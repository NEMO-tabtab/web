import { describe, expect, it } from "vitest";

import {
    CELL,
    boxFaces,
    drawOrder,
    isNearWall,
    onFace,
    project,
    sceneBounds,
    turnBox,
    turnFacing,
    turnSize,
} from "./iso";

const size = { width: 8, depth: 6 };
const box = (x: number, y: number, w = 1, d = 1, h = 1) => ({ x, y, w, d, h });
const ids = (boxes: { id: string }[]) => boxes.map((each) => each.id);

describe("투영", () => {
    it("(0,0)은 원점이고, 동쪽은 오른쪽 아래, 남쪽은 왼쪽 아래로 간다", () => {
        expect(project(0, 0)).toEqual([0, 0]);
        const [eastX, eastY] = project(1, 0);
        const [southX, southY] = project(0, 1);
        expect(eastX).toBeGreaterThan(0);
        expect(southX).toBeCloseTo(-eastX);
        expect(eastY).toBeCloseTo(CELL / 2);
        expect(southY).toBeCloseTo(CELL / 2);
    });

    it("높이는 화면 위쪽으로 한 칸에 CELL 만큼 올라간다", () => {
        expect(project(2, 3, 1)[0]).toBeCloseTo(project(2, 3)[0]);
        expect(project(2, 3, 1)[1]).toBeCloseTo(project(2, 3)[1] - CELL);
    });

    it("화면 범위가 바닥과 가장 높은 물체를 모두 담는다", () => {
        const bounds = sceneBounds(size, 5);
        const corners = [
            project(0, 0, 5),
            project(8, 0, 5),
            project(0, 6),
            project(8, 6),
            project(8, 0),
            project(0, 6, 5),
        ];
        for (const [x, y] of corners) {
            expect(x).toBeGreaterThanOrEqual(bounds.x - 1e-9);
            expect(x).toBeLessThanOrEqual(bounds.x + bounds.width + 1e-9);
            expect(y).toBeGreaterThanOrEqual(bounds.y - 1e-9);
            expect(y).toBeLessThanOrEqual(bounds.y + bounds.height + 1e-9);
        }
    });
});

describe("돌리기", () => {
    it("한 번 돌리면 북쪽 벽이 동쪽 벽이 된다", () => {
        const northWall = box(0, 0, 8, 1, 5);
        expect(turnBox(northWall, size, 1)).toEqual({ x: 5, y: 0, w: 1, d: 8, h: 5 });
        expect(turnSize(size, 1)).toEqual({ width: 6, depth: 8 });
    });

    it("네 방향 모두에서 바닥 안에 있고, 한 바퀴 돌면 제자리다", () => {
        const item = box(1, 2, 2, 1, 3);
        let current = item;
        for (const turn of [1, 2, 3] as const) {
            const turned = turnBox(item, size, turn);
            const turnedSize = turnSize(size, turn);
            expect(turned.x).toBeGreaterThanOrEqual(0);
            expect(turned.y).toBeGreaterThanOrEqual(0);
            expect(turned.x + turned.w).toBeLessThanOrEqual(turnedSize.width);
            expect(turned.y + turned.d).toBeLessThanOrEqual(turnedSize.depth);
        }
        let currentSize = size;
        for (let step = 0; step < 4; step += 1) {
            current = turnBox(current, currentSize, 1);
            currentSize = turnSize(currentSize, 1);
        }
        expect(current).toEqual(item);
    });

    it("돌려도 다른 값(id 등)은 그대로다", () => {
        expect(turnBox({ ...box(1, 1), id: "slot-a" }, size, 2).id).toBe("slot-a");
    });

    it("보는 쪽도 같이 돈다", () => {
        expect(turnFacing("n", 1)).toBe("e");
        expect(turnFacing("s", 1)).toBe("w");
        expect(turnFacing("w", 2)).toBe("e");
        expect(turnFacing("e", 0)).toBe("e");
    });
});

describe("그리는 순서", () => {
    it("뒤(북쪽·서쪽)에 있는 것부터 그린다", () => {
        const front = { id: "front", ...box(3, 4) };
        const back = { id: "back", ...box(3, 1) };
        const west = { id: "west", ...box(0, 4) };
        expect(ids(drawOrder([front, back, west]))).toEqual(["back", "west", "front"]);
    });

    it("긴 벽 바로 앞의 작은 상자는 벽보다 나중에 그린다 (가운데 점만 보면 뒤집히는 경우)", () => {
        const wall = { id: "wall", ...box(0, 0, 12, 1, 5) };
        const slot = { id: "slot", ...box(1, 1, 2, 1, 3) };
        expect(ids(drawOrder([slot, wall]))).toEqual(["wall", "slot"]);
    });

    it("서쪽 벽과 그 옆에 붙은 상자도 벽이 먼저다", () => {
        const wall = { id: "wall", ...box(0, 1, 1, 7, 5) };
        const slot = { id: "slot", ...box(1, 1, 1, 2, 3) };
        expect(ids(drawOrder([slot, wall]))).toEqual(["wall", "slot"]);
    });

    it("넣은 배열은 바꾸지 않고, 빠뜨리는 것이 없다", () => {
        const boxes = [
            { id: "a", ...box(4, 4) },
            { id: "b", ...box(0, 0) },
            { id: "c", ...box(2, 2) },
        ];
        const ordered = drawOrder(boxes);
        expect(ids(boxes)).toEqual(["a", "b", "c"]);
        expect(ids(ordered)).toEqual(["b", "c", "a"]);
    });
});

describe("벽 낮추기", () => {
    it("보는 사람 쪽 변을 따라 선 벽만 고른다", () => {
        expect(isNearWall(box(0, 5, 8, 1, 5), size)).toBe(true); // 남쪽 변
        expect(isNearWall(box(7, 0, 1, 6, 5), size)).toBe(true); // 동쪽 변
        expect(isNearWall(box(0, 0, 8, 1, 5), size)).toBe(false); // 북쪽 변 — 동쪽 끝에 닿지만 뒤에 있다
        expect(isNearWall(box(0, 0, 1, 6, 5), size)).toBe(false); // 서쪽 변
        expect(isNearWall(box(7, 5, 1, 1, 5), size)).toBe(false); // 모서리의 기둥
    });
});

describe("면", () => {
    it("남쪽 면과 동쪽 면은 남동쪽 모서리에서 만난다", () => {
        const faces = boxFaces(box(1, 1, 2, 1, 3));
        expect(faces.south[1]).toEqual(faces.east[0]);
        expect(faces.south[2]).toEqual(faces.east[3]);
        expect(faces.top[2]).toEqual(faces.south[2]);
    });

    it("면 전체를 가리키면 그 면과 같다", () => {
        const item = box(1, 1, 2, 1, 3);
        const faces = boxFaces(item);
        expect(onFace(item, "south", [0, 1], [0, 3])).toEqual(faces.south);
        expect(onFace(item, "east", [0, 1], [0, 3])).toEqual(faces.east);
    });
});
