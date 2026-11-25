import { capsuleLayers, type CapsuleExpressionId } from "./capsule";
import { composeNemo, filterFor, union } from "./compose";
import type { ExpressionId } from "./expressions";
import { CANVAS } from "./geometry";
import type { PoseId } from "./poses";
import type { Box, Drawing, Layer } from "./types";

/*
 * 장면 — 네모와 캡슐 친구가 함께 있는 큰 그림. 온보딩·소개 그림에 쓴다.
 * 둘을 한 SVG 안에 같은 칸 크기로 놓는다. 그래야 선 굵기와 손떨림이 같다.
 * 네모는 입체 보기로 그린다(160px 보다 작게 주면 정면으로 돌아간다).
 */

export interface Scene {
    /** 화면과 문서에 쓰는 이름 */
    label: string;
    /** 쓰는 순간 */
    when: string;
    nemo: {
        pose: PoseId;
        expression?: ExpressionId;
        /** 자세의 소품을 빼고 그 자리를 캡슐 친구에게 준다 */
        bare?: boolean;
    };
    capsule: {
        expression: CapsuleExpressionId;
        /** 캡슐 친구를 옮겨 놓는 자리(칸). 캡슐의 그림은 (30, 33)을 가운데로 그려져 있다 */
        x: number;
        y: number;
    };
    /** 캡슐 친구까지 담는 그림 칸. 네모의 그림 칸과 합쳐 쓴다 */
    box: Box;
}

export const SCENES = {
    together: {
        label: "나란히",
        when: "대표 그림 — 소개, 첫 화면",
        nemo: { pose: "stand", expression: "happy" },
        capsule: { expression: "base", x: 120, y: 52 },
        box: { x: 0, y: 0, width: 178, height: 120 },
    },
    store: {
        label: "담기",
        when: "등록을 마쳤을 때의 큰 그림 — 캡슐이 네모 속으로",
        nemo: { pose: "store", bare: true },
        capsule: { expression: "bounce", x: 37, y: -62 },
        box: { x: 0, y: -74, width: 120, height: 194 },
    },
    outing: {
        label: "나들이",
        when: "가챠샵 지도 — 캡슐이 앞장서 구른다",
        nemo: { pose: "map" },
        capsule: { expression: "roll", x: 126, y: 53 },
        box: { x: 0, y: 0, width: 186, height: 120 },
    },
} satisfies Record<string, Scene>;

export type SceneId = keyof typeof SCENES;
export const SCENE_IDS = Object.keys(SCENES) as SceneId[];

export function composeScene(id: SceneId, size: number = CANVAS * 2): Drawing {
    const scene: Scene = SCENES[id];
    const nemo = composeNemo({ ...scene.nemo, view: "solid", size });
    const place = `translate(${scene.capsule.x} ${scene.capsule.y})`;
    const friend: Layer[] = capsuleLayers(scene.capsule.expression, true).map((layer) => ({
        // 캡슐의 층이 제 몸짓(구르기·뚜껑)을 갖고 있으면 자리를 옮긴 뒤에 이어 붙인다
        transform: layer.transform ? `${place} ${layer.transform}` : place,
        strokes: layer.strokes,
    }));
    return {
        box: union(nemo.box, scene.box),
        unit: CANVAS,
        filter: filterFor(size),
        layers: [...nemo.layers, ...friend],
    };
}
