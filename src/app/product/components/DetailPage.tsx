"use client";

import { useState, useRef } from "react";

import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";
import { Input } from "@/components/common/Input";

const MAX_IMAGES = 3;

const CATEGORIES = ["전자기기", "가구", "의류", "도서", "기타"];

interface ProductFormData {
    name: string;
    purchasePrice: string;
    quantity: string;
    isGift: boolean;
    category: string;
    modelName: string;
    brand: string;
    condition: string;
    purchaseDate: string;
    purchasePlace: string;
    memo: string;
}

export default function DetailPage() {
    const [images, setImages] = useState<string[]>([]);
    const [showMoreInfo, setShowMoreInfo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        purchasePrice: "",
        quantity: "1",
        isGift: false,
        category: "",
        modelName: "",
        brand: "",
        condition: "good",
        purchaseDate: "",
        purchasePlace: "",
        memo: "",
    });

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remainingSlots = MAX_IMAGES - images.length;
        const filesToAdd = Array.from(files).slice(0, remainingSlots);

        filesToAdd.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageRemove = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const canAddMoreImages = images.length < MAX_IMAGES;

    const updateFormData = (field: keyof ProductFormData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 필수 필드 검증
        if (!formData.name.trim()) {
            alert("제품명을 입력해주세요.");
            return;
        }

        if (!formData.category) {
            alert("카테고리를 선택해주세요.");
            return;
        }

        // 서버로 전송할 데이터 구성
        const submitData = {
            ...formData,
            images,
            purchasePrice: formData.isGift ? 0 : Number(formData.purchasePrice),
            quantity: Number(formData.quantity),
        };

        console.log("제출할 데이터:", submitData);

        // TODO: 실제 API 호출
        // try {
        //     const response = await fetch('/api/products', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify(submitData),
        //     });
        //     if (response.ok) {
        //         // 성공 처리
        //     }
        // } catch (error) {
        //     console.error('등록 실패:', error);
        // }

        alert("제품이 등록되었습니다!");
    };

    return (
        <>
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
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                />
                <div className="grid grid-cols-3 gap-4">
                    {canAddMoreImages && (
                        <button
                            type="button"
                            onClick={handleImageClick}
                            className="aspect-square flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-500 hover:bg-brand-100 transition-colors"
                        >
                            <i className="xi-camera text-2xl mb-1"></i>
                            <span className="text-xs font-medium">사진 추가</span>
                        </button>
                    )}
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="aspect-square rounded-2xl relative group overflow-hidden border border-gray-200"
                        >
                            <img
                                src={image}
                                alt={`제품 사진 ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => handleImageRemove(index)}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <i className="xi-close text-sm"></i>
                            </button>
                        </div>
                    ))}
                    {Array.from({ length: MAX_IMAGES - images.length - (canAddMoreImages ? 1 : 0) }).map((_, index) => (
                        <div
                            key={`empty-${index}`}
                            className="aspect-square rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300"
                        >
                            <i className="xi-image text-2xl"></i>
                        </div>
                    ))}
                </div>
                <Text size="sm" color="text-gray-400" className="mt-2">
                    * 최대 {MAX_IMAGES}장까지 등록 가능합니다.
                </Text>
            </section>

            <form className="space-y-8" onSubmit={handleSubmit}>
                {/* 제품 정보 */}
                <Card className="space-y-6">
                    <Heading level={4}>기본 정보</Heading>

                    <Input
                        label="제품명"
                        placeholder="예: 맥북 프로 16인치"
                        required
                        value={formData.name}
                        onChange={(e) => updateFormData("name", e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="구매 가격"
                            placeholder="0"
                            type="number"
                            icon={<span className="text-gray-500 font-bold">₩</span>}
                            value={formData.purchasePrice}
                            onChange={(e) => updateFormData("purchasePrice", e.target.value)}
                            disabled={formData.isGift}
                        />
                        <Input
                            label="수량"
                            placeholder="1"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => updateFormData("quantity", e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-brand-50 rounded-xl border border-brand-100">
                        <input
                            id="is-gift"
                            type="checkbox"
                            className="w-5 h-5 text-brand-500 rounded focus:ring-brand-500 border-gray-300"
                            checked={formData.isGift}
                            onChange={(e) => {
                                updateFormData("isGift", e.target.checked);
                                if (e.target.checked) {
                                    updateFormData("purchasePrice", "0");
                                }
                            }}
                        />
                        <label htmlFor="is-gift" className="text-sm font-medium text-brand-900 cursor-pointer select-none">
                            선물 받은 제품인가요? (가격 0원 처리)
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            카테고리 {formData.category && <span className="text-brand-600">✓</span>}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => updateFormData("category", cat)}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                                        formData.category === cat
                                            ? "border-brand-500 bg-brand-500 text-white"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50"
                                    }`}
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
                            <Input 
                                label="모델명" 
                                placeholder="모델명을 입력해주세요"
                                value={formData.modelName}
                                onChange={(e) => updateFormData("modelName", e.target.value)}
                            />
                            <Input 
                                label="브랜드" 
                                placeholder="브랜드를 입력해주세요"
                                value={formData.brand}
                                onChange={(e) => updateFormData("brand", e.target.value)}
                            />

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
                                            onClick={() => updateFormData("condition", item.value)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${formData.condition === item.value
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

                            <Input 
                                label="구매일" 
                                type="date"
                                value={formData.purchaseDate}
                                onChange={(e) => updateFormData("purchaseDate", e.target.value)}
                            />
                            <Input 
                                label="구매처" 
                                placeholder="구매처를 입력해주세요"
                                value={formData.purchasePlace}
                                onChange={(e) => updateFormData("purchasePlace", e.target.value)}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                                <textarea
                                    className="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-brand-500 focus:bg-white focus:ring-brand-500 p-4 min-h-[100px] resize-none transition-colors"
                                    placeholder="제품에 대한 상세한 정보를 기록해보세요."
                                    value={formData.memo}
                                    onChange={(e) => updateFormData("memo", e.target.value)}
                                />
                            </div>
                        </Card>
                    )}
                </div>

                <div className="pt-4">
                    <Button 
                        type="submit" 
                        fullWidth 
                        size="lg" 
                        className="shadow-lg shadow-brand-500/30"
                    >
                        등록 완료
                    </Button>
                </div>
            </form>
        </main>
        </>
    );
}
