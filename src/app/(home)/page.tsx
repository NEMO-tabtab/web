"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/common/Button";
import { Heading, Text } from "@/components/common/Typography";
import defaultThumbnail from "@/app/assets/images/product_default_thumbnail.jpg";

interface User {
    userIdx: number;
    loginId: string;
    name: string;
    nickname: string;
    email: string;
}

interface HomeProduct {
    productIdx?: number;
    productNm?: string;
    productValue?: number;
    productPrice?: number;
    locationName?: string;
    category?: string;
    files?: { filePath: string }[];
}

export default function Home() {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<1 | 2>(1);
    const [products, setProducts] = useState<HomeProduct[]>([]);
    const [totalValue, setTotalValue] = useState<number>(0);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [userLoading, setUserLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me", {
                    method: "GET",
                    cache: "no-store",
                });

                if (res.status === 401) {
                    router.replace("/login");
                    return;
                }

                if (!res.ok) {
                    throw new Error("회원 정보 조회 실패");
                }

                const data = await res.json();

                console.log("회원 정보:", data);
                const userData = data.data?.user ?? data.data;

                setUser(userData);
            } catch (error) {
                console.error("회원 정보 조회 오류:", error);
                router.replace("/login");
            } finally {
                setUserLoading(false);
            }
        };

        fetchUser();
    }, [router]);

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

                const valueSum = fetchedProducts.reduce(
                    (sum: number, item: HomeProduct) => sum + (item.productValue || item.productPrice || 0),
                    0,
                );
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
            <section className="relative z-10 animate-fade-in">
                <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-3xl md:p-12">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-white/10 opacity-80" />
                    <div className="relative z-10 flex flex-col">
                        <div className="mb-2 flex items-center justify-between">
                            {user && (
                                <p className="mt-1 text-xl text-neutral-500">
                                    {user.nickname || user.name}님의 자산 요약
                                </p>
                            )}

                            {/*                        
                                <i className="xi-angle-right-min text-neutral-400"></i>
                            */}
                        </div>
                        <div className="mb-6 flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
                                {totalValue.toLocaleString()}
                            </span>
                            <span className="text-xl font-bold text-neutral-500">원</span>
                        </div>

                        {/* 디테일 리스트 (토스 스타일 리스트) */}
                        <div className="mb-6 flex flex-col gap-3 rounded-[1.25rem] border border-neutral-100 bg-white/80 p-5 shadow-sm backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-neutral-500">총 자산 수</span>
                                <span className="text-sm font-bold text-neutral-800">{totalCount}개</span>
                            </div>
                            <div className="h-px w-full bg-neutral-100" />
                            <div className="flex items-center justify-between">
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
                                    className="h-14 w-full rounded-[1.25rem] bg-brand-600 text-white shadow-[0_4px_14px_0_rgb(0,118,255,0.39)] transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)]"
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
                <div className="mt-6 min-h-[400px] border-t border-neutral-200 pt-8">
                    {selectedTab === 1 && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {products.length > 0 ? (
                                products.map((item, idx) => {
                                    const imageUrl =
                                        item.files && item.files.length > 0
                                            ? `http://3.38.247.4:8080/${item.files[0].filePath}`
                                            : defaultThumbnail;
                                    return (
                                        <Link
                                            key={idx}
                                            href={`/product/edit/${item.productIdx || idx}`}
                                            className="duration-400 group relative block cursor-pointer overflow-hidden rounded-[1.5rem] border border-neutral-100/50 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-2 hover:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.1)]"
                                        >
                                            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50 p-4">
                                                <Image
                                                    src={imageUrl}
                                                    fill
                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                    alt={item.productNm || "상품 이미지"}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                                <div className="absolute left-4 top-4 z-10 flex -translate-y-2 items-center justify-center rounded-full bg-white/90 px-3 py-1 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                                    <span className="text-xs font-bold text-brand-600">상세보기</span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <h3 className="mb-2 truncate text-lg font-bold text-neutral-800 transition-colors group-hover:text-brand-600">
                                                    {item.productNm}
                                                </h3>
                                                <p className="text-2xl font-black text-brand-600">
                                                    {(item.productValue || item.productPrice || 0).toLocaleString()}
                                                    <span className="ml-1 text-sm font-medium text-neutral-400">
                                                        원
                                                    </span>
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-16 text-center text-neutral-400">
                                    등록된 자산이 없습니다.
                                </div>
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
                    {products.length > 0 ? (
                        products.slice(0, 6).map((product, index) => (
                            <Link
                                key={index}
                                href={`/product/edit/${product.productIdx || index}`}
                                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-100/80 bg-white/70 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-xl text-brand-600 transition-transform group-hover:scale-110 group-hover:shadow-sm">
                                        📦
                                    </div>
                                    <div className="flex max-w-[150px] flex-col overflow-hidden">
                                        <p className="truncate font-bold text-neutral-800 transition-colors group-hover:text-brand-700">
                                            {product.productNm}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="whitespace-nowrap rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                                                {product.locationName || product.category || "본가"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end">
                                    <span className="whitespace-nowrap font-extrabold text-brand-600">
                                        {(product.productValue || product.productPrice || 0).toLocaleString()}원
                                    </span>
                                    <span className="mt-1 flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                                        ✓ 보유 중
                                    </span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-8 text-center text-neutral-400">목록이 비어있습니다.</div>
                    )}
                </div>
            </section>
        </main>
    );
}
