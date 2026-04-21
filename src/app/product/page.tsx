export const dynamic = "force-dynamic";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Text } from "@/components/common/Typography";
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
            `http://3.38.247.4:8080/api/product/list`,
            {
                page: 1,
                size: 10,
            },
            { timeout: 3000 },
        );
        return response?.data;
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
                        총 {productList.content.length}개의 제품
                    </Text>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
                    {productList.content.map((product: Product, index: number) => (
                        <Link
                            key={index}
                            href={`/product/edit/${product.productIdx || 4}`}
                            className="group block overflow-hidden rounded-[1.5rem] border border-neutral-100/50 bg-white/70 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.1)] hover:border-brand-200"
                        >
                            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-4 md:gap-5 md:p-5">
                                {/* 이미지 영역 */}
                                <div className="relative aspect-[16/9] w-full flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 sm:aspect-square sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-40 lg:w-40 p-2">
                                    <Image
                                        src={
                                            product.files.length > 0
                                                ? `http://3.38.247.4:8080/${product.files[0].filePath}`
                                                : defaultThumbnail
                                        }
                                        fill
                                        className="object-cover rounded-xl transition-transform duration-700 ease-out group-hover:scale-105"
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
                                            <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 sm:px-3 sm:py-1">
                                                보유 중
                                            </span>
                                        </div>

                                        {/* 가격 정보 */}
                                        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                                            <div className="text-2xl font-black text-brand-600 sm:text-3xl tracking-tight">
                                                {product.productValue.toLocaleString()}
                                                <span className="ml-1 text-sm font-bold text-neutral-400 sm:text-base tracking-normal">
                                                    원
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* 빈 상태 메시지 (제품이 없을 때) */}
                {productList.content.length === 0 && (
                    <div className="flex h-96 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 text-3xl">
                            📦
                        </div>
                        <Text size="lg" weight="medium" color="text-neutral-500">
                            등록된 제품이 없습니다
                        </Text>
                        <Text size="sm" color="text-neutral-400" className="mt-2">
                            오른쪽 아래 버튼을 눌러 제품을 추가해보세요!
                        </Text>
                    </div>
                )}
            </main>

            {/* 플로팅 액션 버튼 (FAB) */}
            <div className="fixed bottom-24 right-4 z-20 flex flex-col gap-3 sm:right-6 md:right-8 lg:right-10">
                <Link
                    href="/product/add"
                    className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-brand-100 transition-all duration-300 hover:scale-110 hover:shadow-[0_8px_30px_rgb(0,118,255,0.2)]"
                >
                    <i className="xi-plus text-2xl font-bold"></i>
                </Link>
                <Link
                    href="/barcode"
                    className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_8px_30px_rgb(0,118,255,0.24)] transition-all duration-300 hover:scale-110 hover:shadow-[0_12px_40px_rgb(0,118,255,0.36)] hover:from-brand-400 hover:to-brand-500"
                >
                    <Image className="h-6 w-6 brightness-0 invert" src={barcodeIcon} alt="바코드 스캔" />
                </Link>
            </div>
        </div>
    );
}
