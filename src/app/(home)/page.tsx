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
            {/* Hero Section: 내 가치 Dashboard */}
            <section className="animate-fade-in relative z-10">
                <div className="relative overflow-hidden rounded-[2rem] bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-3xl md:p-12 border border-neutral-200">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-white/10 opacity-80" />
                    <div className="relative z-10 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <Text size="sm" className="font-bold text-neutral-500">
                                내 자산 요약
                            </Text>
                            {/*                        
                                <i className="xi-angle-right-min text-neutral-400"></i>
                            */}
                        </div>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
                                102,040,000
                            </span>
                            <span className="text-xl font-bold text-neutral-500">원</span>
                        </div>
                        
                        {/* 디테일 리스트 (토스 스타일 리스트) */}
                        <div className="flex flex-col gap-3 rounded-[1.25rem] bg-white/80 p-5 shadow-sm backdrop-blur-md mb-6 border border-neutral-100">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-neutral-500">총 자산 수</span>
                                <span className="text-sm font-bold text-neutral-800">42개</span>
                            </div>
                            <div className="h-px w-full bg-neutral-100" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-neutral-500">이번 달 증가</span>
                                <span className="text-sm font-bold text-brand-500">+3개</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {/* <Link href="/analysis" className="block w-full">
                                <Button
                                    variant="secondary"
                                    className="w-full rounded-2xl bg-brand-50 text-brand-700 shadow-sm transition-all hover:bg-brand-100 hover:-translate-y-0.5"
                                >
                                    <span className="text-sm font-bold">분석 보기</span>
                                </Button>
                            </Link> */}
                            <Link href="/product/add" className="block w-full">
                                <Button
                                    variant="primary"
                                    className="w-full h-14 rounded-[1.25rem] bg-brand-600 text-white shadow-[0_4px_14px_0_rgb(0,118,255,0.39)] transition-all hover:bg-brand-700 hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:-translate-y-0.5"
                                >
                                    <span className="text-base font-bold">+ 새 자산 추가하기</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 레이아웃 구분을 위한 강력한 가로선 */}
            <div className="my-10 h-px w-full bg-neutral-200" />

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
                <div className="min-h-[400px] mt-6 border-t border-neutral-200 pt-8">
                    {selectedTab === 1 && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {itemList.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group relative cursor-pointer overflow-hidden rounded-[1.5rem] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.1)] border border-neutral-100/50"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50 p-4">
                                        <Image
                                            src={item.image}
                                            fill
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 mix-blend-multiply"
                                            alt={item.name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                        <div className="absolute top-4 left-4 z-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 shadow-sm opacity-0 -translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                                            <span className="text-xs font-bold text-brand-600">상세보기</span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="mb-2 text-lg font-bold text-neutral-800 transition-colors group-hover:text-brand-600">
                                            {item.name}
                                        </h3>
                                        <p className="text-2xl font-black text-brand-600">
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

            <div className="my-12 h-px w-full bg-neutral-200" />

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
                            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-100/80 bg-white/70 backdrop-blur-md p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-brand-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-xl text-brand-600 transition-transform group-hover:scale-110 group-hover:shadow-sm">
                                    📦
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-bold text-neutral-800 transition-colors group-hover:text-brand-700">
                                        {product.name}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-extrabold text-brand-600">{product.price.toLocaleString()}원</span>
                                <span className="mt-1 text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    ✓ 보유 중
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
