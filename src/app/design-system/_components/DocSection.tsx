import React from "react";

import { Heading, Text } from "@/components/common";
import { cn } from "@/lib/cn";

/**
 * 문서 페이지 머리말.
 *
 * `.scribble` 은 inline-block 이라 제목 요소 자체에 붙어야 밑줄이 글자 폭을 따라간다.
 * 밑줄이 baseline 아래 5px 에 깔리므로 설명 문단은 mt-4 부터 띄운다.
 */
export function PageHeader({ title, description }: { title: string; description?: string }) {
    return (
        <header className="border-line mb-12 border-b pb-8">
            <Heading level={1} className="scribble">
                {title}
            </Heading>
            {description && (
                <Text size="lg" tone="muted" className="mt-4">
                    {description}
                </Text>
            )}
        </header>
    );
}

export function DocSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div>
                {/* 시각 레벨 3(손글씨) + 의미 태그 h2 — 페이지 제목(h1) 다음 단계 */}
                <Heading level={3} as="h2">
                    {title}
                </Heading>
                {description && (
                    <Text size="sm" tone="muted" className="mt-1">
                        {description}
                    </Text>
                )}
            </div>
            {children}
        </section>
    );
}

/**
 * 예시 무대 — 먹선 스티커 안에 cream 면을 깔아 예시의 경계를 분명히 한다.
 * 캡션은 카드 내부 구분과 같은 방식(border-t-2 border-ink)으로 끊는다.
 */
export function ExamplePreview({
    children,
    caption,
    className,
}: {
    children: React.ReactNode;
    caption?: string;
    className?: string;
}) {
    return (
        <div className="sticker rounded-nemo bg-paper overflow-hidden">
            <div className={cn("bg-cream flex flex-wrap items-center gap-4 p-8", className)}>{children}</div>
            {caption && <p className="border-ink text-ink-soft border-t-2 px-4 py-2 text-xs">{caption}</p>}
        </div>
    );
}

/** 클래스 이름을 그대로 보여주는 인라인 코드 — 문서 전반에서 톤을 통일한다 */
export function ClassName({ children }: { children: React.ReactNode }) {
    return <code className="text-ink font-sans text-[12px] font-bold">{children}</code>;
}
