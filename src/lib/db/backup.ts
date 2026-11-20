import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { z } from "zod";

import { db, type Product, type ProductImage } from "./index";
import { MAX_IMAGES } from "./products";

/*
 * 백업 파일 — ZIP 하나.
 *
 *   backup.json          기록 전체와 사진 목록
 *   images/<사진 id>.jpg  사진 Blob 그대로
 *
 * 로그인 전에는 기기가 유일한 원본이라(P1) 이 파일이 유일한 안전망이다.
 * 가져오기는 덮어쓰지 않고 합친다 — 같은 id 는 updatedAt 이 새로운 쪽이 남는다.
 */

export const BACKUP_FORMAT = "nemo-backup";
/**
 * 파일 형식이 바뀌면 올린다. 올릴 때는 이전 버전을 읽는 변환도 함께 넣을 것.
 *   1: 처음
 *   2: 물건에 뽑은 곳(origin) 추가. 1 은 origin 이 없을 뿐이라 그대로 읽는다.
 *      버전을 올린 까닭 — 1 만 아는 앱이 2 를 읽으면 origin 을 모르는 필드로 버려 기록이 사라진다. 대신 "새 버전 파일"로 거부하게 한다.
 */
export const BACKUP_FORMAT_VERSION = 2;
const MANIFEST_NAME = "backup.json";

/**
 * - not-zip      : ZIP 으로 열리지 않는다
 * - no-manifest  : ZIP 이지만 backup.json 이 없다 (네모 백업이 아니다)
 * - too-new      : 이 앱보다 새 버전의 앱이 만든 파일
 * - invalid      : 내용이 형식에 맞지 않는다
 */
export type BackupErrorKind = "not-zip" | "no-manifest" | "too-new" | "invalid";

export class BackupError extends Error {
    constructor(
        readonly kind: BackupErrorKind,
        message: string,
    ) {
        super(message);
        this.name = "BackupError";
    }
}

const timestamp = z.number().int().nonnegative();

const originSchema = z.object({
    shopId: z.string().min(1),
    shopName: z.string().min(1),
    layoutVersion: z.number().int().min(1),
    floorId: z.string().min(1),
    floorLabel: z.string(),
    slotId: z.string().min(1),
    machineNumber: z.number().int().min(1),
    tier: z.number().int().nonnegative(),
    seriesId: z.string().nullable(),
    seriesName: z.string().nullable(),
});

const productSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    price: z.number().int().nonnegative(),
    count: z.number().int().min(1),
    isGift: z.boolean(),
    category: z.string(),
    status: z.enum(["BAD", "POOR", "GOOD", "EXCELLENT", "NEW"]),
    place: z.string(),
    modelName: z.string(),
    brandName: z.string(),
    barcode: z.string(),
    purchaseDate: z.string(),
    purchasePlace: z.string(),
    memo: z.string(),
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: timestamp.nullable(),
    serverId: z.number().int().nullable(),
    ownerId: z.number().int().nullable(),
    // 형식 1 의 파일에는 없다
    origin: originSchema.nullable().optional(),
});

