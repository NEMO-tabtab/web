export const dynamic = "force-dynamic";

import axios from "axios";
import ProductForm, { ProductFormData } from "@/app/product/components/ProductForm";

const fetchProductData = async (productId: string): Promise<ProductFormData | null> => {
    try {
        const response = await axios.get<{ data: ProductFormData }>(
            `${process.env.NEXT_PUBLIC_API_URL}/api/product/${productId}`,
            {
                timeout: 3000,
            },
        );
        return response?.data?.data;
    } catch (error) {
        console.error("제품 데이터 불러오기 실패:", error);
        throw new Error("제품 데이터 불러오기 실패");
    }
};

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
    const { id: productId } = await params;
    const productData = await fetchProductData(productId);

    return <ProductForm mode="edit" productId={productId} initialData={productData} />;
}
