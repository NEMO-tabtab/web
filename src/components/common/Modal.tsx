"use client";

import React, { useEffect, useId, useRef } from "react";

import { cn } from "@/lib/cn";

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

/**
 * 종이 한 장을 화면 위에 얹은 모양. 백드롭은 먹 반투명이고 블러를 쓰지 않는다.
 * 패널은 평면 먹선 스티커 — 그림자 대신 2px 테두리와 구분선으로 층을 만든다.
 */
export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const titleId = useId();

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        panelRef.current?.focus();

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="presentation"
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
                className={cn(
                    "sticker rounded-nemo bg-paper relative w-full max-w-md overflow-hidden focus:outline-none",
                    className,
                )}
            >
                <div className="border-ink flex items-start justify-between gap-3 border-b-2 px-4 py-3">
                    <h2 id={titleId} className="font-display text-lg leading-tight">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="닫기"
                        className="sticker sticker-press bg-paper focus-visible:outline-ink flex h-8 w-8 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <i className="xi-close text-base" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto px-4 py-4">{children}</div>
                {footer && <div className="border-ink flex justify-end gap-2 border-t-2 px-4 py-3">{footer}</div>}
            </div>
        </div>
    );
}
