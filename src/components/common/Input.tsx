import React from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    /** 필드 아래 보조 설명. error 가 있으면 error 가 우선한다. */
    hint?: string;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

/**
 * `useId()` 를 쓰지 않는다 — 훅을 쓰면 이 파일이 "use client" 가 되고
 * 서버 컴포넌트인 문서 페이지가 클라이언트 경계로 넘어간다.
 * 대신 전체를 <label> 로 감싸 암묵적 연결을 만들고, id 가 주어지면 명시적으로 연결한다.
 *
 * 생김새는 globals.css 의 `.field` 가 전부 쥐고 있다 —
 * 2px 먹선, 손그림 비대칭 모서리, 패딩, focus-visible 아웃라인.
 * `.field` 는 레이어 밖 규칙이라 Tailwind utilities 레이어를 무조건 이긴다.
 * 그래서 `.field` 가 이미 정한 속성(padding / border / background)만 `!` 로 덮고,
 * 나머지(글자색·placeholder)는 평범한 유틸리티로 얹는다.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, fullWidth = true, className, icon, id, ...props }, ref) => {
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
                <span className="relative block">
                    {icon && (
                        <span className="text-ink-soft pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            {icon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={id}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={describedBy}
                        className={cn(
                            "field text-ink placeholder:text-ink-soft block",
                            "disabled:!bg-cream disabled:text-ink-soft disabled:cursor-not-allowed",
                            icon && "!pl-10",
                            error && "!border-danger",
                            className,
                        )}
                        {...props}
                    />
                </span>
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

Input.displayName = "Input";
