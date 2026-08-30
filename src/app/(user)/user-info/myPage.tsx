"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge, Card, PageHeader, PageShell, Section, StatTile, Text } from "@/components/common";
import { Tabs } from "@/components/common/Tabs";
import { NemoFace } from "@/components/NemoFace";
import { cn } from "@/lib/cn";

type User = {
    userIdx: number;
    loginId: string;
    name: string;
    nickname: string;
    address: string;
};

const TABS = [
    { value: "category", label: "카테고리" },
    { value: "group", label: "참여 그룹" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

/** 계정 진입점 — 전역 떠 있는 메뉴가 사라져 로그인·회원가입은 이 페이지에서만 들어간다 */
const ACCOUNT_LINKS = [
    { href: "/login", label: "로그인", hint: "다른 계정으로 전환하기" },
    { href: "/signup", label: "회원가입", hint: "아직 계정이 없다면" },
] as const;

export default function MyPage({ user }: { user: User }) {
    const [activeTab, setActiveTab] = useState<TabValue>("category");

    const categories = [
        { name: "전자기기", count: 12, icon: "💻" },
        { name: "가구", count: 5, icon: "🪑" },
        { name: "의류", count: 8, icon: "👕" },
        { name: "도서", count: 24, icon: "📚" },
        { name: "취미", count: 3, icon: "🎨" },
        { name: "기타", count: 7, icon: "📦" },
    ];

    const groups = [
        { name: "애플 매니아", members: 1240, role: "멤버" },
        { name: "데스크테리어", members: 850, role: "운영자" },
        { name: "미니멀리스트", members: 3200, role: "멤버" },
    ];

    return (
        <PageShell className="space-y-6">
            <PageHeader title="마이" description="내 정보와 등록한 물건을 한눈에." />

            {/* 프로필 — 네모가 곧 프로필 그림. 사진 없이도 카드가 비어 보이지 않는다 */}
            <section className="sticker rounded-nemo bg-paper flex items-center gap-3 px-4 py-4">
                <div className="shrink-0">
                    <NemoFace size={60} />
                </div>

                <div className="min-w-0">
                    <p className="font-display truncate text-lg leading-tight">{user.nickname}</p>
                    <p className="text-ink-soft mt-0.5 truncate text-[12px]">{user.loginId}</p>

                    <div className="text-ink-soft mt-1 flex items-center gap-2 text-[12px]">
                        {/* 숫자는 손글씨를 쓰지 않는다 — 글리프 폭이 흔들린다 */}
                        <span>
                            팔로워 <strong className="text-ink font-sans font-bold tabular-nums">128</strong>
                        </span>
                        <span aria-hidden="true" className="bg-line h-3 w-px" />
                        <span>
                            팔로잉 <strong className="text-ink font-sans font-bold tabular-nums">42</strong>
                        </span>
                    </div>
                </div>

                <Link
                    href="/user-edit"
                    className="sticker sticker-press bg-paper ml-auto shrink-0 self-start rounded-full px-3 py-1.5 text-[12px] font-bold"
                >
                    프로필 수정
                </Link>
            </section>

            {/* 통계 — 강조는 색이 아니라 먹 채움으로 하나만 준다 */}
            <section className="grid grid-cols-2 gap-3">
                <StatTile
                    emphasis
                    icon={<i className="xi-box" aria-hidden="true" />}
                    label="총 등록 물품"
                    value="59개"
                />
                <StatTile icon={<i className="xi-users" aria-hidden="true" />} label="참여 그룹" value="3개" />
            </section>

            <Tabs items={TABS} value={activeTab} onChange={setActiveTab} variant="underline" aria-label="마이 페이지" />

            <Section>
                {activeTab === "category" && (
                    // 손으로 붙인 스크랩북 — .paste-grid 가 자식 카드를 교차로 기울인다
                    <div className="paste-grid grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {categories.map((cat) => (
                            <Card key={cat.name} padding="sm" interactive className="space-y-1 text-center">
                                <span aria-hidden="true" className="block text-3xl leading-none">
                                    {cat.icon}
                                </span>
                                <Text size="sm" weight="bold">
                                    {cat.name}
                                </Text>
                                <Text size="xs" tone="muted" className="font-sans tabular-nums">
                                    {cat.count}개
                                </Text>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === "group" && (
                    <div className="space-y-3">
                        {groups.map((group) => (
                            <Card key={group.name} padding="sm">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <Text size="sm" weight="bold">
                                            {group.name}
                                        </Text>
                                        <Text size="xs" tone="muted" className="mt-0.5 font-sans tabular-nums">
                                            멤버 {group.members.toLocaleString("ko-KR")}명
                                        </Text>
                                    </div>
                                    <Badge variant={group.role === "운영자" ? "ink" : "neutral"}>{group.role}</Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Section>

            {/* 계정 — 카드 안 구분은 옅은 선이 아니라 먹선으로 끊는다 */}
            <Section title="계정" titleClassName="scribble">
                <div className="sticker rounded-nemo bg-paper overflow-hidden">
                    {ACCOUNT_LINKS.map((link, index) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "sticker-press flex items-center justify-between gap-3 px-4 py-3",
                                index > 0 && "border-ink border-t-2",
                            )}
                        >
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
