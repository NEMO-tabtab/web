export const dynamic = "force-dynamic";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";

import { Badge, EmptyState, FAB, PageHeader, PageShell, ProductCard } from "@/components/common";
import type { ProductFormData } from "./components/ProductForm";

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
    const products: Product[] = productList?.content ?? [];

    return (
        <>
            <PageShell width="wide" className="space-y-5">
                {/* 제목은 손글씨 + 낙서 밑줄, 개수는 본문 서체 + 고정폭 숫자 */}
                <PageHeader
                    title="내 제품"
                    action={
                        <span className="text-ink-soft font-sans text-[13px] font-bold tabular-nums">
                            {products.length}개
                        </span>
                    }
                />

                {products.length > 0 ? (
                    /* 스크랩북처럼 카드가 조금씩 다른 각도로 붙는다 — 회전은 .paste-grid 가 맡는다 */
                    <div className="paste-grid grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(9.75rem,1fr))]">
                        {products.map((product, index) => (
                            <ProductCard
                                key={index}
                                // productIdx 가 비어 오는 경우가 있어 기존 임시 fallback 을 그대로 둔다
                                href={`/product/edit/${product.productIdx || 4}`}
                                name={product.productNm}
                                price={product.productValue}
                                description={product.content}
                                imageSrc={
                                    product.files.length > 0
                                        ? `${process.env.NEXT_PUBLIC_API_URL}/${product.files[0].filePath}`
                                        : defaultThumbnail
                                }
                                badge={
                                    <Badge variant="success" size="sm">
                                        보유 중
                                    </Badge>
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="아직 등록한 제품이 없어요"
                        description="첫 물건을 네모에게 보여주세요!"
                        action={
                            <Link
                                href="/product/add"
                                className="sticker sticker-press bg-ink font-display text-paper rounded-full px-5 py-2.5"
                            >
                                + 제품 등록하기
                            </Link>
                        }
                    />
                )}
            </PageShell>

            {/* 떠 있는 버튼 — 좁은 화면에선 하단 탭 바 위로 띄우고,
                넓은 화면에선 내비가 왼쪽 레일로 옮겨 가므로 화면 아래에 바짝 붙인다 */}
            <div className="fixed right-4 bottom-20 z-30 flex flex-col gap-3 sm:bottom-7">
                <FAB
                    href="/barcode"
                    variant="solid"
                    aria-label="바코드 스캔"
                    icon={<Image className="h-6 w-6" src={barcodeIcon} alt="" />}
                />
                <FAB
                    href="/product/add"
                    variant="ink"
                    aria-label="제품 등록"
                    icon={<i className="xi-plus text-2xl font-bold" aria-hidden="true" />}
                />
            </div>
        </>
    );
}
