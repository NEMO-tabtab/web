"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Card, Icon, Input, PageHeader, PageShell, Section, Text } from "@/components/common";
import { cn } from "@/lib/cn";
import { useObjectUrl, useProducts } from "@/lib/db/hooks";
import { createProduct, newId } from "@/lib/db/products";
import { compressImage } from "@/lib/image";
import { PullResultCard } from "@/components/product/PullResultCard";
import { productListHref } from "@/lib/productSearch";
import { placeAll, type Placement } from "@/lib/pullResult";
import { QUICK_CATEGORY, QUICK_MAX, localDay, quickDefaults, quickInputs } from "@/lib/quickAdd";
import { canGoBackInApp, hasMoved } from "@/lib/navTrail";
import { mySeries } from "@/lib/series";
import { SeriesField } from "../components/SeriesField";

/** 화면에 올린 사진 한 장 = 물건 하나 */
interface Draft {
    key: string;
    blob: Blob;
    name: string;
}

function Thumbnail({ blob, alt }: { blob: Blob; alt: string }) {
    const url = useObjectUrl(blob);
    if (!url) return null;
    return <Image src={url} alt={alt} fill sizes="72px" className="object-cover" />;
}

const pickButton = cn(
    "sticker sticker-press rounded-nemo bg-cream text-ink",
    "flex flex-1 flex-col items-center justify-center gap-1 py-5",
    "focus-visible:outline-ink focus-visible:outline-3 focus-visible:outline-offset-2",
    "disabled:opacity-50",
);

/**
 * 빠른 등록(#199) — 사진 한 장이 물건 하나. 이름은 나중에 적어도 되고, 값·구매처는 한 번만 적는다.
 * 매장에서 서서 한 손으로 쓰는 화면이라 꼭 적어야 하는 칸을 두지 않는다.
 */
