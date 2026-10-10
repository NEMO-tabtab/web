"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DonutChart, LineChart, donutRamp } from "@/components/analysis/Charts";
import {
    Card,
    EmptyState,
    IconTile,
    InfoRow,
    LoadingState,
    PageHeader,
    PageShell,
    Price,
    Section,
    Text,
} from "@/components/common";
import type { Product } from "@/lib/db";
import { useProducts } from "@/lib/db/hooks";
import { productValue } from "@/lib/db/products";
import { formatWon, toPercent } from "@/lib/format";

/** 추이 차트에 보여줄 개월 수 */
const HISTORY_MONTHS = 6;
/** 도넛 조각 수 — 명도 단계(donutRamp)만큼만 나누고 나머지는 "그 외" 로 묶는다 */
const SLICE_LIMIT = donutRamp.length;

/** 해당 시각까지 등록한 물건 가치의 합 */
function cumulativeUntil(products: Product[], until: number): number {
    return products.reduce((sum, item) => (item.createdAt <= until ? sum + productValue(item) : sum), 0);
}

/**
 * 자산 분석 — 기기에 저장된 물건으로만 계산한다.
 * 물건별 가치 변동 기록은 아직 없어서, 추이는 "달마다 그때까지 등록한 물건 가치의 누적" 이다.
 */
function useAnalysis(products: Product[]) {
    return useMemo(() => {
        const now = new Date();
        /** n개월 전 달의 마지막 순간 */
        const endOf = (monthsAgo: number) =>
            new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1).getTime() - 1;

        const totalAsset = products.reduce((sum, item) => sum + productValue(item), 0);
        const lastMonthAsset = cumulativeUntil(products, endOf(1));

        const history = Array.from({ length: HISTORY_MONTHS }, (_, index) => {
            const monthsAgo = HISTORY_MONTHS - 1 - index;
            const month = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1).getMonth() + 1;
            return { label: `${month}월`, value: cumulativeUntil(products, endOf(monthsAgo)) };
        });

        // 가치가 모두 0(선물만 있음 등)이면 금액 대신 개수로 비중을 잰다
        const byValue = totalAsset > 0;
        const weights = new Map<string, number>();
        for (const item of products) {
            const key = item.category.trim() || "미지정";
            weights.set(key, (weights.get(key) ?? 0) + (byValue ? productValue(item) : 1));
        }
        const sorted = [...weights.entries()].sort((a, b) => b[1] - a[1]);
        const head = sorted.length > SLICE_LIMIT ? sorted.slice(0, SLICE_LIMIT - 1) : sorted;
        const rest = sorted.slice(head.length).reduce((sum, [, value]) => sum + value, 0);
        // 큰 항목부터 내림차순으로 두어야 진한 단계가 큰 조각에 붙는다
        const categoryDistribution = [...head, ...(rest > 0 ? [["그 외", rest] as const] : [])].map(
            ([label, value], index) => ({ label, value, color: donutRamp[index] }),
        );
        const distributionTotal = byValue ? totalAsset : products.length;

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const addedThisMonth = products.filter((item) => item.createdAt >= startOfMonth).length;

        return {
            totalAsset,
            lastMonthAsset,
            history,
            byValue,
            categoryDistribution,
            distributionTotal,
            addedThisMonth,
        };
    }, [products]);
}

