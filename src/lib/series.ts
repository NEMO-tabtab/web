import type { Product, ProductCatalog } from "@/lib/db";

/*
 * 내 시리즈(#201) — 기록에 적힌 시리즈를 모아 다시 고르게 한다.
 * 시리즈 표를 따로 두지 않는다. 기록이 곧 원본이라, 기록을 지우면 시리즈도 목록에서 빠진다.
 * 화면과 떼어 둔 순수 함수라 테스트로 확인한다(series.test.ts).
 */

/** 이름을 견줄 때 쓰는 모양 — 조합형 한글을 모으고 영문 대소문자와 띄어쓰기를 무시한다 */
const fold = (text: string) => text.normalize("NFC").toLowerCase().replace(/\s+/g, "");

/**
 * 같은 시리즈인지 가르는 열쇠. 카탈로그에서 고른 시리즈는 id 로, 사용자가 적은 시리즈는 이름으로 묶는다.
 * 앞머리(id:/name:)를 붙여, 이름이 우연히 어떤 id 와 같아도 섞이지 않게 한다.
 */
export function seriesKey(catalog: Pick<ProductCatalog, "seriesId" | "seriesName">): string {
    return catalog.seriesId ? `id:${catalog.seriesId}` : `name:${fold(catalog.seriesName)}`;
}

/** 같은 종류인지 가르는 열쇠. 종류를 모르면 null */
export function variantKey(catalog: Pick<ProductCatalog, "variantId" | "variantName">): string | null {
    if (catalog.variantId) return `id:${catalog.variantId}`;
    return catalog.variantName ? `name:${fold(catalog.variantName)}` : null;
}

export interface MySeries {
    key: string;
    seriesId: string | null;
    /** 가장 최근 기록에 적힌 이름 */
    name: string;
    /** 이 시리즈로 적은 종류 이름들. 최근에 적은 것부터 */
    variants: string[];
    /** 가장 최근에 이 시리즈로 등록한 때 */
    lastAt: number;
}

/** 기록에 적힌 시리즈를 최근에 쓴 것부터 모은다 */
export function mySeries(products: Product[]): MySeries[] {
    const found = new Map<string, MySeries & { seen: Set<string> }>();
    const newestFirst = [...products].sort((a, b) => b.createdAt - a.createdAt);

    for (const product of newestFirst) {
        const catalog = product.catalog;
        if (!catalog) continue;
        const key = seriesKey(catalog);
        let entry = found.get(key);
        if (!entry) {
            entry = {
                key,
                seriesId: catalog.seriesId,
                name: catalog.seriesName,
                variants: [],
                lastAt: product.createdAt,
                seen: new Set(),
            };
            found.set(key, entry);
        }
        const variant = variantKey(catalog);
        if (variant && catalog.variantName && !entry.seen.has(variant)) {
            entry.seen.add(variant);
            entry.variants.push(catalog.variantName);
        }
    }

    return [...found.values()].map(({ key, seriesId, name, variants, lastAt }) => ({
        key,
        seriesId,
        name,
        variants,
        lastAt,
    }));
}

/**
 * 입력 칸의 시리즈·종류 이름으로 기록에 넣을 값을 만든다. 시리즈 이름이 비면 null(고르지 않음).
 * `known` 은 고치기 전의 값이나 굿즈샵 기기에서 고른 값 — 이름이 그대로면 그 id 를 잇는다.
 * 이름을 고쳐 적었으면 다른 시리즈·종류일 수 있으므로 id 를 버린다.
 */
export function toCatalog(
    seriesName: string,
    variantName: string,
    known: ProductCatalog | null = null,
): ProductCatalog | null {
    const series = seriesName.trim();
    if (!series) return null;
    const variant = variantName.trim() || null;
    const sameSeries = known !== null && fold(known.seriesName) === fold(series);
    const sameVariant =
        sameSeries && variant !== null && known.variantName !== null && fold(known.variantName) === fold(variant);
    return {
        seriesId: sameSeries ? known.seriesId : null,
        seriesName: series,
        variantId: sameVariant ? known.variantId : null,
        variantName: variant,
    };
}

export interface SeriesShelf {
    key: string;
    name: string;
    /** 이 시리즈의 물건 수(수량을 더한 값) */
    total: number;
    /** 모은 종류. 많이 가진 것부터, 같으면 이름순 */
    variants: { name: string; count: number }[];
    /** 종류를 적지 않은 물건 수 */
    unknown: number;
    lastAt: number;
    /** 대표 사진을 가져올 기록 — 가장 최근에 등록한 것 */
    coverProductId: string;
}

const collator = new Intl.Collator("ko", { numeric: true, sensitivity: "base" });

/**
 * 시리즈별로 무엇을 얼마나 모았는지(#201, 도감의 첫 단계). 최근에 등록한 시리즈부터.
 * 전체 종류 수("6종 중 4종")는 카탈로그가 있어야 알 수 있어 여기서는 세지 않는다.
 */
export function collectSeries(products: Product[]): SeriesShelf[] {
    const shelves = new Map<string, SeriesShelf & { counts: Map<string, { name: string; count: number }> }>();

    for (const product of [...products].sort((a, b) => b.createdAt - a.createdAt)) {
        const catalog = product.catalog;
        if (!catalog) continue;
        const key = seriesKey(catalog);
        let shelf = shelves.get(key);
        if (!shelf) {
            shelf = {
                key,
                name: catalog.seriesName,
                total: 0,
                variants: [],
                unknown: 0,
                lastAt: product.createdAt,
                coverProductId: product.id,
                counts: new Map(),
            };
            shelves.set(key, shelf);
        }
        shelf.total += product.count;
        const variant = variantKey(catalog);
        if (!variant || !catalog.variantName) {
            shelf.unknown += product.count;
            continue;
        }
        const entry = shelf.counts.get(variant) ?? { name: catalog.variantName, count: 0 };
        entry.count += product.count;
        shelf.counts.set(variant, entry);
    }

    return [...shelves.values()].map(({ counts, ...shelf }) => ({
        ...shelf,
        variants: [...counts.values()].sort((a, b) => b.count - a.count || collator.compare(a.name, b.name)),
    }));
}

/** 이 시리즈의 기록인가 — 목록을 시리즈로 좁힐 때 쓴다 */
export function inSeries(product: Pick<Product, "catalog">, key: string): boolean {
    return Boolean(product.catalog) && seriesKey(product.catalog!) === key;
}
