"use client";

import { useEffect, useMemo, useState } from "react";

import { DevEntrance } from "@/components/dev/DevEntrance";
import { Card, Icon, PageHeader, PageShell, Section, StatTile, Text, categoryIcon } from "@/components/common";
import { useProducts } from "@/lib/db/hooks";

import { AccountSection, ProfileCard } from "./AccountSection";
import { BackupSection } from "./BackupSection";
import { PolicySection } from "./PolicySection";

/** 계정 진입점 — 전역 떠 있는 메뉴가 사라져 로그인·회원가입은 이 페이지에서만 들어간다 */
const ACCOUNT_LINKS = [
    { href: "/login", label: "로그인", hint: "계정이 있다면" },
    { href: "/signup", label: "회원가입", hint: "아직 계정이 없다면" },
] as const;

/** 브라우저가 이 앱에 쓰고 있는 저장 공간 (MB). 지원하지 않으면 null */
function useStorageUsage(deps: unknown): number | null {
    const [usage, setUsage] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        navigator.storage
            ?.estimate?.()
            .then(({ usage: bytes }) => {
                if (!cancelled && bytes !== undefined) setUsage(bytes / 1024 / 1024);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [deps]);

    return usage;
}

/**
 * 마이. 로그인 여부와 상관없이 이 기기에 무엇이 얼마나 저장돼 있는지를 보여준다.
 * 로그인 상태에 따라 달라지는 부분(프로필, 계정)은 AccountSection 이 맡는다.
 */
export default function MyPage() {
    const products = useProducts();
    const usageMb = useStorageUsage(products);

    const categories = useMemo(() => {
        const counts = new Map<string, number>();
        for (const item of products ?? []) {
            const key = item.category.trim() || "미지정";
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    }, [products]);

    return (
        <PageShell className="space-y-6">
            <PageHeader title="마이" description="내 정보와 등록한 물건을 한눈에." />

            <ProfileCard />

            {/* 통계 — 강조는 색이 아니라 먹 채움으로 하나만 준다 */}
            <section className="grid grid-cols-2 gap-3">
                <StatTile
                    emphasis
                    icon={<Icon name="box" />}
                    label="등록한 물건"
                    value={products ? `${products.length}개` : "…"}
                />
                <StatTile
                    icon={<Icon name="storage" />}
                    label="저장 공간 사용"
                    value={usageMb === null ? "—" : `${usageMb < 0.1 ? "0.1 미만" : usageMb.toFixed(1)}MB`}
                />
            </section>

            {categories.length > 0 && (
                <Section title="카테고리">
                    {/* 손으로 붙인 스크랩북 — .paste-grid 가 자식 카드를 교차로 기울인다 */}
                    <div className="paste-grid grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {categories.map(([name, count]) => (
                            <Card key={name} padding="sm" className="space-y-1 text-center">
                                {/* 컬러 이모지 대신 앱 전용 손그림 아이콘 — 색은 먹 하나뿐이다 */}
                                <Icon name={categoryIcon(name)} className="mx-auto block text-3xl" />
                                <Text size="sm" weight="bold">
                                    {name}
                                </Text>
                                <Text size="xs" tone="muted" className="font-sans tabular-nums">
                                    {count}개
                                </Text>
                            </Card>
                        ))}
                    </div>
                </Section>
            )}

            <BackupSection />

            <AccountSection guestLinks={ACCOUNT_LINKS} />

            <PolicySection />

            <DevEntrance />
        </PageShell>
    );
}
