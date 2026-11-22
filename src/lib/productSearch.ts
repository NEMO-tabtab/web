import type { Product } from "@/lib/db";
import { productValue } from "@/lib/db/products";

/*
 * 내 제품 목록의 검색·정렬·필터.
 * 기록은 기기에만 있으므로(결정 0001) 서버의 검색 API(`POST /api/product/list`)를 부르지 않고 여기서 거른다.
 * 화면과 떼어 둔 순수 함수라 테스트로 확인한다(productSearch.test.ts).
 */

export const SORT_OPTIONS = [
    { value: "recent", label: "최근 등록순" },
    { value: "oldest", label: "오래된 순" },
    { value: "valueDesc", label: "금액 높은 순" },
    { value: "valueAsc", label: "금액 낮은 순" },
    { value: "name", label: "이름순" },
    { value: "purchased", label: "구매일 최신순" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: SortKey = "recent";

/** 필터를 거는 칸 */
export type FacetField = "category" | "place";

export interface ProductQuery {
    /** 입력한 그대로의 검색어 */
    q: string;
    sort: SortKey;
    /** null = 전체, "" = 값을 적지 않은 물건(미지정) */
    category: string | null;
    place: string | null;
}

export const EMPTY_QUERY: ProductQuery = { q: "", sort: DEFAULT_SORT, category: null, place: null };

/** 값이 빈 물건을 묶어 부르는 이름 — 홈의 분포 칩과 같은 말을 쓴다 */
export const UNSET_LABEL = "미지정";

const isSortKey = (value: string | null): value is SortKey => SORT_OPTIONS.some((option) => option.value === value);

/** 주소의 `?q=&sort=&category=&place=` 를 읽는다. 모르는 정렬 값은 기본값으로 */
export function parseProductQuery(params: { get(name: string): string | null }): ProductQuery {
    const sort = params.get("sort");
    return {
        q: params.get("q") ?? "",
        sort: isSortKey(sort) ? sort : DEFAULT_SORT,
        category: params.get("category"),
        place: params.get("place"),
    };
}

/** 주소에 붙일 쿼리. 기본값만 있으면 빈 문자열 */
export function productQuerySearch(query: ProductQuery): string {
    const params = new URLSearchParams();
    if (query.q.trim()) params.set("q", query.q);
    if (query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
    // 빈 값("")도 "미지정만 보기" 라는 뜻이라 남긴다 → `place=`
    if (query.category !== null) params.set("category", query.category);
    if (query.place !== null) params.set("place", query.place);
    const search = params.toString();
    return search ? `?${search}` : "";
}

/** 조건을 건 제품 목록 주소. 홈의 분포 칩처럼 다른 화면에서 목록으로 보낼 때 쓴다 */
export function productQueryHref(patch: Partial<ProductQuery>): string {
    return `/product${productQuerySearch({ ...EMPTY_QUERY, ...patch })}`;
}

/** 검색어나 필터가 걸려 있는가. 정렬은 물건을 빼지 않으므로 치지 않는다 */
export function isNarrowed(query: ProductQuery): boolean {
    return query.q.trim() !== "" || query.category !== null || query.place !== null;
}

/* ------------------------------------------------------------------ *
 * 검색
 * ------------------------------------------------------------------ */

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = [
    "ㅏ",
    "ㅐ",
    "ㅑ",
    "ㅒ",
    "ㅓ",
    "ㅔ",
    "ㅕ",
    "ㅖ",
    "ㅗ",
    "ㅗㅏ",
    "ㅗㅐ",
    "ㅗㅣ",
    "ㅛ",
    "ㅜ",
    "ㅜㅓ",
    "ㅜㅔ",
    "ㅜㅣ",
    "ㅠ",
    "ㅡ",
    "ㅡㅣ",
    "ㅣ",
];
const JONG = [
    "",
    "ㄱ",
    "ㄲ",
    "ㄱㅅ",
    "ㄴ",
    "ㄴㅈ",
    "ㄴㅎ",
    "ㄷ",
    "ㄹ",
    "ㄹㄱ",
    "ㄹㅁ",
    "ㄹㅂ",
    "ㄹㅅ",
    "ㄹㅌ",
    "ㄹㅍ",
    "ㄹㅎ",
    "ㅁ",
    "ㅂ",
    "ㅂㅅ",
    "ㅅ",
    "ㅆ",
    "ㅇ",
    "ㅈ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
];
/** 홀로 입력된 겹자모를 낱자로 — 조합 중인 글자를 음절과 같은 단위로 견주기 위해서다 */
const COMPAT_SPLIT: Record<string, string> = {
    ㄳ: "ㄱㅅ",
    ㄵ: "ㄴㅈ",
    ㄶ: "ㄴㅎ",
    ㄺ: "ㄹㄱ",
    ㄻ: "ㄹㅁ",
    ㄼ: "ㄹㅂ",
    ㄽ: "ㄹㅅ",
    ㄾ: "ㄹㅌ",
    ㄿ: "ㄹㅍ",
    ㅀ: "ㄹㅎ",
    ㅄ: "ㅂㅅ",
    ㅘ: "ㅗㅏ",
    ㅙ: "ㅗㅐ",
    ㅚ: "ㅗㅣ",
    ㅝ: "ㅜㅓ",
    ㅞ: "ㅜㅔ",
    ㅟ: "ㅜㅣ",
    ㅢ: "ㅡㅣ",
};

const SYLLABLE_FIRST = 0xac00;
const SYLLABLE_COUNT = 11172;

const syllableIndex = (char: string) => {
    const index = char.charCodeAt(0) - SYLLABLE_FIRST;
    return index >= 0 && index < SYLLABLE_COUNT ? index : -1;
};

/** "맥북" → "ㅁㅐㄱㅂㅜㄱ". 겹모음·겹받침은 낱자로 푼다 */
export function toJamo(text: string): string {
    let out = "";
    for (const char of text) {
        const index = syllableIndex(char);
        out +=
            index < 0
                ? (COMPAT_SPLIT[char] ?? char)
                : CHO[Math.floor(index / 588)] + JUNG[Math.floor((index % 588) / 28)] + JONG[index % 28];
    }
    return out;
}

/** "맥북 프로" → "ㅁㅂ ㅍㄹ". 한글 음절이 아닌 글자는 그대로 둔다 */
export function toChoseong(text: string): string {
    let out = "";
    for (const char of text) {
        const index = syllableIndex(char);
        out += index < 0 ? char : CHO[Math.floor(index / 588)];
    }
    return out;
}

/**
 * 견주기 전에 글자를 고른다 — 조합형으로 들어온 한글(NFD)을 완성형으로 모으고, 영문 대소문자와 띄어쓰기를 무시한다.
 * NFKC 를 쓰지 않는 이유: 호환 자모("ㄱ")를 첫소리 자모(U+1100)로 바꿔 버려 초성 검색이 깨진다.
 */
export function normalizeText(text: string): string {
    return text.normalize("NFC").toLowerCase().replace(/\s+/g, "");
}

const isChoseongOnly = (token: string) => [...token].every((char) => CHO.includes(char));

/** 칸 사이를 가르는 글자 — 입력할 수 없는 글자라 한 칸의 끝과 다음 칸의 처음이 이어져 맞는 일이 없다 */
const FIELD_GAP = "\u0000";

function searchText(product: Product): string {
    return [
        product.name,
        product.brandName,
        product.modelName,
        product.category,
        product.place,
        product.purchasePlace,
        product.memo,
        product.barcode,
        product.origin?.shopName,
        product.origin?.seriesName,
    ]
        .map((field) => normalizeText(field ?? ""))
        .join(FIELD_GAP);
}

/**
 * 조합 중인 마지막 글자까지 맞춰 본다. 한글 자판은 "맥북"을 치는 동안 "매" → "맥" → "맥ㅂ" → "맥부" 를 거치는데,
 * 글자 그대로 견주면 "매"·"맥ㅂ" 에서 결과가 잠깐 비었다가 돌아온다. 마지막 글자만 자모로 풀어
 * "앞 글자는 그대로, 마지막 글자는 자모가 앞에서부터 맞으면" 맞은 것으로 친다.
 * 마지막 글자 하나에만 쓰는 까닭: 모든 글자를 자모로 견주면 "북"이 "부가"(ㅂㅜㄱㅏ)에도 맞는 식으로 엉뚱한 결과가 늘어난다.
 */
function matchesComposing(text: string, token: string): boolean {
    const chars = [...token];
    const last = chars.pop();
    if (!last) return false;
    const prefix = chars.join("");
    const want = toJamo(last);
    for (let from = 0; from <= text.length; from += 1) {
        const at = text.indexOf(prefix, from);
        if (at < 0) return false;
        // 겹받침이 다음 글자의 첫소리로 넘어가는 경우("맠" → "마카")까지 보려고 두 글자를 본다
        const after = text.slice(at + prefix.length, at + prefix.length + 2);
        if (toJamo(after).startsWith(want)) return true;
        from = at;
    }
    return false;
}

/** 검색어를 낱말로 나눈다. 낱말을 여러 개 적으면 모두 들어간 물건만 남는다 */
function tokenize(q: string): string[] {
    return q.normalize("NFC").toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesTokens(text: string, choseong: string, tokens: string[]): boolean {
    return tokens.every((token, index) => {
        if (text.includes(token)) return true;
        if (isChoseongOnly(token) && choseong.includes(token)) return true;
        // 조합 중일 수 있는 것은 지금 치고 있는 마지막 낱말뿐이다
        return index === tokens.length - 1 && matchesComposing(text, token);
    });
}

/** 검색어에 맞는가. 빈 검색어는 모두 맞는다 */
export function matchesSearch(product: Product, q: string): boolean {
    const tokens = tokenize(q);
    if (tokens.length === 0) return true;
    const text = searchText(product);
    return matchesTokens(text, toChoseong(text), tokens);
}

/* ------------------------------------------------------------------ *
 * 필터
 * ------------------------------------------------------------------ */

const facetValue = (product: Product, field: FacetField) => (product[field] ?? "").trim();

const matchesFacet = (product: Product, field: FacetField, value: string | null) =>
    value === null || facetValue(product, field) === value;

export interface FacetOption {
    /** "" = 미지정 */
    value: string;
    label: string;
    count: number;
}

const collator = new Intl.Collator("ko", { numeric: true, sensitivity: "base" });

/**
 * 필터 칩 목록. 개수는 검색어와 다른 칸의 필터를 적용한 뒤에 센다 — 칩의 숫자가 누르면 남을 개수와 같아야 한다.
 * 지금 고른 값은 0개여도 남겨 둔다(그래야 다시 눌러 풀 수 있다). 많은 순, 미지정은 맨 뒤.
 */
export function facetOptions(products: Product[], query: ProductQuery, field: FacetField): FacetOption[] {
    const other: FacetField = field === "category" ? "place" : "category";
    const counts = new Map<string, number>();
    for (const product of products) {
        if (!matchesFacet(product, other, query[other]) || !matchesSearch(product, query.q)) continue;
        const value = facetValue(product, field);
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const selected = query[field];
    if (selected !== null && !counts.has(selected)) counts.set(selected, 0);

    return [...counts.entries()]
        .map(([value, count]) => ({ value, label: value || UNSET_LABEL, count }))
        .sort((a, b) => {
            if (!a.value !== !b.value) return a.value ? -1 : 1;
            return b.count - a.count || collator.compare(a.label, b.label);
        });
}

/** 이 칸에 서로 다른 값이 두 가지 이상 있는가 — 하나뿐이면 필터가 거를 것이 없다 */
export function hasFacet(products: Product[], field: FacetField): boolean {
    const values = new Set<string>();
    for (const product of products) {
        values.add(facetValue(product, field));
        if (values.size > 1) return true;
    }
    return false;
}

/* ------------------------------------------------------------------ *
 * 정렬
 * ------------------------------------------------------------------ */

const newestFirst = (a: Product, b: Product) => b.createdAt - a.createdAt || a.id.localeCompare(b.id);

const comparators: Record<SortKey, (a: Product, b: Product) => number> = {
    recent: newestFirst,
    oldest: (a, b) => -newestFirst(a, b),
    // 금액은 홈 합계와 같은 "1개당 가격 × 수량"
    valueDesc: (a, b) => productValue(b) - productValue(a) || newestFirst(a, b),
    valueAsc: (a, b) => productValue(a) - productValue(b) || newestFirst(a, b),
    name: (a, b) => collator.compare(a.name, b.name) || newestFirst(a, b),
    // 구매일은 YYYY-MM-DD 라 글자 순서가 곧 날짜 순서다. 모르는 날짜("")는 맨 뒤
    purchased: (a, b) => {
        if (!a.purchaseDate !== !b.purchaseDate) return a.purchaseDate ? -1 : 1;
        return b.purchaseDate.localeCompare(a.purchaseDate) || newestFirst(a, b);
    },
};

/** 검색어·필터로 거른 뒤 정렬한다. 받은 배열은 건드리지 않는다 */
export function queryProducts(products: Product[], query: ProductQuery): Product[] {
    return products
        .filter(
            (product) =>
                matchesFacet(product, "category", query.category) &&
                matchesFacet(product, "place", query.place) &&
                matchesSearch(product, query.q),
        )
        .sort(comparators[query.sort]);
}

/* ------------------------------------------------------------------ *
 * 목록으로 돌아가기
 * ------------------------------------------------------------------ */

/**
 * 마지막으로 본 목록의 쿼리. 물건을 눌러 수정 화면에 갔다가 저장·삭제·뒤로 가기로 돌아올 때 보던 목록을 다시 연다.
 * 앱 안에서 화면을 옮기는 동안만 기억하면 되므로 모듈 변수에 둔다(새로고침하면 처음부터).
 */
let lastListSearch = "";

export function rememberProductList(search: string): void {
    lastListSearch = search;
}

export function productListHref(): string {
    return `/product${lastListSearch}`;
}
