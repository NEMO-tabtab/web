import { loadImage } from "@/lib/image";

import { cropMask, dilate, maskBox, stickerWidths, type Mask } from "./mask";

/*
 * 배경 지우기 실험(#215) — 캔버스로 사진을 읽고, 마스크로 오리고, 스티커를 그린다.
 * 브라우저에서만 돈다. 모양 계산은 mask.ts 의 순수 함수가 맡는다.
 */

/** 모델과 계산에 쓰는 사진의 긴 변(px). 저장된 사진(긴 변 1280)보다 조금 작게 둬 휴대폰에서도 버티게 한다 */
export const WORK_EDGE = 1024;

const INK = [28, 27, 25] as const; // tailwind 의 ink #1c1b19
const PAPER = [255, 255, 255] as const;

function canvasOf(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("캔버스를 쓸 수 없어요");
    return context;
}

/** 사진을 긴 변 WORK_EDGE 로 줄여 캔버스에 그린다. 투명한 PNG 는 투명한 채로 둔다(바탕을 칠하지 않는다) */
export async function loadToCanvas(blob: Blob, maxEdge = WORK_EDGE): Promise<HTMLCanvasElement> {
    const url = URL.createObjectURL(blob);
    try {
        const image = await loadImage(url);
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = canvasOf(Math.round(image.naturalWidth * scale), Math.round(image.naturalHeight * scale));
        context2d(canvas).drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas;
    } finally {
        URL.revokeObjectURL(url);
    }
}

export function readRgba(canvas: HTMLCanvasElement): Uint8ClampedArray {
    return context2d(canvas).getImageData(0, 0, canvas.width, canvas.height).data;
}

/** 한 가지 색을 마스크 모양대로 칠한 캔버스 */
function fillCanvas(mask: Mask, color: readonly number[], alpha = 1): HTMLCanvasElement {
    const canvas = canvasOf(mask.width, mask.height);
    const context = context2d(canvas);
    const image = context.createImageData(mask.width, mask.height);
    for (let i = 0; i < mask.data.length; i++) {
        image.data[i * 4] = color[0];
        image.data[i * 4 + 1] = color[1];
        image.data[i * 4 + 2] = color[2];
        image.data[i * 4 + 3] = Math.round(mask.data[i] * alpha * 255);
    }
    context.putImageData(image, 0, 0);
    return canvas;
}

/** 사진 위에 덮어 보여 줄 반투명 먹색 — 어디를 물건으로 봤는지 */
export function overlayCanvas(mask: Mask): HTMLCanvasElement {
    return fillCanvas(mask, INK, 0.45);
}

/** 마스크 밖을 투명하게 한 사진 */
export function cutoutCanvas(source: HTMLCanvasElement, mask: Mask): HTMLCanvasElement {
    const canvas = canvasOf(source.width, source.height);
    const context = context2d(canvas);
    const image = context2d(source).getImageData(0, 0, source.width, source.height);
    for (let i = 0; i < mask.data.length; i++) image.data[i * 4 + 3] = Math.round(image.data[i * 4 + 3] * mask.data[i]);
    context.putImageData(image, 0, 0);
    return canvas;
}

/**
 * 오린 물건에 흰 테두리와 먹선을 둘러 스티커로. 물건 크기에 꼭 맞게 잘라 돌려준다. 물건이 없으면 null.
 * 마스크는 사진과 크기가 같아야 한다.
 */
export function stickerCanvas(source: HTMLCanvasElement, mask: Mask): HTMLCanvasElement | null {
    const box = maskBox(mask);
    if (!box) return null;
    const { border, ink } = stickerWidths(box);
    const pad = border + ink + 2;
    const local = cropMask(mask, box, pad);

    const canvas = canvasOf(local.width, local.height);
    const context = context2d(canvas);
    context.drawImage(fillCanvas(dilate(local, border + ink), INK), 0, 0);
    context.drawImage(fillCanvas(dilate(local, border), PAPER), 0, 0);
    context.drawImage(cutoutCanvas(source, mask), box.x, box.y, box.width, box.height, pad, pad, box.width, box.height);
    return canvas;
}

export function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) =>
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("그림을 만들지 못했어요"))), "image/png"),
    );
}
