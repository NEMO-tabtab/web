import { z } from "zod";

import { ApiError, apiFetch } from "./client";

/*
 * 바코드로 상품 정보 조회 — `GET /api/barcode/{barcode}`.
 * 못 찾은 바코드는 사용자가 동의하면 서버의 바코드 DB에 올린다 — `POST /api/barcode/insert` (#128).
 *
 * 조회 응답(BarcodeRead)의 필드는 barcode·productNm·type·color·brandNm 이다(2026-11-19 실제 응답).
 * 다른 이름도 받아 두는 것은 서버가 바뀌어도 화면이 깨지지 않게 하려는 것이다.
 * 못 찾으면 404 가 아니라 500 으로 온다 (명세 설명). 그래서 "못 찾음"과 "서버 고장"을 구분할 수 없다.
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

/*
 * ── 못 찾은 바코드 올리기 ─────────────────────────────────────────
 * 올리는 것은 바코드·제품명·브랜드뿐이다. 가격·메모·사진·보관 위치는 올리지 않는다.
 * 사용자에게 묻고 동의했을 때만 부른다 — 이 파일은 묻지 않는다(화면의 몫).
 * 서버는 이미 있는 바코드를 덮어쓰지 않는다(409).
 */

/** 서버가 받는 바코드 — 영문·숫자·하이픈 4~30자. 조회(4~48자)보다 좁다: 서버 DB 한쪽의 칸이 30자다 */
const CONTRIBUTE_PATTERN = /^[0-9A-Za-z-]{4,30}$/;

/** 서버가 받는 제품명·브랜드 길이. 넘으면 서버가 400 으로 돌려보내므로 여기서 맞춘다 */
const CONTRIBUTE_TEXT_LIMIT = 50;

/** 사용자가 창을 보고 기다리는 동안이라 조회보다 길게, 잠든 서버가 깨어날 시간보다는 짧게 */
const CONTRIBUTE_TIMEOUT_MS = 30_000;

export interface BarcodeContribution {
    barcode: string;
    name: string;
    /** 비었으면 올리지 않는다 */
    brandName?: string;
}

/** 서버 한도에 맞춘 글자 — 줄바꿈·연속 공백은 한 칸으로, 길면 자른다(이모지 반쪽은 버린다). 비었으면 undefined */
function tidy(value: string | undefined, limit: number): string | undefined {
    const text = (value ?? "")
        .replace(/\p{Cc}+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!text) return undefined;
    // 서버(Java)는 UTF-16 단위로 센다 — 같은 단위로 자른다
    const cut = text.slice(0, limit).replace(/[\uD800-\uDBFF]$/, "");
    return cut.trim() || undefined;
}

/**
 * 실제로 올라갈 값. 확인 창에 보여 주는 값과 보내는 값이 같도록 둘 다 이것을 쓴다.
 * 올릴 수 없는 입력(바코드 형식이 다르거나 제품명이 비었음)이면 null.
 */
export function contributionPayload(input: BarcodeContribution): BarcodeContribution | null {
    const barcode = input.barcode.trim();
    const name = tidy(input.name, CONTRIBUTE_TEXT_LIMIT);
    if (!CONTRIBUTE_PATTERN.test(barcode) || !name) return null;
    const brandName = tidy(input.brandName, CONTRIBUTE_TEXT_LIMIT);
    return brandName ? { barcode, name, brandName } : { barcode, name };
}

/**
 * 등록을 마친 뒤 "올릴까요?"를 물을지.
 * 조회가 "못 찾음"으로 끝난 바로 그 바코드를 저장했고, 올릴 수 있는 값일 때만 묻는다.
 * 저장 전에 바코드 칸을 고쳤으면 묻지 않는다 — 서버에 없다고 확인한 것은 원래 바코드뿐이다.
 */
export function shouldOfferContribution(missedBarcode: string | null, saved: BarcodeContribution): boolean {
    if (!missedBarcode) return false;
    return saved.barcode.trim() === missedBarcode.trim() && contributionPayload(saved) !== null;
}

/** saved — 올렸다. exists — 그사이 누군가 먼저 올려 서버가 받지 않았다(덮어쓰지 않는다) */
export type ContributeResult = "saved" | "exists";

/**
 * 못 찾은 바코드의 정보를 서버의 바코드 DB에 올린다.
 * 서버에 닿지 못했거나 거절당하면(409 제외) ApiError 를 던진다.
 * 올린 뒤에는 이 앱에서 같은 바코드를 다시 물을 때 서버를 부르지 않고 올린 값을 돌려준다.
 */
export async function contributeBarcode(input: BarcodeContribution): Promise<ContributeResult> {
    const payload = contributionPayload(input);
    if (!payload) throw new RangeError("올릴 수 없는 바코드 정보입니다.");
    const { barcode, name, brandName } = payload;

    try {
        await apiFetch({
            method: "POST",
            path: "/api/barcode/insert",
            json: { barcode, productNm: name, ...(brandName ? { brandNm: brandName } : {}) },
            timeoutMs: CONTRIBUTE_TIMEOUT_MS,
        });
    } catch (error) {
        if (error instanceof ApiError && error.kind === "http" && error.status === 409) {
            // 기억해 둔 "못 찾음"을 지운다 — 다음 조회는 서버에 다시 물어 먼저 올라간 값을 받는다
            cache.delete(barcode);
            return "exists";
        }
        throw error;
    }

    cache.set(barcode, { info: brandName ? { name, brandName } : { name }, expiresAt: Infinity });
    return "saved";
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
