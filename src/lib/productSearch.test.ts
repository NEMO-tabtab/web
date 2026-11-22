import { describe, expect, it } from "vitest";

import type { Product } from "@/lib/db";
import {
    EMPTY_QUERY,
    facetOptions,
    hasFacet,
    isNarrowed,
    matchesSearch,
    parseProductQuery,
    productQuerySearch,
    queryProducts,
    toChoseong,
    toJamo,
    type ProductQuery,
} from "./productSearch";

let seq = 0;
const product = (overrides: Partial<Product> = {}): Product => {
    seq += 1;
    return {
        id: `p${seq}`,
        name: "물건",
        price: 0,
        count: 1,
        isGift: false,
        category: "기타",
        status: "GOOD",
        place: "",
        modelName: "",
        brandName: "",
        barcode: "",
        purchaseDate: "",
        purchasePlace: "",
        memo: "",
        createdAt: seq,
        updatedAt: seq,
        deletedAt: null,
        serverId: null,
        ownerId: null,
        ...overrides,
    };
};

const query = (overrides: Partial<ProductQuery> = {}): ProductQuery => ({ ...EMPTY_QUERY, ...overrides });
const names = (products: Product[]) => products.map((item) => item.name);

describe("한글 풀기", () => {
    it("음절을 자모로, 겹받침·겹모음은 낱자로 푼다", () => {
        expect(toJamo("맥북")).toBe("ㅁㅐㄱㅂㅜㄱ");
        expect(toJamo("닭")).toBe("ㄷㅏㄹㄱ");
        expect(toJamo("과")).toBe("ㄱㅗㅏ");
        expect(toJamo("ㄺ")).toBe("ㄹㄱ");
    });

    it("초성만 뽑고 한글이 아닌 글자는 그대로 둔다", () => {
        expect(toChoseong("맥북 Pro 16")).toBe("ㅁㅂ Pro 16");
    });
});

describe("검색", () => {
    const macbook = product({ name: "맥북 프로 16인치", brandName: "Apple", place: "거실 서랍", memo: "회사 지급" });

    it("빈 검색어는 모두 맞는다", () => {
        expect(matchesSearch(macbook, "")).toBe(true);
        expect(matchesSearch(macbook, "   ")).toBe(true);
    });

    it("이름 말고 브랜드·보관 장소·메모에서도 찾는다", () => {
        expect(matchesSearch(macbook, "apple")).toBe(true);
        expect(matchesSearch(macbook, "거실")).toBe(true);
        expect(matchesSearch(macbook, "지급")).toBe(true);
    });

    it("뽑은 곳의 굿즈샵과 시리즈 이름에서도 찾는다", () => {
        const figure = product({
            name: "고양이",
            origin: {
                shopId: "s",
                shopName: "홍대 가챠샵",
                layoutVersion: 1,
                floorId: "f1",
                floorLabel: "1층",
                slotId: "a1",
                machineNumber: 3,
                tier: 0,
                seriesId: "cats",
                seriesName: "졸린 고양이 피규어",
            },
        });
        expect(matchesSearch(figure, "홍대")).toBe(true);
        expect(matchesSearch(figure, "피규어")).toBe(true);
    });

    it("대소문자와 띄어쓰기를 무시한다", () => {
        expect(matchesSearch(macbook, "APPLE")).toBe(true);
        expect(matchesSearch(macbook, "맥북프로")).toBe(true);
        expect(matchesSearch(product({ name: "맥북프로" }), "맥북 프로")).toBe(true);
    });

    it("낱말을 여러 개 적으면 모두 들어간 것만 맞는다", () => {
        expect(matchesSearch(macbook, "맥북 거실")).toBe(true);
        expect(matchesSearch(macbook, "맥북 안방")).toBe(false);
    });

    it("초성으로 찾는다", () => {
        expect(matchesSearch(macbook, "ㅁㅂ")).toBe(true);
        expect(matchesSearch(macbook, "ㄱㅅ")).toBe(true);
        expect(matchesSearch(macbook, "ㅇㅂ")).toBe(false);
    });

    it("한글을 조합하는 중에도 결과가 비지 않는다", () => {
        // "맥북"을 치는 동안 거치는 글자들
        for (const typing of ["ㅁ", "매", "맥", "맥ㅂ", "맥부", "맥북"]) {
            expect(matchesSearch(macbook, typing), typing).toBe(true);
        }
        // 받침이 다음 글자의 첫소리로 넘어가는 중 — "마카"를 치다 "맠"
        expect(matchesSearch(product({ name: "마카롱 키링" }), "맠")).toBe(true);
        // 겹받침을 치는 중 — "닭"을 치다 "달"
        expect(matchesSearch(product({ name: "닭 인형" }), "달")).toBe(true);
    });

    it("조합 중 맞추기는 마지막 낱말에만 쓴다", () => {
        // 앞 낱말 "매"는 다 친 낱말이라 "맥"에 맞지 않는다
        expect(matchesSearch(macbook, "매 거실")).toBe(false);
        expect(matchesSearch(macbook, "거실 매")).toBe(true);
    });

    it("다른 칸의 끝과 처음이 이어져 맞지 않는다", () => {
        // 이름 끝 "프로" + 브랜드 처음 "애플" → "로애"
        const item = product({ name: "프로", brandName: "애플" });
        expect(matchesSearch(item, "로애")).toBe(false);
    });

    it("조합형(NFD)으로 들어온 한글도 찾는다", () => {
        expect(matchesSearch(product({ name: "키링".normalize("NFD") }), "키링")).toBe(true);
    });
});

