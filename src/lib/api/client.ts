/**
 * nemo-api 호출의 단일 진입점.
 *
 * 명세: https://nemo-api.onrender.com/swagger-ui/index.html
 * 모든 응답은 `{ success, message, code, data }` 봉투에 담겨 온다 (실패 시 `data` 대신 `error`).
 *
 * - `request`  — 실패해도 던지지 않고 호출 과정 전체(상태·소요 시간·봉투·실패 종류)를 돌려준다.
 *               /dev/api-test 콘솔이 이걸로 "어디서 깨졌는지"를 보여준다.
 * - `apiFetch` — 화면용. 봉투를 벗겨 `data` 만 돌려주고, 실패는 `ApiError` 로 던진다.
 *               예상 형식(zod)을 함께 주면 `data` 가 그 형식인지도 확인한다.
 */

import type { ZodType } from "zod";

/**
 * 모의 서버 모드 — 실제 서버 대신 `./mock` 이 명세의 예상 응답을 돌려준다.
 * 서버 DB 가 꺼져 있어도 화면을 눌러 볼 수 있게 하는 개발용 스위치다. 운영에서는 켜지 않는다.
 */
export const API_MOCK_ENABLED = process.env.NEXT_PUBLIC_API_MOCK === "true";

export const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_URL || (API_MOCK_ENABLED ? "https://mock.invalid" : "");

/** 서버 주소가 없으면(로컬 전용으로 빌드한 경우) 서버를 부르는 기능은 조용히 건너뛴다 */
export const API_CONFIGURED = DEFAULT_API_BASE !== "";

/** Render 무료 플랜은 잠들었다 깨는 데 수십 초가 걸린다 — 기본 타임아웃을 그보다 길게 잡는다 */
const DEFAULT_TIMEOUT_MS = 60_000;

export interface ApiEnvelope<T = unknown> {
    success: boolean;
    message?: string;
    code?: number;
    data?: T;
    error?: string;
}

/**
 * 실패가 어느 층에서 났는지.
 * - network  : 응답 자체를 못 받음 — 오프라인, CORS 차단, mixed content, DNS
 * - timeout  : 제한 시간 초과 (콜드 스타트 포함)
 * - parse    : 응답이 JSON 이 아님
 * - http     : HTTP 4xx/5xx
 * - envelope : HTTP 는 2xx 인데 `success: false`
 * - shape    : 성공 응답인데 `data` 가 예상한 형식과 다름 (서버와 앱의 버전이 어긋났을 때)
 */
export type ApiFailureKind = "network" | "timeout" | "parse" | "http" | "envelope" | "shape";

