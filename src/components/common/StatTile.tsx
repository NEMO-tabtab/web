import React from "react";

import { cn } from "@/lib/cn";

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
    label: React.ReactNode;
    value: React.ReactNode;
    icon?: React.ReactNode;
    hint?: React.ReactNode;
    /** ink 채움 강조 타일 (한 화면에 하나만) */
    emphasis?: boolean;
    align?: "center" | "start";
}

/**
 * 라벨 + 수치 한 쌍. 색이 아니라 채움으로 강조한다.
 *
 * 수치를 먼저, 라벨을 그 아래에 둔다 — 손그림 시안의 스탯 칸 순서.
 * 숫자는 손글씨 페이스를 쓰지 않고 `font-sans tabular-nums` 로 고정한다.
 */
export function StatTile({
    label,
    value,
    icon,
    hint,
    emphasis = false,
    align = "center",
    className,
    ...props
}: StatTileProps) {
    const soft = emphasis ? "text-paper/70" : "text-ink-soft";

    return (
        <div
            className={cn(
                "sticker rounded-nemo flex flex-col gap-1 px-4 py-4",
                align === "center" ? "items-center text-center" : "items-start text-left",
                emphasis ? "bg-ink text-paper" : "bg-paper text-ink",
                className,
            )}
            {...props}
        >
            {icon && (
                <span aria-hidden="true" className={cn("text-xl leading-none", soft)}>
                    {icon}
                </span>
            )}
            <span className="font-sans text-xl font-bold tabular-nums">{value}</span>
            <span className={cn("text-xs", soft)}>{label}</span>
            {hint && <span className={cn("text-xs", soft)}>{hint}</span>}
        </div>
    );
}
