import Dexie, { type EntityTable } from "dexie";

/** 제품 상태 — 나쁨 → 미개봉 순서 자체가 등급이다 */
export type ProductStatus = "BAD" | "POOR" | "GOOD" | "EXCELLENT" | "NEW";

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
