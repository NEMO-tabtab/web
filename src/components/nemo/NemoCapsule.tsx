import React from "react";

import { NemoSvg } from "@/components/nemo/NemoSvg";
import { composeCapsule, type CapsuleExpressionId } from "@/lib/nemo/capsule";
import { composeScene, type SceneId } from "@/lib/nemo/scenes";

export interface NemoCapsuleProps {
    /** 표정. 목록과 쓰는 순간은 src/lib/nemo/capsule.ts, 그림은 /design-system/character/friend */
    expression?: CapsuleExpressionId;
    /** px 단위 정사각. 40px 이하에서는 표시를 뺀다 */
    size?: number;
    /** 주면 화면 낭독기가 읽는다. 없으면 장식으로 숨긴다 */
    title?: string;
    className?: string;
}

/**
 * 캡슐 친구 "동글" — 네모의 짝. 말을 하지 않는다: 화면의 화자는 네모 하나다
 * (docs/decisions/0008-character.md "캡슐 친구"). 혼자 세우기보다 네모 옆이나 기다리는 화면에 쓴다.
 */
export function NemoCapsule({ expression = "base", size = 48, title, className }: NemoCapsuleProps) {
    return <NemoSvg drawing={composeCapsule({ expression, size })} size={size} title={title} className={className} />;
}

export interface NemoSceneProps {
    /** 장면. 목록은 src/lib/nemo/scenes.ts */
    scene: SceneId;
    /** 네모의 크기(px). 장면은 캡슐 친구의 자리만큼 더 넓거나 높다. 160px 보다 작으면 네모를 정면으로 그린다 */
    size?: number;
    title?: string;
    className?: string;
}

/** 네모와 캡슐 친구가 함께 있는 큰 그림 — 온보딩·소개용 */
export function NemoScene({ scene, size = 200, title, className }: NemoSceneProps) {
    return <NemoSvg drawing={composeScene(scene, size)} size={size} title={title} className={className} />;
}
