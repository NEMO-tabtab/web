import { ApiError, apiFetch } from "./client";
import {
    pageOf,
    serverAlarmSchema,
    serverCategorySchema,
    serverProductSchema,
    type Page,
    type ServerAlarm,
    type ServerCategory,
    type ServerProduct,
} from "./schemas";

/*
 * 서버 조회(GET) 함수. 2026-11-19 에 실제 응답을 보고 맞췄다.
 *
 * 아직 실제 화면은 이 함수들을 쓰지 않는다 — `/dev/api-live` 에서 먼저 확인한다.
 * 서버에 사용자 필터가 없어(#97) 목록은 모든 사용자의 것이 섞여 온다. 그대로 화면에 내지 말 것.
 */

/**
 * 서버는 "없음"을 404 가 아니라 500 으로 답한다(#97). 서버 고장과 가르는 단서가 `error` 문구뿐이라
 * 그것으로 구분한다. 서버가 404 로 바꾸면 문구 비교는 지운다.
 */
export function isNotFound(error: unknown): boolean {
    if (!(error instanceof ApiError) || error.kind !== "http") return false;
    if (error.status === 404) return true;
    return error.status === 500 && (error.envelope?.error ?? "").includes("찾을 수 없습니다");
}

async function orNull<T>(run: () => Promise<T>): Promise<T | null> {
    try {
        return await run();
    } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
    }
}

export interface PageQuery {
    /** 1부터 */
    page?: number;
    size?: number;
}

const DEFAULT_PAGE_SIZE = 20;

/** 명세와 달리 page·size 를 빼면 서버가 빈 목록을 준다 — 늘 넣어 보낸다 */
const paging = ({ page = 1, size = DEFAULT_PAGE_SIZE }: PageQuery = {}) => ({ page, size });

/** 서버가 깨어 있는지. 잠들어 있었다면 깨어날 때까지(1분 안팎) 기다린다 */
export async function checkHealth(): Promise<void> {
    await apiFetch({ method: "GET", path: "/api/health" });
}

/** 상품 한 건. 없으면 null (서버는 200 에 data 없이 답한다) */
export async function getServerProduct(productIdx: number): Promise<ServerProduct | null> {
    const data = await orNull(() =>
        apiFetch({ method: "GET", path: `/api/product/${productIdx}` }, serverProductSchema.nullish()),
    );
    return data ?? null;
}

export function listServerCategories(query?: PageQuery): Promise<Page<ServerCategory>> {
    return apiFetch({ method: "GET", path: "/api/category/list", query: paging(query) }, pageOf(serverCategorySchema));
}

/** 카테고리 한 건. 없으면 null */
export async function getServerCategory(categoryIdx: number): Promise<ServerCategory | null> {
    const data = await orNull(() =>
        apiFetch({ method: "GET", path: `/api/category/${categoryIdx}` }, serverCategorySchema.nullish()),
    );
    return data ?? null;
}

export function listServerAlarms(query: PageQuery & { productIdx?: number } = {}): Promise<Page<ServerAlarm>> {
    return apiFetch(
        { method: "GET", path: "/api/alarm/list", query: { ...paging(query), productIdx: query.productIdx } },
        pageOf(serverAlarmSchema),
    );
}

/** 알람 한 건. 없으면 null */
export async function getServerAlarm(alarmIdx: number): Promise<ServerAlarm | null> {
    const data = await orNull(() =>
        apiFetch({ method: "GET", path: `/api/alarm/${alarmIdx}` }, serverAlarmSchema.nullish()),
    );
    return data ?? null;
}
