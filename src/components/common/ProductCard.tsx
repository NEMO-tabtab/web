import React from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

import { Price } from "./Price";
import { cn } from "@/lib/cn";

export interface ProductCardProps {
    href: string;
    name: string;
    price: number | string | null | undefined;
    imageSrc?: string | StaticImageData;
    /** 이미지가 없을 때 보여줄 이모지 (기본값 📦) */
    fallbackIcon?: React.ReactNode;
    description?: string;
    /** 이름 아래 메타 정보 (위치·카테고리 등) */
    meta?: React.ReactNode;
    /** 오른쪽 상태 슬롯 (Badge 등) */
    badge?: React.ReactNode;
    layout?: "grid" | "row";
    className?: string;
}

/**
 * 제품 한 건의 단일 표현. 이전에는 홈 그리드·홈 리스트·제품 목록이
 * 각자 다른 마크업으로 같은 엔티티를 그리고 있었다.
 *
 * 손그림 카드 = 평면 먹선 스티커. 그림자 없이 테두리와 구분선만으로 층을 만든다.
 * 여러 장을 늘어놓을 때는 부모 그리드에 `.paste-grid` 를 붙이면 스크랩북처럼 살짝 기울어진다.
 */
export function ProductCard({
    href,
    name,
    price,
    imageSrc,
    fallbackIcon = "📦",
    description,
    meta,
    badge,
    layout = "grid",
    className,
}: ProductCardProps) {
    if (layout === "row") {
        return (
            <Link
                href={href}
                className={cn(
                    "sticker sticker-press rounded-nemo bg-paper flex items-center gap-3 overflow-hidden p-2.5",
                    className,
                )}
            >
                {/* 목록용 썸네일 — 사진 위에는 인쇄 질감을 한 겹 덮는다 */}
                <span className="sticker rounded-nemo bg-cream relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden">
                    {imageSrc ? (
                        <>
                            <Image src={imageSrc} alt="" fill sizes="64px" className="object-cover" />
                            <span aria-hidden="true" className="print-grain" />
                        </>
                    ) : (
                        <span aria-hidden="true" className="text-2xl">
                            {fallbackIcon}
                        </span>
                    )}
                </span>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold">{name}</p>
                    {description && <p className="text-ink-soft mt-0.5 truncate text-[11.5px]">{description}</p>}
                    {meta && <div className="mt-1 flex flex-wrap items-center gap-1.5">{meta}</div>}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                    <Price value={price} size="sm" />
                    {badge}
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className={cn("sticker sticker-press rounded-nemo bg-paper block overflow-hidden", className)}
        >
            {/* 오브제 무대 — 옅은 면 위에 물건이 놓인 듯한 콘택트 섀도가 깔린다 */}
            <div className="obj-stage bg-cream relative flex aspect-square items-center justify-center overflow-hidden">
                {imageSrc ? (
                    <>
                        <Image
                            src={imageSrc}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover"
                        />
                        <span aria-hidden="true" className="print-grain" />
                    </>
                ) : (
                    <span aria-hidden="true" className="text-4xl">
                        {fallbackIcon}
                    </span>
                )}
                {badge && <div className="absolute top-2 left-2">{badge}</div>}
            </div>

            {/* 정보 영역 — 이미지와는 2px 먹선으로 끊는다 */}
            <div className="border-ink border-t-2 px-2.5 py-1.5">
                <p className="truncate text-[13px] font-bold">{name}</p>
                {description && <p className="text-ink-soft mt-0.5 line-clamp-2 text-[11.5px]">{description}</p>}
                {meta && <div className="mt-1 flex flex-wrap items-center gap-1.5">{meta}</div>}
                <div className="mt-1">
                    <Price value={price} size="sm" />
                </div>
            </div>
        </Link>
    );
}
