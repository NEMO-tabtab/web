"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/common/Button";
import { Heading, Text } from "@/components/common/Typography";
import defaultThumbnail from "@/app/assets/images/product_default_thumbnail.jpg";

export default function Home() {
    const [selectedTab, setSelectedTab] = useState<1 | 2>(1);
    const [products, setProducts] = useState<any[]>([]);
    const [totalValue, setTotalValue] = useState<number>(0);
    const [totalCount, setTotalCount] = useState<number>(0);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.post(`http://3.38.247.4:8080/api/product/list`, {
                    page: 1,
                    size: 100,
                });
                const fetchedProducts = response.data?.content || [];
                setProducts(fetchedProducts);
                setTotalCount(response.data?.totalElements || fetchedProducts.length);
                
                const valueSum = fetchedProducts.reduce((sum: number, item: any) => sum + (item.productValue || item.productPrice || 0), 0);
                setTotalValue(valueSum);
            } catch (error) {
                console.error("Failed to fetch products", error);
            }
        };
        fetchProducts();
    }, []);

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
                                {totalValue.toLocaleString()}
                            </span>
                            <span className="text-xl font-bold text-neutral-500">원</span>
                        </div>
                        
                        {/* 디테일 리스트 (토스 스타일 리스트) */}
                        <div className="flex flex-col gap-3 rounded-[1.25rem] bg-white/80 p-5 shadow-sm backdrop-blur-md mb-6 border border-neutral-100">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-neutral-500">총 자산 수</span>
                                <span className="text-sm font-bold text-neutral-800">{totalCount}개</span>
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
                            {products.length > 0 ? products.map((item, idx) => {
                                const imageUrl = item.files && item.files.length > 0 
                                    ? `http://3.38.247.4:8080/${item.files[0].filePath}`
                                    : defaultThumbnail;
                                return (
                                <Link
                                    key={idx}
                                    href={`/product/edit/${item.productIdx || idx}`}
                                    className="group relative cursor-pointer block overflow-hidden rounded-[1.5rem] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.1)] border border-neutral-100/50"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50 p-4">
                                        <Image
                                            src={imageUrl}
                                            fill
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                            alt={item.productNm || "상품 이미지"}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                        <div className="absolute top-4 left-4 z-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 shadow-sm opacity-0 -translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                                            <span className="text-xs font-bold text-brand-600">상세보기</span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="mb-2 text-lg font-bold text-neutral-800 transition-colors group-hover:text-brand-600 truncate">
                                            {item.productNm}
                                        </h3>
                                        <p className="text-2xl font-black text-brand-600">
                                            {(item.productValue || item.productPrice || 0).toLocaleString()}
                                            <span className="ml-1 text-sm font-medium text-neutral-400">원</span>
                                        </p>
                                    </div>
                                </Link>
                                );
                            }) : (
                                <div className="col-span-full py-16 text-center text-neutral-400">등록된 자산이 없습니다.</div>
                            )}
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
                    {products.length > 0 ? products.slice(0, 6).map((product, index) => (
                        <Link
                            key={index}
                            href={`/product/edit/${product.productIdx || index}`}
                            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-100/80 bg-white/70 backdrop-blur-md p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-brand-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-xl text-brand-600 transition-transform group-hover:scale-110 group-hover:shadow-sm">
                                    📦
                                </div>
                                <div className="flex flex-col overflow-hidden max-w-[150px]">
                                    <p className="font-bold truncate text-neutral-800 transition-colors group-hover:text-brand-700">
                                        {product.productNm}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 whitespace-nowrap">
                                            {product.locationName || product.category || "본가"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end">
                                <span className="font-extrabold whitespace-nowrap text-brand-600">{(product.productValue || product.productPrice || 0).toLocaleString()}원</span>
                                <span className="mt-1 text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    ✓ 보유 중
                                </span>
                            </div>
                        </Link>
                    )) : (
                        <div className="col-span-full py-8 text-center text-neutral-400">목록이 비어있습니다.</div>
                    )}
                </div>
            </section>
        </main>
    );
}
