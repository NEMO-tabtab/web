"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
import { Modal } from "@/components/common/Modal";
import { cn } from "@/lib/cn";
import type { Product, ProductImage, ProductStatus } from "@/lib/db";
import { useObjectUrl } from "@/lib/db/hooks";
import {
    MAX_IMAGES,
    createProduct,
    deleteProduct,
    newId,
    updateProduct,
    type ProductInput,
} from "@/lib/db/products";
import { compressImage } from "@/lib/image";

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
] as const satisfies readonly { value: ProductStatus; label: string }[];

/** 입력 중인 값. 숫자 칸은 입력 그대로(문자열) 두고 저장할 때 숫자로 바꾼다. */
interface FormState {
    name: string;
    price: string;
    count: string;
    isGift: boolean;
    category: string;
    status: ProductStatus;
    place: string;
    modelName: string;
    brandName: string;
    barcode: string;
    purchaseDate: string;
    purchasePlace: string;
    memo: string;
}

/** 화면에 올린 사진 한 장. 이미 저장된 사진이면 storedId 가 있다. */
interface PhotoDraft {
    key: string;
    blob: Blob;
    storedId?: string;
}

const EMPTY_FORM: FormState = {
    name: "",
    price: "",
    count: "1",
    isGift: false,
    category: "전자기기",
    status: "GOOD",
    place: "",
    modelName: "",
    brandName: "",
    barcode: "",
    purchaseDate: "",
    purchasePlace: "",
    memo: "",
};

const fromProduct = (product: Product): FormState => ({
    name: product.name,
    price: product.price ? String(product.price) : "",
    count: String(product.count),
    isGift: product.isGift,
    category: product.category,
    status: product.status,
    place: product.place,
    modelName: product.modelName,
    brandName: product.brandName,
    barcode: product.barcode,
    purchaseDate: product.purchaseDate,
    purchasePlace: product.purchasePlace,
    memo: product.memo,
});

const toInput = (form: FormState): ProductInput => ({
    ...form,
    price: Number(form.price) || 0,
    count: Number(form.count) || 1,
});

/** 상세 정보 칸에 무엇이든 적혀 있으면 처음부터 펼쳐 둔다 */
const hasDetails = (form: FormState) =>
    Boolean(
        form.modelName ||
            form.brandName ||
            form.place ||
            form.barcode ||
            form.purchaseDate ||
            form.purchasePlace ||
            form.memo,
    );

type ProductFormProps =
    | { mode: "add"; initialBarcode?: string }
    | { mode: "edit"; product: Product; images: ProductImage[] };

/** 칩 묶음 라벨 — Input/Textarea 의 라벨과 같은 결로 맞춘다. 필드 라벨은 한 가지 모양만 쓴다. */
const groupLabel = "mb-2 block text-[13px] font-bold text-ink";

/** 사진 한 장의 미리보기. Blob 을 URL 로 바꾸고 화면에서 빠질 때 해제한다. */
function PhotoPreview({ blob, alt }: { blob: Blob; alt: string }) {
    const url = useObjectUrl(blob);
    if (!url) return null;
    return <Image src={url} alt={alt} fill sizes="33vw" className="object-cover" />;
}