export class ApiError extends Error {
    constructor(
        message: string,
        readonly kind: ApiFailureKind,
        readonly status?: number,
        readonly envelope?: ApiEnvelope,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestOptions {
    method: HttpMethod;
    /** `/api/...` — 경로 파라미터는 이미 치환된 상태로 받는다 */
    path: string;
    query?: Record<string, string | number | undefined>;
    /** JSON 본문 */
    json?: unknown;
    /** multipart 본문. Content-Type 은 브라우저가 boundary 와 함께 붙이므로 직접 넣지 않는다 */
    form?: FormData;
    token?: string;
    baseUrl?: string;
    timeoutMs?: number;
}

export interface RequestTrace {
    url: string;
    method: HttpMethod;
    ok: boolean;
    status?: number;
    durationMs: number;
    envelope?: ApiEnvelope;
    /** JSON 이 아닌 응답 본문 (parse 실패 시) */
    rawText?: string;
    failure?: { kind: ApiFailureKind; message: string };
}

export function buildUrl(baseUrl: string, path: string, query?: RequestOptions["query"]) {
    const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
    for (const [key, value] of Object.entries(query ?? {})) {
        if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
    return url.toString();
}

/**
 * multipart 요청의 `dto` 파트. 서버(Spring)는 이 파트의 Content-Type 이
 * application/json 이어야 객체로 읽는다 — 문자열로 append 하면 415 가 난다.
 */
export function jsonPart(value: unknown) {
    return new Blob([JSON.stringify(value)], { type: "application/json" });
}

export async function request({
    method,
    path,
    query,
    json,
    form,
    token,
    baseUrl = DEFAULT_API_BASE,
    timeoutMs = DEFAULT_TIMEOUT_MS,
}: RequestOptions): Promise<RequestTrace> {
    const startedAt = performance.now();
    const elapsed = () => Math.round(performance.now() - startedAt);

    let url: string;
    try {
        url = buildUrl(baseUrl, path, query);
    } catch {
        return {
            url: `${baseUrl}${path}`,
            method,
            ok: false,
            durationMs: 0,
            failure: { kind: "network", message: `API 주소가 올바르지 않습니다: "${baseUrl}"` },
        };
    }

    const headers: Record<string, string> = {};
    if (json !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    // AbortSignal.timeout() 은 iOS Safari 16 부터라 구형 기기를 위해 직접 건다
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
        let send: (url: string, init: RequestInit) => Promise<Response> = fetch;
        // 조건을 환경변수 그대로 적어야 번들러가 운영 빌드에서 모의 서버 코드를 통째로 뺀다
        if (process.env.NEXT_PUBLIC_API_MOCK === "true") send = (await import("./mock")).mockFetch;
        res = await send(url, {
            method,
            headers,
            body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
            signal: controller.signal,
            cache: "no-store",
        });
    } catch (error) {
        clearTimeout(timer);
        const timedOut = controller.signal.aborted;
        return {
            url,
            method,
            ok: false,
            durationMs: elapsed(),
            failure: timedOut
                ? { kind: "timeout", message: `${Math.round(timeoutMs / 1000)}초 안에 응답이 없습니다.` }
                : {
                      kind: "network",
                      // 브라우저는 CORS·mixed content·오프라인을 전부 같은 TypeError 로 뭉갠다
                      message: `응답을 받지 못했습니다 (${error instanceof Error ? error.message : String(error)}).`,
                  },
        };
    }

    const durationMs = elapsed();
    let text: string;
    try {
        text = await res.text();
    } catch {
        text = "";
    } finally {
        clearTimeout(timer);
    }

    let envelope: ApiEnvelope | undefined;
    try {
        envelope = text ? (JSON.parse(text) as ApiEnvelope) : undefined;
    } catch {
        return {
            url,
            method,
            ok: false,
            status: res.status,
            durationMs,
            rawText: text,
            failure: { kind: "parse", message: "응답이 JSON 이 아닙니다." },
        };
    }

    if (!res.ok) {
        return {
            url,
            method,
            ok: false,
            status: res.status,
            durationMs,
            envelope,
            failure: { kind: "http", message: envelope?.message ?? `HTTP ${res.status}` },
        };
    }

    if (envelope && envelope.success === false) {
        return {
            url,
            method,
            ok: false,
            status: res.status,
            durationMs,
            envelope,
            failure: { kind: "envelope", message: envelope.message ?? "success: false" },
        };
    }

    return { url, method, ok: true, status: res.status, durationMs, envelope };
}

/**
 * 화면용 — 봉투를 벗겨 `data` 를 돌려주고, 실패는 던진다.
 * `schema` 를 주면 `data` 를 그 형식으로 확인하고, 형식에 없는 필드는 버린다.
 */
export async function apiFetch<T = unknown>(options: RequestOptions, schema?: ZodType<T>): Promise<T> {
    const trace = await request(options);
    if (trace.failure) {
        throw new ApiError(trace.failure.message, trace.failure.kind, trace.status, trace.envelope);
    }
    if (!schema) return trace.envelope?.data as T;

    const parsed = schema.safeParse(trace.envelope?.data);
    if (!parsed.success) {
        throw new ApiError("응답이 예상한 형식과 다릅니다.", "shape", trace.status, trace.envelope);
    }
    return parsed.data;
}
