import React from "react";

import { NemoFace } from "@/components/NemoFace";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
    /** 주면 이 노드를, 없으면 네모 캐릭터를 세운다. */
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/**
 * 아직 아무것도 없음. 점선 테두리 대신 실선 먹선을 쓴다 —
 * 이 시스템에 점선은 없고, 비어 있음은 캐릭터와 문장이 대신 말한다.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "sticker rounded-nemo bg-paper flex min-h-[18rem] flex-col items-center justify-center gap-3 p-8 text-center",
                className,
            )}
        >
            {/* 이모지를 받을 수도 있으므로 글자 크기를 함께 준다 */}
            <span aria-hidden="true" className="flex h-24 items-center justify-center text-4xl">
                {icon ?? <NemoFace size={96} />}
            </span>
            <p className="font-display text-lg leading-snug">{title}</p>
            {description && <p className="text-ink-soft max-w-sm text-[13px] leading-relaxed">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
