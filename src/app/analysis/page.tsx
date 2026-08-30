"use client";

import { useRouter } from "next/navigation";

import { DonutChart, LineChart, donutRamp } from "@/components/analysis/Charts";
import { Card, IconTile, InfoRow, PageHeader, PageShell, Price, Section, Text } from "@/components/common";
import { formatWon, toPercent } from "@/lib/format";

export default function AnalysisPage() {
    const router = useRouter();

    // 더미 데이터: 월별 자산 가치 변화
    const assetHistory = [
        { label: "1월", value: 85000000 },
        { label: "2월", value: 88000000 },
        { label: "3월", value: 87500000 },
        { label: "4월", value: 92000000 },
        { label: "5월", value: 98000000 },
        { label: "6월", value: 102040000 },
    ];

    // 더미 데이터: 카테고리별 비중. 색이 없으므로 명도 단계(donutRamp)로 구분한다.
    // 큰 항목부터 내림차순으로 두어야 진한 단계가 큰 조각에 붙는다.
    const categoryDistribution = [
        { label: "전자기기", value: 45000000, color: donutRamp[0] },
        { label: "가구", value: 30000000, color: donutRamp[1] },
        { label: "의류", value: 15000000, color: donutRamp[2] },
        { label: "기타", value: 12040000, color: donutRamp[3] },
    ];

    const totalAsset = 102040000;
    const lastMonthAsset = 98000000;
    const growth = totalAsset - lastMonthAsset;
    const growthRate = toPercent(growth, lastMonthAsset);

    return (
        <PageShell className="space-y-8">
            <PageHeader
                title="자산 분석"
                description="나의 자산 가치 변동을 확인하세요."
                onBack={() => router.back()}
            />

            {/* 총 자산 요약 — 강조 위계 1단계(먹 채움). 페이지에서 가장 센 면은 여기 하나뿐이다. */}
            <Card padding="lg" className="bg-ink space-y-4">
                <div className="space-y-1">
                    <p className="text-paper/70 text-sm">총 자산 가치</p>
                    <Price value={totalAsset} size="xl" inverse />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* 먹 채움 위에서는 먹선을 쓸 수 없어 바탕색 헤어라인으로 알약을 그린다 */}
                    <span className="border-paper/40 text-paper inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-[13px] font-bold">
                        <i className="xi-arrow-up" aria-hidden="true" />
                        <span className="font-sans tabular-nums">
                            {formatWon(growth)}원 ({growthRate}%)
                        </span>
                    </span>
                    <p className="text-paper/70 text-sm">지난달 대비</p>
                </div>
            </Card>

            <Section title="자산 변동 추이">
                <Card>
                    <LineChart
                        data={assetHistory}
                        height={200}
                        ariaLabel={`최근 ${assetHistory.length}개월 자산 가치 추이. ${assetHistory[0].label} ${formatWon(assetHistory[0].value)}원에서 ${assetHistory[assetHistory.length - 1].label} ${formatWon(totalAsset)}원으로 늘었습니다.`}
                    />
                </Card>
            </Section>

            <Section title="카테고리별 비중">
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
                                    value={`${formatWon(item.value)}원 · ${toPercent(item.value, totalAsset)}%`}
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
                            <i className="xi-trending-up" aria-hidden="true" />
                        </IconTile>
                        <div className="space-y-1">
                            <Text weight="bold">꾸준한 성장</Text>
                            <Text size="sm" tone="muted">
                                지난 6개월간 자산 가치가 평균 3.5%씩 증가하고 있어요. 특히 전자기기 카테고리의 가치
                                상승이 두드러집니다.
                            </Text>
                        </div>
                    </Card>
                    <Card variant="sunken" padding="md" className="flex items-start gap-4">
                        <IconTile tone="muted">
                            <i className="xi-lightbulb-o" aria-hidden="true" />
                        </IconTile>
                        <div className="space-y-1">
                            <Text weight="bold">포트폴리오 다각화 추천</Text>
                            <Text size="sm" tone="muted">
                                전자기기 비중이 {toPercent(categoryDistribution[0].value, totalAsset)}%로 높습니다. 가구
                                등 감가상각이 적은 자산군을 늘려보시는 건 어떨까요?
                            </Text>
                        </div>
                    </Card>
                </div>
            </Section>
        </PageShell>
    );
}
