import type { Product } from "@/lib/db";
import type { ProductInput } from "@/lib/db/products";

/*
 * 빠른 등록(#199) — 사진만으로 물건을 기록하고 이름은 나중에 채운다.
 *
 * 이름을 적지 않은 물건은 빈 이름이 아니라 정해진 이름("이름 없는 물건")으로 저장한다.
 * 저장소는 빈 이름을 받지 않고(products.ts 의 normalize), 백업 형식과 서버 기록도 이름이 있다고 본다.
 * 빈 이름을 허용하면 그 셋을 모두 바꿔야 해서, 이름으로 구별하는 쪽을 골랐다.
 * 화면과 떼어 둔 순수 함수라 테스트로 확인한다(quickAdd.test.ts).
 */

/** 이름을 적지 않은 물건에 넣는 이름. 이미 저장된 기록이 이 글자로 구별되므로 바꾸지 않는다 */
export const UNNAMED = "이름 없는 물건";

/** 한 번에 등록할 수 있는 사진 수 — 사진은 화면에 올린 동안 메모리에 있다 */
export const QUICK_MAX = 12;

/** 이름을 아직 적지 않은 물건인가 */
export function isUnnamed(product: Pick<Product, "name">): boolean {
    const name = product.name.trim();
    return name === "" || name === UNNAMED;
}

/** 저장할 이름 — 비어 있으면 정해진 이름 */
export function nameOrUnnamed(name: string): string {
    return name.trim() || UNNAMED;
}

/** 입력 칸에 보여 줄 이름 — 정해진 이름은 비워서 바로 적게 한다 */
export function editableName(name: string): string {
    return isUnnamed({ name }) ? "" : name;
}

/** 기기의 날짜로 YYYY-MM-DD. toISOString 은 UTC 라 한국의 자정~오전 9시에 어제가 된다 */
export function localDay(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface QuickDefaults {
    /** 1개당 값(원) */
    price: number;
    purchasePlace: string;
    category: string;
    /** 가장 최근 기록을 오늘 등록했는가 — 그렇다면 같은 자리에서 이어 뽑는 중으로 본다 */
    fromToday: boolean;
}

/** 기록이 하나도 없을 때의 카테고리 */
export const QUICK_CATEGORY = "기타";

/**
 * 가장 최근에 등록한 기록에서 값·구매처·카테고리를 가져온다. 기록이 없으면 null.
 * 선물은 값이 0이라 건너뛴다 — 다음 물건의 값으로 쓸 수 없다.
 */
export function quickDefaults(products: Product[], now: Date): QuickDefaults | null {
    let latest: Product | null = null;
    for (const product of products) {
        if (product.isGift) continue;
        if (!latest || product.createdAt > latest.createdAt) latest = product;
    }
    if (!latest) return null;
    return {
        price: latest.price,
        purchasePlace: latest.purchasePlace,
        category: latest.category || QUICK_CATEGORY,
        fromToday: localDay(new Date(latest.createdAt)) === localDay(now),
    };
}

export interface QuickCommon {
    /** 입력한 그대로의 값 */
    price: string;
    purchasePlace: string;
    category: string;
}

/** 사진마다 적은 이름(비어 있어도 된다)과 함께 넣을 값으로 저장할 기록을 만든다. 사진 한 장이 물건 하나다 */
export function quickInputs(names: string[], common: QuickCommon, today: string): ProductInput[] {
    const price = Number(common.price);
    return names.map((name) => ({
        name: nameOrUnnamed(name),
        price: Number.isFinite(price) && price > 0 ? Math.round(price) : 0,
        count: 1,
        isGift: false,
        category: common.category || QUICK_CATEGORY,
        status: "GOOD",
        place: "",
        modelName: "",
        brandName: "",
        barcode: "",
        purchaseDate: today,
        purchasePlace: common.purchasePlace.trim(),
        memo: "",
        origin: null,
    }));
}