export default function ProductForm(props: ProductFormProps) {
    const { mode } = props;
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<FormState>(() =>
        props.mode === "edit" ? fromProduct(props.product) : { ...EMPTY_FORM, barcode: props.initialBarcode ?? "" },
    );
    const [photos, setPhotos] = useState<PhotoDraft[]>(() =>
        props.mode === "edit"
            ? props.images.map((image) => ({ key: image.id, blob: image.blob, storedId: image.id }))
            : [],
    );
    const [showMoreInfo, setShowMoreInfo] = useState(() => hasDetails(formData));
    const [isSaving, setIsSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const canAddMoreImages = photos.length < MAX_IMAGES;

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const filesToAdd = Array.from(files).slice(0, MAX_IMAGES - photos.length);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        // 휴대폰 원본 사진은 수 MB 라 줄여서 저장한다
        const blobs = await Promise.all(filesToAdd.map(compressImage));
        setPhotos((prev) => [...prev, ...blobs.map((blob) => ({ key: newId(), blob }))].slice(0, MAX_IMAGES));
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageRemove = (key: string) => {
        setPhotos((prev) => prev.filter((photo) => photo.key !== key));
    };

    const updateFormData = <K extends keyof FormState>(field: K, value: FormState[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);

        try {
            const input = toInput(formData);

            if (props.mode === "add") {
                await createProduct(
                    input,
                    photos.map((photo) => photo.blob),
                );
            } else {
                const keptIds = new Set(photos.map((photo) => photo.storedId).filter(Boolean));
                await updateProduct(props.product.id, input, {
                    removeIds: props.images.map((image) => image.id).filter((id) => !keptIds.has(id)),
                    add: photos.filter((photo) => !photo.storedId).map((photo) => photo.blob),
                });
            }

            router.push("/product");
        } catch (error) {
            console.error(`${mode === "add" ? "등록" : "수정"} 실패:`, error);
            alert(`제품 ${mode === "add" ? "등록" : "수정"}에 실패했습니다.`);
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (props.mode !== "edit") return;
        // 먼저 목록으로 떠난다 — 지우고 나서 떠나면 이 화면이 잠깐 "찾을 수 없어요" 로 바뀐다
        router.replace("/product");
        try {
            await deleteProduct(props.product.id);
        } catch (error) {
            console.error("삭제 실패:", error);
            alert("제품 삭제에 실패했습니다.");
        }
    };

    const pageTitle = mode === "add" ? "제품 등록" : "제품 수정";
    const pageDescription =
        mode === "add" ? "소중한 물건을 등록하고 가치를 기록해보세요." : "제품 정보를 수정하고 최신 상태를 유지하세요.";
    const submitButtonText = mode === "add" ? "등록 완료" : "수정 완료";

    // 비어 있는 자리 표시 칸 — "몇 장까지 붙일 수 있는지"를 숫자 대신 자리로 보여준다
    const emptySlotCount = MAX_IMAGES - photos.length - (canAddMoreImages ? 1 : 0);

    return (
        <PageShell className="space-y-6">
            {/* 내비가 숨는 몰입 화면이라 빠져나갈 길을 헤더가 책임진다.
                설치형 PWA(display: fullscreen)에는 주소창도 뒤로가기도 없다. */}
            <PageHeader title={pageTitle} description={pageDescription} backHref="/product" />

            {/* 이미지 업로드 섹션 — 폼 바깥에 둔다. 저장은 photos 상태로 직접 넘긴다. */}
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
                    {photos.map((photo, index) => (
                        // .checker 는 투명 PNG 를 올렸을 때 뚫린 자리를 드러낸다
                        <div
                            key={photo.key}
                            className="sticker checker rounded-nemo relative aspect-square overflow-hidden"
                        >
                            <PhotoPreview blob={photo.blob} alt={`제품 사진 ${index + 1}`} />
                            {/* 인쇄 질감 — absolute 라서 부모가 relative 여야 한다 */}
                            <span aria-hidden="true" className="print-grain" />
                            <button
                                type="button"
                                onClick={() => handleImageRemove(photo.key)}
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
                        value={formData.name}
                        onChange={(e) => updateFormData("name", e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        {/* 금액·수량은 손글씨를 쓰지 않는다 — Gaegu 는 숫자 글리프가 불규칙하다 */}
                        <Input
                            label="구매 가격"
                            placeholder="0"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            className="font-sans tabular-nums"
                            icon={<span className="text-ink-soft font-bold">₩</span>}
                            value={formData.price}
                            onChange={(e) => updateFormData("price", e.target.value)}
                            disabled={formData.isGift}
                        />
                        <Input
                            label="수량"
                            placeholder="1"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            className="font-sans tabular-nums"
                            value={formData.count}
                            onChange={(e) => updateFormData("count", e.target.value)}
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
                                updateFormData("price", "0");
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
                                    selected={formData.category === cat}
                                    onClick={() => updateFormData("category", cat)}
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
                                label="보관 장소"
                                placeholder="예: 거실 서랍"
                                value={formData.place}
                                onChange={(e) => updateFormData("place", e.target.value)}
                            />
                            <Input
                                label="모델명"
                                placeholder="모델명을 입력해주세요"
                                value={formData.modelName}
                                onChange={(e) => updateFormData("modelName", e.target.value)}
                            />
                            <Input
                                label="브랜드"
                                placeholder="브랜드를 입력해주세요"
                                value={formData.brandName}
                                onChange={(e) => updateFormData("brandName", e.target.value)}
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
                                className="font-sans tabular-nums"
                                value={formData.purchaseDate}
                                onChange={(e) => updateFormData("purchaseDate", e.target.value)}
                            />
                            <Input
                                label="구매처"
                                placeholder="구매처를 입력해주세요"
                                value={formData.purchasePlace}
                                onChange={(e) => updateFormData("purchasePlace", e.target.value)}
                            />
                            {/* 바코드는 숫자열이라 손글씨를 피한다 */}
                            <Input
                                label="바코드"
                                placeholder="바코드 스캔으로 채워져요"
                                inputMode="numeric"
                                className="font-sans tabular-nums"
                                value={formData.barcode}
                                onChange={(e) => updateFormData("barcode", e.target.value)}
                            />

                            <Textarea
                                id="product-memo"
                                label="메모"
                                placeholder="제품에 대한 상세한 정보를 기록해보세요."
                                value={formData.memo}
                                onChange={(e) => updateFormData("memo", e.target.value)}
                            />
                        </Card>
                    )}
                </div>

                {/* 화면당 먹 채움 버튼은 하나 — 제출이 그 자리를 가져간다 */}
                <div className="space-y-2 pt-2">
                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        isLoading={isSaving}
                        className="font-display text-lg"
                    >
                        {submitButtonText}
                    </Button>
                    {mode === "edit" && (
                        <Button
                            type="button"
                            variant="ghost"
                            fullWidth
                            className="text-danger hover:text-danger"
                            onClick={() => setConfirmDelete(true)}
                        >
                            이 물건 삭제
                        </Button>
                    )}
                </div>
            </form>

            <Modal
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                title="이 물건을 삭제할까요?"
                footer={
                    <>
                        <Button variant="secondary" shape="pill" onClick={() => setConfirmDelete(false)}>
                            취소
                        </Button>
                        <Button variant="danger" shape="pill" onClick={handleDelete}>
                            삭제
                        </Button>
                    </>
                }
            >
                <p className="text-ink-soft text-sm">사진도 함께 지워지고 되돌릴 수 없어요.</p>
            </Modal>
        </PageShell>
    );
}
