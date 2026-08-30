import React from "react";

import { cn } from "@/lib/cn";

export const badgeVariants = {
    /** 기본 — 옅은 면 위 헤어라인 */
    neutral: "border border-line bg-cream text-ink",
    /** 강조 배지 — 색이 아니라 먹 채움 */
    ink: "sticker bg-ink text-paper",
    /** 주의 — 색 없이 먹선 아웃라인으로 */
    warning: "sticker bg-paper text-ink",
    /** 긍정 — 색 없이 먹선 아웃라인 + 문구로 표현한다 */
    success: "sticker bg-paper text-ink",
    /** 삭제·오류 전용 */
    danger: "border border-danger bg-paper text-danger",
} as const;

export type BadgeVariant = keyof typeof badgeVariants | "brand";

export const badgeSizes = {
    sm: "px-2 py-0 text-[10px] leading-4",
    md: "px-2.5 py-0.5 text-[11px] leading-5 sm:px-3",
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** `brand` 는 @deprecated — `ink` 로 렌더링됩니다. */
    variant?: BadgeVariant;
    size?: keyof typeof badgeSizes;
    children: React.ReactNode;
}

// TODO(design-system): 페이지 마이그레이션 완료 후 deprecated 별칭 제거
const resolveVariant = (variant: BadgeVariant) => (variant === "brand" ? "ink" : variant);

export function Badge({ variant = "neutral", size = "md", className, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                // 개수·수량이 자주 들어오므로 본문 서체 + 고정폭 숫자를 강제한다
                "inline-flex items-center gap-1 rounded-full font-sans font-bold tabular-nums",
                badgeSizes[size],
                badgeVariants[resolveVariant(variant)],
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}
