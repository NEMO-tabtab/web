import React from "react";

import { cn } from "@/lib/cn";
import { formatWon } from "@/lib/format";

export const priceSizes = {
    sm: { amount: "text-sm", unit: "text-xs" },
    md: { amount: "text-lg", unit: "text-xs" },
    lg: { amount: "text-2xl", unit: "text-sm" },
    xl: { amount: "text-3xl sm:text-4xl", unit: "text-base" },
} as const;

export interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
    value: number | string | null | undefined;
    size?: keyof typeof priceSizes;
    /** 먹 채움(bg-ink) 위에서 쓸 때 */
    inverse?: boolean;
    unit?: string;
}

/**
 * 금액 표시. 숫자는 언제나 `font-sans tabular-nums` 로 빠져나온다 —
 * 손글씨 페이스(Gaegu)는 숫자 글리프가 불규칙해 금액에 쓸 수 없다.
 */
export function Price({ value, size = "md", inverse = false, unit = "원", className, ...props }: PriceProps) {
    const scale = priceSizes[size];

    return (
        <span className={cn("inline-flex items-baseline gap-1", className)} {...props}>
            <span className={cn("font-sans font-bold tabular-nums", scale.amount, inverse ? "text-paper" : "text-ink")}>
                {formatWon(value)}
            </span>
            <span className={cn("font-sans font-medium", scale.unit, inverse ? "text-paper/70" : "text-ink-soft")}>
                {unit}
            </span>
        </span>
    );
}
