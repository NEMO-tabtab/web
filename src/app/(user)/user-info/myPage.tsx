"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge, Card, PageHeader, PageShell, Section, StatTile, Text } from "@/components/common";
import { NemoFace } from "@/components/NemoFace";
import { cn } from "@/lib/cn";
import { useProducts } from "@/lib/db/hooks";

const CATEGORY_ICONS: Record<string, string> = {
    전자기기: "💻",
    가구: "🪑",
    의류: "👕",
    도서: "📚",
};

/** 계정 진입점 — 전역 떠 있는 메뉴가 사라져 로그인·회원가입은 이 페이지에서만 들어간다 */
const ACCOUNT_LINKS = [
    { href: "/login", label: "로그인", hint: "계정이 있다면" },
    { href: "/signup", label: "회원가입", hint: "아직 계정이 없다면" },
] as const;

/** 데이터 백업 — 다음 작업에서 붙인다. 자리와 문구만 먼저 잡아 둔다. */
const BACKUP_ACTIONS = [
    { label: "백업 내보내기", hint: "기록한 물건과 사진을 파일로 저장", icon: "xi-download" },
    { label: "백업 가져오기", hint: "저장해 둔 파일에서 되살리기", icon: "xi-upload" },
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

/** 리스트 행 공통 모양 — 카드 안 구분은 옅은 선이 아니라 먹선으로 끊는다 */
const rowClassName = (index: number) =>
    cn("flex items-center justify-between gap-3 px-4 py-3", index > 0 && "border-ink border-t-2");

/**
 * 마이 — 로그인 전(게스트) 화면.
 * 서버의 사용자 정보 대신, 이 기기에 무엇이 얼마나 저장돼 있는지를 보여준다.
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

            {/* 프로필 — 네모가 곧 프로필 그림. 사진 없이도 카드가 비어 보이지 않는다 */}
            <section className="sticker rounded-nemo bg-paper flex items-center gap-3 px-4 py-4">
                <div className="shrink-0">
                    <NemoFace size={60} />
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-display truncate text-lg leading-tight">게스트</p>
                        <Badge size="sm">로그인 전</Badge>
                    </div>
                    <p className="text-ink-soft mt-0.5 text-[12px]">기록한 물건은 이 기기에만 저장돼요.</p>
                </div>
            </section>

            {/* 통계 — 강조는 색이 아니라 먹 채움으로 하나만 준다 */}
            <section className="grid grid-cols-2 gap-3">
                <StatTile
                    emphasis
                    icon={<i className="xi-box" aria-hidden="true" />}
                    label="등록한 물건"
                    value={products ? `${products.length}개` : "…"}
                />
                <StatTile
                    icon={<i className="xi-server" aria-hidden="true" />}
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
                                <span aria-hidden="true" className="block text-3xl leading-none">
                                    {CATEGORY_ICONS[name] ?? "📦"}
                                </span>
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

            <Section
                title="데이터"
                titleClassName="scribble"
                description="앱을 지우거나 브라우저 데이터를 지우면 기록도 함께 사라져요."
            >
                <div className="sticker rounded-nemo bg-paper overflow-hidden">
                    {BACKUP_ACTIONS.map((action, index) => (
                        // 아직 동작하지 않는다 — 누를 수 없게 막고 "작업 중" 으로 알린다
                        <button
                            key={action.label}
                            type="button"
                            disabled
                            aria-disabled="true"
                            className={cn(rowClassName(index), "w-full cursor-not-allowed text-left")}
                        >
                            <span className="flex min-w-0 items-center gap-3 opacity-60">
                                <i className={cn(action.icon, "text-lg")} aria-hidden="true" />
                                <span className="min-w-0">
                                    <span className="block text-sm font-bold">{action.label}</span>
                                    <span className="text-ink-soft block text-xs">{action.hint}</span>
                                </span>
                            </span>
                            <Badge size="sm">작업 중</Badge>
                        </button>
                    ))}
                </div>
            </Section>

            <Section title="계정" titleClassName="scribble">
                <div className="sticker rounded-nemo bg-paper overflow-hidden">
                    {ACCOUNT_LINKS.map((link, index) => (
                        <Link key={link.href} href={link.href} className={cn("sticker-press", rowClassName(index))}>
                            <span className="min-w-0">
                                <span className="block text-sm font-bold">{link.label}</span>
                                <span className="text-ink-soft block text-xs">{link.hint}</span>
                            </span>
                            <i className="xi-angle-right-min text-ink-soft text-lg" aria-hidden="true" />
                        </Link>
                    ))}
                </div>
            </Section>
        </PageShell>
    );
}
