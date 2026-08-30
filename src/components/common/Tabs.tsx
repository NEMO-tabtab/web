"use client";

import React, { useRef } from "react";

import { cn } from "@/lib/cn";

export interface TabItem<T extends string = string> {
    value: T;
    label: React.ReactNode;
}

export interface TabsProps<T extends string = string> {
    items: readonly TabItem<T>[];
    value: T;
    onChange: (value: T) => void;
    /** pill = 손그림 알약 칩, underline = 먹선 밑줄 */
    variant?: "pill" | "underline";
    className?: string;
    "aria-label"?: string;
}

/**
 * 선택 상태를 먹 채움(pill) 또는 먹선 밑줄(underline)로 표현한다.
 * 색이 아니라 채움과 선으로만 구분한다 — 볼터치는 여기에 쓰지 않는다.
 * 좌우 방향키로 탭 사이를 옮겨 다닐 수 있다(roving tabindex).
 */
export function Tabs<T extends string = string>({
    items,
    value,
    onChange,
    variant = "pill",
    className,
    ...props
}: TabsProps<T>) {
    // roving tabindex — 방향키로 옮긴 탭에 포커스까지 따라가야 한다
    const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const delta = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (index + delta + items.length) % items.length;
        onChange(items[nextIndex].value);
        buttonsRef.current[nextIndex]?.focus();
    };

    const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

    if (variant === "underline") {
        return (
            <div role="tablist" className={cn("border-line flex gap-6 border-b-2", className)} {...props}>
                {items.map((item, index) => {
                    const active = item.value === value;
                    return (
                        <button
                            key={item.value}
                            ref={(node) => {
                                buttonsRef.current[index] = node;
                            }}
                            role="tab"
                            type="button"
                            aria-selected={active}
                            tabIndex={active ? 0 : -1}
                            onClick={() => onChange(item.value)}
                            onKeyDown={(event) => handleKeyDown(event, index)}
                            className={cn(
                                "-mb-0.5 border-b-2 px-1 py-2.5 text-sm",
                                focusRing,
                                active ? "border-ink text-ink font-bold" : "text-ink-soft border-transparent",
                            )}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
        );
    }

    // 알약 칩 — 낱개 스티커를 나란히 붙인 결. 감싸는 테두리를 두지 않는다.
    return (
        <div role="tablist" className={cn("flex flex-wrap gap-2", className)} {...props}>
            {items.map((item, index) => {
                const active = item.value === value;
                return (
                    <button
                        key={item.value}
                        ref={(node) => {
                            buttonsRef.current[index] = node;
                        }}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(item.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        className={cn(
                            "sticker sticker-press rounded-full px-3.5 py-1.5 text-[13px] font-bold",
                            focusRing,
                            active ? "bg-ink text-paper" : "bg-paper",
                        )}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
