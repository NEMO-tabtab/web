"use client";

import { Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Badge, Button, Chip, EmptyState, Input, PageHeader, PageShell } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import { StoredProductCard } from "@/components/product/StoredProductCard";
import type { Product } from "@/lib/db";
import { useProducts } from "@/lib/db/hooks";
import {
    EMPTY_QUERY,
    SORT_OPTIONS,
    facetOptions,
    hasFacet,
    isNarrowed,
    parseProductQuery,
    productQuerySearch,
    queryProducts,
    rememberProductList,
    type FacetField,
    type FacetOption,
    type ProductQuery,
} from "@/lib/productSearch";
import Loading from "./loading";

export default function ProductPage() {
    // useSearchParams 는 정적 생성 화면에서 Suspense 경계가 있어야 한다
    return (
        <Suspense fallback={<Loading />}>
            <ProductList />
        </Suspense>
    );
}

/**
 * 목록 조건(검색어·정렬·필터)을 이 화면의 상태로 두고 주소(`?q=&sort=…`)에 따라 적는다.
 *
 * 상태가 기준인 이유: 주소를 기준으로 두고 글자마다 되읽으면, 주소 반영이 늦게 도착할 때 옛 값이
 * 한글 조합 중인 입력을 덮는다. 대신 밖에서 주소가 바뀐 경우(검색한 채로 하단 탭 "제품"을 누름 등)는
 * 우리가 적은 값과 구별해 따라간다 — 같은 화면이라 다시 마운트되지 않아 상태가 그대로 남기 때문이다.
 */
function useListQuery() {
    const searchParams = useSearchParams();
    const [query, setQuery] = useState<ProductQuery>(() => parseProductQuery(searchParams));
    /** 주소에 적었지만 아직 useSearchParams 로 돌아오지 않은 쿼리. 적은 순서대로 */
    const pending = useRef<string[]>([]);

    // 상태 → 주소
    useEffect(() => {
        const search = productQuerySearch(query);
        rememberProductList(search);
        if (window.location.search === search) return;
        pending.current.push(search);
        // router.replace 는 화면 데이터를 다시 받으러 가고, push 는 뒤로 가기 기록을 글자마다 쌓는다.
        // history 를 직접 고치면 둘 다 없이 주소만 바뀐다(Next 가 useSearchParams 에 반영한다)
        window.history.replaceState(null, "", `/product${search}`);
    }, [query]);

    // 주소 → 상태
    useEffect(() => {
        const raw = searchParams.toString();
        const search = raw ? `?${raw}` : "";
        const index = pending.current.indexOf(search);
        if (index >= 0) {
            // 우리가 적은 값이 돌아왔다. 이것과 그보다 먼저 적은 값은 이제 기다리지 않는다
            pending.current.splice(0, index + 1);
            return;
        }
        pending.current = [];
        setQuery((prev) => (productQuerySearch(prev) === search ? prev : parseProductQuery(searchParams)));
    }, [searchParams]);

    return [query, setQuery] as const;
}

function ProductList() {
    const products = useProducts();
    const [query, setQuery] = useListQuery();

    // 기기 저장소를 여는 짧은 순간 — 목록과 같은 자리의 스켈레톤을 보여준다
    if (products === undefined) return <Loading />;

    return (
        <>
            <PageShell width="wide" className="space-y-4">
                {/* 제목은 손글씨 + 낙서 밑줄, 개수는 본문 서체 + 고정폭 숫자 */}
                <PageHeader
                    title="내 제품"
                    action={
                        <span className="font-sans text-[13px] font-bold tabular-nums text-ink-soft">
                            {products.length}개
                        </span>
                    }
                />

                {products.length > 0 ? (
                    <ProductBrowser products={products} query={query} setQuery={setQuery} />
                ) : (
                    <EmptyState
                        title="아직 등록한 제품이 없어요"
                        description="첫 물건을 네모에게 보여주세요!"
                        action={
                            <Link
                                href="/product/add"
                                className="sticker sticker-press rounded-full bg-ink px-5 py-2.5 font-display text-paper"
                            >
                                + 제품 등록하기
                            </Link>
                        }
                    />
                )}
            </PageShell>
        </>
    );
}

interface ProductBrowserProps {
    products: Product[];
    query: ProductQuery;
    setQuery: React.Dispatch<React.SetStateAction<ProductQuery>>;
}