const imageEntrySchema = z.object({
    id: z.string().min(1),
    productId: z.string().min(1),
    order: z.number().int().nonnegative(),
    createdAt: timestamp,
    /** ZIP 안의 경로 */
    file: z.string().regex(/^images\/[^/\\]+$/),
    /** Blob 의 MIME 타입 */
    type: z.string().regex(/^image\//),
});

const manifestSchema = z.object({
    format: z.literal(BACKUP_FORMAT),
    formatVersion: z.number().int().min(1).max(BACKUP_FORMAT_VERSION),
    exportedAt: timestamp,
    products: z.array(productSchema),
    images: z.array(imageEntrySchema),
});

type Manifest = z.infer<typeof manifestSchema>;

export interface BuiltBackup {
    blob: Blob;
    fileName: string;
    /** 삭제 표시된 기록은 세지 않는다 */
    productCount: number;
    imageCount: number;
}

/** 파일에서 읽어 검사를 마친 백업. 아직 기기에는 아무것도 쓰지 않았다 */
export interface ParsedBackup {
    exportedAt: number;
    products: Product[];
    images: ProductImage[];
}

export interface ImportPlan {
    /** 이 기기에 없어서 새로 들어오는 물건 */
    added: number;
    /** 백업 쪽이 더 새로워 바뀌는 물건 */
    updated: number;
    /** 백업에서 더 나중에 지워져, 이 기기에서도 지워지는 물건 */
    removed: number;
    /** 이 기기 쪽이 같거나 더 새로워 그대로 두는 물건 */
    kept: number;
}

const EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

const pad = (value: number) => String(value).padStart(2, "0");

export function backupFileName(at: number): string {
    const date = new Date(at);
    return `nemo-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.zip`;
}

/** 기기의 기록 전체(삭제 표시 포함)와 사진을 ZIP 하나로 만든다 */
export async function buildBackup(now: number = Date.now()): Promise<BuiltBackup> {
    const [products, images] = await db.transaction("r", db.products, db.images, () =>
        Promise.all([db.products.toArray(), db.images.toArray()]),
    );

    const files: Record<string, Uint8Array> = {};
    const entries: Manifest["images"] = [];

    for (const image of images) {
        const type = image.blob.type || "image/jpeg";
        const file = `images/${image.id}.${EXTENSIONS[type] ?? "bin"}`;
        files[file] = new Uint8Array(await image.blob.arrayBuffer());
        entries.push({
            id: image.id,
            productId: image.productId,
            order: image.order,
            createdAt: image.createdAt,
            file,
            type,
        });
    }

    const manifest: Manifest = {
        format: BACKUP_FORMAT,
        formatVersion: BACKUP_FORMAT_VERSION,
        exportedAt: now,
        products,
        images: entries,
    };
    files[MANIFEST_NAME] = strToU8(JSON.stringify(manifest));

    // 사진은 이미 압축된 JPEG 라 다시 압축해도 줄지 않는다 — 묶기만 한다
    const zipped = zipSync(files, { level: 0 });

    return {
        blob: new Blob([zipped as Uint8Array<ArrayBuffer>], { type: "application/zip" }),
        fileName: backupFileName(now),
        productCount: products.filter((product) => product.deletedAt === null).length,
        imageCount: images.length,
    };
}

/**
 * 백업 파일을 읽고 검사한다. 기기에는 쓰지 않는다.
 * 하나라도 맞지 않으면 통째로 거부한다 — 반쯤 맞는 파일을 반쯤 가져오지 않는다.
 */
export async function readBackup(file: Blob): Promise<ParsedBackup> {
    let entries: Record<string, Uint8Array>;
    try {
        entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
    } catch {
        throw new BackupError("not-zip", "네모 백업 파일이 아니에요.");
    }

    const manifestBytes = entries[MANIFEST_NAME];
    if (!manifestBytes) throw new BackupError("no-manifest", "네모 백업 파일이 아니에요.");

    let raw: unknown;
    try {
        raw = JSON.parse(strFromU8(manifestBytes));
    } catch {
        throw new BackupError("invalid", "백업 파일이 손상됐어요.");
    }

    const head = z.object({ format: z.literal(BACKUP_FORMAT), formatVersion: z.number().int().min(1) }).safeParse(raw);
    if (!head.success) throw new BackupError("no-manifest", "네모 백업 파일이 아니에요.");
    if (head.data.formatVersion > BACKUP_FORMAT_VERSION) {
        throw new BackupError(
            "too-new",
            "더 새로운 버전의 앱에서 만든 백업이에요. 앱을 최신으로 올린 뒤 다시 시도해 주세요.",
        );
    }

    const parsed = manifestSchema.safeParse(raw);
    if (!parsed.success) throw new BackupError("invalid", "백업 파일의 내용이 형식에 맞지 않아요.");
    const manifest = parsed.data;

    const invalid = () => new BackupError("invalid", "백업 파일의 내용이 서로 맞지 않아요.");

    const productsById = new Map(manifest.products.map((product) => [product.id, product]));
    if (productsById.size !== manifest.products.length) throw invalid();

    const imageIds = new Set<string>();
    const perProduct = new Map<string, number>();
    const images: ProductImage[] = [];

    for (const entry of manifest.images) {
        const owner = productsById.get(entry.productId);
        const bytes = entries[entry.file];
        // 사진은 살아 있는 기록에만 붙는다. 지운 기록의 사진은 지울 때 함께 없어진다
        if (!owner || owner.deletedAt !== null || !bytes || imageIds.has(entry.id)) throw invalid();

        const count = (perProduct.get(entry.productId) ?? 0) + 1;
        if (count > MAX_IMAGES) throw invalid();
        perProduct.set(entry.productId, count);
        imageIds.add(entry.id);

        images.push({
            id: entry.id,
            productId: entry.productId,
            order: entry.order,
            createdAt: entry.createdAt,
            blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: entry.type }),
        });
    }

    return { exportedAt: manifest.exportedAt, products: manifest.products, images };
}

type Decision = "add" | "update" | "remove" | "keep" | "tombstone";

/** 같은 id 는 updatedAt 이 새로운 쪽이 남는다. 같으면 이 기기 것을 둔다 */
function decide(incoming: Product, local: Product | undefined): Decision {
    if (!local) return incoming.deletedAt === null ? "add" : "tombstone";
    if (incoming.updatedAt <= local.updatedAt) return "keep";
    if (incoming.deletedAt === null) return local.deletedAt === null ? "update" : "add";
    return local.deletedAt === null ? "remove" : "tombstone";
}

function tally(decisions: Decision[]): ImportPlan {
    const count = (kind: Decision) => decisions.filter((decision) => decision === kind).length;
    return { added: count("add"), updated: count("update"), removed: count("remove"), kept: count("keep") };
}

/** 가져오면 무엇이 달라지는지 미리 센다. 기기에는 쓰지 않는다 */
export async function planImport(backup: ParsedBackup): Promise<ImportPlan> {
    const locals = await db.products.bulkGet(backup.products.map((product) => product.id));
    return tally(backup.products.map((product, index) => decide(product, locals[index])));
}

/**
 * 백업을 기기에 합친다. 트랜잭션 하나라서 중간에 실패하면(저장 공간 부족 등) 아무것도 바뀌지 않는다.
 * 미리 본 뒤에 기록이 바뀌었을 수 있으므로 무엇을 가져올지는 여기서 다시 정한다.
 */
export async function applyImport(backup: ParsedBackup): Promise<ImportPlan> {
    const imagesByProduct = new Map<string, ProductImage[]>();
    for (const image of backup.images) {
        imagesByProduct.set(image.productId, [...(imagesByProduct.get(image.productId) ?? []), image]);
    }

    return db.transaction("rw", db.products, db.images, async () => {
        const locals = await db.products.bulkGet(backup.products.map((product) => product.id));
        const decisions = backup.products.map((product, index) => decide(product, locals[index]));

        const taken = backup.products.filter((_, index) => decisions[index] !== "keep");
        const takenIds = taken.map((product) => product.id);

        // 가져오는 기록의 사진은 백업 것으로 통째로 바꾼다 (지워진 기록이면 사진만 없어진다)
        await db.images.where("productId").anyOf(takenIds).delete();
        await db.products.bulkPut(taken);
        await db.images.bulkPut(takenIds.flatMap((id) => imagesByProduct.get(id) ?? []));

        return tally(decisions);
    });
}
