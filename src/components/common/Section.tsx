import React from "react";

import { cn } from "@/lib/cn";

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
    title?: React.ReactNode;
    description?: React.ReactNode;
    /** 제목 오른쪽에 놓이는 슬롯 (전체보기 링크 등) */
    action?: React.ReactNode;
    /** 제목 태그. 페이지 h1 아래에 놓이므로 기본은 h2. */
    titleAs?: "h2" | "h3" | "h4";
    /** 제목에 덧붙일 클래스. 낙서 밑줄이 필요하면 호출부에서 `scribble` 을 넘긴다. */
    titleClassName?: string;
    children: React.ReactNode;
}

/** 제목 + 본문 블록. 페이지가 반복적으로 손으로 만들던 `<section className="space-y-4">` 를 대체한다. */
export function Section({
    title,
    description,
    action,
    titleAs: TitleTag = "h2",
    titleClassName,
    children,
    className,
    ...props
}: SectionProps) {
    return (
        <section className={cn("space-y-4", className)} {...props}>
            {(title || action) && (
                <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                        {/* 제목만 손글씨 — 본문·숫자는 sans 를 유지한다 */}
                        {title && <TitleTag className={cn("font-display text-lg", titleClassName)}>{title}</TitleTag>}
                        {description && <p className="text-ink-soft text-sm">{description}</p>}
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
                </div>
            )}
            {children}
        </section>
    );
}
