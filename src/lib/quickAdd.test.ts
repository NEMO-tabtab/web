import { describe, expect, it } from "vitest";

import type { Product } from "@/lib/db";
import { EMPTY_QUERY, isNarrowed, parseProductQuery, productQuerySearch, queryProducts } from "./productSearch";
import {
    QUICK_CATEGORY,
    UNNAMED,
    editableName,
    isUnnamed,
    localDay,
    nameOrUnnamed,
    quickDefaults,
    quickInputs,
} from "./quickAdd";

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

describe("이름 없는 물건", () => {
    it("빈 이름과 정해진 이름을 이름 없는 물건으로 본다", () => {
        expect(isUnnamed({ name: UNNAMED })).toBe(true);
        expect(isUnnamed({ name: "  " })).toBe(true);
        expect(isUnnamed({ name: "치이카와 마스코트" })).toBe(false);
    });

    it("저장할 때는 빈 이름을 정해진 이름으로, 고칠 때는 정해진 이름을 빈 칸으로", () => {
        expect(nameOrUnnamed("  ")).toBe(UNNAMED);
        expect(nameOrUnnamed(" 하치와레 ")).toBe("하치와레");
        expect(editableName(UNNAMED)).toBe("");
        expect(editableName("하치와레")).toBe("하치와레");
    });
});

describe("localDay", () => {
    it("기기의 날짜를 YYYY-MM-DD 로 적는다(UTC 가 아니다)", () => {
        expect(localDay(new Date(2026, 10, 4, 0, 30))).toBe("2026-11-04");
        expect(localDay(new Date(2026, 0, 31, 23, 59))).toBe("2026-01-31");
    });
});

describe("quickDefaults", () => {
    const now = new Date(2026, 10, 24, 15, 0);
    const today = new Date(2026, 10, 24, 11, 0).getTime();
    const yesterday = new Date(2026, 10, 23, 20, 0).getTime();

    it("기록이 없으면 null", () => {
        expect(quickDefaults([], now)).toBeNull();
    });

    it("가장 최근에 등록한 기록의 값·구매처·카테고리를 가져온다", () => {
        const found = quickDefaults(
            [
                product({ price: 3000, purchasePlace: "옛 가게", createdAt: yesterday }),
                product({ price: 5000, purchasePlace: "새 가게", category: "가챠", createdAt: today }),
            ],
            now,
        );
        expect(found).toEqual({ price: 5000, purchasePlace: "새 가게", category: "가챠", fromToday: true });
    });

    it("가장 최근 기록이 오늘 것이 아니면 fromToday 가 false", () => {
        expect(quickDefaults([product({ price: 3000, createdAt: yesterday })], now)?.fromToday).toBe(false);
    });

    it("선물은 건너뛴다", () => {
        const found = quickDefaults(
            [product({ price: 4000, createdAt: yesterday }), product({ isGift: true, price: 0, createdAt: today })],
            now,
        );
        expect(found?.price).toBe(4000);
        expect(found?.fromToday).toBe(false);
    });

    it("카테고리가 비어 있으면 기타", () => {
        expect(quickDefaults([product({ category: "", createdAt: today })], now)?.category).toBe(QUICK_CATEGORY);
    });
});

describe("quickInputs", () => {
    it("사진 한 장마다 기록 하나 — 이름이 비면 정해진 이름, 값·구매처·구매일은 모두 같다", () => {
        const inputs = quickInputs(
            ["", " 우사기 "],
            { price: "5000", purchasePlace: " 홍대 ", category: "가챠" },
            "2026-11-24",
        );
        expect(inputs).toHaveLength(2);
        expect(inputs.map((input) => input.name)).toEqual([UNNAMED, "우사기"]);
        for (const input of inputs) {
            expect(input).toMatchObject({
                price: 5000,
                count: 1,
                isGift: false,
                category: "가챠",
                purchaseDate: "2026-11-24",
                purchasePlace: "홍대",
                origin: null,
            });
        }
    });

    it("시리즈를 골랐으면 적은 이름은 종류가 되고, 안 적은 물건의 이름은 시리즈 이름이 된다", () => {
        const inputs = quickInputs(
            ["하치와레", ""],
            { price: "", purchasePlace: "", category: "", seriesName: " 치이카와 마스코트 " },
            "2026-11-24",
        );
        expect(inputs[0]).toMatchObject({
            name: "하치와레",
            catalog: { seriesId: null, seriesName: "치이카와 마스코트", variantId: null, variantName: "하치와레" },
        });
        expect(inputs[1]).toMatchObject({
            name: "치이카와 마스코트",
            catalog: { seriesId: null, seriesName: "치이카와 마스코트", variantId: null, variantName: null },
        });
    });

    it("시리즈를 고르지 않았으면 시리즈·종류 없이 저장한다", () => {
        const [input] = quickInputs(["하치와레"], { price: "", purchasePlace: "", category: "" }, "2026-11-24");
        expect(input.catalog).toBeNull();
    });

    it("값을 적지 않았거나 숫자가 아니면 0원", () => {
        const common = { purchasePlace: "", category: "" };
        expect(quickInputs([""], { ...common, price: "" }, "2026-11-24")[0].price).toBe(0);
        expect(quickInputs([""], { ...common, price: "-3" }, "2026-11-24")[0].price).toBe(0);
        expect(quickInputs([""], { ...common, price: "abc" }, "2026-11-24")[0].category).toBe(QUICK_CATEGORY);
    });
});

describe("목록에서 이름을 안 적은 물건만 보기", () => {
    const products = [product({ name: UNNAMED }), product({ name: "하치와레" }), product({ name: UNNAMED })];

    it("unnamed 를 켜면 이름을 안 적은 물건만 남는다", () => {
        expect(queryProducts(products, { ...EMPTY_QUERY, unnamed: true })).toHaveLength(2);
        expect(queryProducts(products, EMPTY_QUERY)).toHaveLength(3);
    });

    it("주소에 unnamed=1 로 적고 읽는다", () => {
        const search = productQuerySearch({ ...EMPTY_QUERY, unnamed: true });
        expect(search).toBe("?unnamed=1");
        expect(parseProductQuery(new URLSearchParams(search)).unnamed).toBe(true);
        expect(parseProductQuery(new URLSearchParams("")).unnamed).toBe(false);
    });

    it("series 로 한 시리즈의 물건만 남기고, 주소에 적고 읽는다", () => {
        const catalog = { seriesId: null, seriesName: "치이카와", variantId: null, variantName: null };
        const list = [product({ catalog }), product({ catalog: null }), product()];
        const query = { ...EMPTY_QUERY, series: "name:치이카와", view: "series" as const };
        expect(queryProducts(list, query)).toHaveLength(1);
        const search = productQuerySearch(query);
        expect(parseProductQuery(new URLSearchParams(search))).toMatchObject({ series: "name:치이카와", view: "series" });
        expect(isNarrowed(query)).toBe(true);
        // 보기 방식만 바꾼 것은 좁힌 것이 아니다
        expect(isNarrowed({ ...EMPTY_QUERY, view: "series" })).toBe(false);
    });

    it("unnamed 는 목록을 좁히는 조건이다", () => {
        expect(isNarrowed({ ...EMPTY_QUERY, unnamed: true })).toBe(true);
    });
});
