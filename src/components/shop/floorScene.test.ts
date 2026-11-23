import { describe, expect, it } from "vitest";

import { UNIT_ACROSS } from "@/lib/iso";
import type { Floor } from "@/lib/shops/schema";
import { entranceMat, floorScene, narrowestSlot, numberSize } from "./floorScene";

/** 6m × 4m 바닥을 칸 크기만 달리해 적은 것 */
const fine: Floor = {
    id: "f1",
    label: "1층",
    width: 24,
    depth: 16,
    entrance: { x: 12, y: 15 },
    fixtures: [{ id: "wall", kind: "wall", x: 0, y: 0, w: 24, d: 1, h: 10 }],
    slots: [{ id: "a", x: 3, y: 1, w: 1, d: 2, h: 5, facing: "s", tiers: 2 }],
};
const coarse: Floor = {
    ...fine,
    width: 12,
    depth: 8,
    entrance: { x: 6, y: 7 },
    fixtures: [{ id: "wall", kind: "wall", x: 0, y: 0, w: 12, d: 1, h: 5 }],
    slots: [{ id: "a", x: 1, y: 1, w: 2, d: 1, h: 3, facing: "s", tiers: 2 }],
};

describe("층 그림의 범위", () => {
    it("칸 크기가 달라도 실제 크기가 같은 매장은 같은 크기로 그려진다", () => {
        expect(floorScene(fine, 25, 0)).toEqual(floorScene(coarse, 50, 0));
        expect(floorScene(fine, 25, 1)).toEqual(floorScene(coarse, 50, 1));
    });

    it("가장 좁은 기기의 폭 — 25cm 기계는 50cm 의 절반이다", () => {
        expect(narrowestSlot(fine, 25)).toBeCloseTo(UNIT_ACROSS / 2);
        expect(narrowestSlot(coarse, 50)).toBeCloseTo(UNIT_ACROSS);
        expect(narrowestSlot({ ...fine, slots: [] }, 25)).toBeNull();
    });

    it("번호 글자는 좁은 윗면에 맞춰 줄이되 11 을 넘지 않는다", () => {
        expect(numberSize(UNIT_ACROSS / 2)).toBeLessThan(7);
        expect(numberSize(UNIT_ACROSS * 2)).toBe(11);
    });
});

describe("입구 깔개", () => {
    it("입구 칸에서 가장 가까운 변에 붙고, 칸 크기와 상관없이 폭 1m · 깊이 50cm 다", () => {
        // 남쪽 변 가운데
        expect(entranceMat(fine, 25)).toEqual({ x: 5.25, y: 7, w: 2, d: 1, h: 0 });
        expect(entranceMat(coarse, 50)).toEqual({ x: 5.5, y: 7, w: 2, d: 1, h: 0 });
    });

    it("동쪽 변의 입구는 세로로 놓인다", () => {
        expect(entranceMat({ ...coarse, entrance: { x: 11, y: 3 } }, 50)).toEqual({ x: 11, y: 2.5, w: 1, d: 2, h: 0 });
    });

    it("모서리의 입구도 바닥 밖으로 나가지 않는다", () => {
        const mat = entranceMat({ ...coarse, entrance: { x: 0, y: 7 } }, 50);
        expect(mat.x).toBe(0);
        expect(mat.y + mat.d).toBeLessThanOrEqual(8);
    });
});
