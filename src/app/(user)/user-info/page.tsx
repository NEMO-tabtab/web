"use client";

import Image from "next/image";
import { useState } from "react";

export default function MyPage() {
    const [activeTab, setActiveTab] = useState<"category" | "group">("category");
    const DUMMYDATA = [
        { name: "테스트1", count: 1 },
        { name: "테스트3", count: 2 },
        { name: "테스트2", count: 3 },
        { name: "테스트4", count: 4 },
        { name: "테스트5", count: 5 },
        { name: "테스트6", count: 6 },
    ];

    return (
        <div className="container-1280 px">
            <section className="p-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <Image
                            src="https://placehold.co/200x200.jpg"
                            width={200}
                            height={200}
                            className="md:w-[200px] md:h-[200px] w-16 h-16 rounded-full"
                            alt="유저 썸네일"
                        />
                        <div className="grid grid-rows-2 md:gap-6">
                            <div className="md:text-2xl text-lg  font-semibold">닉네임</div>
                            <div className="md:text-lg  text-sm text-gray-600">
                                팔로워 <strong className="text-black">0</strong> · 팔로잉
                                <strong className="text-black">0</strong>
                            </div>
                        </div>
                    </div>
                    <div>
                        <i className="xi-angle-right md:text-3xl cursor-pointer"></i>
                    </div>
                </div>

                <div className="mt-6 grid md:grid-cols-6 grid-cols-4 gap-4">
                    <div className="p-2 rounded text-center cursor-pointer">
                        <i className="xi-hdd text-2xl" />
                        <div className="text-xs text-gray-500 mt-1">총 등록 갯수</div>
                        <div className="text-sm font-semibold mt-1">10개</div>
                    </div>
                    <div className="p-2 rounded text-center cursor-pointer">
                        <i className="xi-users text-2xl" />
                        <div className="text-xs text-gray-500 mt-1">참여 그룹</div>
                        <div className="text-sm font-semibold mt-1">10개</div>
                    </div>
                </div>
            </section>

            <section className="px-4 mt-4">
                <div className="flex space-x-6">
                    <button
                        onClick={() => setActiveTab("category")}
                        className={`pb-1 border-b-2 ${
                            activeTab === "category" ? "border-black font-bold" : "border-transparent text-gray-500"
                        }`}
                    >
                        카테고리
                    </button>
                    <button
                        onClick={() => setActiveTab("group")}
                        className={`pb-1 border-b-2 ${
                            activeTab === "group" ? "border-black font-bold" : "border-transparent text-gray-500"
                        }`}
                    >
                        그룹
                    </button>
                </div>
            </section>

            {/* 이 부분 큰 화면일때 grid-cols-2 를 수정하면 됨 */}
            <section className="grid lg:grid-cols-6 grid-cols-2 gap-4 px-4 py-6">
                {DUMMYDATA.map((data, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg p-4">
                        <div className="h-40 bg-gray-300 rounded-md"></div>
                        <div className="mt-2 text-sm font-semibold">{data.name}</div>
                        <div className="text-xs text-gray-500">등록갯수 {data.count}</div>
                    </div>
                ))}
            </section>
        </div>
    );
}
