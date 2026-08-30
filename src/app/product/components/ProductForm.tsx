"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import axios from "axios";

import {
    Button,
    Card,
    Checkbox,
    Chip,
    Heading,
    Input,
    PageHeader,
    PageShell,
    Section,
    Textarea,
} from "@/components/common";
import { cn } from "@/lib/cn";

const MAX_IMAGES = 3;

const CATEGORIES = ["전자기기", "가구", "의류", "도서", "기타"];

/**
 * 제품 상태는 이모지 없이 낱말만 쓴다 — 손그림 시스템의 색은 먹 하나뿐이라
 * 컬러 이모지가 들어오면 볼터치(유일한 포인트 컬러)의 자리를 빼앗는다.
 * 나쁨 → 미개봉 순서 자체가 이미 등급을 말해준다.
 */
const STATUS_OPTIONS = [
    { value: "BAD", label: "나쁨" },
    { value: "POOR", label: "보통" },
    { value: "GOOD", label: "좋음" },
    { value: "EXCELLENT", label: "아주 좋음" },
    { value: "NEW", label: "미개봉" },
] as const;

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

/** 칩 묶음 라벨 — Input/Textarea 의 라벨과 같은 결로 맞춘다. 필드 라벨은 한 가지 모양만 쓴다. */
const groupLabel = "mb-2 block text-[13px] font-bold text-ink";

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

    // 비어 있는 자리 표시 칸 — "몇 장까지 붙일 수 있는지"를 숫자 대신 자리로 보여준다
    const emptySlotCount = MAX_IMAGES - images.length - (canAddMoreImages ? 1 : 0);

    return (
        <PageShell className="space-y-6">
            {/* 내비가 숨는 몰입 화면이라 빠져나갈 길을 헤더가 책임진다.
                설치형 PWA(display: fullscreen)에는 주소창도 뒤로가기도 없다. */}
            <PageHeader title={pageTitle} description={pageDescription} backHref="/product" />

            {/* 이미지 업로드 섹션 — 폼 바깥에 둔다. 전송은 imageFiles 상태로 직접 조립한다. */}
            <Section title="제품 사진" description={`최대 ${MAX_IMAGES}장까지 등록 가능합니다.`}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                />
                <div className="grid grid-cols-3 gap-3">
                    {canAddMoreImages && (
                        <button
                            type="button"
                            onClick={handleImageClick}
                            className={cn(
                                "sticker sticker-press rounded-nemo bg-cream text-ink",
                                "flex aspect-square flex-col items-center justify-center gap-1",
                                "focus-visible:outline-ink focus-visible:outline-3 focus-visible:outline-offset-2",
                            )}
                        >
                            <i className="xi-camera text-2xl" aria-hidden="true" />
                            <span className="text-[12px] font-bold">사진 추가</span>
                        </button>
                    )}
                    {images.map((image, index) => (
                        // .checker 는 투명 PNG 를 올렸을 때 뚫린 자리를 드러낸다
                        <div
                            key={index}
                            className="sticker checker rounded-nemo relative aspect-square overflow-hidden"
                        >
                            <Image
                                src={image}
                                alt={`제품 사진 ${index + 1}`}
                                fill
                                sizes="33vw"
                                className="object-cover"
                            />
                            {/* 인쇄 질감 — absolute 라서 부모가 relative 여야 한다 */}
                            <span aria-hidden="true" className="print-grain" />
                            <button
                                type="button"
                                onClick={() => handleImageRemove(index)}
                                aria-label={`제품 사진 ${index + 1} 삭제`}
                                className={cn(
                                    "sticker sticker-press bg-paper text-danger",
                                    "absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full",
                                    "focus-visible:outline-ink focus-visible:outline-3 focus-visible:outline-offset-2",
                                )}
                            >
                                <i className="xi-close text-sm" aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                    {Array.from({ length: emptySlotCount }).map((_, index) => (
                        // 아직 안 채운 자리는 강조 위계 3~4단계 — 옅은 헤어라인 + cream 면
                        <div
                            key={`empty-${index}`}
                            className="border-line bg-cream text-ink-soft rounded-nemo flex aspect-square items-center justify-center border"
                        >
                            <i className="xi-image text-2xl" aria-hidden="true" />
                        </div>
                    ))}
                </div>
            </Section>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* 제품 정보 */}
                <Card padding="sm" className="space-y-5">
                    <Heading level={3} as="h2">
                        기본 정보
                    </Heading>

                    <Input
                        label="제품명"
                        placeholder="예: 맥북 프로 16인치"
                        required
                        value={formData.productNm}
                        onChange={(e) => updateFormData("productNm", e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        {/* 금액·수량은 손글씨를 쓰지 않는다 — Gaegu 는 숫자 글리프가 불규칙하다 */}
                        <Input
                            label="구매 가격"
                            placeholder="0"
                            type="number"
                            className="font-sans tabular-nums"
                            icon={<span className="text-ink-soft font-bold">₩</span>}
                            value={formData.productPrice}
                            onChange={(e) => updateFormData("productPrice", e.target.value)}
                            disabled={formData.isGift}
                        />
                        <Input
                            label="수량"
                            placeholder="1"
                            type="number"
                            className="font-sans tabular-nums"
                            value={formData.productCnt}
                            onChange={(e) => updateFormData("productCnt", e.target.value)}
                        />
                    </div>

                    <Checkbox
                        id="is-gift"
                        boxed
                        label="선물 받은 제품인가요? (가격 0원 처리)"
                        checked={formData.isGift}
                        onChange={(e) => {
                            updateFormData("isGift", e.target.checked);
                            if (e.target.checked) {
                                updateFormData("productPrice", "0");
                            }
                        }}
                    />

                    <div role="group" aria-labelledby="product-category-label">
                        <p id="product-category-label" className={groupLabel}>
                            카테고리
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <Chip
                                    key={cat}
                                    selected={formData.selCategory === cat}
                                    onClick={() => updateFormData("selCategory", cat)}
                                >
                                    {cat}
                                </Chip>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* 추가 정보 토글 */}
                <div className="space-y-5">
                    <div className="flex justify-center">
                        <Button
                            type="button"
                            variant="secondary"
                            shape="pill"
                            size="sm"
                            aria-expanded={showMoreInfo}
                            onClick={() => setShowMoreInfo(!showMoreInfo)}
                            rightIcon={
                                <i
                                    aria-hidden="true"
                                    className={cn(
                                        "xi-angle-down transition-transform duration-200",
                                        showMoreInfo && "rotate-180",
                                    )}
                                />
                            }
                        >
                            {showMoreInfo ? "상세 정보 접기" : "상세 정보 입력하기"}
                        </Button>
                    </div>

                    {showMoreInfo && (
                        <Card padding="sm" className="space-y-5">
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

                            <div role="group" aria-labelledby="product-status-label">
                                <p id="product-status-label" className={groupLabel}>
                                    제품 상태
                                </p>
                                {/* 선택 상태는 색이 아니라 먹 채움으로 — Chip 이 알아서 뒤집는다 */}
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTIONS.map((item) => (
                                        <Chip
                                            key={item.value}
                                            selected={formData.status === item.value}
                                            onClick={() => updateFormData("status", item.value)}
                                        >
                                            {item.label}
                                        </Chip>
                                    ))}
                                </div>
                            </div>

                            <Input
                                label="구매일"
                                type="date"
                                required={true}
                                className="font-sans tabular-nums"
                                value={formData.prchDate}
                                onChange={(e) => updateFormData("prchDate", e.target.value)}
                            />
                            <Input
                                label="구매처"
                                placeholder="구매처를 입력해주세요"
                                value={formData.prchPlace}
                                onChange={(e) => updateFormData("prchPlace", e.target.value)}
                            />

                            <Textarea
                                id="product-memo"
                                label="메모"
                                placeholder="제품에 대한 상세한 정보를 기록해보세요."
                                value={formData.content}
                                onChange={(e) => updateFormData("content", e.target.value)}
                            />
                        </Card>
                    )}
                </div>

                {/* 화면당 먹 채움 버튼은 하나 — 제출이 그 자리를 가져간다 */}
                <div className="pt-2">
                    <Button type="submit" fullWidth size="lg" className="font-display text-lg">
                        {submitButtonText}
                    </Button>
                </div>
            </form>
        </PageShell>
    );
}
