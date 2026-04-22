"use client";

import { useState, useRef } from "react";
import axios from "axios";

import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Heading, Text } from "@/components/common/Typography";
import { Input } from "@/components/common/Input";
import Image from "next/image";

const MAX_IMAGES = 3;

const CATEGORIES = ["전자기기", "가구", "의류", "도서", "기타"];

const FIELDS_TO_SEND = [
    "productIdx",
    "spaceIdx",
    "userIdx",
    "productNm",
    "isGift",
    "productPrice",
    "productValue",
    "productCnt",
    "status",
    "serialNo",
    "modelNm",
    "brandNm",
    "barcode",
    "prchPlace",
    "content",
    "information",
    "selCategory",
    "selTag",
    "carrotYn",
    "prchDate",
    "regDate",
    "updDate",
    "delDate",
] as const satisfies readonly (keyof ProductFormData)[];

export interface ProductFormData {
    productIdx: number;
    spaceIdx: number;
    userIdx: number;
    productNm: string;
    isGift: boolean;
    productPrice: number;
    productValue: number;
    productCnt: number;
    status: string;
    serialNo: string;
    modelNm: string;
    brandNm: string;
    barcode: string;
    prchPlace: string;
    content: string;
    information: string;
    selCategory: string;
    selTag: string;
    carrotYn: string;
    prchDate: string;
    regDate: string;
    updDate: string | null;
    delDate: string | null;
}

interface ProductFormProps {
    mode: "add" | "edit";
    productId?: string;
    initialData?: ProductFormData | null;
    initialImages?: string[];
}

const DEFAULT_FORM_DATA: ProductFormData = {
    productIdx: 1,
    spaceIdx: 1,
    userIdx: 1,
    productNm: "",
    isGift: false,
    productPrice: 0,
    productValue: 0,
    productCnt: 1,
    status: "GOOD",
    serialNo: "",
    modelNm: "",
    brandNm: "",
    barcode: "",
    prchPlace: "",
    content: "",
    information: "",
    selCategory: "전자기기",
    selTag: "123",
    carrotYn: "N",
    prchDate: "",
    regDate: "",
    updDate: null,
    delDate: null,
};

