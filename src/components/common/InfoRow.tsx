import React from "react";

import { cn } from "@/lib/cn";

export interface InfoRowProps extends React.HTMLAttributes<HTMLDivElement> {
    label: React.ReactNode;
    value: React.ReactNode;
    /** 먹 채움(bg-ink) 위에서 쓸 때 */
    inverse?: boolean;
}

/** 라벨 ↔ 값 한 줄. 카드 안 목록에 쓴다. 값은 숫자가 흔하므로 sans + tabular-nums 로 고정. */
export function InfoRow({ label, value, inverse = false, className, ...props }: InfoRowProps) {
    return (
        <div className={cn("flex items-center justify-between gap-4", className)} {...props}>
            <span className={cn("text-sm", inverse ? "text-paper/70" : "text-ink-soft")}>{label}</span>
            <span className={cn("font-sans text-sm font-bold tabular-nums", inverse ? "text-paper" : "text-ink")}>
                {value}
            </span>
        </div>
    );
}
