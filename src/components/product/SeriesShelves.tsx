"use client";

import Image from "next/image";

import { Icon } from "@/components/common";
import { cn } from "@/lib/cn";
import { useCoverUrl } from "@/lib/db/hooks";
import type { SeriesShelf } from "@/lib/series";

/** 한 시리즈에서 보여 줄 종류 수 — 넘치면 "외 n종" */
const SHOWN_VARIANTS = 8;

function Cover({ productId }: { productId: string }) {
    const url = useCoverUrl(productId);
    return (
        <div className="sticker checker rounded-nemo bg-cream text-ink-soft relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden">
            {url ? (
                <Image src={url} alt="" fill sizes="64px" className="object-cover" />
            ) : (
                <Icon name="box" className="text-2xl" />
            )}
        </div>
    );
}

export interface SeriesShelvesProps {
    shelves: SeriesShelf[];
    /** 시리즈를 누르면 그 시리즈의 물건 목록으로 */
    onOpen: (key: string) => void;
}

/**
 * 시리즈별 모아 보기(#201, 도감의 첫 단계) — 시리즈마다 모은 종류와 개수를 한 장에 보여 준다.
 * 색은 쓰지 않는다. 여러 개 가진 종류는 "×2" 로만 적는다.
 */
export function SeriesShelves({ shelves, onOpen }: SeriesShelvesProps) {
    return (
        <ul className="space-y-3">
            {shelves.map((shelf) => {
                const kinds = shelf.variants.length;
                const more = kinds - SHOWN_VARIANTS;
                return (
                    <li key={shelf.key}>
                        <button
                            type="button"
                            onClick={() => onOpen(shelf.key)}
                            className={cn(
                                "sticker sticker-press rounded-nemo bg-paper text-ink w-full p-4 text-left",
                                "focus-visible:outline-ink focus-visible:outline-3 focus-visible:outline-offset-2",
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Cover productId={shelf.coverProductId} />
                                <div className="min-w-0 flex-1">
                                    <p className="font-display line-clamp-2 text-lg leading-snug break-keep">
                                        {shelf.name}
                                    </p>
                                    <p className="text-ink-soft mt-1 font-sans text-[13px] font-bold tabular-nums">
                                        {kinds > 0 ? `모은 종류 ${kinds} · ` : ""}모두 {shelf.total}개
                                    </p>
                                </div>
                                <Icon name="chevron-right" className="text-ink-soft shrink-0 text-xl" />
                            </div>

                            {(kinds > 0 || shelf.unknown > 0) && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {shelf.variants.slice(0, SHOWN_VARIANTS).map((variant) => (
                                        <span
                                            key={variant.name}
                                            className="border-line bg-cream rounded-full border px-2.5 py-0.5 text-[12px] font-bold"
                                        >
                                            {variant.name}
                                            {variant.count > 1 && (
                                                <span className="font-sans tabular-nums"> ×{variant.count}</span>
                                            )}
                                        </span>
                                    ))}
                                    {more > 0 && (
                                        <span className="text-ink-soft px-1 py-0.5 text-[12px] font-bold">
                                            외 {more}종
                                        </span>
                                    )}
                                    {shelf.unknown > 0 && (
                                        <span className="border-line text-ink-soft rounded-full border border-dashed px-2.5 py-0.5 text-[12px] font-bold">
                                            종류 안 적음
                                            <span className="font-sans tabular-nums"> {shelf.unknown}</span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
