"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";

type User = {
    userIdx: number;
    loginId: string;
    name: string;
    nickname: string;
    address: string;
};

export default function MyPage({ user }: { user: User }) {
    const [activeTab, setActiveTab] = useState<"category" | "group">("category");

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
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-32">
            {/* 프로필 */}
            <section className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white shadow-md md:h-24 md:w-24">
                        <Image src="https://placehold.co/200x200.jpg" fill className="object-cover" alt="유저 프로필" />
                    </div>

                    <div>
                        <Heading level={3} className="mb-1">
                            {user.nickname}
                        </Heading>

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>
                                팔로워 <strong className="text-brand-600">128</strong>
                            </span>

                            <span className="h-3 w-px bg-gray-300"></span>

                            <span>
                                팔로잉 <strong className="text-gray-900">42</strong>
                            </span>
                        </div>
                    </div>
                </div>

                <Button variant="outline" size="sm" className="rounded-full">
                    프로필 수정
                </Button>
            </section>

            {/* 통계 */}
            <section className="grid grid-cols-2 gap-4">
                <Card
                    padding="sm"
                    className="flex flex-col items-center justify-center border-brand-100 bg-brand-50 py-6"
                >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-500 shadow-sm">
                        <i className="xi-box text-xl"></i>
                    </div>

                    <Text size="sm" color="text-gray-500">
                        총 등록 물품
                    </Text>

                    <Text size="xl" weight="bold" color="text-brand-700">
                        59개
                    </Text>
                </Card>

                <Card
                    padding="sm"
                    className="flex flex-col items-center justify-center border-gray-200 bg-gray-50 py-6"
                >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                        <i className="xi-users text-xl"></i>
                    </div>

                    <Text size="sm" color="text-gray-500">
                        참여 그룹
                    </Text>

                    <Text size="xl" weight="bold" color="text-gray-700">
                        3개
                    </Text>
                </Card>
            </section>

            {/* 탭 */}
            <section className="sticky top-16 z-10 -mx-4 border-b border-gray-100 bg-white/80 px-4 backdrop-blur-md">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab("category")}
                        className={`relative py-4 text-sm font-medium ${
                            activeTab === "category" ? "text-brand-600" : "text-gray-500"
                        }`}
                    >
                        카테고리
                    </button>

                    <button
                        onClick={() => setActiveTab("group")}
                        className={`relative py-4 text-sm font-medium ${
                            activeTab === "group" ? "text-brand-600" : "text-gray-500"
                        }`}
                    >
                        참여 그룹
                    </button>
                </div>
            </section>

            {/* 내용 */}
            <section>
                {activeTab === "category" && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {categories.map((cat, i) => (
                            <Card key={i} padding="sm">
                                <div className="text-center">
                                    <span className="text-3xl">{cat.icon}</span>

                                    <Text weight="medium">{cat.name}</Text>

                                    <Text size="sm" color="text-gray-400">
                                        {cat.count}개
                                    </Text>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === "group" && (
                    <div className="space-y-4">
                        {groups.map((group, i) => (
                            <Card key={i}>
                                <div className="flex justify-between">
                                    <div>
                                        <Text weight="bold">{group.name}</Text>

                                        <Text size="sm" color="text-gray-500">
                                            멤버 {group.members.toLocaleString()}명
                                        </Text>
                                    </div>

                                    <div>{group.role}</div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
