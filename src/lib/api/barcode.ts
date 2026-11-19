import { z } from "zod";

import { ApiError, apiFetch } from "./client";

/*
 * 바코드로 상품 정보 조회 — `GET /api/barcode/{barcode}`.
 *
 * 명세에 응답 형식(BarcodeRead)이 없어 가정한 것 (실제 응답을 보면 여기만 고친다):
 * - data 는 객체이고, 이름·브랜드·모델명이 아래 후보 이름 중 하나로 온다
 * - 못 찾으면 404 가 아니라 500 으로 온다 (명세 설명). 그래서 "못 찾음"과 "서버 고장"을 구분할 수 없다
 */

export interface BarcodeInfo {
    name?: string;
    brandName?: string;
    modelName?: string;
}

/** 서버가 쓸 법한 필드 이름. 앞의 것이 우선한다 */
const CANDIDATES: Record<keyof BarcodeInfo, readonly string[]> = {
    name: ["productNm", "barcodeNm", "itemNm", "title", "name"],
    brandName: ["brandNm", "brand", "brandName"],
    modelName: ["modelNm", "model", "modelName"],
};

const MAX_LENGTH = 100;

function pick(raw: Record<string, unknown>, keys: readonly string[]): string | undefined {
    for (const key of keys) {
        const value = raw[key];
        if (typeof value === "string" && value.trim()) return value.trim().slice(0, MAX_LENGTH);
    }
    return undefined;
}

/** 쓸 만한 값이 하나도 없으면 null — 못 찾은 것으로 다룬다 */
export const barcodeInfoSchema = z
    .record(z.string(), z.unknown())
    .nullish()
    .transform((raw): BarcodeInfo | null => {
        if (!raw) return null;
        const info: BarcodeInfo = {
            name: pick(raw, CANDIDATES.name),
            brandName: pick(raw, CANDIDATES.brandName),
            modelName: pick(raw, CANDIDATES.modelName),
        };
        return info.name || info.brandName || info.modelName ? info : null;
    });

/** 주소에 넣어도 되는 바코드인가 — 숫자·영문·하이픈만 */
const BARCODE_PATTERN = /^[0-9A-Za-z-]{4,48}$/;

/** 조회는 도우미일 뿐이라 잠든 서버를 끝까지 기다리지 않는다 */
const LOOKUP_TIMEOUT_MS = 15_000;

/** "못 찾음"은 잠깐만 기억한다 — 서버가 고장 나 있던 것일 수도 있고, 그사이 등록됐을 수도 있다 */
const MISS_TTL_MS = 60_000;

const cache = new Map<string, { info: BarcodeInfo | null; expiresAt: number }>();
const inFlight = new Map<string, Promise<BarcodeInfo | null>>();

/** 기억해 둔 조회 결과를 지운다 (테스트용) */
export function clearBarcodeCache(): void {
    cache.clear();
    inFlight.clear();
}

async function fetchBarcode(code: string): Promise<BarcodeInfo | null> {
    try {
        return await apiFetch(
            { method: "GET", path: `/api/barcode/${encodeURIComponent(code)}`, timeoutMs: LOOKUP_TIMEOUT_MS },
            barcodeInfoSchema,
        );
    } catch (error) {
        // 서버가 답은 했다 — 명세상 "정보 없음"도 이 길(500)로 온다
        if (error instanceof ApiError && (error.kind === "http" || error.kind === "envelope")) return null;
        throw error;
    }
}

/**
 * 상품 정보를 찾는다. 못 찾으면 null.
 * 서버에 닿지 못했거나(연결·지연) 응답을 읽지 못하면 ApiError 를 던진다.
 *
 * 같은 바코드를 스캐너 화면과 등록 화면이 이어서 묻는다. 결과를 기억해 두어 서버는 한 번만 부른다 —
 * 찾은 것은 앱을 닫을 때까지, 못 찾은 것은 1분. 조회 중에 또 물으면 같은 요청의 결과를 함께 기다린다.
 * 실패(연결·지연)는 기억하지 않는다.
 */
export function lookupBarcode(barcode: string, now: number = Date.now()): Promise<BarcodeInfo | null> {
    const code = barcode.trim();
    if (!BARCODE_PATTERN.test(code)) return Promise.resolve(null);

    const cached = cache.get(code);
    if (cached && cached.expiresAt > now) return Promise.resolve(cached.info);

    const pending = inFlight.get(code);
    if (pending) return pending;

    const request = fetchBarcode(code)
        .then((info) => {
            cache.set(code, { info, expiresAt: info ? Infinity : now + MISS_TTL_MS });
            return info;
        })
        .finally(() => inFlight.delete(code));
    inFlight.set(code, request);
    return request;
}

const FIELD_LABELS: Record<keyof BarcodeInfo, string> = {
    name: "제품명",
    brandName: "브랜드",
    modelName: "모델명",
};

/**
 * 조회한 정보로 **비어 있는 칸만** 채운다. 사용자가 이미 적은 값은 건드리지 않는다.
 * `filled` 는 채운 칸의 이름(화면 안내용).
 */
export function fillEmptyFields<T extends Record<keyof BarcodeInfo, string>>(
    current: T,
    info: BarcodeInfo,
): { next: T; filled: string[] } {
    const next = { ...current };
    const filled: string[] = [];

    for (const field of Object.keys(FIELD_LABELS) as (keyof BarcodeInfo)[]) {
        const value = info[field];
        if (value && !current[field].trim()) {
            (next as Record<keyof BarcodeInfo, string>)[field] = value;
            filled.push(FIELD_LABELS[field]);
        }
    }

    return { next, filled };
}
