import { describe, expect, it } from "vitest";

import {
    CAPSULE,
    CAPSULE_EXPRESSIONS,
    CAPSULE_EXPRESSION_IDS,
    CAPSULE_MARKS_HIDDEN_MAX,
    capsuleLayers,
    composeCapsule,
    type CapsuleExpression,
} from "./capsule";
import { SMALL_FILTER_MAX, composeNemo } from "./compose";
import { BODY, CANVAS } from "./geometry";
import { SCENES, SCENE_IDS, composeScene, type Scene } from "./scenes";
import { SOLID_MIN } from "./solid";
import type { Drawing } from "./types";

const paths = (drawing: Drawing) => drawing.layers.flatMap((layer) => layer.strokes).map((stroke) => stroke.d);
const face = (id: (typeof CAPSULE_EXPRESSION_IDS)[number]): CapsuleExpression => CAPSULE_EXPRESSIONS[id];
const scene = (id: (typeof SCENE_IDS)[number]): Scene => SCENES[id];

describe("캡슐 친구", () => {
    it("몸은 네모보다 작고 그림 칸 안에 들어간다", () => {
        const { cx, cy, r, box } = CAPSULE;
        expect(r * 2).toBeLessThan(BODY.right - BODY.left);
        expect(cx - r).toBeGreaterThan(box.x);
        expect(cx + r).toBeLessThan(box.x + box.width);
        expect(cy - r).toBeGreaterThan(box.y);
        expect(cy + r).toBeLessThan(box.y + box.height);
    });

    it("표정은 6개이고 모두 이름과 쓰는 순간이 있다", () => {
        expect(CAPSULE_EXPRESSION_IDS).toHaveLength(6);
        const labels = CAPSULE_EXPRESSION_IDS.map((id) => face(id).label);
        expect(new Set(labels).size).toBe(labels.length);
        for (const id of CAPSULE_EXPRESSION_IDS) {
            expect(face(id).label.length).toBeGreaterThan(0);
            expect(face(id).when.length).toBeGreaterThan(0);
        }
    });

    it("몸은 그릇과 뚜껑 두 쪽이고, 뚜껑은 그릇 위에 얹힌다", () => {
        for (const id of CAPSULE_EXPRESSION_IDS) {
            const layers = capsuleLayers(id, false);
            expect(layers).toHaveLength(2);
            // 그릇과 뚜껑은 이음선의 같은 두 끝에서 만난다
            const bowl = layers[0].strokes[0].d;
            const dome = layers[1].strokes[0].d;
            expect(dome.split(" ").slice(0, 2)).toEqual(bowl.split(" ").slice(0, 2));
        }
    });

    it("뚜껑 틈이 기분을 드러낸다 — 닫히면 그릇과 같이 움직이고, 열리면 뚜껑만 더 움직인다", () => {
        const closed = capsuleLayers("base", false);
        expect(closed[0].transform).toBeUndefined();
        expect(closed[1].transform).toBeUndefined();
        const rolled = capsuleLayers("roll", false);
        expect(rolled[1].transform).toBe(rolled[0].transform);
        for (const id of ["bounce", "pop"] as const) {
            const [bowl, dome] = capsuleLayers(id, false);
            expect(dome.transform).toContain("rotate");
            expect(dome.transform).not.toBe(bowl.transform);
        }
    });

    it("그림이 똑같은 표정이 둘 있지 않다", () => {
        const drawings = CAPSULE_EXPRESSION_IDS.map((id) => {
            const drawing = composeCapsule({ expression: id });
            return paths(drawing).join("|") + drawing.layers.map((layer) => layer.transform).join("|");
        });
        expect(new Set(drawings).size).toBe(drawings.length);
    });

    it("작은 크기에서는 표시를 빼고, 더 작으면 작은 필터를 쓴다", () => {
        const large = composeCapsule({ expression: "sleep", size: CAPSULE_MARKS_HIDDEN_MAX + 1 });
        const small = composeCapsule({ expression: "sleep", size: CAPSULE_MARKS_HIDDEN_MAX });
        expect(small.layers.length).toBeLessThan(large.layers.length);
        expect(composeCapsule({ size: SMALL_FILTER_MAX + 1 }).filter).toBe("rough-line");
        expect(composeCapsule({ size: SMALL_FILTER_MAX }).filter).toBe("rough-line-sm");
        expect(large.unit).toBe(CAPSULE.unit);
        expect(large.box).toEqual(CAPSULE.box);
    });
});

describe("장면", () => {
    it("장면은 3개이고 모두 이름과 쓰는 순간이 있다", () => {
        expect(SCENE_IDS).toHaveLength(3);
        for (const id of SCENE_IDS) {
            expect(scene(id).label.length).toBeGreaterThan(0);
            expect(scene(id).when.length).toBeGreaterThan(0);
        }
    });

    it("네모와 캡슐을 한 그림에 같은 칸 크기로 놓는다", () => {
        for (const id of SCENE_IDS) {
            const drawing = composeScene(id, SOLID_MIN);
            const { nemo, capsule } = scene(id);
            const alone = composeNemo({ ...nemo, view: "solid", size: SOLID_MIN });
            // 네모의 층이 그대로 앞에 오고, 그 뒤에 캡슐의 층(그릇·뚜껑·표시)이 온다
            expect(drawing.unit).toBe(CANVAS);
            expect(drawing.layers.slice(0, alone.layers.length)).toEqual(alone.layers);
            const friend = drawing.layers.slice(alone.layers.length);
            expect(friend.length).toBeGreaterThanOrEqual(2);
            for (const layer of friend) {
                expect(layer.transform?.startsWith(`translate(${capsule.x} ${capsule.y})`)).toBe(true);
            }
        }
    });

    it("캡슐 친구가 그림 칸 안에 들어간다", () => {
        for (const id of SCENE_IDS) {
            const { box } = composeScene(id, SOLID_MIN);
            const { capsule } = scene(id);
            const x = capsule.x + CAPSULE.cx;
            const y = capsule.y + CAPSULE.cy;
            expect(x - CAPSULE.r).toBeGreaterThan(box.x);
            expect(x + CAPSULE.r).toBeLessThan(box.x + box.width);
            expect(y - CAPSULE.r).toBeGreaterThan(box.y);
            expect(y + CAPSULE.r).toBeLessThan(box.y + box.height);
        }
    });

    it("캡슐이 소품 자리를 대신하는 장면에서는 네모가 소품을 들지 않는다", () => {
        const withProp = paths(composeNemo({ pose: "store", view: "solid", size: SOLID_MIN }));
        const bare = paths(composeNemo({ pose: "store", view: "solid", size: SOLID_MIN, bare: true }));
        expect(bare.length).toBeLessThan(withProp.length);
        // 팔은 그대로 든다
        expect(bare.slice(0, 1)).toEqual(withProp.slice(0, 1));
    });
});
