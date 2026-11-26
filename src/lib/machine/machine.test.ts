import { describe, expect, it } from "vitest";

import { project } from "@/lib/iso";
import { ROUGH_FILTERS, toSvgString } from "@/lib/nemo/exportSvg";
import type { Drawing } from "@/lib/nemo/types";

import { FULL_FROM, MID_FROM, composeMachine, detailFor, machineSpan, sizeAtScale } from "./compose";
import { MACHINE_MODELS, MACHINE_MODEL_IDS, machineModel, modelCells, sizeLabel } from "./models";
import { KAN_PER_CM, Sketch, frontAt, solidAt, type MachineView } from "./sketch";

const strokesOf = (drawing: Drawing) => drawing.layers.flatMap((layer) => layer.strokes);
const SIZES = [24, 48, 96, 160, 512];
const VIEWS: MachineView[] = ["solid", "front"];
/** 종류 × 크기 × 보기를 모두 */
const EVERY = MACHINE_MODEL_IDS.flatMap((id) =>
    SIZES.flatMap((size) => VIEWS.map((view) => ({ id, size, view }) as const)),
);

describe("기계 카탈로그", () => {
    it("종류는 목록의 id 와 하나씩 맞는다", () => {
        expect(MACHINE_MODELS.map((model) => model.id)).toEqual([...MACHINE_MODEL_IDS]);
        for (const id of MACHINE_MODEL_IDS) expect(machineModel(id).id).toBe(id);
    });

    it("종류마다 이름과 설명, 단 수, 받는 캡슐의 크기가 있다", () => {
        for (const model of MACHINE_MODELS) {
            expect(model.name.length).toBeGreaterThan(0);
            expect(model.summary.length).toBeGreaterThan(0);
            expect(model.tiers).toBeGreaterThanOrEqual(1);
            expect(model.capsule[0]).toBeLessThanOrEqual(model.capsule[1]);
        }
    });

    it("그림의 기준 치수는 첫 기준 기계의 치수다", () => {
        for (const model of MACHINE_MODELS) expect(model.size).toEqual(model.references[0].size);
    });

    it("기준 기계마다 제원을 본 주소가 있고 치수가 양수다", () => {
        for (const model of MACHINE_MODELS) {
            const urls = model.references.map((reference) => reference.url);
            expect(new Set(urls).size).toBe(urls.length);
            for (const reference of model.references) {
                expect(reference.url).toMatch(/^https:\/\//);
                for (const length of Object.values(reference.size)) expect(length).toBeGreaterThan(0);
            }
        }
    });

    it("2단 표준형을 격자에 적으면 결정 기록 0004 의 표준 기계와 같다 (폭 1칸 × 깊이 2칸 × 높이 5칸)", () => {
        expect(modelCells(machineModel("standard-2"))).toEqual({ w: 1, d: 2, h: 5 });
    });

    it("격자에 적을 때 한 칸보다 작아지지 않는다", () => {
        expect(modelCells(machineModel("tabletop-box"))).toEqual({ w: 1, d: 1, h: 2 });
        // 50cm 칸으로 적던 예전 구조에서도
        expect(modelCells(machineModel("tabletop-box"), 50)).toEqual({ w: 1, d: 1, h: 1 });
    });

    it("크기를 cm 로 읽는다", () => {
        expect(sizeLabel({ width: 280, depth: 450, height: 1300 })).toBe("28 × 45 × 130cm");
        expect(sizeLabel({ width: 270, depth: 450, height: 645 })).toBe("27 × 45 × 64.5cm");
    });
});

describe("그리는 도구", () => {
    const block = { x: 0, y: 0, z: 0, w: 10, d: 20, h: 30 };
    const faces = { front: "paper", side: "cream", top: "paper" } as const;

    it("입체 보기의 투영이 내부 지도와 같다 — 50cm 가 내부 지도의 길이 1 이다", () => {
        for (const [x, y, z] of [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
            [2, 3, 1.5],
        ]) {
            const [mapX, mapY] = project(x, y, z);
            const [drawnX, drawnY] = solidAt(x * 50, y * 50, z * 50);
            expect(drawnX).toBeCloseTo(mapX, 6);
            expect(drawnY).toBeCloseTo(mapY, 6);
        }
    });

    it("입체 보기에서 상자는 세 면이 보이고, 가로를 폭과 깊이가 나눠 쓴다", () => {
        const sketch = new Sketch();
        sketch.block(block, faces, 1);
        const box = sketch.box(0);
        expect(box.width).toBeCloseTo((10 + 20) * (Math.sqrt(3) / 2) * KAN_PER_CM, 1);
        // 세로에는 높이가 더해진다
        expect(box.height).toBeCloseTo(((10 + 20) / 2 + 30) * KAN_PER_CM, 1);
        expect(sketch.strokes).toHaveLength(3);
    });

    it("정면 보기는 깊이를 버리고 폭과 높이를 그대로 그린다", () => {
        expect(frontAt(10, 99, 20)).toEqual([10 * KAN_PER_CM, -20 * KAN_PER_CM]);

        const sketch = new Sketch("front");
        sketch.block(block, faces, 1);
        const box = sketch.box(0);
        expect(box.width).toBeCloseTo(10 * KAN_PER_CM, 1);
        expect(box.height).toBeCloseTo(30 * KAN_PER_CM, 1);
        // 앞면 하나만 보인다
        expect(sketch.strokes).toHaveLength(1);
    });

    it("정면 보기에서는 옆면에 놓은 것을 그리지 않는다", () => {
        const front = new Sketch("front");
        front.rectOn(block, "side", [0.1, 0.9], [5, 25], { fill: "paper" });
        front.roundOn(block, "side", 0.5, 15, 3, { fill: "paper" });
        front.lineOn(block, "side", [0.1, 5], [0.9, 5], 1);
        expect(front.strokes).toHaveLength(0);
        front.rectOn(block, "front", [0.1, 0.9], [5, 25], { fill: "paper" });
        expect(front.strokes).toHaveLength(1);

        const solid = new Sketch("solid");
        solid.rectOn(block, "side", [0.1, 0.9], [5, 25], { fill: "paper" });
        expect(solid.strokes).toHaveLength(1);
    });

    it("둥근 몸은 정면에서 네모와 원으로 보인다", () => {
        const sketch = new Sketch("front");
        sketch.cylinder(20, 20, [0, 10], 5, { side: "cream", top: "paper" }, 1);
        // 윗면은 보이지 않는다
        expect(sketch.strokes).toHaveLength(1);
        expect(sketch.box(0).width).toBeCloseTo(10 * KAN_PER_CM, 1);
        expect(sketch.widthOf(5)).toBeCloseTo(5 * KAN_PER_CM, 6);
        expect(sketch.sinkOf(5)).toBe(0);
        // 입체에서는 원기둥이 더 넓게 보인다
        expect(new Sketch("solid").widthOf(5)).toBeGreaterThan(sketch.widthOf(5));
    });
});

describe("기계 그림", () => {
    it("어떤 종류든 어떤 크기든 어느 보기로든 그려진다", () => {
        for (const { id, size, view } of EVERY) {
            const drawing = composeMachine(id, { size, view });
            const strokes = strokesOf(drawing);
            expect(strokes.length).toBeGreaterThan(0);
            for (const stroke of strokes) {
                expect(stroke.d).not.toMatch(/NaN|undefined|Infinity/);
                // 채우지도 긋지도 않는 획은 보이지 않는다
                expect(stroke.fill !== undefined || stroke.w !== undefined).toBe(true);
                if (stroke.w !== undefined) expect(stroke.w).toBeGreaterThan(0);
            }
            for (const value of Object.values(drawing.box)) expect(Number.isFinite(value)).toBe(true);
            expect(drawing.box.width).toBeGreaterThan(0);
            expect(drawing.box.height).toBeGreaterThan(0);
            expect(drawing.filter).toBe("rough-line-sm");
        }
    });

    it("보기를 주지 않으면 입체다", () => {
        for (const id of MACHINE_MODEL_IDS) {
            expect(composeMachine(id, { size: 160 })).toEqual(composeMachine(id, { size: 160, view: "solid" }));
        }
    });

    it("size 는 기계의 키다 — 그림의 칸은 여백만큼만 더 크다", () => {
        for (const { id, size, view } of EVERY) {
            const drawing = composeMachine(id, { size, view });
            expect(drawing.unit).toBe(machineSpan(id, view));
            // 여백은 위아래로 테두리 굵기의 절반과 손떨림 몫 1.5칸씩이다
            const pxPerKan = size / drawing.unit;
            const extra = (drawing.box.height - drawing.unit) * pxPerKan;
            const expected = Math.max(1.5, size * 0.012) + 3 * pxPerKan;
            expect(Math.abs(extra - expected)).toBeLessThan(1);
        }
    });

    it("입체 그림의 키는 실제 치수에서 나온다", () => {
        for (const model of MACHINE_MODELS) {
            const { width, depth, height } = model.size;
            // 상자라면 (폭 + 깊이) ÷ 2 + 높이. 둥근 기계는 모서리가 없어 그보다 조금 작다
            const boxed = ((width + depth) / 2 + height) / 10;
            const spanCm = machineSpan(model.id) / KAN_PER_CM;
            expect(spanCm).toBeLessThanOrEqual(boxed + 0.01);
            expect(spanCm).toBeGreaterThan(boxed * 0.8);
        }
    });

    it("정면 그림의 키는 실제 높이 그대로다", () => {
        for (const model of MACHINE_MODELS) {
            expect(machineSpan(model.id, "front") / KAN_PER_CM).toBeCloseTo(model.size.height / 10, 1);
        }
    });

    it("화면에서 1cm 가 몇 px 인지에 따라 덜어 낸다", () => {
        for (const id of MACHINE_MODEL_IDS) {
            for (const view of VIEWS) {
                expect(detailFor(id, sizeAtScale(id, FULL_FROM, view) + 0.01, view)).toBe("full");
                expect(detailFor(id, sizeAtScale(id, FULL_FROM, view) - 1, view)).toBe("mid");
                expect(detailFor(id, sizeAtScale(id, MID_FROM, view) + 0.01, view)).toBe("mid");
                expect(detailFor(id, sizeAtScale(id, MID_FROM, view) - 1, view)).toBe("low");

                const count = (pxPerCm: number) =>
                    strokesOf(composeMachine(id, { size: sizeAtScale(id, pxPerCm, view), view })).length;
                // 경계 바로 위에서 재야 한다 — 딱 경계에서는 나눗셈의 끝자리에 따라 어느 쪽으로도 떨어진다
                expect(count(MID_FROM * 0.9)).toBeLessThan(count(MID_FROM * 1.01));
                expect(count(MID_FROM * 1.01)).toBeLessThan(count(FULL_FROM * 1.01));
            }
        }
    });

    it("볼터치는 손잡이에만 쓴다 — 단마다 하나씩이고, 작게 그려도 어느 보기에서도 남는다", () => {
        for (const { id, size, view } of EVERY) {
            const cheeks = strokesOf(composeMachine(id, { size, view })).filter((stroke) => stroke.fill === "cheek");
            expect(cheeks).toHaveLength(machineModel(id).tiers);
        }
    });

    it("정면은 같은 부품을 앞에서 본 것이다 — 옆면과 윗면의 획만 빠진다", () => {
        for (const id of MACHINE_MODEL_IDS) {
            const solid = strokesOf(composeMachine(id, { size: 512, view: "solid" }));
            const front = strokesOf(composeMachine(id, { size: 512, view: "front" }));
            expect(front.length).toBeLessThan(solid.length);
            // 캡슐이 나오는 곳(먹 채움)은 앞에 있어서 정면에서도 보인다
            expect(front.some((stroke) => stroke.fill === "ink")).toBe(true);
        }
    });

    it("정면은 같은 키에서 앞면이 더 크게 보인다 — 더 작은 크기부터 자세히 그려진다", () => {
        expect(detailFor("standard-2", 140, "front")).toBe("full");
        expect(detailFor("standard-2", 140, "solid")).toBe("mid");
        for (const id of MACHINE_MODEL_IDS) {
            expect(sizeAtScale(id, 1, "front")).toBeLessThan(sizeAtScale(id, 1, "solid"));
        }
    });

    it("선 굵기는 키에 비례하고, 화면에서 1.5px 보다 가늘어지지 않는다", () => {
        for (const { id, size, view } of EVERY) {
            const drawing = composeMachine(id, { size, view });
            const thickest = Math.max(...strokesOf(drawing).map((stroke) => stroke.w ?? 0));
            expect(thickest * (size / drawing.unit)).toBeCloseTo(Math.max(1.5, size * 0.012), 6);
        }
    });

    it("같은 축척으로 세우면 키가 그림의 키에 비례한다", () => {
        const scale = 1.2;
        for (const id of MACHINE_MODEL_IDS) {
            for (const view of VIEWS) {
                expect(sizeAtScale(id, scale, view)).toBeCloseTo((machineSpan(id, view) / KAN_PER_CM) * scale, 6);
            }
        }
        // 2단 표준형(130cm)이 1단 하프형(64cm)보다 크게 그려진다
        expect(sizeAtScale("standard-2", scale)).toBeGreaterThan(sizeAtScale("half-1", scale));
        expect(sizeAtScale("half-1", scale)).toBeGreaterThan(sizeAtScale("tabletop-box", scale));
        expect(sizeAtScale("standard-2", scale, "front")).toBeGreaterThan(sizeAtScale("half-1", scale, "front"));
    });
});

describe("내보내기", () => {
    it("캐릭터와 같은 방법으로 따로 떼어 쓸 수 있는 SVG 가 된다", () => {
        for (const id of MACHINE_MODEL_IDS) {
            for (const view of VIEWS) {
                const drawing = composeMachine(id, { size: 512, view });
                const svg = toSvgString(drawing, 512);
                expect(svg.startsWith("<svg ")).toBe(true);
                expect(svg.match(/<path /g)).toHaveLength(strokesOf(drawing).length);
                // 손떨림 필터가 그림 안에 들어간다
                expect(svg).toContain(`baseFrequency="${ROUGH_FILTERS["rough-line-sm"].baseFrequency}"`);
            }
        }
    });
});
