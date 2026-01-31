"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Heading, Text } from "@/components/common/Typography";

export default function Home() {
    const [selectedTab, setSelectedTab] = useState<1 | 2>(1);

    const itemList = [
        {
            name: "맥북 프로 16인치",
            price: 3200000,
            image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=600",
        },
        {
            name: "아이패드 에어 5",
            price: 920000,
            image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=600",
        },
        {
            name: "소니 헤드폰 WH-1000XM5",
            price: 450000,
            image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=600",
        },
        {
            name: "로지텍 MX Master 3S",
            price: 139000,
            image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=600",
        },
    ];

    const myProducts = [
        { name: "게이밍 데스크탑", price: 2500000, category: "전자기기" },
        { name: "시디즈 의자", price: 350000, category: "가구" },
        { name: "기계식 키보드", price: 180000, category: "전자기기" },
        { name: "27인치 모니터", price: 450000, category: "전자기기" },
        { name: "책상", price: 120000, category: "가구" },
        { name: "스탠드 조명", price: 45000, category: "가구" },
    ];

    return (
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8">
            {/* Hero Section: 내 가치 */}
            <section className="mb-10 animate-fade-in">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-500 to-brand-400 p-8 text-white shadow-glow md:p-12">
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-2 text-center">
                        <Text size="lg" className="font-medium text-brand-50 opacity-90">
                            현재 나의 자산 가치
                        </Text>
                        <div className="flex flex-wrap items-baseline justify-center gap-2">
                            <span className="text-5xl font-black tracking-tight md:text-7xl">102,040,000</span>
                            <span className="text-2xl font-bold text-brand-100 md:text-3xl">원</span>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <Link href="/analysis">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                                >
                                    📈 분석 보기
                                </Button>
                            </Link>
                            <Link href="/add-product">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-full bg-white text-brand-600 hover:bg-brand-50"
                                >
                                    + 자산 추가
                                </Button>
                            </Link>
                        </div>
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl" />
                </div>
            </section>

            {/* Main Content Area */}
            <section className="animate-slide-up space-y-8">
                {/* Tabs */}
                <div className="flex justify-center">
                    <div className="inline-flex rounded-full bg-neutral-100 p-1">
                        <button
                            onClick={() => setSelectedTab(1)}
                            className={`rounded-full px-8 py-2.5 text-sm font-bold transition-all duration-200 ${
                                selectedTab === 1
                                    ? "bg-white text-brand-600 shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-700"
                            }`}
                        >
                            카테고리별
                        </button>
                        <button
                            onClick={() => setSelectedTab(2)}
                            className={`rounded-full px-8 py-2.5 text-sm font-bold transition-all duration-200 ${
                                selectedTab === 2
                                    ? "bg-white text-brand-600 shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-700"
                            }`}
                        >
                            공간별
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {selectedTab === 1 && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {itemList.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                                        <Image
                                            src={item.image}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            alt={item.name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="mb-1 text-lg font-bold text-neutral-900 group-hover:text-brand-600">
                                            {item.name}
                                        </h3>
                                        <p className="text-xl font-extrabold text-brand-600">
                                            {item.price.toLocaleString()}
                                            <span className="ml-1 text-sm font-medium text-neutral-400">원</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedTab === 2 && (
                        <div className="flex h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 text-3xl">
                                🏗️
                            </div>
                            <Text size="lg" weight="medium" color="text-neutral-500">
                                공간별 보기는 준비 중입니다
                            </Text>
                            <Text size="sm" color="text-neutral-400" className="mt-2">
                                더 편리한 기능을 위해 열심히 개발하고 있어요!
                            </Text>
                        </div>
                    )}
                </div>
            </section>

            <hr className="my-12 border-neutral-100" />

            {/* Bottom List Section */}
            <section className="animate-slide-up">
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <Heading level={3} className="text-neutral-900">
                            내 보유 목록
                        </Heading>
                        <Text size="sm" className="mt-1 text-neutral-500">
                            최근 등록한 물품들입니다.
                        </Text>
                    </div>
                    <Button variant="ghost" size="sm" className="text-brand-600 hover:bg-brand-50 hover:text-brand-700">
                        전체보기 <i className="xi-angle-right-min ml-1"></i>
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myProducts.map((product, index) => (
                        <div
                            key={index}
                            className="group flex items-center justify-between rounded-xl border border-neutral-100 bg-white p-4 transition-all duration-200 hover:border-brand-200 hover:shadow-md"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-xl text-brand-500 transition-colors group-hover:bg-brand-100">
                                    📦
                                </div>
                                <div>
                                    <p className="font-bold text-neutral-900 group-hover:text-brand-700">
                                        {product.name}
                                    </p>
                                    <p className="text-xs text-neutral-400">{product.category}</p>
                                </div>
                            </div>
                            <span className="font-bold text-brand-600">{product.price.toLocaleString()} 원</span>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
