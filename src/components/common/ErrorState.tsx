import React from "react";

import { IconTile } from "./IconTile";
import { cn } from "@/lib/cn";

export interface ErrorStateProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/**
 * 실패 상태. EmptyState 와 같은 골격을 쓰고, danger 는 아이콘 웰에만 남긴다 —
 * 상태색은 신호일 뿐 표면을 물들이지 않는다.
 */
export function ErrorState({ title, description, action, className }: ErrorStateProps) {
    return (
        <div
            role="alert"
            className={cn(
                "sticker rounded-nemo bg-paper flex min-h-[18rem] flex-col items-center justify-center gap-3 p-8 text-center",
                className,
            )}
        >
            <IconTile size="lg" tone="danger">
                ⚠️
            </IconTile>
            <p className="font-display text-lg leading-snug">{title}</p>
            {description && <p className="text-ink-soft max-w-sm text-[13px] leading-relaxed">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
