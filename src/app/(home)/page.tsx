"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
    const [selectedTab, setSelectedTab] = useState<1 | 2 | undefined>();

    const itemList = [
        { name: "제품1", price: 10000 },
        { name: "제품2", price: 20000 },
        { name: "제품3", price: 30000 },
        { name: "제품4", price: 40000 },
    ];

    const myProducts = [
        { name: "컴퓨터", price: 10000 },
        { name: "문구류", price: 20000 },
        { name: "침실용품", price: 300123123123123100 },
        { name: "주방용품", price: 40000 },
        { name: "컴퓨터", price: 50000 },
        { name: "문구류", price: 70000 },
        { name: "침실용품", price: 80000 },
        { name: "주방용품", price: 90000 },
        { name: "컴퓨터", price: 10000 },
        { name: "문구류", price: 20000 },
        { name: "침실용품", price: 30000 },
        { name: "주방용품", price: 40000 },
        { name: "컴퓨터", price: 50000 },
        { name: "문구류", price: 70000 },
        { name: "침실용품", price: 80000 },
        { name: "주방용품", price: 90000 },
        { name: "컴퓨터", price: 10000 },
        { name: "문구류", price: 20000 },
        { name: "침실용품", price: 30000 },
        { name: "주방용품", price: 40000 },
        { name: "컴퓨터", price: 50000 },
        { name: "문구류", price: 70000 },
        { name: "침실용품", price: 80000 },
        { name: "주방용품", price: 90000 },
    ];

    return (
        <main className="container-1280 px">
            <section className="grid grid-rows-2 my-5 p-5 gap-6 border-2 border-solid rounded-xl">
                <strong className="text-xl md:text-3xl">내 가치</strong>
                <span>
                    <strong className="text-xl md:text-4xl text-amber-500">102,040,000</strong>
                    <strong className="text-xl md:text-3xl"> 원</strong>
                </span>
            </section>
            <hr className="border-solid border-4" />
            <section className="my-5 py-5 border-2 border-solid rounded-xl">
                <article className="grid grid-cols-2 gap-4 px-4">
                    <button
                        className={`w-full bg-amber-400 text-xl md:text-2xl py-2 text-white rounded-xl ${
                            selectedTab === 1 ? "bg-amber-500" : "bg-amber-100"
                        }`}
                        onClick={() => setSelectedTab(selectedTab === 1 ? undefined : 1)}
                    >
                        <strong className={`${selectedTab === 1 ? "text-white" : "text-amber-500"}`}>카테고리</strong>
                    </button>
                    <button
                        className={`w-full bg-amber-400 text-xl md:text-2xl py-2 text-white rounded-xl ${
                            selectedTab === 2 ? "bg-amber-500" : "bg-amber-100"
                        }`}
                        onClick={() => setSelectedTab(selectedTab === 2 ? undefined : 2)}
                    >
                        <strong className={`${selectedTab === 2 ? "text-white" : "text-amber-500"}`}>공간</strong>
                    </button>
                </article>
                {selectedTab === 1 && (
                    <ul className="grid lg:grid-cols-1 grid-cols-1 gap-4 mt-5 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden px-10">
                        {itemList.map((item) => (
                            <li
                                key={item.name}
                                className="overflow-hidden flex md:flex-row flex-col items-start border border-gray-200 rounded-2xl"
                            >
                                <Image
                                    src="https://placehold.co/300x300.jpg"
                                    width={300}
                                    height={300}
                                    className="md:w-[200px] w-full"
                                    alt="제품 썸네일"
                                />
                                <div className="flex flex-col gap-2 p-8">
                                    <strong className="lg:text-xl text-lg">{item.name}</strong>
                                    <div className="lg:text-xl text-lg mt-auto">
                                        <strong>{item.price.toLocaleString()}</strong>
                                        <span>원</span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {selectedTab === 2 && (
                    <div className="px-10 mt-5 text-gray-600">
                        {/* 공간 관련 내용 */}
                        공간 관련 컨텐츠를 여기에 넣으세요.
                    </div>
                )}
            </section>
            <section className="">
                <ul className="grid grid-col-1 gap-10">
                    {myProducts.map((product) => (
                        <li key={product.name} className="grid grid-cols-2 my-2">
                            <span className="text-lg md:text-xl">{product.name}</span>
                            <strong className="justify-self-end md:text-2xl text-xl whitespace-nowrap">
                                {product.price.toLocaleString()} 원
                            </strong>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}
