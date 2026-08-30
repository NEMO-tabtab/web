import React from "react";

import { cn } from "@/lib/cn";

export const dividerTones = {
    /** 옅은 구분선 — 표면 안쪽 항목 사이 */
    subtle: "bg-line",
    /** 기본 구분선 */
    default: "bg-line",
    /** 먹선 — 카드 내부 구분처럼 구조를 끊을 때. 2px 로 굵어진다. */
    ink: "bg-ink",
} as const;

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical";
    tone?: keyof typeof dividerTones;
    /** 가운데에 인라인 라벨을 넣는다. horizontal 에서만 동작. */
    label?: React.ReactNode;
}

/**
 * 그림자가 없는 시스템에서 선은 주요 구조 장치다.
 * ink 톤만 먹선 굵기(2px)를 쓰고, 나머지는 머리카락 굵기(1px)를 유지한다.
 */
export function Divider({ orientation = "horizontal", tone = "default", label, className, ...props }: DividerProps) {
    const isInk = tone === "ink";

    if (orientation === "vertical") {
        return (
            <div
                role="separator"
                aria-orientation="vertical"
                className={cn(isInk ? "w-0.5" : "w-px", "self-stretch", dividerTones[tone], className)}
                {...props}
            />
        );
    }

    if (label) {
        return (
            <div role="separator" className={cn("flex items-center gap-3", className)} {...props}>
                <span className={cn("flex-1", isInk ? "h-0.5" : "h-px", dividerTones[tone])} />
                <span className="text-ink-soft text-xs font-medium">{label}</span>
                <span className={cn("flex-1", isInk ? "h-0.5" : "h-px", dividerTones[tone])} />
            </div>
        );
    }

    return (
        <div
            role="separator"
            aria-orientation="horizontal"
            className={cn("w-full", isInk ? "h-0.5" : "h-px", dividerTones[tone], className)}
            {...props}
        />
    );
}
