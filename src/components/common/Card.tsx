import React from "react";

import { cn } from "@/lib/cn";

/**
 * 카드 표면. 손그림 시스템에는 그림자가 없다 — 강조는 오직 "채움"과 "선 굵기"로 만든다.
 * `.sticker` 는 2px 먹선 + 평면, `.sticker.rounded-nemo` 는 네 귀퉁이가 모두 다른 비대칭 모서리다.
 */
export const cardVariants = {
    /** 기본 표면 — 2px 먹선 + 비대칭 손그림 모서리 */
    default: "sticker rounded-nemo bg-paper",
    /** @deprecated `default` 와 동일. 먹선 아웃라인이 이미 기본이다. */
    outline: "sticker rounded-nemo bg-paper",
    /** @deprecated `default` 와 동일. 스티커가 곧 기본 표면이다. */
    sticker: "sticker rounded-nemo bg-paper",
    /** 가라앉은 면 — 옅은 헤어라인 + cream. paper 위에 카드를 중첩할 때 사용 */
    sunken: "rounded-nemo border border-line bg-cream",
} as const;

export type CardVariant = keyof typeof cardVariants | "glass";

export const cardPaddings = {
    none: "",
    xs: "p-3",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
} as const;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    padding?: keyof typeof cardPaddings;
    /** `glass` 는 @deprecated — `default` 로 렌더링됩니다. 글래스모피즘은 이 시스템에 없습니다. */
    variant?: CardVariant;
    /** 누를 수 있는 카드. 들어올리지 않고 종이를 누르는 피드백만 준다. */
    interactive?: boolean;
}

// TODO(design-system): 페이지 마이그레이션 완료 후 deprecated 별칭 제거
const resolveVariant = (variant: CardVariant) => (variant === "glass" ? "default" : variant);

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ children, className, padding = "md", variant = "default", interactive = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    cardVariants[resolveVariant(variant)],
                    cardPaddings[padding],
                    // 호버 리프트 금지 — 평면 시스템이라 눌림(translateY 1px)만 쓴다
                    interactive && "sticker-press cursor-pointer",
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        );
    },
);

Card.displayName = "Card";
