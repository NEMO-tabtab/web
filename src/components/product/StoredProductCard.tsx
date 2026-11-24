"use client";

import { Icon, ProductCard, type ProductCardProps } from "@/components/common";
import type { Product } from "@/lib/db";
import { useCoverUrl } from "@/lib/db/hooks";
import { productValue } from "@/lib/db/products";
import { UNNAMED } from "@/lib/quickAdd";
import { originShort } from "@/lib/shops/origin";

export interface StoredProductCardProps extends Pick<ProductCardProps, "badge" | "meta" | "layout" | "className"> {
    product: Product;
    /** 메모를 설명 줄로 보여줄지 */
    showMemo?: boolean;
}

/** 수정 화면 주소 — 동적 경로 대신 쿼리를 써서 오프라인에서도 하나의 미리 받아 둔 화면으로 열린다 */
export const productEditHref = (id: string) => `/product/edit?id=${encodeURIComponent(id)}`;

/**
 * 기기에 저장된 제품 한 건을 ProductCard 로 그린다.
 * 대표 사진은 IndexedDB 의 Blob 이라 카드마다 직접 읽어 URL 로 바꾼다.
 */
export function StoredProductCard({ product, showMemo = false, meta, ...props }: StoredProductCardProps) {
    const coverUrl = useCoverUrl(product.id);
    // 뽑은 곳은 카드 안의 글로만 보여 준다. 카드 전체가 링크라 지도로 가는 링크를 겹쳐 넣지 않는다
    const origin = product.origin ? (
        // 두 칸 그리드에서는 한 줄이면 기기 번호가 잘린다 — 두 줄까지 보여 준다
        <span className="flex min-w-0 items-start gap-1 text-[11px] text-ink-soft">
            <Icon name="map-pin" className="mt-0.5 shrink-0" />
            <span className="line-clamp-2 break-keep">{originShort(product.origin)}</span>
        </span>
    ) : null;

    return (
        <ProductCard
            href={productEditHref(product.id)}
            name={product.name || UNNAMED}
            price={productValue(product)}
            description={showMemo ? product.memo || undefined : undefined}
            // 사진이 없으면 넘기지 않는다 — ProductCard 가 손그림 상자 아이콘(fallbackIcon)을 세운다.
            // 여러 장이 한꺼번에 나오는 자리라 캐릭터를 세우지 않는다(docs/design-system.md U8)
            imageSrc={coverUrl}
            meta={
                meta || origin ? (
                    <>
                        {meta}
                        {origin}
                    </>
                ) : undefined
            }
            {...props}
        />
    );
}