function Analysis({ products }: { products: Product[] }) {
    const { totalAsset, lastMonthAsset, history, byValue, categoryDistribution, distributionTotal, addedThisMonth } =
        useAnalysis(products);

    const growth = totalAsset - lastMonthAsset;
    const top = categoryDistribution[0];
    const formatShare = (value: number) =>
        `${byValue ? `${formatWon(value)}원` : `${value}개`} · ${toPercent(value, distributionTotal)}%`;

    return (
        <>
            {/* 총 자산 요약 — 강조 위계 1단계(먹 채움). 페이지에서 가장 센 면은 여기 하나뿐이다. */}
            <Card padding="lg" className="bg-ink space-y-4">
                <div className="space-y-1">
                    <p className="text-paper/70 text-sm">총 자산 가치</p>
                    <Price value={totalAsset} size="xl" inverse />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* 먹 채움 위에서는 먹선을 쓸 수 없어 바탕색 헤어라인으로 알약을 그린다 */}
                    <span className="border-paper/40 text-paper inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-[13px] font-bold">
                        {growth > 0 && <i className="xi-arrow-up" aria-hidden="true" />}
                        <span className="font-sans tabular-nums">
                            {growth > 0 && "+"}
                            {formatWon(growth)}원
                            {lastMonthAsset > 0 && ` (${toPercent(growth, lastMonthAsset)}%)`}
                        </span>
                    </span>
                    <p className="text-paper/70 text-sm">지난달 대비</p>
                </div>
            </Card>

            <Section title="자산 변동 추이" description="달마다 그때까지 기록한 물건의 가치를 더했어요.">
                <Card>
                    <LineChart
                        data={history}
                        height={200}
                        ariaLabel={`최근 ${history.length}개월 누적 자산 가치. ${history[0].label} ${formatWon(history[0].value)}원에서 ${history[history.length - 1].label} ${formatWon(totalAsset)}원.`}
                    />
                </Card>
            </Section>

            <Section
                title="카테고리별 비중"
                description={byValue ? undefined : "가격이 모두 0원이라 개수로 나눴어요."}
            >
                <Card>
                    <div className="flex flex-col items-center gap-8 md:flex-row">
                        <DonutChart data={categoryDistribution} size={200} />
                        {/* 옅은 조각은 채움만으로 읽히지 않는다 — 이 목록이 값을 책임지는 표 역할이다 */}
                        <div className="w-full space-y-3">
                            {categoryDistribution.map((item) => (
                                <InfoRow
                                    key={item.label}
                                    label={
                                        <span className="inline-flex items-center gap-2">
                                            <span
                                                aria-hidden="true"
                                                className="border-ink h-3 w-3 rounded-full border"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            {item.label}
                                        </span>
                                    }
                                    value={formatShare(item.value)}
                                />
                            ))}
                        </div>
                    </div>
                </Card>
            </Section>

            <Section title="인사이트">
                {/* paste-grid — 손으로 붙인 듯 카드가 서로 반대로 미세하게 기운다 */}
                <div className="paste-grid grid gap-4">
                    <Card padding="md" className="flex items-start gap-4">
                        <IconTile>
                            <i className="xi-chart-pie" aria-hidden="true" />
                        </IconTile>
                        <div className="space-y-1">
                            <Text weight="bold">가장 큰 비중</Text>
                            <Text size="sm" tone="muted">
                                {top.label} 카테고리가 전체 {byValue ? "가치" : "물건"}의{" "}
                                {toPercent(top.value, distributionTotal)}%를 차지해요.
                            </Text>
                        </div>
                    </Card>
                    <Card variant="sunken" padding="md" className="flex items-start gap-4">
                        <IconTile tone="muted">
                            <i className="xi-calendar-check" aria-hidden="true" />
                        </IconTile>
                        <div className="space-y-1">
                            <Text weight="bold">이번 달 기록</Text>
                            <Text size="sm" tone="muted">
                                {addedThisMonth > 0
                                    ? `이번 달에 물건 ${addedThisMonth}개를 새로 기록했어요.`
                                    : "이번 달엔 아직 새로 기록한 물건이 없어요."}
                            </Text>
                        </div>
                    </Card>
                </div>
            </Section>
        </>
    );
}

export default function AnalysisPage() {
    const router = useRouter();
    const products = useProducts();

    return (
        <PageShell className="space-y-8">
            <PageHeader
                title="자산 분석"
                description="나의 자산 가치 변동을 확인하세요."
                onBack={() => router.back()}
            />

            {products === undefined ? (
                <LoadingState />
            ) : products.length === 0 ? (
                <EmptyState
                    title="분석할 물건이 아직 없어요"
                    description="물건을 등록하면 가치와 카테고리 비중을 여기서 보여줘요."
                    action={
                        <Link
                            href="/product/add"
                            className="sticker sticker-press bg-ink font-display text-paper rounded-full px-5 py-2.5"
                        >
                            + 물건 등록
                        </Link>
                    }
                />
            ) : (
                <Analysis products={products} />
            )}
        </PageShell>
    );
}
