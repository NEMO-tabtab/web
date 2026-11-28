import { describe, expect, it } from "vitest";

import { toMediaPipeStroke, toU2netInput } from "./engines";
import { alphaMask, backgroundFill, polygonMask, transparentShare } from "./handmade";
import {
    componentsAt,
    coverage,
    createMask,
    cropMask,
    dilate,
    feather,
    keepSoft,
    largestComponent,
    maskAt,
    maskBox,
    normalizeRange,
    pickForeground,
    resizeMask,
    stickerWidths,
    type Mask,
} from "./mask";

/** 바탕색 위에 사각형 하나를 그린 RGBA */
function picture(
    width: number,
    height: number,
    background: [number, number, number],
    rect?: { x: number; y: number; w: number; h: number; color: [number, number, number] },
): Uint8ClampedArray {
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const inside = rect && x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
            const color = inside ? rect.color : background;
            rgba.set([...color, 255], (y * width + x) * 4);
        }
    }
    return rgba;
}

const fromRows = (rows: string[]): Mask => {
    const mask = createMask(rows[0].length, rows.length);
    rows.forEach((row, y) => [...row].forEach((cell, x) => (mask.data[y * mask.width + x] = cell === "#" ? 1 : 0)));
    return mask;
};

const toRows = (mask: Mask): string[] =>
    Array.from({ length: mask.height }, (_, y) =>
        Array.from({ length: mask.width }, (_, x) => (mask.data[y * mask.width + x] >= 0.5 ? "#" : ".")).join(""),
    );

describe("backgroundFill — 바탕색 지우기", () => {
    it("한 가지 색 바탕 위의 물건만 남긴다", () => {
        const rgba = picture(40, 30, [245, 243, 238], { x: 10, y: 8, w: 15, h: 12, color: [200, 40, 40] });
        const mask = backgroundFill(rgba, 40, 30);
        expect(maskBox(mask)).toEqual({ x: 10, y: 8, width: 15, height: 12 });
        expect(coverage(mask)).toBeCloseTo((15 * 12) / (40 * 30), 5);
    });

    it("조금씩 어두워지는 바탕(그림자)은 따라가 지운다", () => {
        const width = 60;
        const rgba = new Uint8ClampedArray(width * 10 * 4);
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < width; x++) {
                const shade = 250 - x; // 왼쪽 250 → 오른쪽 191, 이웃끼리는 1씩
                rgba.set([shade, shade, shade, 255], (y * width + x) * 4);
            }
        }
        expect(coverage(backgroundFill(rgba, width, 10))).toBe(0);
    });

    it("바탕과 색이 같은 물건은 함께 지운다 — 이 방법의 한계", () => {
        const rgba = picture(20, 20, [240, 240, 240], { x: 5, y: 5, w: 8, h: 8, color: [236, 236, 236] });
        expect(coverage(backgroundFill(rgba, 20, 20))).toBe(0);
    });

    it("물건이 사진 끝에 닿아 있어도 그 자리에서 물건 안으로 번지지 않는다", () => {
        const rgba = picture(30, 20, [250, 250, 250], { x: 0, y: 5, w: 12, h: 10, color: [30, 60, 200] });
        expect(maskBox(backgroundFill(rgba, 30, 20))).toEqual({ x: 0, y: 5, width: 12, height: 10 });
    });
});

describe("polygonMask — 손으로 따라 그리기", () => {
    it("네모를 그리면 그 안이 찬다", () => {
        const mask = polygonMask(
            [
                { x: 0.25, y: 0.25 },
                { x: 0.75, y: 0.25 },
                { x: 0.75, y: 0.75 },
                { x: 0.25, y: 0.75 },
            ],
            8,
            8,
        );
        expect(toRows(mask)).toEqual([
            "........",
            "........",
            "..####..",
            "..####..",
            "..####..",
            "..####..",
            "........",
            "........",
        ]);
    });

    it("점이 셋보다 적으면 아무것도 칠하지 않는다", () => {
        expect(
            coverage(
                polygonMask(
                    [
                        { x: 0, y: 0 },
                        { x: 1, y: 1 },
                    ],
                    4,
                    4,
                ),
            ),
        ).toBe(0);
    });

    it("세모의 넓이가 맞는다", () => {
        const mask = polygonMask(
            [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
            ],
            100,
            100,
        );
        expect(coverage(mask)).toBeCloseTo(0.5, 1);
    });
});

