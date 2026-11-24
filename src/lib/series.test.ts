import { describe, expect, it } from "vitest";

import type { Product, ProductCatalog } from "@/lib/db";
import { collectSeries, inSeries, mySeries, seriesKey, toCatalog, variantKey } from "./series";

let seq = 0;
const product = (catalog: ProductCatalog | null, overrides: Partial<Product> = {}): Product => {
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
        catalog,
        ...overrides,
    };
};

const mine = (seriesName: string, variantName: string | null = null): ProductCatalog => ({
    seriesId: null,
    seriesName,
    variantId: null,
    variantName,
});

describe("seriesKey / variantKey", () => {
    it("사용자가 적은 시리즈는 이름으로 묶는다 — 띄어쓰기와 영문 대소문자는 무시한다", () => {
        expect(seriesKey(mine("치이카와 마스코트"))).toBe(seriesKey(mine("치이카와마스코트")));
        expect(seriesKey(mine("Sanrio Mix"))).toBe(seriesKey(mine("sanrio mix")));
        expect(seriesKey(mine("치이카와"))).not.toBe(seriesKey(mine("치이카와 2탄")));
    });

    it("카탈로그에서 고른 시리즈는 id 로 묶고, 이름이 같은 내 시리즈와 섞이지 않는다", () => {
        const fromCatalog = { seriesId: "chiikawa", seriesName: "치이카와" };
        expect(seriesKey(fromCatalog)).toBe(seriesKey({ seriesId: "chiikawa", seriesName: "이름이 바뀜" }));
        expect(seriesKey(fromCatalog)).not.toBe(seriesKey(mine("chiikawa")));
    });

    it("종류를 모르면 열쇠가 없다", () => {
        expect(variantKey(mine("치이카와"))).toBeNull();
        expect(variantKey(mine("치이카와", "하치와레"))).toBe(variantKey(mine("치이카와", " 하치 와레".trim())));
    });
});

describe("mySeries", () => {
    it("시리즈가 없는 기록은 건너뛰고, 최근에 쓴 시리즈부터 모은다", () => {
        const found = mySeries([
            product(mine("산리오"), { createdAt: 10 }),
            product(null, { createdAt: 40 }),
            product(mine("치이카와"), { createdAt: 30 }),
            product(mine("산리오"), { createdAt: 20 }),
        ]);
        expect(found.map((each) => each.name)).toEqual(["치이카와", "산리오"]);
        expect(found[1].lastAt).toBe(20);
    });

    it("종류 이름은 겹치지 않게, 최근에 적은 것부터 모은다", () => {
        const [series] = mySeries([
            product(mine("치이카와", "하치와레"), { createdAt: 1 }),
            product(mine("치이카와", "우사기"), { createdAt: 2 }),
            product(mine("치이카와", "하치와레"), { createdAt: 3 }),
            product(mine("치이카와"), { createdAt: 4 }),
        ]);
        expect(series.variants).toEqual(["하치와레", "우사기"]);
    });

    it("기록에 catalog 칸이 아예 없어도(옛 기록) 멈추지 않는다", () => {
        const old = product(null);
        delete old.catalog;
        expect(mySeries([old])).toEqual([]);
    });
});

describe("toCatalog", () => {
    it("시리즈 이름이 비면 null", () => {
        expect(toCatalog("  ", "하치와레")).toBeNull();
    });

    it("이름의 앞뒤 공백을 떼고, 종류가 비면 모르는 것으로", () => {
        expect(toCatalog(" 치이카와 ", " ")).toEqual(mine("치이카와"));
        expect(toCatalog("치이카와", " 하치와레 ")).toEqual(mine("치이카와", "하치와레"));
    });

    it("이름이 그대로면 알던 id 를 잇고, 고쳐 적으면 버린다", () => {
        const known = { seriesId: "s1", seriesName: "치이카와", variantId: "v1", variantName: "하치와레" };
        expect(toCatalog("치이카와", "하치와레", known)).toEqual(known);
        expect(toCatalog("치이카와", "우사기", known)).toEqual({ ...known, variantId: null, variantName: "우사기" });
        expect(toCatalog("산리오", "하치와레", known)).toEqual(mine("산리오", "하치와레"));
    });
});

describe("collectSeries", () => {
    it("시리즈마다 모은 종류와 개수를 센다 — 수량을 더하고, 종류를 안 적은 것은 따로 센다", () => {
        const shelves = collectSeries([
            product(mine("치이카와", "하치와레"), { createdAt: 1 }),
            product(mine("치이카와", "하치와레"), { createdAt: 2, count: 2 }),
            product(mine("치이카와", "우사기"), { createdAt: 3 }),
            product(mine("치이카와"), { createdAt: 4, id: "newest" }),
            product(mine("산리오", "시나모롤"), { createdAt: 5 }),
            product(null, { createdAt: 6 }),
        ]);
        expect(shelves.map((shelf) => shelf.name)).toEqual(["산리오", "치이카와"]);
        const chiikawa = shelves[1];
        expect(chiikawa).toMatchObject({ total: 5, unknown: 1, coverProductId: "newest", lastAt: 4 });
        expect(chiikawa.variants).toEqual([
            { name: "하치와레", count: 3 },
            { name: "우사기", count: 1 },
        ]);
    });

    it("inSeries 는 그 시리즈의 기록만 고른다", () => {
        const key = seriesKey(mine("치이카와"));
        expect(inSeries(product(mine("치이 카와", "우사기")), key)).toBe(true);
        expect(inSeries(product(mine("산리오")), key)).toBe(false);
        expect(inSeries(product(null), key)).toBe(false);
    });
});
