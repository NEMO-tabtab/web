import React from "react";

import { NemoSvg } from "@/components/nemo/NemoSvg";
import { composeNemo, composeSymbol } from "@/lib/nemo/compose";
import type { ExpressionId } from "@/lib/nemo/expressions";

export interface NemoProps {
    /** 표정. 목록과 쓰는 순간은 src/lib/nemo/expressions.ts, 그림은 /design-system/character/expressions */
    expression?: ExpressionId;
    /** px 단위 정사각 */
    size?: number;
    /**
     * 주면 화면 낭독기가 읽는다. 없으면 장식으로 숨긴다 —
     * 상황은 캐릭터가 아니라 옆의 문장이 전해야 한다(docs/design-system.md U8).
     */
    title?: string;
    className?: string;
}

/**
 * 네모 — 전신. 64px 이하에서는 표시(땀방울·물음표 등)를 빼고, 40px 이하에서는 작은 필터를 쓴다.
 * 그보다 좁은 자리(24~32px)에는 `NemoSymbol` 을 쓴다.
 */
export function Nemo({ expression = "base", size = 120, title, className }: NemoProps) {
    return <NemoSvg drawing={composeNemo({ expression, size })} size={size} title={title} className={className} />;
}

/** 네모 심볼 — 팔다리를 덜어 낸 얼굴. 24px 밑으로는 눈·입이 뭉개진다 */
export function NemoSymbol({ expression = "base", size = 40, title, className }: NemoProps) {
    return <NemoSvg drawing={composeSymbol({ expression })} size={size} title={title} className={className} />;
}
