/*
 * 배경 지우기 실험(#215) — 오려 낸 모양(마스크)을 다루는 순수 함수.
 * 마스크는 화소마다 0(배경)~1(물건)의 값이다. 어느 방법(바탕색·손·모델)으로 얻었든 이 모양으로 맞춘 뒤
 * 같은 길로 스티커를 만든다. 화면과 떼어 두어 테스트로 확인한다(cutout.test.ts).
 */

export interface Mask {
    width: number;
    height: number;
    /** 행 우선, 0~1 */
    data: Float32Array;
}

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function createMask(width: number, height: number, fill = 0): Mask {
    return { width, height, data: new Float32Array(width * height).fill(fill) };
}

/** 정규화 좌표(0~1)의 값. 가장 가까운 화소를 읽는다 */
export function maskAt(mask: Mask, x: number, y: number): number {
    const px = Math.min(mask.width - 1, Math.max(0, Math.floor(x * mask.width)));
    const py = Math.min(mask.height - 1, Math.max(0, Math.floor(y * mask.height)));
    return mask.data[py * mask.width + px];
}

/** 양선형 보간으로 크기를 바꾼다 — 모델은 320·768 같은 정사각형으로 내놓으니 사진 크기로 늘린다 */
export function resizeMask(mask: Mask, width: number, height: number): Mask {
    if (mask.width === width && mask.height === height) return { width, height, data: mask.data.slice() };
    const out = createMask(width, height);
    const sx = mask.width / width;
    const sy = mask.height / height;
    for (let y = 0; y < height; y++) {
        // 화소 가운데끼리 맞춘다
        const fy = Math.min(mask.height - 1, Math.max(0, (y + 0.5) * sy - 0.5));
        const y0 = Math.floor(fy);
        const y1 = Math.min(mask.height - 1, y0 + 1);
        const ty = fy - y0;
        for (let x = 0; x < width; x++) {
            const fx = Math.min(mask.width - 1, Math.max(0, (x + 0.5) * sx - 0.5));
            const x0 = Math.floor(fx);
            const x1 = Math.min(mask.width - 1, x0 + 1);
            const tx = fx - x0;
            const top = mask.data[y0 * mask.width + x0] * (1 - tx) + mask.data[y0 * mask.width + x1] * tx;
            const bottom = mask.data[y1 * mask.width + x0] * (1 - tx) + mask.data[y1 * mask.width + x1] * tx;
            out.data[y * width + x] = top * (1 - ty) + bottom * ty;
        }
    }
    return out;
}

/** 0 또는 1로 */
export function binarize(mask: Mask, threshold = 0.5): Mask {
    return { ...mask, data: mask.data.map((value) => (value >= threshold ? 1 : 0)) };
}

export function invertMask(mask: Mask): Mask {
    return { ...mask, data: mask.data.map((value) => 1 - value) };
}

/** 최솟값~최댓값을 0~1로 편다. 모델이 내놓은 점수(saliency)를 마스크로 바꿀 때 쓴다 */
export function normalizeRange(values: Float32Array | number[], width: number, height: number): Mask {
    let min = Infinity;
    let max = -Infinity;
    for (const value of values) {
        if (value < min) min = value;
        if (value > max) max = value;
    }
    const span = max - min;
    const data = new Float32Array(width * height);
    for (let i = 0; i < data.length; i++) data[i] = span > 0 ? (values[i] - min) / span : 0;
    return { width, height, data };
}

/** 물건으로 본 화소의 비율 */
export function coverage(mask: Mask, threshold = 0.5): number {
    let count = 0;
    for (const value of mask.data) if (value >= threshold) count += 1;
    return mask.data.length ? count / mask.data.length : 0;
}

