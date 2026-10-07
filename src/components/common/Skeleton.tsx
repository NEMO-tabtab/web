import React from "react";

import { cn } from "@/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    /** 기본은 한 줄짜리 바. 여러 줄이 필요하면 lines 를 준다. */
    lines?: number;
}

/** 자리 표시 바. 색이 아니라 옅은 면(cream)으로만 "아직 비어 있음"을 알린다. */
export function Skeleton({ lines = 1, className, ...props }: SkeletonProps) {
    if (lines > 1) {
        return (
            <div className="space-y-2" {...props}>
                {Array.from({ length: lines }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "bg-cream h-4 animate-pulse rounded-full",
                            index === lines - 1 && "w-2/3",
                            className,
                        )}
                    />
                ))}
            </div>
        );
    }

    return <div className={cn("bg-cream h-4 animate-pulse rounded-full", className)} {...props} />;
}

/** 제품 카드 그리드용 스켈레톤. 실제 카드와 같은 먹선 골격을 흉내낸다. */
export function ProductCardSkeleton() {
    return (
        <div className="sticker rounded-nemo bg-paper overflow-hidden">
            <div className="bg-cream aspect-square animate-pulse" />
            {/* 카드 내부 구분은 헤어라인이 아니라 먹선 */}
            <div className="border-ink space-y-2 border-t-2 px-2.5 py-2.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

export interface LoadingStateProps {
    label?: string;
    className?: string;
}

/** 기다리는 화면. 큰 스피너 대신 작은 먹선 원 하나와 손글씨 톤의 한마디. */
export function LoadingState({ label = "여는 중…", className }: LoadingStateProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn("flex min-h-[18rem] flex-col items-center justify-center gap-3", className)}
        >
            <span aria-hidden="true" className="border-line border-t-ink h-5 w-5 animate-spin rounded-full border-2" />
            <p className="text-ink-soft text-sm">{label}</p>
        </div>
    );
}
