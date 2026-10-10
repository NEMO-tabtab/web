"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import ProductForm from "../components/ProductForm";

/** 바코드 스캔에서 넘어오면 `?barcode=…` 로 바코드 칸을 채워 연다 */
function AddProductForm() {
    const searchParams = useSearchParams();
    return <ProductForm mode="add" initialBarcode={searchParams.get("barcode") ?? undefined} />;
}

export default function AddProduct() {
    // useSearchParams 는 정적 생성 화면에서 Suspense 경계가 있어야 한다
    return (
        <Suspense>
            <AddProductForm />
        </Suspense>
    );
}
