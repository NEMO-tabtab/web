import React from "react";

import { cn } from "@/lib/cn";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    label: React.ReactNode;
    /** 라벨 전체를 손그림 필드 박스로 감싼다 (폼 안에서 눈에 띄게) */
    boxed?: boolean;
}

/**
 * 네이티브 체크박스를 `appearance-none` 으로 지우고 2px 먹선 사각을 직접 그린다.
 * 체크되면 먹으로 꽉 채우고(강조 위계 1단계) 흰 획으로 체크 표시를 얹는다.
 * 표시는 input 의 형제라서 `peer-checked:` 로 붙였다 뗀다 — 훅 없이 동작한다.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, boxed = false, className, ...props }, ref) => {
        return (
            <label
                className={cn(
                    "flex cursor-pointer items-center gap-2.5 select-none",
                    // .field 는 테두리·비대칭 모서리·패딩을 통째로 얹는다 (display 는 건드리지 않는다)
                    boxed && "field",
                    props.disabled && "cursor-not-allowed opacity-45",
                    className,
                )}
            >
                <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
                    <input
                        ref={ref}
                        type="checkbox"
                        className={cn(
                            "peer border-ink bg-paper size-5 appearance-none rounded-[0.4rem_0.26rem_0.45rem_0.3rem] border-2",
                            "checked:bg-ink",
                            "focus-visible:outline-ink focus-visible:outline-[3px] focus-visible:outline-offset-2",
                        )}
                        {...props}
                    />
                    {/* 체크 획 — 손으로 그은 것처럼 끝을 둥글게 */}
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 14 14"
                        className="text-paper pointer-events-none absolute size-3.5 opacity-0 peer-checked:opacity-100"
                    >
                        <path
                            d="M2.6 7.4 L5.5 10.3 L11.3 3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
                <span className="text-ink text-sm font-bold">{label}</span>
            </label>
        );
    },
);

Checkbox.displayName = "Checkbox";