/** 물건이 차지한 사각형. 물건이 없으면 null */
export function maskBox(mask: Mask, threshold = 0.5): Box | null {
    let minX = mask.width;
    let minY = mask.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < mask.height; y++) {
        for (let x = 0; x < mask.width; x++) {
            if (mask.data[y * mask.width + x] < threshold) continue;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
    return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * `box` 영역을 잘라 사방에 `pad` 화소의 빈 여백을 둔 새 마스크. 스티커 테두리가 사진 끝에서 잘리지 않게
 * 물건이 사진 가장자리에 닿아 있어도 여백 안에서 테두리를 그릴 수 있다.
 */
export function cropMask(mask: Mask, box: Box, pad: number): Mask {
    const out = createMask(box.width + pad * 2, box.height + pad * 2);
    for (let y = 0; y < box.height; y++) {
        for (let x = 0; x < box.width; x++) {
            out.data[(y + pad) * out.width + x + pad] = mask.data[(box.y + y) * mask.width + box.x + x];
        }
    }
    return out;
}

/** 스티커의 흰 테두리와 먹선 두께(화소). 물건 크기에 맞춰 늘고 줄되 너무 얇거나 굵지 않게 */
export function stickerWidths(box: Box): { border: number; ink: number } {
    const edge = Math.max(box.width, box.height);
    return {
        border: Math.min(40, Math.max(6, Math.round(edge * 0.035))),
        ink: Math.min(6, Math.max(2, Math.round(edge * 0.006))),
    };
}

/** 상하좌우로 이어진 덩어리마다 번호(1부터)를 매긴다. 0은 배경. sizes[번호] 는 그 덩어리의 화소 수 */
function labelComponents(mask: Mask, threshold: number): { labels: Int32Array; sizes: number[] } {
    const { width } = mask;
    const labels = new Int32Array(mask.data.length);
    const queue = new Int32Array(mask.data.length);
    const sizes = [0];
    let label = 0;

    for (let start = 0; start < labels.length; start++) {
        if (labels[start] !== 0 || mask.data[start] < threshold) continue;
        label += 1;
        let head = 0;
        let tail = 0;
        queue[tail++] = start;
        labels[start] = label;
        while (head < tail) {
            const index = queue[head++];
            const x = index % width;
            const neighbors = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width];
            for (const next of neighbors) {
                if (next < 0 || next >= labels.length || labels[next] !== 0 || mask.data[next] < threshold) continue;
                labels[next] = label;
                queue[tail++] = next;
            }
        }
        sizes.push(tail);
    }
    return { labels, sizes };
}

/** 고른 번호의 덩어리만 1인 마스크 */
function keepLabels(mask: Mask, labels: Int32Array, keep: Set<number>): Mask {
    const data = new Float32Array(labels.length);
    for (let i = 0; i < data.length; i++) data[i] = keep.has(labels[i]) ? 1 : 0;
    return { width: mask.width, height: mask.height, data };
}

/**
 * 가장 큰 덩어리 하나만 남긴다(상하좌우로 이어진 것). 바탕색 지우기나 자동 모델이 남긴 부스러기를 치운다.
 * 결과는 0/1 이다.
 */
export function largestComponent(mask: Mask, threshold = 0.5): Mask {
    const { labels, sizes } = labelComponents(mask, threshold);
    let best = 0;
    for (let label = 1; label < sizes.length; label++) if (sizes[label] > sizes[best]) best = label;
    return keepLabels(mask, labels, new Set(best ? [best] : []));
}

/**
 * 사용자가 누르거나 문지른 점이 닿은 덩어리만 남긴다(0/1). 닿은 덩어리가 없으면 가장 큰 덩어리를 남긴다.
 * 모델이 멀리 떨어진 곳에 남긴 부스러기를 치우되, 사용자가 고른 여러 물건(키링 둘 등)은 함께 남긴다.
 */
export function componentsAt(mask: Mask, points: { x: number; y: number }[], threshold = 0.5): Mask {
    const { labels } = labelComponents(mask, threshold);
    const keep = new Set<number>();
    for (const point of points) {
        const x = Math.min(mask.width - 1, Math.max(0, Math.floor(point.x * mask.width)));
        const y = Math.min(mask.height - 1, Math.max(0, Math.floor(point.y * mask.height)));
        const label = labels[y * mask.width + x];
        if (label) keep.add(label);
    }
    return keep.size ? keepLabels(mask, labels, keep) : largestComponent(mask, threshold);
}

/** 부드러운 가장자리는 그대로 두고, 남길 덩어리(`keep`)에서 `margin` 화소 넘게 떨어진 곳만 지운다 */
export function keepSoft(soft: Mask, keep: Mask, margin = 2): Mask {
    const near = dilate(keep, margin);
    return { ...soft, data: soft.data.map((value, i) => value * near.data[i]) };
}

/**
 * 물건에서 `radius` 화소 안쪽을 모두 채운다(둥근 팽창). 스티커의 흰 테두리와 먹선을 그릴 때 쓴다.
 * 거리는 두 번 훑는 근사(가로·세로 1, 대각 √2)로 셈해 사진이 커도 화소 수에 비례하는 시간만 든다.
 */
export function dilate(mask: Mask, radius: number, threshold = 0.5): Mask {
    const { width, height } = mask;
    const far = width + height;
    const distance = new Float32Array(width * height);
    for (let i = 0; i < distance.length; i++) distance[i] = mask.data[i] >= threshold ? 0 : far;

    const diagonal = Math.SQRT2;
    // 왼쪽 위에서 오른쪽 아래로
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            let d = distance[i];
            if (x > 0) d = Math.min(d, distance[i - 1] + 1);
            if (y > 0) {
                d = Math.min(d, distance[i - width] + 1);
                if (x > 0) d = Math.min(d, distance[i - width - 1] + diagonal);
                if (x < width - 1) d = Math.min(d, distance[i - width + 1] + diagonal);
            }
            distance[i] = d;
        }
    }
    // 오른쪽 아래에서 왼쪽 위로
    for (let y = height - 1; y >= 0; y--) {
        for (let x = width - 1; x >= 0; x--) {
            const i = y * width + x;
            let d = distance[i];
            if (x < width - 1) d = Math.min(d, distance[i + 1] + 1);
            if (y < height - 1) {
                d = Math.min(d, distance[i + width] + 1);
                if (x < width - 1) d = Math.min(d, distance[i + width + 1] + diagonal);
                if (x > 0) d = Math.min(d, distance[i + width - 1] + diagonal);
            }
            distance[i] = d;
        }
    }

    // 소수점 오차로 정확히 radius 인 곳이 빠지지 않게 조금 여유를 둔다
    return { width, height, data: distance.map((d) => (d <= radius + 1e-4 ? 1 : 0)) };
}