describe("마스크 다루기", () => {
    it("dilate 는 반지름 안쪽만 채운다", () => {
        const dot = createMask(7, 7);
        dot.data[3 * 7 + 3] = 1;
        expect(toRows(dilate(dot, 2))).toEqual([
            ".......",
            "...#...",
            "..###..",
            ".#####.",
            "..###..",
            "...#...",
            ".......",
        ]);
    });

    it("largestComponent 는 가장 큰 덩어리만 남긴다", () => {
        const mask = fromRows(["##....", "##..##", "....##", "....##"]);
        expect(toRows(largestComponent(mask))).toEqual(["......", "....##", "....##", "....##"]);
    });

    it("componentsAt 은 누른 점이 닿은 덩어리만 남기고, 닿은 것이 없으면 가장 큰 덩어리를 남긴다", () => {
        const mask = fromRows(["##....#", "##..#..", "....#..", "....#.."]);
        // 왼쪽 위 덩어리를 눌렀다
        expect(toRows(componentsAt(mask, [{ x: 0.1, y: 0.1 }]))).toEqual(["##.....", "##.....", ".......", "......."]);
        // 두 덩어리를 문질렀다 — 오른쪽 위 점 하나는 남지 않는다
        expect(
            toRows(
                componentsAt(mask, [
                    { x: 0.1, y: 0.1 },
                    { x: 0.6, y: 0.9 },
                ]),
            ),
        ).toEqual(["##.....", "##..#..", "....#..", "....#.."]);
        // 배경을 눌렀다
        expect(toRows(componentsAt(mask, [{ x: 0.4, y: 0.9 }]))).toEqual(["##.....", "##.....", ".......", "......."]);
    });

    it("keepSoft 는 남길 덩어리 근처의 부드러운 값은 두고 먼 곳만 지운다", () => {
        const soft = createMask(5, 1);
        soft.data.set([0.9, 0.6, 0.3, 0, 0.8]);
        const keep = fromRows(["#...."]);
        expect(Array.from(keepSoft(soft, keep, 2).data)).toEqual([0.9, 0.6, 0.3, 0, 0].map((v) => Math.fround(v)));
    });

    it("cropMask 는 물건 둘레를 잘라 여백을 둔다", () => {
        const mask = fromRows(["....", ".##.", ".#..", "...."]);
        const box = maskBox(mask)!;
        expect(box).toEqual({ x: 1, y: 1, width: 2, height: 2 });
        expect(toRows(cropMask(mask, box, 1))).toEqual(["....", ".##.", ".#..", "...."]);
    });

    it("resizeMask 는 크기를 바꾸어도 값의 자리가 맞는다", () => {
        const half = fromRows(["#.", "#."]);
        const big = resizeMask(half, 8, 8);
        expect(maskAt(big, 0.1, 0.5)).toBe(1);
        expect(maskAt(big, 0.9, 0.5)).toBe(0);
        expect(coverage(big)).toBeCloseTo(0.5, 5);
    });

    it("feather 는 가장자리만 흐리고 안쪽은 그대로 둔다", () => {
        const mask = fromRows(["......", ".####.", ".####.", ".####.", ".####.", "......"]);
        const soft = feather(mask, 1);
        expect(soft.data[3 * 6 + 3]).toBe(1);
        expect(soft.data[1 * 6 + 1]).toBeGreaterThan(0);
        expect(soft.data[1 * 6 + 1]).toBeLessThan(1);
    });

    it("normalizeRange 는 최솟값~최댓값을 0~1로 편다", () => {
        expect(Array.from(normalizeRange([2, 4, 6, 10], 2, 2).data)).toEqual([0, 0.25, 0.5, 1]);
        expect(Array.from(normalizeRange([3, 3, 3, 3], 2, 2).data)).toEqual([0, 0, 0, 0]);
    });

    it("pickForeground 는 누른 점이 물건인 마스크를 고르고, 한 장뿐이면 앞뒤를 맞춘다", () => {
        const background = fromRows(["##", "#."]);
        const object = fromRows(["..", ".#"]);
        const point = { x: 0.75, y: 0.75 };
        expect(pickForeground([background, object], point)).toBe(object);
        expect(toRows(pickForeground([background], point)!)).toEqual(["..", ".#"]);
        expect(pickForeground([], point)).toBeNull();
    });

    it("stickerWidths 는 물건 크기를 따르되 너무 얇거나 굵지 않다", () => {
        expect(stickerWidths({ x: 0, y: 0, width: 50, height: 40 })).toEqual({ border: 6, ink: 2 });
        expect(stickerWidths({ x: 0, y: 0, width: 600, height: 800 })).toEqual({ border: 28, ink: 5 });
        expect(stickerWidths({ x: 0, y: 0, width: 4000, height: 10 })).toEqual({ border: 40, ink: 6 });
    });
});

describe("가져온 PNG", () => {
    it("투명한 화소의 비율과 알파 마스크를 읽는다", () => {
        const rgba = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 128, 0, 0, 0, 255]);
        expect(transparentShare(rgba)).toBe(0.5);
        expect(Array.from(alphaMask(rgba, 2, 2).data)).toEqual([0, 1, 128 / 255, 1].map((v) => Math.fround(v)));
    });
});

describe("모델 입력", () => {
    it("U²-Net 입력은 채널을 나누고 ImageNet 평균·편차로 정규화한다", () => {
        const rgba = new Uint8ClampedArray([255, 0, 128, 255]);
        const input = toU2netInput(rgba, 1);
        expect(input[0]).toBeCloseTo((1 - 0.485) / 0.229, 5);
        expect(input[1]).toBeCloseTo((0 - 0.456) / 0.224, 5);
        expect(input[2]).toBeCloseTo((128 / 255 - 0.406) / 0.225, 5);
    });

    it("MediaPipe 획은 넣기 1·빼기 2, 점 하나는 거의 같은 점 둘로 보낸다", () => {
        expect(toMediaPipeStroke({ mode: "remove", points: [{ x: 0.5, y: 0.5 }] })).toEqual({
            brushMode: 2,
            point: [
                { x: 0.5, y: 0.5 },
                { x: 0.501, y: 0.5 },
            ],
            isCompleted: true,
        });
        expect(
            toMediaPipeStroke({
                mode: "add",
                points: [
                    { x: 0.1, y: 0.2 },
                    { x: 0.3, y: 0.4 },
                ],
            }).brushMode,
        ).toBe(1);
    });
});
