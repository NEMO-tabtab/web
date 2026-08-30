import React from "react";

import { cn } from "@/lib/cn";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** 선택 상태는 색이 아니라 먹 채움으로 표현한다 — 이 시스템의 핵심 원칙 */
    selected?: boolean;
    /** 값을 주면 오른쪽에 제거 버튼이 붙는다 */
    onRemove?: () => void;
    /** 상호작용이 없는 정적 태그로 쓸 때 */
    as?: "button" | "span";
    children: React.ReactNode;
}

/** 필터 알약 — 먹선 아웃라인, 평면. 그림자 없음 */
const base = "inline-flex items-center gap-1.5 sticker rounded-full px-3.5 py-1.5 text-[13px] font-bold";

export function Chip({ selected = false, onRemove, as = "button", className, children, ...props }: ChipProps) {
    const stateClasses = selected ? "bg-ink text-paper" : "bg-paper text-ink";

    const content = (
        <>
            {children}
            {onRemove && (
                <span
                    role="button"
                    tabIndex={-1}
                    aria-label="제거"
                    onClick={(event) => {
                        event.stopPropagation();
                        onRemove();
                    }}
                    className="-mr-0.5 flex h-4 w-4 items-center justify-center rounded-full text-current opacity-60 hover:opacity-100"
                >
                    ×
                </span>
            )}
        </>
    );

    // 정적 태그는 누를 수 없으므로 눌림 피드백을 붙이지 않는다
    if (as === "span") {
        return <span className={cn(base, stateClasses, className)}>{content}</span>;
    }

    return (
        <button
            type="button"
            aria-pressed={selected}
            className={cn(
                base,
                "sticker-press",
                stateClasses,
                // .field 와 같은 결의 포커스 링 — 3px 먹선 아웃라인
                "focus-visible:outline-ink focus-visible:outline-3 focus-visible:outline-offset-2",
                "disabled:pointer-events-none disabled:opacity-40",
                className,
            )}
            {...props}
        >
            {content}
        </button>
    );
}
