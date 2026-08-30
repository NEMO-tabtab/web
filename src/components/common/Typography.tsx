import React from "react";

import { cn } from "@/lib/cn";

/**
 * 손그림 시스템의 색은 먹(ink) 하나로 굴러간다.
 * 볼터치(cheek)는 유일한 포인트 컬러라 정서적 강조에만 아주 드물게,
 * danger 는 삭제·오류 전용이다. 그 외 강조는 색이 아니라 채움과 선으로 만든다.
 */
export type Tone = "default" | "muted" | "subtle" | "strong" | "danger" | "inverse" | "cheek";

export const toneClasses: Record<Tone, string> = {
    default: "text-ink",
    muted: "text-ink-soft",
    subtle: "text-ink-soft/70",
    strong: "text-ink",
    danger: "text-danger",
    inverse: "text-paper",
    cheek: "text-cheek",
};

/**
 * 디스플레이 페이스(Gaegu)는 level 1~3 에만 적용한다.
 * level 4~6 은 데이터 블록 라벨이라 sans 를 유지 — Gaegu 는 숫자 글리프가 불규칙하다.
 *
 * 스케일은 모바일 기준. 손글씨는 크게 키우면 금방 지저분해져서 h1 도 text-2xl 에서 멈춘다.
 * 금액·수량이 섞이는 제목이면 숫자만 `font-sans tabular-nums` 로 빼줄 것.
 */
export const headingLevels = {
    1: "font-display text-2xl font-bold leading-snug text-ink md:text-3xl",
    2: "font-display text-xl font-bold leading-snug text-ink md:text-2xl",
    3: "font-display text-lg font-bold leading-snug text-ink md:text-xl",
    4: "text-base font-bold leading-snug text-ink md:text-lg",
    5: "text-sm font-bold leading-snug text-ink md:text-base",
    6: "text-[13px] font-bold leading-snug text-ink md:text-sm",
} as const;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    /** 시각 레벨과 다른 의미 태그를 쓰고 싶을 때 */
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span";
    tone?: Tone;
    className?: string;
}

/**
 * 페이지 제목에 손그림 밑줄을 깔고 싶으면 `className="scribble"` 을 넘긴다.
 * `.scribble` 은 inline-block 이라 제목 요소 자체에 붙어야 밑줄 폭이 글자 폭을 따라간다.
 */
export const Heading = ({ children, level = 1, as, tone, className, ...props }: HeadingProps) => {
    const Tag = (as ?? `h${level}`) as "h1";

    return (
        <Tag className={cn(headingLevels[level], tone && toneClasses[tone], className)} {...props}>
            {children}
        </Tag>
    );
};

export const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
} as const;

export const textWeights = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
} as const;

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode;
    size?: keyof typeof textSizes;
    weight?: keyof typeof textWeights;
    tone?: Tone;
    as?: "p" | "span" | "div";
    /**
     * @deprecated `tone` 을 사용하세요. 원시 Tailwind 클래스 문자열입니다.
     * 기본값을 두지 않는 것이 중요 — 기본값이 있으면 tone 이 절대 적용될 수 없습니다.
     */
    color?: string;
    className?: string;
}

export const Text = ({
    children,
    size = "base",
    weight = "normal",
    tone = "default",
    as: Tag = "p",
    color,
    className,
    ...props
}: TextProps) => {
    return (
        <Tag className={cn(textSizes[size], textWeights[weight], toneClasses[tone], color, className)} {...props}>
            {children}
        </Tag>
    );
};