/** 검색 칸, 필터 칩, 정렬, 결과 목록 */
function ProductBrowser({ products, query, setQuery }: ProductBrowserProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [sortOpen, setSortOpen] = useState(false);

    // 카드가 많으면 글자마다 목록을 다시 그리느라 입력이 버벅인다 — 입력 칸은 바로, 목록은 한 박자 늦게 따라간다
    const shown = useDeferredValue(query);
    const results = useMemo(() => queryProducts(products, shown), [products, shown]);
    const categories = useMemo(() => facetOptions(products, shown, "category"), [products, shown]);
    const places = useMemo(() => facetOptions(products, shown, "place"), [products, shown]);

    const update = (patch: Partial<ProductQuery>) => setQuery((prev) => ({ ...prev, ...patch }));
    // 정렬은 물건을 빼지 않으므로 그대로 둔다
    const clearConditions = () => setQuery((prev) => ({ ...EMPTY_QUERY, sort: prev.sort }));

    const narrowed = isNarrowed(query);
    const sortLabel = SORT_OPTIONS.find((option) => option.value === query.sort)?.label;
    const searched = shown.q.trim();

    return (
        <>
            <form
                role="search"
                onSubmit={(event) => {
                    // 결과는 칠 때마다 바뀐다 — 엔터는 휴대폰 자판만 내린다
                    event.preventDefault();
                    inputRef.current?.blur();
                }}
            >
                <Input
                    ref={inputRef}
                    type="search"
                    aria-label="내 제품에서 찾기"
                    placeholder="이름, 브랜드, 보관 장소로 찾기"
                    enterKeyHint="search"
                    autoComplete="off"
                    value={query.q}
                    onChange={(event) => update({ q: event.target.value })}
                    icon={<i className="xi-search text-lg" aria-hidden="true" />}
                    trailing={
                        query.q && (
                            <Button
                                type="button"
                                variant="ghost"
                                shape="circle"
                                size="sm"
                                aria-label="검색어 지우기"
                                leftIcon={<i className="xi-close-circle text-lg" aria-hidden="true" />}
                                onClick={() => {
                                    update({ q: "" });
                                    inputRef.current?.focus();
                                }}
                            />
                        )
                    }
                />
            </form>

            {hasFacet(products, "category") && (
                <FacetRow
                    label="카테고리"
                    field="category"
                    options={categories}
                    value={query.category}
                    onSelect={(category) => update({ category })}
                />
            )}
            {hasFacet(products, "place") && (
                <FacetRow
                    label="보관 장소"
                    field="place"
                    options={places}
                    value={query.place}
                    onSelect={(place) => update({ place })}
                />
            )}

            <div className="flex min-h-8 items-center justify-between gap-3">
                {/* 결과 개수가 바뀌면 화면 읽기 프로그램이 읽어 준다 */}
                <p role="status" className="font-sans text-[13px] font-bold tabular-nums text-ink-soft">
                    {narrowed ? `${products.length}개 중 ${results.length}개` : ""}
                </p>
                <div className="flex items-center gap-1">
                    {narrowed && results.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearConditions}>
                            조건 지우기
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        aria-haspopup="dialog"
                        onClick={() => setSortOpen(true)}
                        rightIcon={<i className="xi-angle-down-min" aria-hidden="true" />}
                    >
                        <span className="sr-only">정렬: </span>
                        {sortLabel}
                    </Button>
                </div>
            </div>

            {results.length > 0 ? (
                /* 스크랩북처럼 카드가 조금씩 다른 각도로 붙는다 — 회전은 .paste-grid 가 맡는다 */
                <div className="paste-grid grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(9.75rem,1fr))]">
                    {results.map((product) => (
                        <StoredProductCard
                            key={product.id}
                            product={product}
                            showMemo
                            badge={
                                <Badge variant="success" size="sm">
                                    보유 중
                                </Badge>
                            }
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="맞는 물건이 없어요"
                    description={
                        searched
                            ? `'${searched}'(으)로 찾은 물건이 없어요. 다른 낱말로 찾거나 조건을 지워 보세요.`
                            : "고른 조건에 맞는 물건이 없어요. 조건을 지워 보세요."
                    }
                    action={
                        <Button variant="secondary" shape="pill" onClick={clearConditions}>
                            조건 지우기
                        </Button>
                    }
                />
            )}

            {/* 라디오 대신 버튼 목록 — 라디오는 화살표 키로 옮기는 순간 값이 바뀌어, 고르자마자 닫으면 키보드로 고를 수 없다 */}
            <Modal open={sortOpen} onClose={() => setSortOpen(false)} title="정렬">
                <ul className="space-y-1">
                    {SORT_OPTIONS.map((option) => {
                        const selected = option.value === query.sort;
                        return (
                            <li key={option.value}>
                                <Button
                                    variant={selected ? "secondary" : "ghost"}
                                    fullWidth
                                    aria-pressed={selected}
                                    className="justify-between"
                                    rightIcon={selected ? <i className="xi-check" aria-hidden="true" /> : undefined}
                                    onClick={() => {
                                        update({ sort: option.value });
                                        setSortOpen(false);
                                    }}
                                >
                                    {option.label}
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            </Modal>
        </>
    );
}

interface FacetRowProps {
    label: string;
    field: FacetField;
    options: FacetOption[];
    value: string | null;
    onSelect: (value: string | null) => void;
}

/** 필터 칩 한 줄. 좁은 화면에서는 옆으로 밀고, 넓은 화면에서는 줄을 바꿔 다 보여 준다 */
function FacetRow({ label, field, options, value, onSelect }: FacetRowProps) {
    return (
        <div role="group" aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:overflow-visible">
            <div className="flex w-max items-center gap-2 py-1 sm:w-auto sm:flex-wrap">
                <span aria-hidden="true" className="mr-1 shrink-0 text-xs font-bold text-ink-soft">
                    {label}
                </span>
                <Chip selected={value === null} onClick={() => onSelect(null)}>
                    전체
                </Chip>
                {options.map((option) => (
                    <Chip
                        key={`${field}:${option.value}`}
                        selected={value === option.value}
                        // 고른 칩을 다시 누르면 푼다
                        onClick={() => onSelect(value === option.value ? null : option.value)}
                    >
                        {option.label}
                        <span className="font-sans tabular-nums opacity-70">{option.count}</span>
                    </Chip>
                ))}
            </div>
        </div>
    );
}
