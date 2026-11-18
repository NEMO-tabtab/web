import { strToU8, unzipSync, zipSync, strFromU8 } from "fflate";
import { beforeEach, describe, expect, it } from "vitest";

import {
    BACKUP_FORMAT_VERSION,
    BackupError,
    applyImport,
    backupFileName,
    buildBackup,
    planImport,
    readBackup,
} from "./backup";
import { db } from "./index";
import {
    createProduct,
    deleteProduct,
    getProduct,
    listImages,
    listProducts,
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

const photo = (label: string) => new Blob([label], { type: "image/jpeg" });

const clear = async () => {
    await db.products.clear();
    await db.images.clear();
};

/** 백업 ZIP 을 풀어 manifest 를 고친 뒤 다시 묶는다 */
async function tamper(
    blob: Blob,
    edit: (manifest: Record<string, unknown>, files: Record<string, Uint8Array>) => void,
) {
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const manifest = JSON.parse(strFromU8(files["backup.json"]));
    edit(manifest, files);
    if (files["backup.json"]) files["backup.json"] = strToU8(JSON.stringify(manifest));
    return new Blob([zipSync(files, { level: 0 }) as Uint8Array<ArrayBuffer>]);
}

const expectRejected = async (file: Blob, kind: BackupError["kind"]) => {
    await expect(readBackup(file)).rejects.toMatchObject({ name: "BackupError", kind });
};

beforeEach(clear);

describe("내보내기 → 가져오기", () => {
    it("빈 기기에 가져오면 기록과 사진이 그대로 돌아온다", async () => {
        const first = await createProduct(input({ name: "카메라", price: 500_000, count: 2 }), [
            photo("a"),
            photo("b"),
        ]);
        const second = await createProduct(input({ name: "책" }));
        const before = { products: await db.products.toArray(), images: await listImages(first) };

        const built = await buildBackup();
        expect(built).toMatchObject({ productCount: 2, imageCount: 2 });

        await clear();
        const backup = await readBackup(built.blob);
        expect(await planImport(backup)).toEqual({ added: 2, updated: 0, removed: 0, kept: 0 });
        expect(await applyImport(backup)).toEqual({ added: 2, updated: 0, removed: 0, kept: 0 });

        expect((await db.products.toArray()).sort((a, b) => a.id.localeCompare(b.id))).toEqual(
            before.products.sort((a, b) => a.id.localeCompare(b.id)),
        );
        const images = await listImages(first);
        expect(images.map(({ id, order }) => ({ id, order }))).toEqual(
            before.images.map(({ id, order }) => ({ id, order })),
        );
        expect(await Promise.all(images.map((image) => image.blob.text()))).toEqual(["a", "b"]);
        expect(images[0].blob.type).toBe("image/jpeg");
        expect(await getProduct(second)).toMatchObject({ name: "책" });
    });

    it("같은 백업을 두 번 가져와도 달라지지 않는다", async () => {
        await createProduct(input(), [photo("a")]);
        const backup = await readBackup((await buildBackup()).blob);

        expect(await applyImport(backup)).toEqual({ added: 0, updated: 0, removed: 0, kept: 1 });
        expect(await listProducts()).toHaveLength(1);
        expect(await db.images.count()).toBe(1);
    });

    it("파일 이름에 내보낸 날짜가 들어간다", () => {
        expect(backupFileName(new Date(2026, 10, 9).getTime())).toBe("nemo-backup-2026-11-09.zip");
    });
});

describe("합치기", () => {
    it("백업보다 나중에 고친 기록은 그대로 둔다", async () => {
        const id = await createProduct(input({ name: "예전 이름" }), [photo("old")]);
        const backup = await readBackup((await buildBackup()).blob);

        await new Promise((resolve) => setTimeout(resolve, 2));
        await updateProduct(id, input({ name: "새 이름" }), { add: [photo("new")] });

        expect(await applyImport(backup)).toEqual({ added: 0, updated: 0, removed: 0, kept: 1 });
        expect(await getProduct(id)).toMatchObject({ name: "새 이름" });
        expect(await listImages(id)).toHaveLength(2);
    });

    it("백업 쪽이 더 새로우면 기록과 사진을 백업 것으로 바꾼다", async () => {
        const id = await createProduct(input({ name: "새 이름" }), [photo("new")]);
        const backup = await readBackup((await buildBackup()).blob);

        // 이 기기를 백업보다 예전 상태로 되돌린다
        await db.products.update(id, { name: "예전 이름", updatedAt: backup.products[0].updatedAt - 1 });
        await db.images.clear();
        await db.images.add({ id: "stale", productId: id, blob: photo("old"), order: 0, createdAt: 0 });

        expect(await planImport(backup)).toEqual({ added: 0, updated: 1, removed: 0, kept: 0 });
        await applyImport(backup);

        expect(await getProduct(id)).toMatchObject({ name: "새 이름" });
        const images = await listImages(id);
        expect(await Promise.all(images.map((image) => image.blob.text()))).toEqual(["new"]);
    });

    it("백업에서 더 나중에 지운 기록은 이 기기에서도 지운다", async () => {
        const id = await createProduct(input(), [photo("a")]);
        const snapshot = await db.products.get(id);
        await new Promise((resolve) => setTimeout(resolve, 2));
        await deleteProduct(id);
        const backup = await readBackup((await buildBackup()).blob);

        // 지우기 전 상태로 되돌린 기기
        await db.products.put(snapshot!);
        await db.images.add({ id: "left", productId: id, blob: photo("a"), order: 0, createdAt: 0 });

        expect(await applyImport(backup)).toEqual({ added: 0, updated: 0, removed: 1, kept: 0 });
        expect(await getProduct(id)).toBeUndefined();
        expect(await listImages(id)).toEqual([]);
    });

    it("이 기기에 없던 삭제 기록은 물건으로 세지 않고, 목록에도 나오지 않는다", async () => {
        const id = await createProduct(input());
        await deleteProduct(id);
        const backup = await readBackup((await buildBackup()).blob);
        await clear();

        expect(await applyImport(backup)).toEqual({ added: 0, updated: 0, removed: 0, kept: 0 });
        expect(await listProducts()).toEqual([]);
    });

    it("중간에 실패하면 아무것도 바뀌지 않는다", async () => {
        const kept = await createProduct(input({ name: "원래 있던 것" }));
        const backup = await readBackup((await buildBackup()).blob);
        await db.products.update(kept, { name: "예전", updatedAt: 0 });

        // 사진 저장 단계에서 깨지게 한다 — 기본 키가 없는 사진
        const broken = {
            ...backup,
            images: [{ productId: kept, blob: photo("x"), order: 0, createdAt: 0 } as never],
        };

        await expect(applyImport(broken)).rejects.toThrow();
        expect(await getProduct(kept)).toMatchObject({ name: "예전" });
    });
});

describe("거부하는 파일", () => {
    it("ZIP 이 아닌 파일", async () => {
        await expectRejected(new Blob(["그냥 글자"]), "not-zip");
    });

    it("backup.json 이 없는 ZIP", async () => {
        await expectRejected(new Blob([zipSync({ "a.txt": strToU8("a") }) as Uint8Array<ArrayBuffer>]), "no-manifest");
    });

    it("다른 앱의 JSON 이 든 ZIP", async () => {
        const built = await buildBackup();
        await expectRejected(await tamper(built.blob, (manifest) => (manifest.format = "other")), "no-manifest");
    });

    it("이 앱보다 새 형식", async () => {
        const built = await buildBackup();
        await expectRejected(
            await tamper(built.blob, (manifest) => (manifest.formatVersion = BACKUP_FORMAT_VERSION + 1)),
            "too-new",
        );
    });

    it("필드가 빠졌거나 값이 틀린 기록", async () => {
        await createProduct(input());
        const built = await buildBackup();

        await expectRejected(
            await tamper(built.blob, (manifest) => delete (manifest.products as Record<string, unknown>[])[0].name),
            "invalid",
        );
        await expectRejected(
            await tamper(
                built.blob,
                (manifest) => ((manifest.products as Record<string, unknown>[])[0].status = "SHINY"),
            ),
            "invalid",
        );
        await expectRejected(
            await tamper(
                built.blob,
                (manifest) => ((manifest.products as Record<string, unknown>[])[0].price = "비쌈"),
            ),
            "invalid",
        );
    });

    it("목록에 있는 사진이 ZIP 에 없거나, 없는 기록을 가리키는 사진", async () => {
        await createProduct(input(), [photo("a")]);
        const built = await buildBackup();

        await expectRejected(
            await tamper(built.blob, (manifest, files) => {
                delete files[(manifest.images as { file: string }[])[0].file];
            }),
            "invalid",
        );
        await expectRejected(
            await tamper(
                built.blob,
                (manifest) => ((manifest.images as { productId: string }[])[0].productId = "nobody"),
            ),
            "invalid",
        );
    });

    it("기록 하나에 사진이 너무 많은 파일", async () => {
        await createProduct(input(), [photo("a")]);
        const built = await buildBackup();

        await expectRejected(
            await tamper(built.blob, (manifest) => {
                const images = manifest.images as Record<string, unknown>[];
                manifest.images = [0, 1, 2, 3].map((n) => ({ ...images[0], id: `copy-${n}`, order: n }));
            }),
            "invalid",
        );
    });

    it("거부한 뒤에도 기기의 기록은 그대로다", async () => {
        const id = await createProduct(input());
        await expectRejected(new Blob(["x"]), "not-zip");
        expect(await getProduct(id)).toBeDefined();
    });
});
