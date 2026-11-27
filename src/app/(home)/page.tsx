"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge, Chip, EmptyState, PageShell, Price, Section, StatTile } from "@/components/common";
import { Tabs } from "@/components/common/Tabs";
import { NemoFace } from "@/components/NemoFace";
import { NemoLogo } from "@/components/NemoLogo";
import { StoredProductCard } from "@/components/product/StoredProductCard";
import { useProducts } from "@/lib/db/hooks";
import { productValue } from "@/lib/db/products";
import { EMPTY_QUERY, facetOptions, productQueryHref, type FacetField } from "@/lib/productSearch";

/** 분포 칩의 기준 축 — 예전 "카테고리별 / 공간별" 탭을 그대로 이어받는다 */
const TABS = [
    { value: "category", label: "카테고리별" },
    { value: "space", label: "공간별" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

/** 탭마다 묶는 칸 — 제품 화면의 필터와 같은 칸이라 칩을 누르면 그 필터가 걸린 목록으로 간다 */
const TAB_FIELD: Record<TabValue, FacetField> = { category: "category", space: "place" };

/** 홈에 세워둘 최근 카드 수 */
const RECENT_LIMIT = 6;
/** 한 줄에 늘어놓을 분포 칩 수 — 넘치면 "그 외 n" 으로 접는다 */
const CHIP_LIMIT = 6;

export default function Home() {
    const [selectedTab, setSelectedTab] = useState<TabValue>("category");
    // 기기 저장소를 읽는다 — 다른 화면에서 등록·삭제하면 저절로 다시 그려진다
    const stored = useProducts();
    const loading = stored === undefined;
    const products = useMemo(() => stored ?? [], [stored]);
    const totalCount = products.length;
    const totalValue = useMemo(() => products.reduce((sum, item) => sum + productValue(item), 0), [products]);

    /**
     * 선택한 축으로 묶어 개수를 센다. 비어 있는 값은 "미지정" 으로 모은다(맨 뒤).
     * 제품 화면의 필터 칩과 같은 함수라 여기 숫자와 눌러서 열리는 목록의 개수가 늘 같다.
     */
    const distribution = useMemo(
        () => facetOptions(products, EMPTY_QUERY, TAB_FIELD[selectedTab]),
        [products, selectedTab],
    );

    /** 스탯 칸에 쓸 갈래 수 — 실제 데이터에서 센다(추정치를 지어내지 않는다) */
    const groupCounts = useMemo(() => {
        const locations = new Set<string>();
        const categories = new Set<string>();
        for (const item of products) {
            const location = item.place?.trim();
            const category = item.category?.trim();
            if (location) locations.add(location);
            if (category) categories.add(category);
        }
        return { locations: locations.size, categories: categories.size };
    }, [products]);

    const recent = products.slice(0, RECENT_LIMIT);
    const shownChips = distribution.slice(0, CHIP_LIMIT);
    const restCount = distribution.length - shownChips.length;

    return (
        <PageShell width="wide" className="space-y-4">
            {/* 브랜드 머리 — 심볼 + 이름 + 태그라인 */}
            <header className="flex items-center gap-2.5">
                <NemoLogo size={42} />
                <div className="min-w-0">
                    <h1 className="font-display text-2xl leading-none">NEMO</h1>
                    <p className="text-ink-soft mt-1 text-[11px]">가진 물건을 기록하고, 그 가치를 한눈에</p>
                </div>
            </header>

            {loading ? (
                <p className="text-ink-soft py-16 text-center text-sm">여는 중…</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* 인사 카드 — 캐릭터 옆에 자산 요약 한 줄, 그리고 유일한 먹 채움 버튼 */}
                    <section className="sticker rounded-nemo bg-paper flex items-center gap-3 px-4 py-4">
                        <span className="shrink-0 leading-none">
                            <NemoFace size={76} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="font-display text-[17px] leading-snug">
                                {totalCount === 0 ? "아직 기록한 물건이 없어요" : "지금까지 기록한 내 자산"}
                            </p>
                            {/* 금액은 손글씨 대신 sans + 고정폭 숫자 (Price 가 보장한다) */}
                            {totalCount === 0 ? (
                                <p className="text-ink-soft mt-0.5 text-[12px]">
                                    첫 물건을 등록하면 가치를 합산해 보여줘요.
                                </p>
                            ) : (
                                <Price value={totalValue} size="lg" className="mt-0.5" />
                            )}
                            {/* 금액(인라인)과 같은 줄에 붙어 겹치지 않도록 버튼은 다음 줄에 둔다 */}
                            <Link
                                href="/product/quick"
                                className="sticker sticker-press bg-ink text-paper mt-2 block w-fit rounded-full px-4 py-1.5 text-[13px] font-bold"
                            >
                                + 물건 등록
                            </Link>
                        </div>
                    </section>

                    {/* 스탯 3칸 — 색이 아니라 먹선 아웃라인으로 나란히 */}
                    <section className="grid grid-cols-3 gap-2.5">
                        <StatTile label="등록한 물건" value={`${totalCount}개`} />
                        <StatTile label="보관 장소" value={`${groupCounts.locations}곳`} />
                        <StatTile label="카테고리" value={`${groupCounts.categories}종`} />
                    </section>

                    {products.length > 0 ? (
                        <>
                            {/* 분포 — 기준 축을 바꿔가며 어디에 무엇이 모여 있는지 본다 */}
                            <section className="space-y-3">
                                <Tabs
                                    items={TABS}
                                    value={selectedTab}
                                    onChange={setSelectedTab}
                                    aria-label="분포 기준"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {/* 누르면 그 조건이 걸린 제품 목록으로 간다 — "미지정"은 값을 적지 않은 물건만 */}
                                    {shownChips.map((option) => (
                                        <Chip
                                            key={option.value}
                                            href={productQueryHref({ [TAB_FIELD[selectedTab]]: option.value })}
                                            className="tabular-nums"
                                        >
                                            {option.label} {option.count}
                                        </Chip>
                                    ))}
                                    {restCount > 0 && (
                                        <Chip as="span" className="text-ink-soft tabular-nums">
                                            그 외 {restCount}
                                            {selectedTab === "category" ? "종" : "곳"}
                                        </Chip>
                                    )}
                                </div>
                            </section>

                            {/* 최근 등록 — 스크랩북처럼 살짝 기운 카드 그리드 */}
                            <Section
                                title="최근 등록"
                                titleClassName="scribble"
                                action={
                                    <Link href="/product" className="text-ink-soft text-[12px] font-bold">
                                        전체 보기 →
                                    </Link>
                                }
                            >
                                <div className="paste-grid grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
                                    {recent.map((item) => (
                                        <StoredProductCard
                                            key={item.id}
                                            product={item}
                                            meta={
                                                (item.place || item.category) && (
                                                    <Badge size="sm">{item.place || item.category}</Badge>
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </Section>
                        </>
                    ) : (
                        // 등록 버튼은 위 인사 카드와 떠 있는 퀵 메뉴에 있다 — 여기서는 문장으로만 안내한다
                        <EmptyState
                            title="아직 등록한 물건이 없어요"
                            description="위의 '+ 물건 등록' 을 눌러 첫 물건을 기록해 보세요."
                        />
                    )}
                </div>
            )}
        </PageShell>
    );
}
