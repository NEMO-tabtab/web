import Dexie, { type EntityTable } from "dexie";

/** 제품 상태 — 나쁨 → 미개봉 순서 자체가 등급이다 */
export type ProductStatus = "BAD" | "POOR" | "GOOD" | "EXCELLENT" | "NEW";

/**
 * 물건을 뽑은 곳 — 굿즈샵의 어느 가챠 기기, 몇째 단인지.
 * 굿즈샵 데이터(public/shops)는 나중에 바뀌거나 빠질 수 있어서, 고른 순간의 이름과 번호를 함께 적어 둔다.
 * 그래야 굿즈샵 데이터가 달라져도 "어디서 뽑았는지"는 그대로 읽힌다.
 */
export interface ProductOrigin {
    shopId: string;
    shopName: string;
    /** 고를 때 본 매장 구조의 버전 */
    layoutVersion: number;
    floorId: string;
    /** "1층" */
    floorLabel: string;
    slotId: string;
    /** 층 안에서 매긴 기기 번호(내부 지도에 적힌 번호) */
    machineNumber: number;
    /** 아래부터 0 */
    tier: number;
    /** 고를 때 그 단에 들어 있던 시리즈. 비어 있었거나 몰랐으면 null */
    seriesId: string | null;
    seriesName: string | null;
}

/**
 * 기기에 저장되는 물건 한 건.
 *
 * 로그인 전에는 이 기기가 유일한 원본이다. 나중에 서버와 동기화할 수 있도록
 * id 는 기기에서 만든 UUID 를 쓰고(서버 번호에 기대지 않는다), 삭제는 deletedAt 만 찍는다.
 * 서버 DTO 와의 필드 이름 변환은 동기화 계층 한 곳에서 맡는다.
 */
export interface Product {
    id: string;
    name: string;
    /** 1개당 구매 가격(원). 선물이면 0 */
    price: number;
    count: number;
    isGift: boolean;
    category: string;
    status: ProductStatus;
    /** 보관 장소 */
    place: string;
    modelName: string;
    brandName: string;
    barcode: string;
    /** YYYY-MM-DD. 모르면 빈 문자열 */
    purchaseDate: string;
    purchasePlace: string;
    memo: string;
    createdAt: number;
    updatedAt: number;
    deletedAt: number | null;
    /** 서버에 올라간 뒤의 productIdx. 로그인 전에는 null */
    serverId: number | null;
    /** 계정 userIdx. 게스트면 null */
    ownerId: number | null;
    /**
     * 뽑은 곳. 고르지 않았으면 null, 이 필드가 생기기 전(2026-11)에 만든 기록에는 아예 없다.
     * 색인이 아니라서 Dexie 버전을 올리지 않았다 — 읽을 때 없는 것과 null 을 같게 다룬다.
     */
    origin?: ProductOrigin | null;
}

/** 제품 사진. 원본 대신 줄인 JPEG Blob 을 저장한다 (src/lib/image.ts) */
export interface ProductImage {
    id: string;
    productId: string;
    blob: Blob;
    /** 0부터. 0번이 대표 사진 */
    order: number;
    createdAt: number;
}

class NemoDB extends Dexie {
    products!: EntityTable<Product, "id">;
    images!: EntityTable<ProductImage, "id">;

    constructor() {
        super("nemo");
        this.version(1).stores({
            products: "id, createdAt, barcode",
            images: "id, productId, [productId+order]",
        });
    }
}

/** 열기는 첫 쿼리 때 일어난다 — 서버 렌더링 중에 import 돼도 IndexedDB 를 건드리지 않는다 */
export const db = new NemoDB();
