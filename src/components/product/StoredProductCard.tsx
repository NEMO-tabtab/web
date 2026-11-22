"use client";

import { Icon, ProductCard, type ProductCardProps } from "@/components/common";
import defaultThumbnail from "@/app/assets/images/product_default_thumbnail.jpg";
import type { Product } from "@/lib/db";
import { useCoverUrl } from "@/lib/db/hooks";
import { productValue } from "@/lib/db/products";
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
            name={product.name || "이름 없는 물건"}
            price={productValue(product)}
            description={showMemo ? product.memo || undefined : undefined}
            imageSrc={coverUrl ?? defaultThumbnail}
            // 기본 썸네일은 원본(10KB)이 미리 받아 둔 목록에 있다 — 최적화 경로를 타면 오프라인에서 깨진다
            imageUnoptimized={!coverUrl}
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
