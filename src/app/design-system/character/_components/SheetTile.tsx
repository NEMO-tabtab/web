import React from "react";

import { ClassName } from "../../_components/DocSection";

/**
 * 캐릭터 시트의 한 칸 — 그림, 이름, 코드에서 부르는 id, 쓰는 순간.
 * 그림은 cream 면 위에 놓아 종이색 몸의 테두리가 보이게 한다(ExamplePreview 와 같은 방식).
 */
export function SheetTile({
    id,
    label,
    when,
    children,
}: {
    id: string;
    label: string;
    when?: string;
    children: React.ReactNode;
}) {
    return (
        <figure className="sticker rounded-nemo bg-paper flex flex-col overflow-hidden">
            <div className="bg-cream flex items-center justify-center px-3 py-6">{children}</div>
            <figcaption className="border-ink flex-1 space-y-0.5 border-t-2 px-3 py-2">
                <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-lg leading-tight">{label}</span>
                    <ClassName>{id}</ClassName>
                </p>
                {when && <p className="text-ink-soft text-[11px] leading-snug break-keep">{when}</p>}
            </figcaption>
        </figure>
    );
}