export default function QuickAddPage() {
    const router = useRouter();
    const products = useProducts();
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    // 저장 중 표시는 다시 그려진 뒤에야 버튼을 막는다 — 같은 순간 두 번 눌리는 것은 ref 로 막는다
    const savingRef = useRef(false);

    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [price, setPrice] = useState("");
    const [purchasePlace, setPurchasePlace] = useState("");
    const [seriesName, setSeriesName] = useState("");
    const seriesSuggestions = useMemo(() => mySeries(products ?? []), [products]);
    const hasSeries = seriesName.trim() !== "";
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    /** 이 화면을 연 뒤로 기록한 수와, 그중 이름을 안 적은 수 */
    const [saved, setSaved] = useState({ count: 0, unnamed: 0 });
    /** 방금 등록한 묶음의 반응(#202). seq 가 바뀌면 카드를 새로 그려 움직임을 다시 튼다 */
    const [result, setResult] = useState<{ seq: number; placements: Placement[]; hasUnnamed: boolean } | null>(null);

    // 등록할 때마다 목록이 바뀌어도 "지난번 값"은 화면을 열었을 때의 것으로 둔다 — 방금 넣은 값이 되돌아와 덮지 않게
    const [defaults, setDefaults] = useState<ReturnType<typeof quickDefaults>>(null);
    const defaultsRead = useRef(false);
    useEffect(() => {
        if (!products || defaultsRead.current) return;
        defaultsRead.current = true;
        const found = quickDefaults(products, new Date());
        setDefaults(found);
        // 오늘 이미 등록했다면 같은 자리에서 이어 뽑는 중으로 보고 미리 채운다
        if (found?.fromToday) {
            setPrice(found.price ? String(found.price) : "");
            setPurchasePlace(found.purchasePlace);
        }
    }, [products]);

    // 기록하기 버튼은 화면 아래에 있다 — 저장하면 맨 위의 결과가 보이도록 올려 준다
    const resultRef = useRef<HTMLDivElement>(null);
    const resultSeq = result?.seq;
    useEffect(() => {
        if (resultSeq === undefined) return;
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        resultRef.current?.scrollIntoView({ block: "start", behavior: calm ? "auto" : "smooth" });
    }, [resultSeq]);

    // + 버튼은 홈·제품·지도·분석 어디서든 뜬다 — 들어온 화면으로 돌아가고, 주소를 바로 열었으면 제품 목록으로 간다(#250)
    const handleBack = () => {
        const navigation = (window as { navigation?: { canGoBack?: boolean } }).navigation;
        if (canGoBackInApp(navigation, hasMoved())) router.back();
        else router.replace(productListHref());
    };

    const room = QUICK_MAX - drafts.length;
    const canOfferLast = useMemo(
        () =>
            defaults !== null &&
            !defaults.fromToday &&
            (defaults.price > 0 || defaults.purchasePlace !== "") &&
            price === "" &&
            purchasePlace === "",
        [defaults, price, purchasePlace],
    );

    const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []).slice(0, room);
        // 같은 사진을 다시 고를 수 있게 비운다
        event.target.value = "";
        if (files.length === 0) return;
        setError(null);
        // 휴대폰 원본 사진은 수 MB 라 줄여서 저장한다
        const blobs = await Promise.all(files.map(compressImage));
        setDrafts((prev) => [...prev, ...blobs.map((blob) => ({ key: newId(), blob, name: "" }))].slice(0, QUICK_MAX));
    };

    const handleSave = async () => {
        if (savingRef.current || drafts.length === 0) return;
        savingRef.current = true;
        setIsSaving(true);
        setError(null);

        const batch = drafts;
        const inputs = quickInputs(
            batch.map((draft) => draft.name),
            { price, purchasePlace, category: defaults?.category ?? QUICK_CATEGORY, seriesName },
            localDay(new Date()),
        );

        // 저장하기 전의 기록 — 방금 넣은 것이 새 종류인지 가를 기준이다
        const before = products ?? [];
        let done = 0;
        let unnamed = 0;
        try {
            // 하나씩 저장한다 — 중간에 실패해도 앞의 것은 남고, 남은 사진은 화면에 그대로 둔다
            for (const [index, input] of inputs.entries()) {
                await createProduct(input, [batch[index].blob]);
                done += 1;
                // 시리즈를 골랐으면 이름을 안 적어도 시리즈 이름으로 저장된다
                if (!batch[index].name.trim() && !hasSeries) unnamed += 1;
            }
        } catch {
            // 무엇을 적었는지는 로그에 남기지 않는다(R4). 화면에서 알리고 남은 사진은 다시 시도할 수 있게 둔다
            setError(`${batch.length - done}개를 기록하지 못했어요. 저장 공간을 확인하고 다시 눌러 주세요.`);
        }

        const savedKeys = new Set(batch.slice(0, done).map((draft) => draft.key));
        setDrafts((prev) => prev.filter((draft) => !savedKeys.has(draft.key)));
        setSaved((prev) => ({ count: prev.count + done, unnamed: prev.unnamed + unnamed }));
        if (done > 0) {
            setResult((prev) => ({
                seq: (prev?.seq ?? 0) + 1,
                placements: placeAll(before, inputs.slice(0, done)),
                hasUnnamed: unnamed > 0,
            }));
        }
        savingRef.current = false;
        setIsSaving(false);
    };

    return (
        <PageShell className="space-y-6">
            <PageHeader
                title="빠른 등록"
                description="사진만 찍어 두고, 이름은 나중에 적어도 돼요."
                onBack={handleBack}
            />

            {result && (
                <div ref={resultRef} className="scroll-mt-4">
                    <PullResultCard
                        key={result.seq}
                        placements={result.placements}
                        totalCount={saved.count}
                        hasUnnamed={result.hasUnnamed}
                    />
                </div>
            )}

            <Section title="사진" description={`사진 한 장이 물건 하나예요. 한 번에 ${QUICK_MAX}장까지.`}>
                {/* 카메라는 찍을 때마다 한 장씩, 앨범은 여러 장을 한꺼번에 */}
                <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFiles}
                    className="hidden"
                />
                <input
                    ref={galleryRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFiles}
                    className="hidden"
                />
                <div className="flex gap-3">
                    <button
                        type="button"
                        className={pickButton}
                        disabled={room <= 0}
                        onClick={() => cameraRef.current?.click()}
                    >
                        <Icon name="camera" className="text-2xl" />
                        <span className="text-[13px] font-bold">사진 찍기</span>
                    </button>
                    <button
                        type="button"
                        className={pickButton}
                        disabled={room <= 0}
                        onClick={() => galleryRef.current?.click()}
                    >
                        <Icon name="image" className="text-2xl" />
                        <span className="text-[13px] font-bold">앨범에서 고르기</span>
                    </button>
                    {/* 사진이 없거나 바코드·메모까지 적고 싶을 때의 길 — 자세한 등록으로 간다(#250) */}
                    <Link href="/product/add" className={pickButton}>
                        <Icon name="pencil" className="text-2xl" />
                        <span className="text-[13px] font-bold">직접 적기</span>
                    </Link>
                </div>

                {drafts.length > 0 && (
                    <ul className="mt-4 space-y-3">
                        {drafts.map((draft, index) => (
                            <li key={draft.key} className="flex items-center gap-3">
                                <div className="sticker checker rounded-nemo relative h-[72px] w-[72px] shrink-0 overflow-hidden">
                                    <Thumbnail blob={draft.blob} alt={`물건 ${index + 1} 사진`} />
                                </div>
                                <Input
                                    aria-label={hasSeries ? `물건 ${index + 1} 종류` : `물건 ${index + 1} 이름`}
                                    placeholder={hasSeries ? "종류 (몰라도 돼요)" : "이름 (나중에 적어도 돼요)"}
                                    value={draft.name}
                                    onChange={(event) =>
                                        setDrafts((prev) =>
                                            prev.map((each) =>
                                                each.key === draft.key ? { ...each, name: event.target.value } : each,
                                            ),
                                        )
                                    }
                                />
                                <Button
                                    variant="ghost"
                                    shape="circle"
                                    size="sm"
                                    aria-label={`물건 ${index + 1} 빼기`}
                                    leftIcon={<Icon name="close" className="text-lg" />}
                                    onClick={() => setDrafts((prev) => prev.filter((each) => each.key !== draft.key))}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </Section>

            <Card padding="sm" className="space-y-4">
                <Text size="sm" tone="muted">
                    아래 값은 이번에 등록하는 모든 물건에 똑같이 들어가요. 구매일은 오늘이에요.
                </Text>
                <SeriesField seriesName={seriesName} onSeriesChange={setSeriesName} suggestions={seriesSuggestions} />
                <div className="grid grid-cols-2 gap-3">
                    {/* 금액은 손글씨를 쓰지 않는다 — Gaegu 는 숫자 글리프가 불규칙하다 */}
                    <Input
                        label="1개 값"
                        placeholder="0"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className="font-sans tabular-nums"
                        icon={<span className="text-ink-soft font-bold">₩</span>}
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                    />
                    <Input
                        label="구매처"
                        placeholder="예: 홍대 가챠샵"
                        value={purchasePlace}
                        onChange={(event) => setPurchasePlace(event.target.value)}
                    />
                </div>
                {canOfferLast && defaults && (
                    <Button
                        variant="secondary"
                        shape="pill"
                        size="sm"
                        onClick={() => {
                            setPrice(defaults.price ? String(defaults.price) : "");
                            setPurchasePlace(defaults.purchasePlace);
                        }}
                    >
                        지난번 값 넣기
                        {defaults.price > 0 && (
                            <span className="font-sans tabular-nums"> · ₩{defaults.price.toLocaleString("ko-KR")}</span>
                        )}
                        {defaults.purchasePlace && <span> · {defaults.purchasePlace}</span>}
                    </Button>
                )}
            </Card>

            {error && (
                <Text size="sm" tone="danger" weight="bold" role="alert">
                    {error}
                </Text>
            )}

            {/* 화면당 먹 채움 버튼은 하나 — 기록하기가 그 자리를 가져간다 */}
            <div className="space-y-2 pt-2">
                <Button
                    fullWidth
                    size="lg"
                    isLoading={isSaving}
                    disabled={drafts.length === 0}
                    className="font-display text-lg"
                    onClick={handleSave}
                >
                    {drafts.length > 0 ? `${drafts.length}개 기록하기` : "사진을 먼저 넣어 주세요"}
                </Button>
            </div>
        </PageShell>
    );
}
