export const dynamic = "force-dynamic";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Text } from "@/components/common/Typography";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { FAB } from "@/components/common/FAB";
import { ProductFormData } from "./components/ProductForm";

// 이미지
import barcodeIcon from "@/app/assets/images/icon_barcode.png";
import defaultThumbnail from "@/app/assets/images/product_default_thumbnail.jpg";

interface ProductFile {
    filePath: string;
}

type Product = ProductFormData & {
    files: ProductFile[];
};

const getProductList = async () => {
    try {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/product/list`,
            {
                page: 1,
                size: 10,
            },
            { timeout: 3000 },
        );
        return response?.data?.data;
    } catch (error) {
        console.error("Error:", error);
        throw new Error("제품 목록을 불러오는데 실패했습니다");
    }
};

export default async function Product() {
    const productList = await getProductList();
    //const hoverEffectClass = "transition-all duration-300 hover:scale-110";

    return (
        <div className="pb-20 sm:pb-24 lg:pb-28">
            {/* 2차 개발 */}
            {/* <Filter locationList={locationList} gnbCategory={gnbCategory} /> */}

            {/* 메인 컨텐츠 */}
            <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
                {/* 헤더 */}
                <div className="mb-4 sm:mb-6">
                    <Text size="sm" className="mt-2 text-neutral-500">
                        총 {productList?.content?.length}개의 제품
                    </Text>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
                    {productList?.content?.map((product: Product, index: number) => (
                        <Link
                            key={index}
                            href={`/product/edit/${product.productIdx || 4}`}
                            className="block"
                        >
                            <Card variant="glass" interactive padding="none" className="h-full flex flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-4 md:gap-5 md:p-5 group">
                                {/* 이미지 영역 */}
                                <div className="relative aspect-[16/9] w-full flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 p-2 sm:aspect-square sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-40 lg:w-40">
                                    <Image
                                        src={
                                            product.files.length > 0
                                                ? `${process.env.NEXT_PUBLIC_API_URL}/${product.files[0].filePath}`
                                                : defaultThumbnail
                                        }
                                        fill
                                        className="rounded-xl object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        alt={product.productNm}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                </div>

                                {/* 정보 영역 */}
                                <div className="flex flex-1 flex-col justify-between space-y-2 sm:space-y-0">
                                    <div className="space-y-1 sm:space-y-2">
                                        <h3 className="text-lg font-bold text-neutral-800 transition-colors group-hover:text-brand-600 sm:text-xl md:text-xl lg:text-2xl">
                                            {product.productNm}
                                        </h3>

                                        {product.content && (
                                            <Text
                                                size="sm"
                                                className="line-clamp-2 text-xs font-medium text-neutral-500 sm:text-sm"
                                            >
                                                {product.content}
                                            </Text>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 sm:mt-3 sm:space-y-2">
                                        {/* 카테고리 태그 */}
                                        <div className="flex items-center gap-2">
                                            <Badge variant="success">보유 중</Badge>
                                        </div>

                                        {/* 가격 정보 */}
                                        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                                            <div className="text-2xl font-black tracking-tight text-brand-600 sm:text-3xl">
                                                {product.productValue.toLocaleString()}
                                                <span className="ml-1 text-sm font-bold tracking-normal text-neutral-400 sm:text-base">
                                                    원
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* 빈 상태 메시지 (제품이 없을 때) */}
                {productList?.content?.length === 0 && (
                    <EmptyState 
                        title="등록된 제품이 없습니다"
                        description="오른쪽 아래 버튼을 눌러 제품을 추가해보세요!"
                    />
                )}
            </main>

            {/* 플로팅 액션 버튼 (FAB) */}
            <div className="fixed bottom-24 right-4 z-20 flex flex-col gap-3 sm:right-6 md:right-8 lg:right-10">
                <FAB 
                    href="/product/add" 
                    variant="solid" 
                    icon={<i className="xi-plus text-2xl font-bold"></i>} 
                />
                <FAB 
                    href="/barcode" 
                    variant="gradient" 
                    icon={<Image className="h-6 w-6 brightness-0 invert" src={barcodeIcon} alt="바코드 스캔" />} 
                />
            </div>
        </div>
    );
}
