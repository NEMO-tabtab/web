import React from "react";

import { cn } from "@/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
    fullWidth?: boolean;
}

/**
 * `Input` 과 동일한 API. 필드 시스템은 두 필드 타입이 같아야 시스템이다.
 * 베이스도 똑같이 `.field` — 먹선·모서리·패딩·포커스가 한 곳에서 나온다.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, hint, fullWidth = true, className, id, rows = 4, ...props }, ref) => {
        const describedBy = id ? (error ? `${id}-error` : hint ? `${id}-hint` : undefined) : undefined;

        return (
            <label htmlFor={id} className={cn("block", fullWidth && "w-full")}>
                {label && (
                    <span className="text-ink mb-1.5 block text-[13px] font-bold">
                        {label}
                        {/* 필수 표시는 먹선 그대로 — danger 는 삭제·오류 전용이다 */}
                        {props.required && <span aria-hidden="true"> *</span>}
                    </span>
                )}
                <textarea
                    ref={ref}
                    id={id}
                    rows={rows}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        "field text-ink placeholder:text-ink-soft block resize-y",
                        "disabled:!bg-cream disabled:text-ink-soft disabled:cursor-not-allowed disabled:resize-none",
                        error && "!border-danger",
                        className,
                    )}
                    {...props}
                />
                {error ? (
                    <span id={id ? `${id}-error` : undefined} className="text-danger mt-1.5 block text-xs">
                        {error}
                    </span>
                ) : hint ? (
                    <span id={id ? `${id}-hint` : undefined} className="text-ink-soft mt-1.5 block text-xs">
                        {hint}
                    </span>
                ) : null}
            </label>
        );
    },
);

Textarea.displayName = "Textarea";
