import Dexie from "dexie";

import { db, type Product, type ProductImage } from "./index";

/** 제품 한 건에 붙일 수 있는 사진 수 */
export const MAX_IMAGES = 3;

/** 화면이 넘겨주는 값 — id·시각·동기화 필드는 저장소가 채운다 */
export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "deletedAt" | "serverId" | "ownerId">;

export interface ImageChanges {
    /** 지울 기존 사진 id */
    removeIds?: string[];
    /** 뒤에 덧붙일 새 사진 */
    add?: Blob[];
}

/**
 * crypto.randomUUID 는 보안 컨텍스트(HTTPS·localhost)에서만 있다.
 * 휴대폰으로 개발 서버(http://192.168.x.x)에 붙어 테스트할 때도 깨지지 않게 대체 경로를 둔다.
 */
export function newId(): string {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const isAlive = (product: Product) => product.deletedAt === null;

/** 저장 직전에 값을 정리한다 — 선물이면 가격 0, 수량은 1 이상 정수 */
function normalize(input: ProductInput): ProductInput {
    const price = Number.isFinite(input.price) && input.price > 0 ? Math.round(input.price) : 0;
    const count = Number.isFinite(input.count) && input.count >= 1 ? Math.floor(input.count) : 1;
    return {
        ...input,
        name: input.name.trim(),
        price: input.isGift ? 0 : price,
        count,
        place: input.place.trim(),
        barcode: input.barcode.trim(),
    };
}

/** 최근 등록 순. 삭제한 물건은 빠진다 */
export async function listProducts(): Promise<Product[]> {
    const products = await db.products.orderBy("createdAt").reverse().toArray();
    return products.filter(isAlive);
}

/** 없거나 삭제됐으면 undefined */
export async function getProduct(id: string): Promise<Product | undefined> {
    const product = await db.products.get(id);
    return product && isAlive(product) ? product : undefined;
}

export async function findProductByBarcode(barcode: string): Promise<Product | undefined> {
    const code = barcode.trim();
    if (!code) return undefined;
    return db.products.where("barcode").equals(code).filter(isAlive).first();
}

export async function listImages(productId: string): Promise<ProductImage[]> {
    return db.images.where("[productId+order]").between([productId, Dexie.minKey], [productId, Dexie.maxKey]).toArray();
}

/** 대표 사진(가장 앞 순서) */
export async function getCoverImage(productId: string): Promise<ProductImage | undefined> {
    return db.images
        .where("[productId+order]")
        .between([productId, Dexie.minKey], [productId, Dexie.maxKey])
        .first();
}

/**
 * 사진 Blob 은 미리 줄여서 넘길 것 — 트랜잭션 안에서 IndexedDB 가 아닌 비동기 작업을
 * 기다리면 트랜잭션이 저절로 닫힌다.
 */
export async function createProduct(input: ProductInput, images: Blob[] = []): Promise<string> {
    const id = newId();
    const now = Date.now();

    await db.transaction("rw", db.products, db.images, async () => {
        await db.products.add({
            ...normalize(input),
            id,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            serverId: null,
            ownerId: null,
        });
        await db.images.bulkAdd(
            images.slice(0, MAX_IMAGES).map((blob, order) => ({ id: newId(), productId: id, blob, order, createdAt: now })),
        );
    });

    return id;
}

export async function updateProduct(id: string, input: ProductInput, changes: ImageChanges = {}): Promise<void> {
    const now = Date.now();

    await db.transaction("rw", db.products, db.images, async () => {
        const current = await db.products.get(id);
        if (!current || !isAlive(current)) throw new Error(`제품을 찾을 수 없습니다: ${id}`);

        await db.products.put({ ...current, ...normalize(input), updatedAt: now });

        if (changes.removeIds?.length) {
            await db.images.where("productId").equals(id).and((image) => changes.removeIds!.includes(image.id)).delete();
        }

        // 남은 사진 뒤에 새 사진을 붙이고 순서를 0부터 다시 매긴다
        const kept = await listImages(id);
        const room = Math.max(0, MAX_IMAGES - kept.length);
        const added = (changes.add ?? [])
            .slice(0, room)
            .map((blob) => ({ id: newId(), productId: id, blob, order: 0, createdAt: now }));

        await db.images.bulkPut([...kept, ...added].map((image, order) => ({ ...image, order })));
    });
}

/**
 * 동기화 때 서버에 삭제를 알릴 수 있도록 제품 기록은 남기고 deletedAt 만 찍는다.
 * 사진은 용량이 커서 바로 지운다.
 */
export async function deleteProduct(id: string): Promise<void> {
    const now = Date.now();
    await db.transaction("rw", db.products, db.images, async () => {
        await db.products.update(id, { deletedAt: now, updatedAt: now });
        await db.images.where("productId").equals(id).delete();
    });
}

/** 한 건의 가치 — 1개당 가격 × 수량 */
export function productValue(product: Pick<Product, "price" | "count">): number {
    return product.price * product.count;
}
