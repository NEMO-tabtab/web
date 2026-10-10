"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import type { Product, ProductImage } from "./index";
import { getCoverImage, getProduct, listImages, listProducts } from "./products";

/*
 * 화면은 이 훅들로만 데이터를 읽는다. useLiveQuery 라서 어느 화면에서 등록·수정·삭제하든
 * 열려 있는 다른 화면(홈 합계, 목록, 분석)이 저절로 다시 그려진다.
 * 반환값 undefined 는 "아직 읽는 중" 이다.
 */

export function useProducts(): Product[] | undefined {
    return useLiveQuery(listProducts, []);
}

/** undefined = 읽는 중, null = 없음(삭제됐거나 잘못된 id) */
export function useProduct(id: string | null | undefined): Product | null | undefined {
    return useLiveQuery(async () => (id ? ((await getProduct(id)) ?? null) : null), [id]);
}

export function useProductImages(productId: string | null | undefined): ProductImage[] | undefined {
    return useLiveQuery(async () => (productId ? listImages(productId) : []), [productId]);
}

/** Blob 을 화면에 붙일 URL 로 바꾸고, 쓰임이 끝나면 해제한다 */
export function useObjectUrl(blob: Blob | null | undefined): string | undefined {
    const [url, setUrl] = useState<string>();

    useEffect(() => {
        if (!blob) {
            setUrl(undefined);
            return;
        }
        const next = URL.createObjectURL(blob);
        setUrl(next);
        return () => URL.revokeObjectURL(next);
    }, [blob]);

    return url;
}

/** 대표 사진 URL. 사진이 없으면 undefined */
export function useCoverUrl(productId: string): string | undefined {
    const cover = useLiveQuery(() => getCoverImage(productId), [productId]);
    return useObjectUrl(cover?.blob);
}