export default function ProductForm({ mode, productId, initialData, initialImages = [] }: ProductFormProps) {
    const [images, setImages] = useState<string[]>(initialImages); // 미리보기용 Data URL
    const [imageFiles, setImageFiles] = useState<File[]>([]); // 서버 전송용 File 객체
    const [showMoreInfo, setShowMoreInfo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<ProductFormData>(initialData || DEFAULT_FORM_DATA);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remainingSlots = MAX_IMAGES - images.length;
        const filesToAdd = Array.from(files).slice(0, remainingSlots);

        // 미리보기용 Data URL 생성
        filesToAdd.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

        // 서버 전송용 File 객체 저장
        setImageFiles((prev) => [...prev, ...filesToAdd]);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageRemove = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const canAddMoreImages = images.length < MAX_IMAGES;

    const updateFormData = (field: keyof ProductFormData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const buildSubmitData = (): Partial<ProductFormData> => {
        const submitData: Partial<ProductFormData> = {};
        FIELDS_TO_SEND.forEach((key) => {
            const value = formData[key];
            if (value !== null && value !== undefined) {
                (submitData as Record<keyof ProductFormData, unknown>)[key] = value;
            }
        });
        return submitData;
    };

    const buildMultipartForm = (data: Partial<ProductFormData>): FormData => {
        const multipartForm = new FormData();
        multipartForm.append("dto", new Blob([JSON.stringify(data)], { type: "application/json" }));
        imageFiles.forEach((file) => multipartForm.append("files", file));
        return multipartForm;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const submitData = buildSubmitData();

            if (mode === "edit" && productId) {
                submitData.productIdx = Number(productId);
            }

            const multipartForm = buildMultipartForm(submitData);
            const headers = { "Content-Type": "multipart/form-data" };

            const PRODUCT_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/product`;

            const response =
                mode === "add"
                    ? await axios.post(PRODUCT_API_URL, multipartForm, { headers })
                    : await axios.put(PRODUCT_API_URL, multipartForm, { headers });

            if (response.status === 200) {
                alert(mode === "add" ? "제품이 등록되었습니다!" : "제품이 수정되었습니다!");
                window.location.reload();
            }
        } catch (error) {
            console.error(`${mode === "add" ? "등록" : "수정"} 실패:`, error);
            alert(`제품 ${mode === "add" ? "등록" : "수정"}에 실패했습니다.`);
        }
    };

    const pageTitle = mode === "add" ? "제품 등록" : "제품 수정";
    const pageDescription =
        mode === "add" ? "소중한 물건을 등록하고 가치를 기록해보세요." : "제품 정보를 수정하고 최신 상태를 유지하세요.";
    const submitButtonText = mode === "add" ? "등록 완료" : "수정 완료";

    return (
        <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 pb-32">
            <header className="space-y-2">
                <Heading level={2}>{pageTitle}</Heading>
                <Text color="text-gray-500">{pageDescription}</Text>
            </header>

            {/* 이미지 업로드 섹션 */}
            <section>
                <Text weight="medium" className="mb-3">
                    제품 사진
                </Text>
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
                            className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-500 transition-colors hover:bg-brand-100"
                        >
                            <i className="xi-camera mb-1 text-2xl"></i>
                            <span className="text-xs font-medium">사진 추가</span>
                        </button>
                    )}
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-200"
                        >
                            <Image src={image} alt={`제품 사진 ${index + 1}`} fill className="object-cover" />
                            <button
                                type="button"
                                onClick={() => handleImageRemove(index)}
                                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                            >
                                <i className="xi-close text-sm"></i>
                            </button>
                        </div>
                    ))}
                    {Array.from({ length: MAX_IMAGES - images.length - (canAddMoreImages ? 1 : 0) }).map((_, index) => (
                        <div
                            key={`empty-${index}`}
                            className="flex aspect-square items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-gray-300"
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
                        value={formData.productNm}
                        onChange={(e) => updateFormData("productNm", e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="구매 가격"
                            placeholder="0"
                            type="number"
                            icon={<span className="font-bold text-gray-500">₩</span>}
                            value={formData.productPrice}
                            onChange={(e) => updateFormData("productPrice", e.target.value)}
                            disabled={formData.isGift}
                        />
                        <Input
                            label="수량"
                            placeholder="1"
                            type="number"
                            value={formData.productCnt}
                            onChange={(e) => updateFormData("productCnt", e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 p-3">
                        <input
                            id="is-gift"
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                            checked={formData.isGift}
                            onChange={(e) => {
                                updateFormData("isGift", e.target.checked);
                                if (e.target.checked) {
                                    updateFormData("productPrice", "0");
                                }
                            }}
                        />
                        <label
                            htmlFor="is-gift"
                            className="cursor-pointer select-none text-sm font-medium text-brand-900"
                        >
                            선물 받은 제품인가요? (가격 0원 처리)
                        </label>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            카테고리 {formData.selCategory && <span className="text-brand-600">✓</span>}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => updateFormData("selCategory", cat)}
                                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                                        formData.selCategory === cat
                                            ? "border-brand-500 bg-brand-500 text-white"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600"
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
                        className="flex items-center gap-2 font-medium text-brand-600 transition-colors hover:text-brand-700"
                    >
                        <span>상세 정보 입력하기</span>
                        <i
                            className={`xi-angle-down transition-transform duration-200 ${showMoreInfo ? "rotate-180" : ""}`}
                        ></i>
                    </button>

                    {showMoreInfo && (
                        <Card className="animate-fade-in space-y-6">
                            <Input
                                label="모델명"
                                placeholder="모델명을 입력해주세요"
                                value={formData.modelNm}
                                onChange={(e) => updateFormData("modelNm", e.target.value)}
                            />
                            <Input
                                label="브랜드"
                                placeholder="브랜드를 입력해주세요"
                                value={formData.brandNm}
                                onChange={(e) => updateFormData("brandNm", e.target.value)}
                            />

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">제품 상태</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[
                                        { value: "BAD", label: "나쁨", icon: "😫" },
                                        { value: "POOR", label: "보통", icon: "😐" },
                                        { value: "GOOD", label: "좋음", icon: "🙂" },
                                        { value: "EXCELLENT", label: "아주 좋음", icon: "😀" },
                                        { value: "NEW", label: "미개봉", icon: "✨" },
                                    ].map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => updateFormData("status", item.value)}
                                            className={`flex flex-col items-center justify-center rounded-xl border p-2 transition-all ${
                                                formData.status === item.value
                                                    ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
                                                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            <span className="mb-1 text-2xl">{item.icon}</span>
                                            <span className="text-xs font-medium">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Input
                                label="구매일"
                                type="date"
                                required={true}
                                value={formData.prchDate}
                                onChange={(e) => updateFormData("prchDate", e.target.value)}
                            />
                            <Input
                                label="구매처"
                                placeholder="구매처를 입력해주세요"
                                value={formData.prchPlace}
                                onChange={(e) => updateFormData("prchPlace", e.target.value)}
                            />

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">메모</label>
                                <textarea
                                    className="block min-h-[100px] w-full resize-none rounded-xl border-gray-200 bg-gray-50 p-4 text-gray-900 transition-colors focus:border-brand-500 focus:bg-white focus:ring-brand-500"
                                    placeholder="제품에 대한 상세한 정보를 기록해보세요."
                                    value={formData.content}
                                    onChange={(e) => updateFormData("content", e.target.value)}
                                />
                            </div>
                        </Card>
                    )}
                </div>

                <div className="pt-4">
                    <Button type="submit" fullWidth size="lg" className="shadow-lg shadow-brand-500/30">
                        {submitButtonText}
                    </Button>
                </div>
            </form>
        </main>
    );
}
