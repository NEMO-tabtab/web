import MyPage from "./myPage";
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

export default function MyPage() {
   const res = await fetch(`http://localhost:8080/api/user/36`, {
        cache: "no-store",
    });
    const user: User = await res.json();
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
        <main className="max-w-3xl mx-auto px-4 py-8 pb-32 space-y-6">
            {/* 프로필 섹션 */}
            <section className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white shadow-md">
                        <Image
                            src="https://placehold.co/200x200.jpg"
                            fill
                            className="object-cover"
                            alt="유저 프로필"
                        />
                    </div>
                    <div>
                        <Heading level={3} className="mb-1">김네모</Heading>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>팔로워 <strong className="text-brand-600">128</strong></span>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <span>팔로잉 <strong className="text-gray-900">42</strong></span>
                        </div>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">
                    프로필 수정
                </Button>
            </section>

            {/* 통계 카드 */}
            <section className="grid grid-cols-2 gap-4">
                <Card padding="sm" className="flex flex-col items-center justify-center py-6 bg-brand-50 border-brand-100">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-500 mb-2 shadow-sm">
                        <i className="xi-box text-xl"></i>
                    </div>
                    <Text size="sm" color="text-gray-500">총 등록 물품</Text>
                    <Text size="xl" weight="bold" color="text-brand-700">59개</Text>
                </Card>
                <Card padding="sm" className="flex flex-col items-center justify-center py-6 bg-gray-50 border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 mb-2 shadow-sm">
                        <i className="xi-users text-xl"></i>
                    </div>
                    <Text size="sm" color="text-gray-500">참여 그룹</Text>
                    <Text size="xl" weight="bold" color="text-gray-700">3개</Text>
                </Card>
            </section>

            {/* 탭 네비게이션 */}
            <section className="sticky top-16 bg-white/80 backdrop-blur-md z-10 -mx-4 px-4 border-b border-gray-100">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab("category")}
                        className={`py-4 text-sm font-medium transition-all relative ${activeTab === "category"
                                ? "text-brand-600"
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        카테고리
                        {activeTab === "category" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("group")}
                        className={`py-4 text-sm font-medium transition-all relative ${activeTab === "group"
                                ? "text-brand-600"
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        참여 그룹
                        {activeTab === "group" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
                        )}
                    </button>
                </div>
            </section>

            {/* 컨텐츠 영역 */}
            <section className="animate-fade-in min-h-[300px]">
                {activeTab === "category" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {categories.map((cat, i) => (
                            <Card key={i} padding="sm" className="hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group">
                                <div className="flex flex-col items-center text-center gap-2 py-2">
                                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
                                    <Text weight="medium" className="group-hover:text-brand-700">{cat.name}</Text>
                                    <Text size="sm" color="text-gray-400">{cat.count}개</Text>
                                </div>
                            </Card>
                        ))}
                        <Card padding="sm" className="border-dashed border-2 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 cursor-pointer transition-colors text-gray-400 hover:text-gray-600 hover:border-gray-300">
                            <i className="xi-plus text-2xl"></i>
                            <Text size="sm">새 카테고리</Text>
                        </Card>
                    </div>
                )}

                {activeTab === "group" && (
                    <div className="space-y-4">
                        {groups.map((group, i) => (
                            <Card key={i} className="flex items-center justify-between hover:border-brand-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl">
                                        🏢
                                    </div>
                                    <div>
                                        <Text weight="bold" size="lg">{group.name}</Text>
                                        <Text size="sm" color="text-gray-500">멤버 {group.members.toLocaleString()}명</Text>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${group.role === "운영자"
                                        ? "bg-brand-100 text-brand-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}>
                                    {group.role}
                                </div>
                            </Card>
                        ))}
                        <Button variant="outline" fullWidth className="border-dashed h-14 text-gray-500 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50">
                            + 새로운 그룹 찾아보기
                        </Button>
                    </div>
                )}
            </section>
        </main>
    );
}
