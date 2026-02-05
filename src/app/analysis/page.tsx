"use client";

import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";
import { LineChart, DonutChart } from "@/components/analysis/Charts";
import { useRouter } from "next/navigation";

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

    // 더미 데이터: 카테고리별 비중
    const categoryDistribution = [
        { label: "전자기기", value: 45000000, color: "#F59E0B" }, // brand-500
        { label: "가구", value: 30000000, color: "#FCD34D" }, // brand-300
        { label: "의류", value: 15000000, color: "#FEF3C7" }, // brand-100
        { label: "기타", value: 12040000, color: "#E5E7EB" }, // gray-200
    ];

    const totalAsset = 102040000;
    const lastMonthAsset = 98000000;
    const growth = totalAsset - lastMonthAsset;
    const growthRate = ((growth / lastMonthAsset) * 100).toFixed(1);

    return (
        <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 pb-32">
            <header className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="-ml-2 rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                >
                    <i className="xi-arrow-left text-xl"></i>
                </button>
                <div>
                    <Heading level={2}>자산 분석</Heading>
                    <Text color="text-gray-500">나의 자산 가치 변동을 확인하세요.</Text>
                </div>
            </header>

            {/* 총 자산 요약 */}
            <section>
                <Card className="border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl">
                    <div className="space-y-1">
                        <Text size="sm" className="text-gray-400">
                            총 자산 가치
                        </Text>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold tracking-tight">{totalAsset.toLocaleString()}</span>
                            <span className="text-xl text-gray-400">원</span>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg bg-green-500/20 px-2 py-1 text-sm font-medium text-green-400">
                            <i className="xi-arrow-up"></i>
                            {growth.toLocaleString()}원 ({growthRate}%)
                        </div>
                        <Text size="sm" className="text-gray-400">
                            지난달 대비
                        </Text>
                    </div>
                </Card>
            </section>

            {/* 자산 변동 그래프 */}
            <section className="space-y-4">
                <Heading level={4}>자산 변동 추이</Heading>
                <Card>
                    <div className="flex h-64 items-center justify-center">
                        <LineChart data={assetHistory} height={250} />
                    </div>
                </Card>
            </section>

            {/* 카테고리별 비중 */}
            <section className="space-y-4">
                <Heading level={4}>카테고리별 비중</Heading>
                <Card>
                    <div className="flex flex-col items-center gap-8 md:flex-row">
                        <div className="flex-shrink-0">
                            <DonutChart data={categoryDistribution} size={200} />
                        </div>
                        <div className="w-full space-y-3">
                            {categoryDistribution.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <Text weight="medium">{item.label}</Text>
                                    </div>
                                    <div className="text-right">
                                        <Text weight="bold">{item.value.toLocaleString()}원</Text>
                                        <Text size="sm" color="text-gray-400">
                                            {((item.value / totalAsset) * 100).toFixed(1)}%
                                        </Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </section>

            {/* 인사이트 */}
            <section className="space-y-4">
                <Heading level={4}>인사이트</Heading>
                <div className="grid gap-4">
                    <Card padding="sm" className="flex items-start gap-4 border-brand-100 bg-brand-50">
                        <div className="mt-1 rounded-full bg-white p-2 text-brand-500 shadow-sm">
                            <i className="xi-trending-up"></i>
                        </div>
                        <div>
                            <Text weight="bold" className="text-brand-800">
                                꾸준한 성장
                            </Text>
                            <Text size="sm" className="mt-1 text-brand-600">
                                지난 6개월간 자산 가치가 평균 3.5%씩 증가하고 있어요. 특히 전자기기 카테고리의 가치
                                상승이 두드러집니다.
                            </Text>
                        </div>
                    </Card>
                    <Card padding="sm" className="flex items-start gap-4 border-gray-200 bg-gray-50">
                        <div className="mt-1 rounded-full bg-white p-2 text-gray-500 shadow-sm">
                            <i className="xi-lightbulb-o"></i>
                        </div>
                        <div>
                            <Text weight="bold" className="text-gray-800">
                                포트폴리오 다각화 추천
                            </Text>
                            <Text size="sm" className="mt-1 text-gray-600">
                                전자기기 비중이 44%로 높습니다. 가구 등 감가상각이 적은 자산군을 늘려보시는 건 어떨까요?
                            </Text>
                        </div>
                    </Card>
                </div>
            </section>
        </main>
    );
}
