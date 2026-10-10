"use client";

import Link from "next/link";

import { Badge, EmptyState, FAB, PageHeader, PageShell } from "@/components/common";
import { StoredProductCard } from "@/components/product/StoredProductCard";
import { useProducts } from "@/lib/db/hooks";
import Loading from "./loading";

export default function Product() {
    const products = useProducts();

    // 기기 저장소를 여는 짧은 순간 — 목록과 같은 자리의 스켈레톤을 보여준다
    if (products === undefined) return <Loading />;

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
                        {products.map((product) => (
                            <StoredProductCard
                                key={product.id}
                                product={product}
                                showMemo
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
                    icon={<i className="xi-barcode text-2xl" aria-hidden="true" />}
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
