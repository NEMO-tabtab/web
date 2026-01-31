"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";
import { Input } from "@/components/common/Input";

export default function AddProduct() {
    const [showMoreInfo, setShowMoreInfo] = useState(false);
    const [condition, setCondition] = useState<string>("good");

    return (
        <main className="max-w-3xl mx-auto px-4 py-8 pb-32 space-y-8">
            <header className="space-y-2">
                <Heading level={2}>제품 등록</Heading>
                <Text color="text-gray-500">
                    소중한 물건을 등록하고 가치를 기록해보세요.
                </Text>
            </header>

            {/* 이미지 업로드 섹션 */}
            <section>
                <Text weight="medium" className="mb-3">제품 사진</Text>
                <div className="grid grid-cols-3 gap-4">
                    <button className="aspect-square flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-500 hover:bg-brand-100 transition-colors">
                        <i className="xi-camera text-2xl mb-1"></i>
                        <span className="text-xs font-medium">사진 추가</span>
                    </button>
                    {/* 예시 이미지 슬롯 (비어있음) */}
                    <div className="aspect-square rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300">
                        <i className="xi-image text-2xl"></i>
                    </div>
                    <div className="aspect-square rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300">
                        <i className="xi-image text-2xl"></i>
                    </div>
                </div>
                <Text size="sm" color="text-gray-400" className="mt-2">
                    * 최대 3장까지 등록 가능합니다.
                </Text>
            </section>

            <form className="space-y-8">
                {/* 제품 정보 */}
                <Card className="space-y-6">
                    <Heading level={4}>기본 정보</Heading>

                    <Input
                        label="제품명"
                        placeholder="예: 맥북 프로 16인치"
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="구매 가격"
                            placeholder="0"
                            type="number"
                            icon={<span className="text-gray-500 font-bold">₩</span>}
                        />
                        <Input
                            label="수량"
                            placeholder="1"
                            type="number"
                            defaultValue={1}
                        />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-brand-50 rounded-xl border border-brand-100">
                        <input
                            id="is-gift"
                            type="checkbox"
                            className="w-5 h-5 text-brand-500 rounded focus:ring-brand-500 border-gray-300"
                        />
                        <label htmlFor="is-gift" className="text-sm font-medium text-brand-900 cursor-pointer select-none">
                            선물 받은 제품인가요? (가격 0원 처리)
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                        <div className="flex flex-wrap gap-2">
                            {["전자기기", "가구", "의류", "도서", "기타"].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 transition-all bg-white"
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* 추가 정보 토글 */}
                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={() => setShowMoreInfo(!showMoreInfo)}
                        className="flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 transition-colors"
                    >
                        <span>상세 정보 입력하기</span>
                        <i className={`xi-angle-down transition-transform duration-200 ${showMoreInfo ? "rotate-180" : ""}`}></i>
                    </button>

                    {showMoreInfo && (
                        <Card className="space-y-6 animate-fade-in">
                            <Input label="모델명" placeholder="모델명을 입력해주세요" />
                            <Input label="브랜드" placeholder="브랜드를 입력해주세요" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">제품 상태</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[
                                        { value: "bad", label: "나쁨", icon: "😫" },
                                        { value: "poor", label: "보통", icon: "😐" },
                                        { value: "good", label: "좋음", icon: "🙂" },
                                        { value: "excellent", label: "아주 좋음", icon: "😀" },
                                        { value: "new", label: "미개봉", icon: "✨" },
                                    ].map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => setCondition(item.value)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${condition === item.value
                                                    ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
                                                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                                }`}
                                        >
                                            <span className="text-2xl mb-1">{item.icon}</span>
                                            <span className="text-xs font-medium">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Input label="구매일" type="date" />
                            <Input label="구매처" placeholder="구매처를 입력해주세요" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                                <textarea
                                    className="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-brand-500 focus:bg-white focus:ring-brand-500 p-4 min-h-[100px] resize-none transition-colors"
                                    placeholder="제품에 대한 상세한 정보를 기록해보세요."
                                />
                            </div>
                        </Card>
                    )}
                </div>

                <div className="pt-4">
                    <Button fullWidth size="lg" className="shadow-lg shadow-brand-500/30">
                        등록 완료
                    </Button>
                </div>
            </form>
        </main>
    );
}
