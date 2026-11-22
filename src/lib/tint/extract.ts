import { loadImage } from "@/lib/image";

import { oklabToOklch, rgbToOklab, type Oklch } from "./color";

/** 색을 볼 때 줄일 크기(긴 변). 색 분포만 보면 되니 아주 작아도 된다 */
const SAMPLE_EDGE = 64;
/** 이보다 채도가 낮은 화소는 흰 배경·회색·검정으로 보고 뺀다 */
const MIN_CHROMA = 0.045;
/** 너무 어둡거나(그림자) 너무 밝은(빛 반사) 화소는 물건의 색이 아니다 */
const MIN_LIGHTNESS = 0.22;
const MAX_LIGHTNESS = 0.97;
/** 유채색 화소가 이 비율보다 적으면 "색이 없는 물건"(흑백 굿즈, 투명 케이스 등)으로 본다 */
const MIN_COLORFUL_SHARE = 0.04;
/** 색상환을 몇 칸으로 나눠 셀지 (10도씩) */
const HUE_BINS = 36;

/**
 * 화소 묶음(RGBA)에서 물건의 대표 색을 고른다. 색이 없다고 보면 null.
 *
 * 1. 채도가 낮거나 너무 어둡고 밝은 화소는 뺀다 — 흰 책상, 회색 벽, 그림자가 여기서 빠진다.
 * 2. 남은 화소를 색상각 10도 칸에 나눠 담는다. 무게는 채도²×가운데 가중치다.
 *    채도를 제곱하는 이유: 살색·나무색처럼 옅은 넓은 면보다 캐릭터 옷처럼 진한 면이 이겨야 한다.
 *    가운데 가중치: 물건은 대개 사진 가운데에 놓고 찍는다. 귀퉁이는 0.3배까지 줄인다.
 * 3. 가장 무거운 칸(이웃 칸을 반만 더해 매끈하게 본다)과 그 양옆 칸의 화소를 평균한 색을 대표 색으로 한다.
 *    평균은 OKLab 에서 낸다 — 색상각을 그냥 평균하면 350도와 10도의 평균이 180도가 된다.
 */
export function dominantColor(data: ArrayLike<number>, width: number, height: number): Oklch | null {
    const total = width * height;
    if (total === 0) return null;

    const bins = new Float64Array(HUE_BINS);
    // 칸마다 무게를 곱한 l·a·b 합 — 마지막에 고른 칸만 평균 낸다
    const sumL = new Float64Array(HUE_BINS);
    const sumA = new Float64Array(HUE_BINS);
    const sumB = new Float64Array(HUE_BINS);
    let colorful = 0;
    let counted = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            // 투명한 화소(PNG 를 직접 넘긴 경우)는 아예 세지 않는다
            if (data[i + 3] < 128) continue;
            counted++;

            const lab = rgbToOklab(data[i], data[i + 1], data[i + 2]);
            const chroma = Math.hypot(lab.a, lab.b);
            if (chroma < MIN_CHROMA || lab.l < MIN_LIGHTNESS || lab.l > MAX_LIGHTNESS) continue;
            colorful++;

            const dx = (x + 0.5) / width - 0.5;
            const dy = (y + 0.5) / height - 0.5;
            // 가운데 0, 귀퉁이 1
            const distance = (dx * dx + dy * dy) / 0.5;
            const weight = chroma * chroma * (1 - 0.7 * distance);

            let hue = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
            if (hue < 0) hue += 360;
            const bin = Math.min(HUE_BINS - 1, Math.floor(hue / (360 / HUE_BINS)));
            bins[bin] += weight;
            sumL[bin] += lab.l * weight;
            sumA[bin] += lab.a * weight;
            sumB[bin] += lab.b * weight;
        }
    }

    if (counted === 0 || colorful / counted < MIN_COLORFUL_SHARE) return null;

    const at = (index: number) => (index + HUE_BINS) % HUE_BINS;
    let peak = -1;
    let peakScore = 0;
    for (let index = 0; index < HUE_BINS; index++) {
        const score = bins[index] + 0.5 * (bins[at(index - 1)] + bins[at(index + 1)]);
        if (score > peakScore) {
            peakScore = score;
            peak = index;
        }
    }
    if (peak < 0) return null;

    let weight = 0;
    let l = 0;
    let a = 0;
    let b = 0;
    for (const index of [at(peak - 1), peak, at(peak + 1)]) {
        weight += bins[index];
        l += sumL[index];
        a += sumA[index];
        b += sumB[index];
    }
    return oklabToOklch({ l: l / weight, a: a / weight, b: b / weight });
}

/**
 * 저장된 사진 Blob 의 대표 색. 읽지 못하면 null.
 * 화면에 그릴 때와 같은 <img> + <canvas> 경로를 쓴다(src/lib/image.ts 와 같은 이유 — iOS 구버전, EXIF 회전).
 */
export async function analyzeImage(blob: Blob): Promise<Oklch | null> {
    const url = URL.createObjectURL(blob);
    try {
        const image = await loadImage(url);
        const scale = Math.min(1, SAMPLE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return null;
        context.drawImage(image, 0, 0, width, height);
        return dominantColor(context.getImageData(0, 0, width, height).data, width, height);
    } catch {
        // 읽을 수 없는 사진은 색이 없는 물건과 같게 다룬다 — 앱 색은 꾸밈이라 실패를 알릴 까닭이 없다
        return null;
    } finally {
        URL.revokeObjectURL(url);
    }
}