describe("필터", () => {
    const items = [
        product({ name: "A", category: "피규어", place: "책상" }),
        product({ name: "B", category: "피규어", place: "선반" }),
        product({ name: "C", category: "키링", place: "책상" }),
        product({ name: "D", category: "키링", place: "" }),
        product({ name: "E", category: "피규어", place: " " }),
    ];

    it("카테고리와 보관 장소로 거르고, 빈 값은 미지정으로 고른다", () => {
        expect(names(queryProducts(items, query({ category: "피규어" })))).toEqual(["E", "B", "A"]);
        expect(names(queryProducts(items, query({ category: "피규어", place: "책상" })))).toEqual(["A"]);
        expect(names(queryProducts(items, query({ place: "" })))).toEqual(["E", "D"]);
    });

    it("칩 개수는 다른 필터와 검색어를 적용한 뒤에 센다", () => {
        expect(facetOptions(items, query(), "category")).toEqual([
            { value: "피규어", label: "피규어", count: 3 },
            { value: "키링", label: "키링", count: 2 },
        ]);
        expect(facetOptions(items, query({ place: "책상" }), "category")).toEqual([
            { value: "키링", label: "키링", count: 1 },
            { value: "피규어", label: "피규어", count: 1 },
        ]);
    });

    it("미지정은 맨 뒤에 두고, 고른 값은 0개여도 남긴다", () => {
        const places = facetOptions(items, query(), "place");
        expect(places.at(-1)).toEqual({ value: "", label: "미지정", count: 2 });
        expect(facetOptions(items, query({ q: "A", place: "선반" }), "place")).toContainEqual({
            value: "선반",
            label: "선반",
            count: 0,
        });
    });

    it("값이 한 가지뿐이면 필터를 보일 필요가 없다", () => {
        expect(hasFacet(items, "category")).toBe(true);
        expect(hasFacet([product({ category: "키링" }), product({ category: "키링" })], "category")).toBe(false);
    });
});

describe("정렬", () => {
    const items = [
        product({ name: "나 키링", price: 3000, count: 2, purchaseDate: "2026-01-05" }),
        product({ name: "가 피규어", price: 8000, count: 1, purchaseDate: "" }),
        product({ name: "다 인형", price: 1000, count: 1, purchaseDate: "2026-03-01" }),
        product({ name: "키링 10", price: 0, count: 1, purchaseDate: "2025-12-31" }),
        product({ name: "키링 9", price: 0, count: 1, purchaseDate: "" }),
    ];
    const sorted = (sort: ProductQuery["sort"]) => names(queryProducts(items, query({ sort })));

    it("최근 등록순이 기본이고, 오래된 순은 그 반대다", () => {
        expect(sorted("recent")).toEqual(["키링 9", "키링 10", "다 인형", "가 피규어", "나 키링"]);
        expect(sorted("oldest")).toEqual(["나 키링", "가 피규어", "다 인형", "키링 10", "키링 9"]);
    });

    it("금액은 1개당 가격 × 수량으로 비교하고, 같으면 최근 등록순", () => {
        expect(sorted("valueDesc")).toEqual(["가 피규어", "나 키링", "다 인형", "키링 9", "키링 10"]);
        expect(sorted("valueAsc")).toEqual(["키링 9", "키링 10", "다 인형", "나 키링", "가 피규어"]);
    });

    it("이름순은 가나다 순이고 숫자는 크기대로", () => {
        expect(sorted("name")).toEqual(["가 피규어", "나 키링", "다 인형", "키링 9", "키링 10"]);
    });

    it("구매일 최신순 — 구매일을 모르는 물건은 맨 뒤", () => {
        expect(sorted("purchased")).toEqual(["다 인형", "나 키링", "키링 10", "키링 9", "가 피규어"]);
    });

    it("받은 배열을 바꾸지 않는다", () => {
        const before = names(items);
        queryProducts(items, query({ sort: "name" }));
        expect(names(items)).toEqual(before);
    });
});

describe("주소 쿼리", () => {
    it("기본값이면 쿼리를 붙이지 않는다", () => {
        expect(productQuerySearch(EMPTY_QUERY)).toBe("");
        expect(productQuerySearch(query({ q: "  " }))).toBe("");
    });

    it("쓰고 읽으면 같은 조건이 된다 — 미지정(빈 값)도 남는다", () => {
        const original = query({ q: "맥북 프로", sort: "valueDesc", category: "전자기기", place: "" });
        const search = productQuerySearch(original);
        expect(search).toBe(
            "?q=%EB%A7%A5%EB%B6%81+%ED%94%84%EB%A1%9C&sort=valueDesc&category=%EC%A0%84%EC%9E%90%EA%B8%B0%EA%B8%B0&place=",
        );
        expect(parseProductQuery(new URLSearchParams(search))).toEqual(original);
    });

    it("모르는 정렬 값은 기본값으로 읽는다", () => {
        expect(parseProductQuery(new URLSearchParams("?sort=price")).sort).toBe("recent");
    });

    it("정렬만 바꾼 것은 좁힌 것으로 치지 않는다", () => {
        expect(isNarrowed(query({ sort: "name" }))).toBe(false);
        expect(isNarrowed(query({ q: "맥북" }))).toBe(true);
        expect(isNarrowed(query({ place: "" }))).toBe(true);
    });
});
