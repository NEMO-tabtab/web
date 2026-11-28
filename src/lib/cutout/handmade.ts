import { createMask, type Mask } from "./mask";

/*
 * 모델 없이 오리는 두 가지 길(#215). 내려받을 것이 없고 바로 끝난다.
 * - 바탕색 지우기: 바탕이 책상·종이처럼 한 가지 색일 때
 * - 손으로 따라 그리기: 무엇이든, 대신 손이 간다
 */

export interface Point {
    /** 0~1 */
    x: number;
    /** 0~1 */
    y: number;
}

/**
 * 바탕색 지우기. 사진 가장자리에서 시작해 색이 비슷하게 이어지는 곳을 배경으로 보고, 나머지를 물건(1)으로 돌려준다.
 * - 가장자리 중 가장자리의 대표색(채널별 중앙값)과 비슷한 화소에서만 시작한다. 물건이 사진 끝에 닿아 있어도 그 자리에서 번지지 않게.
 * - 이웃과 비슷하면서(`tolerance`) 출발한 가장자리 색과도 너무 멀지 않을 때만(`tolerance` × 3) 번진다. 그림자처럼 조금씩
 *   어두워지는 바탕은 따라가되, 바탕과 색이 다른 물건 안으로 천천히 새어 들어가지는 않게.
 * 바탕과 물건의 색이 비슷하면 물건까지 지운다 — 이 방법의 한계다.
 */
export function backgroundFill(rgba: Uint8ClampedArray, width: number, height: number, tolerance = 32): Mask {
    const total = width * height;
    const border: number[] = [];
    for (let x = 0; x < width; x++) border.push(x, (height - 1) * width + x);
    for (let y = 1; y < height - 1; y++) border.push(y * width, y * width + width - 1);

    const reference = [0, 1, 2].map((channel) => median(border.map((index) => rgba[index * 4 + channel])));
    const distance = (a: number, r: number, g: number, b: number) =>
        Math.hypot(rgba[a * 4] - r, rgba[a * 4 + 1] - g, rgba[a * 4 + 2] - b);

    const isBackground = new Uint8Array(total);
    /** 이 배경 화소가 출발한 가장자리 화소 */
    const origin = new Int32Array(total).fill(-1);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;

    for (const index of border) {
        if (isBackground[index]) continue;
        if (distance(index, reference[0], reference[1], reference[2]) > tolerance * 2) continue;
        isBackground[index] = 1;
        origin[index] = index;
        queue[tail++] = index;
    }

    while (head < tail) {
        const index = queue[head++];
        const x = index % width;
        const seed = origin[index];
        const neighbors = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width];
        for (const next of neighbors) {
            if (next < 0 || next >= total || isBackground[next]) continue;
            const near = distance(next, rgba[index * 4], rgba[index * 4 + 1], rgba[index * 4 + 2]) <= tolerance;
            const fromSeed = distance(next, rgba[seed * 4], rgba[seed * 4 + 1], rgba[seed * 4 + 2]) <= tolerance * 3;
            if (!near || !fromSeed) continue;
            isBackground[next] = 1;
            origin[next] = seed;
            queue[tail++] = next;
        }
    }

    const mask = createMask(width, height);
    for (let i = 0; i < total; i++) mask.data[i] = isBackground[i] ? 0 : 1;
    return mask;
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/**
 * 손으로 따라 그린 테두리(정규화 좌표의 꼭짓점들)를 채운 마스크. 선이 닫히지 않았으면 처음 점으로 이어 닫는다.
 * 화소 가운데를 지나는 가로줄마다 테두리와 만나는 곳을 찾아 짝수-홀수 규칙으로 칠한다.
 */
export function polygonMask(points: Point[], width: number, height: number): Mask {
    const mask = createMask(width, height);
    if (points.length < 3) return mask;
    const vertices = points.map((point) => ({ x: point.x * width, y: point.y * height }));

    for (let y = 0; y < height; y++) {
        const scan = y + 0.5;
        const crossings: number[] = [];
        for (let i = 0; i < vertices.length; i++) {
            const a = vertices[i];
            const b = vertices[(i + 1) % vertices.length];
            // 위 끝은 넣고 아래 끝은 빼서 꼭짓점을 두 번 세지 않는다
            if ((a.y <= scan && b.y > scan) || (b.y <= scan && a.y > scan)) {
                crossings.push(a.x + ((scan - a.y) / (b.y - a.y)) * (b.x - a.x));
            }
        }
        crossings.sort((a, b) => a - b);
        for (let i = 0; i + 1 < crossings.length; i += 2) {
            const from = Math.max(0, Math.ceil(crossings[i] - 0.5));
            const to = Math.min(width - 1, Math.floor(crossings[i + 1] - 0.5));
            for (let x = from; x <= to; x++) mask.data[y * width + x] = 1;
        }
    }
    return mask;
}

/** 투명한 화소(알파 250 미만)의 비율 — 사진 앱의 "피사체 오려내기"로 이미 오려 온 PNG인지 본다 */
export function transparentShare(rgba: Uint8ClampedArray): number {
    const total = rgba.length / 4;
    let count = 0;
    for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 250) count += 1;
    return total ? count / total : 0;
}

/** 알파 채널을 마스크로 */
export function alphaMask(rgba: Uint8ClampedArray, width: number, height: number): Mask {
    const mask = createMask(width, height);
    for (let i = 0; i < width * height; i++) mask.data[i] = rgba[i * 4 + 3] / 255;
    return mask;
}