/** 가장자리를 `radius` 화소만큼 흐린다(가로·세로 상자 흐림). 0/1 마스크의 계단을 부드럽게 한다 */
export function feather(mask: Mask, radius = 1): Mask {
    if (radius <= 0) return { ...mask, data: mask.data.slice() };
    const { width, height } = mask;
    const pass = (source: Float32Array, horizontal: boolean) => {
        const out = new Float32Array(source.length);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0;
                let count = 0;
                for (let k = -radius; k <= radius; k++) {
                    const nx = horizontal ? x + k : x;
                    const ny = horizontal ? y : y + k;
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                    sum += source[ny * width + nx];
                    count += 1;
                }
                out[y * width + x] = sum / count;
            }
        }
        return out;
    };
    return { width, height, data: pass(pass(mask.data, true), false) };
}

/**
 * 모델이 물건과 배경 중 어느 쪽을 1로 내놓았는지 모를 때, 사용자가 누른 점이 물건이라고 보고 고른다.
 * 여러 장(신뢰도 마스크) 중 누른 점의 값이 가장 큰 것을 물건으로 본다. 한 장뿐인데 누른 점이 0.5 아래면 뒤집는다.
 */
export function pickForeground(masks: Mask[], point: { x: number; y: number }): Mask | null {
    if (masks.length === 0) return null;
    let best = masks[0];
    for (const mask of masks) if (maskAt(mask, point.x, point.y) > maskAt(best, point.x, point.y)) best = mask;
    if (masks.length === 1 && maskAt(best, point.x, point.y) < 0.5) return invertMask(best);
    return best;
}
