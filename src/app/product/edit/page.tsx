"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ErrorState, LoadingState, PageShell } from "@/components/common";
import { useProduct, useProductImages } from "@/lib/db/hooks";
import ProductForm from "../components/ProductForm";

/**
 * 제품 수정 — `/product/edit?id=…`.
 * 동적 경로(`/product/edit/[id]`) 대신 쿼리를 쓰는 이유: 정적 화면 하나라서 서비스 워커가 미리 받아 둘 수 있고,
 * 처음 여는 제품도 오프라인에서 열린다.
 */
function EditProduct() {
    const id = useSearchParams().get("id");
    const product = useProduct(id);
    const images = useProductImages(id);

    if (product === undefined || images === undefined) {
        return (
            <PageShell>
                <LoadingState label="제품 정보를 여는 중…" />
            </PageShell>
        );
    }

    if (product === null) {
        return (
            <PageShell>
                <ErrorState
                    title="이 물건을 찾을 수 없어요"
                    description="이미 삭제했거나 다른 기기에서 등록한 물건이에요."
                    action={
                        <Link
                            href="/product"
                            className="sticker sticker-press bg-paper rounded-full px-4 py-2 text-sm font-bold"
                        >
                            목록으로
                        </Link>
                    }
                />
            </PageShell>
        );
    }

    // key — 다른 제품으로 넘어가면 입력 상태를 새로 잡는다
    return <ProductForm key={product.id} mode="edit" product={product} images={images} />;
}

export default function EditProductPage() {
    return (
        <Suspense>
            <EditProduct />
        </Suspense>
    );
}
