import React from "react";

import { cn } from "@/lib/cn";

export const shellWidths = {
    narrow: "max-w-3xl",
    wide: "max-w-7xl",
    full: "max-w-none",
} as const;

export interface PageShellProps extends React.HTMLAttributes<HTMLElement> {
    width?: keyof typeof shellWidths;
    children: React.ReactNode;
}

/**
 * 모든 페이지의 `<main>` 컨테이너.
 *
 * 여백을 여기서 한 번에 관리한다 — 루트 레이아웃이 이미 `pb-16 sm:pb-0` 으로
 * 바텀 네비 자리를 확보하므로 페이지는 `pb-8` 만 더한다. 좌우는 손그림 시안 그대로
 * 넓은 화면에서도 `px-4` 를 유지해 종이 한 장 같은 느낌을 지킨다.
 */
export function PageShell({ width = "narrow", children, className, ...props }: PageShellProps) {
    return (
        <main className={cn("mx-auto w-full px-4 pt-5 pb-8", shellWidths[width], className)} {...props}>
            {children}
        </main>
    );
}

export interface PageHeaderProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    /** 뒤로가기 링크. onBack 과 함께 쓰지 않는다. */
    backHref?: string;
    /** 뒤로가기 핸들러. 이 prop 을 쓰는 호출부는 클라이언트 컴포넌트여야 한다. */
    onBack?: () => void;
    /** 오른쪽 슬롯 (액션 버튼 등) */
    action?: React.ReactNode;
    className?: string;
}

/** 뒤로가기 단추 — 먹선 아웃라인 알약. 링크·버튼 어느 쪽이든 같은 모양을 쓴다. */
const backClassName =
    "sticker sticker-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink";

export function PageHeader({ title, description, backHref, onBack, action, className }: PageHeaderProps) {
    const back = onBack ? (
        <button type="button" onClick={onBack} aria-label="뒤로 가기" className={backClassName}>
            <i className="xi-arrow-left text-xl" aria-hidden="true" />
        </button>
    ) : backHref ? (
        <a href={backHref} aria-label="뒤로 가기" className={backClassName}>
            <i className="xi-arrow-left text-xl" aria-hidden="true" />
        </a>
    ) : null;

    return (
        <header className={cn("flex items-start justify-between gap-4", className)}>
            <div className="flex min-w-0 items-start gap-2.5">
                {back}
                <div className="min-w-0">
                    {/* 낙서 밑줄은 h1 자체에 붙인다 — .scribble 이 inline-block 이라야 폭을 잡는다 */}
                    <h1 className="scribble font-display text-2xl leading-tight">{title}</h1>
                    {description && <p className="text-ink-soft mt-2 text-sm">{description}</p>}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </header>
    );
}
