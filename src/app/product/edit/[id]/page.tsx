"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductForm, { ProductFormData } from "@/app/product/components/ProductForm";

const fetchProductData = async (productId: string): Promise<ProductFormData | null> => {
    try {
        const response = await axios.get<ProductFormData>(`http://localhost:8080/api/product/${productId}`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error("제품 데이터 불러오기 실패:", error);
        return null;
    }
};

export default function EditProduct() {
    const params = useParams();
    const productId = params.id as string;
    const [productData, setProductData] = useState<ProductFormData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProduct = async () => {
            setIsLoading(true);
            const data = await fetchProductData(productId);
            setProductData(data);
            setIsLoading(false);
        };

        loadProduct();
    }, [productId]);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-8 text-center">
                <p>로딩 중...</p>
            </div>
        );
    }

    if (!productData) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-8 text-center">
                <p>제품을 찾을 수 없습니다.</p>
            </div>
        );
    }

    return <ProductForm mode="edit" productId={productId} initialData={productData} />;
}
