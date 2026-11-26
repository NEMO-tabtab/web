import React from "react";

import { NemoSvg } from "@/components/nemo/NemoSvg";
import { composeMachine } from "@/lib/machine/compose";
import type { MachineModelId } from "@/lib/machine/models";
import type { MachineView } from "@/lib/machine/sketch";

export interface GachaMachineProps {
    /** 기계 종류. 목록과 실제 치수는 src/lib/machine/models.ts, 그림은 /design-system/machines */
    model: MachineModelId;
    /**
     * 보기. 입체(기본)는 위에서 비스듬히 내려다본 모습이라 가게 장면에 세울 때 쓴다.
     * 정면("front")은 손잡이가 달린 앞면을 똑바로 본 모습이라 작은 자리에서도 앞면이 크게 보인다.
     */
    view?: MachineView;
    /**
     * 기계의 키(px). 작으면 캡슐·동전 넣는 곳 같은 작은 부품을 덜어 낸다.
     * 종류가 다른 기계를 같은 축척으로 나란히 세우려면 `sizeAtScale` 로 크기를 구한다(보기마다 따로).
     */
    size?: number;
    /** 주면 화면 낭독기가 읽는다. 없으면 장식으로 숨긴다 */
    title?: string;
    className?: string;
}

/**
 * 가챠 기계 한 대 — 기계 카탈로그의 종류를 손그림으로 그린다. 입체와 정면 두 가지 보기가 있다.
 * 그림은 캐릭터와 같은 자료형(획의 목록)이라 같은 부품으로 그린다.
 */
export function GachaMachine({ model, view = "solid", size = 160, title, className }: GachaMachineProps) {
    return <NemoSvg drawing={composeMachine(model, { size, view })} size={size} title={title} className={className} />;
}
