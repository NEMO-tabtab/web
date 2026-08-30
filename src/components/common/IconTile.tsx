import React from "react";

import { cn } from "@/lib/cn";

export const iconTileSizes = {
    sm: "h-8 w-8 text-base",
    md: "h-10 w-10 text-xl",
    lg: "h-16 w-16 text-3xl",
} as const;

/**
 * 톤은 색이 아니라 "채움과 선"으로 위계를 만든다.
 * `.sticker` 는 globals.css 의 언레이어드 규칙이라 border 유틸리티보다 세다 —
 * 먹선이 아닌 테두리(muted·danger)는 `.sticker` 없이 border 유틸리티로 직접 그린다.
 */
export const iconTileTones = {
    /** 먹선 아웃라인 — 기본 */
    default: "sticker bg-paper text-ink",
    /** 먹 채움 — 최강 강조 */
    ink: "sticker bg-ink text-paper",
    /** 옅은 면 — 비활성·보조 */
    muted: "border border-line bg-cream text-ink-soft",
    /** 삭제·오류 전용 */
    danger: "border-2 border-danger bg-paper text-danger",
    /** 볼터치 — 정서적 강조에만 아주 드물게 */
    cheek: "sticker bg-cheek text-ink",
} as const;

export const iconTileShapes = {
    /** `.sticker` 와 만나면 네 귀퉁이가 모두 다른 비대칭 손그림 모서리가 된다 */
    blob: "rounded-nemo",
    /** @deprecated `blob` 과 동일 — 손그림 모서리는 한 종류뿐이다. */
    "blob-sm": "rounded-nemo",
    circle: "rounded-full",
    square: "rounded-nemo",
} as const;

export interface IconTileProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    size?: keyof typeof iconTileSizes;
    tone?: keyof typeof iconTileTones;
    shape?: keyof typeof iconTileShapes;
    /** @deprecated 무시됩니다. 이 시스템에는 그림자가 없습니다. */
    raised?: boolean;
}

/** 아이콘·이모지를 담는 작은 웰. 평면 먹선으로 아이콘을 표면에 고정하는 장치. */
export function IconTile({
    children,
    size = "md",
    tone = "default",
    shape = "blob",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    raised,
    className,
    ...props
}: IconTileProps) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                "inline-flex shrink-0 items-center justify-center",
                iconTileSizes[size],
                iconTileTones[tone],
                iconTileShapes[shape],
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}
