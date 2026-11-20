import { beforeEach, describe, expect, it } from "vitest";

import { db } from "./index";
import {
    MAX_IMAGES,
    createProduct,
    deleteProduct,
    findProductByBarcode,
    getCoverImage,
    getProduct,
    listImages,
    listProducts,
    productValue,
    updateProduct,
    type ProductInput,
} from "./products";

const input = (overrides: Partial<ProductInput> = {}): ProductInput => ({
    name: "맥북 프로",
    price: 2_000_000,
    count: 1,
    isGift: false,
    category: "전자기기",
    status: "GOOD",
    place: "",
    modelName: "",
    brandName: "",
    barcode: "",
    purchaseDate: "",
    purchasePlace: "",
    memo: "",
    ...overrides,
});

const blob = (label: string) => new Blob([label], { type: "image/jpeg" });

const origin = {
    shopId: "nemo-virtual",
    shopName: "네모 가상 굿즈샵 (예시)",
    layoutVersion: 1,
    floorId: "f1",
    floorLabel: "1층",
    slotId: "n3",
    machineNumber: 3,
    tier: 1,
    seriesId: "virtual-cats",
    seriesName: "(예시) 졸린 고양이 피규어",
};

beforeEach(async () => {
    await db.products.clear();
    await db.images.clear();
});

describe("createProduct", () => {
    it("기기에서 만든 id 로 저장하고 동기화 필드는 비워 둔다", async () => {
        const id = await createProduct(input());
        const product = await getProduct(id);

        expect(product).toMatchObject({ id, name: "맥북 프로", deletedAt: null, serverId: null, ownerId: null });
        expect(product!.createdAt).toBe(product!.updatedAt);
    });

    it("선물이면 가격을 0 으로, 수량은 1 이상 정수로 맞춘다", async () => {
        const id = await createProduct(input({ isGift: true, price: 5000, count: 0, name: "  선물  " }));
        expect(await getProduct(id)).toMatchObject({ name: "선물", price: 0, count: 1 });
    });

    it("이름이 비었거나 공백뿐이면 저장하지 않는다", async () => {
        await expect(createProduct(input({ name: "   " }))).rejects.toThrow();
        expect(await listProducts()).toEqual([]);
    });

    it(`사진은 ${MAX_IMAGES}장까지만 순서대로 저장한다`, async () => {
        const id = await createProduct(input(), ["a", "b", "c", "d"].map(blob));
        const images = await listImages(id);

        expect(images.map((image) => image.order)).toEqual([0, 1, 2]);
        expect(await (await getCoverImage(id))!.blob.text()).toBe("a");
    });
});

describe("listProducts", () => {
    it("최근 등록 순으로, 삭제한 물건은 빼고 돌려준다", async () => {
        const first = await createProduct(input({ name: "첫째" }));
        await new Promise((resolve) => setTimeout(resolve, 2));
        const second = await createProduct(input({ name: "둘째" }));
        await new Promise((resolve) => setTimeout(resolve, 2));
        const third = await createProduct(input({ name: "셋째" }));

        await deleteProduct(second);

        expect((await listProducts()).map((product) => product.id)).toEqual([third, first]);
    });
});

describe("updateProduct", () => {
    it("값을 고치고 updatedAt 을 올린다", async () => {
        const id = await createProduct(input());
        const before = (await getProduct(id))!;
        await new Promise((resolve) => setTimeout(resolve, 2));

        await updateProduct(id, input({ name: "맥북 에어", count: 2 }));
        const after = (await getProduct(id))!;

        expect(after).toMatchObject({ name: "맥북 에어", count: 2, createdAt: before.createdAt });
        expect(after.updatedAt).toBeGreaterThan(before.updatedAt);
    });

    it("사진을 지우고 덧붙이면 순서를 0부터 다시 매기고 최대 장수를 지킨다", async () => {
        const id = await createProduct(input(), ["a", "b", "c"].map(blob));
        const [a] = await listImages(id);

        await updateProduct(id, input(), { removeIds: [a.id], add: ["d", "e"].map(blob) });
        const images = await listImages(id);

        expect(images.map((image) => image.order)).toEqual([0, 1, 2]);
        expect(await Promise.all(images.map((image) => image.blob.text()))).toEqual(["b", "c", "d"]);
    });

    it("삭제한 물건은 고칠 수 없다", async () => {
        const id = await createProduct(input());
        await deleteProduct(id);
        await expect(updateProduct(id, input())).rejects.toThrow();
    });
});

describe("뽑은 곳 (origin)", () => {
    it("등록할 때 고른 뽑은 곳을 그대로 저장한다", async () => {
        const id = await createProduct(input({ origin }));
        expect((await getProduct(id))!.origin).toEqual(origin);
    });

    it("수정할 때 뽑은 곳을 넘기지 않으면 기존 값을 그대로 둔다", async () => {
        const id = await createProduct(input({ origin }));
        await updateProduct(id, input({ name: "이름만 바꿈" }));
        expect(await getProduct(id)).toMatchObject({ name: "이름만 바꿈", origin });
    });

    it("null 을 넘기면 지우고, 다른 곳을 넘기면 바꾼다", async () => {
        const id = await createProduct(input({ origin }));
        await updateProduct(id, input({ origin: { ...origin, tier: 0, seriesName: null, seriesId: null } }));
        expect((await getProduct(id))!.origin).toMatchObject({ tier: 0, seriesName: null });

        await updateProduct(id, input({ origin: null }));
        expect((await getProduct(id))!.origin).toBeNull();
    });

    it("뽑은 곳 없이 등록하면 필드가 없다 — 예전 기록과 같은 모양이다", async () => {
        const id = await createProduct(input());
        expect((await getProduct(id))!.origin ?? null).toBeNull();
    });
});

describe("deleteProduct", () => {
    it("기록은 남기고 deletedAt 만 찍으며 사진은 지운다", async () => {
        const id = await createProduct(input(), [blob("a")]);
        await deleteProduct(id);

        expect(await getProduct(id)).toBeUndefined();
        expect((await db.products.get(id))!.deletedAt).not.toBeNull();
        expect(await listImages(id)).toEqual([]);
    });
});

describe("findProductByBarcode", () => {
    it("살아 있는 물건만 찾는다", async () => {
        const id = await createProduct(input({ barcode: " 8801234567890 " }));
        expect((await findProductByBarcode("8801234567890"))?.id).toBe(id);

        await deleteProduct(id);
        expect(await findProductByBarcode("8801234567890")).toBeUndefined();
        expect(await findProductByBarcode("")).toBeUndefined();
    });
});

describe("productValue", () => {
    it("1개당 가격 × 수량", () => {
        expect(productValue({ price: 1500, count: 3 })).toBe(4500);
    });
});
