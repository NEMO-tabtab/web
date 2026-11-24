import type { ApiEnvelope } from "./client";

/*
 * 모의 서버 — 명세에 적힌 예상 응답을 돌려준다. `NEXT_PUBLIC_API_MOCK=true` 일 때만 쓰이고,
 * 같은 응답을 테스트가 함께 쓴다. 실제 응답을 보게 되면 여기와 schemas.ts 를 같이 고친다.
 *
 * 입력값으로 상황을 고른다:
 *   아이디 `taken`    — 이미 쓰는 아이디 (중복 확인은 200 에 isAvailable:false, 가입은 400)
 *   아이디 `down`     — 서버가 DB 에 연결하지 못함 (2026-11 에 실제로 본 500 응답)
 *   아이디 `offline`  — 응답 자체를 못 받음
 *   아이디 `odd`      — 성공인데 data 가 예상과 다른 형식
 *   비밀번호 `wrong`  — 로그인 401
 *   바코드 `0000…`    — 못 찾음 (명세대로 500)
 *   바코드 `9999…`    — 응답 자체를 못 받음
 *   바코드 `7777…`    — 성공인데 쓸 만한 값이 없음
 *   바코드 등록 `8888…` — 이미 누가 올린 바코드 (409)
 *   바코드 등록 `9999…` — 응답 자체를 못 받음
 *   번호 `999999`     — 없는 상품·카테고리·알람
 */

const json = (status: number, body: ApiEnvelope) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const base64Url = (value: string) => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** 서명이 가짜인 JWT 모양 토큰. 만료(exp)만 진짜처럼 넣는다 */
export function fakeToken(userIdx: number, expiresAt: number): string {
    const header = base64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
    const payload = base64Url(JSON.stringify({ sub: String(userIdx), exp: Math.floor(expiresAt / 1000) }));
    return `${header}.${payload}.mock`;
}

/** 실제 서버가 돌려준 data 를 옮긴 것 (2026-11-19) */
export const sample = {
    product: {
        productIdx: 1,
        userIdx: 1,
        productNm: "맥북프로",
        productPrice: null,
        productValue: null,
        productCnt: null,
        status: null,
        serialNo: null,
        modelNm: null,
        brandNm: null,
        barcodeIdx: null,
        prchPlace: null,
        content: "회사 업무용",
        information: null,
        selCategory: null,
        selTag: null,
        carrotYn: null,
        prchDate: null,
        regDate: "2026-07-24 04:26:29",
        updDate: "2026-08-29 09:00:59",
        delDate: null,
        files: [],
        categoryIdx: 1,
        barcode: "880100000001",
        place: "책상",
        placeSub: "왼쪽서랍",
    },
    categories: [
        { categoryIdx: 1, userIdx: 1, categoryNm: "전자기기", emoji: "💻", color: "#3B82F6" },
        { categoryIdx: 5, userIdx: 3, categoryNm: "의류", emoji: "👕", color: "#F97316" },
        { categoryIdx: 4, userIdx: 2, categoryNm: "취미", emoji: "🎮", color: "#A855F7" },
    ],
    alarms: [
        {
            alarmIdx: 1,
            productIdx: 1,
            title: "위치변경",
            content: "맥북 위치가 변경되었습니다.",
            regDate: "2026-07-24 04:26:29",
        },
        {
            alarmIdx: 2,
            productIdx: 2,
            title: "재고확인",
            content: "아이폰 등록이 완료되었습니다.",
            regDate: "2026-07-24 04:26:29",
        },
    ],
};

export const expected = {
    loginOk: (loginId: string, now: number = Date.now()): ApiEnvelope => ({
        success: true,
        message: "로그인이 완료되었습니다.",
        code: 200,
        data: {
            token: fakeToken(1, now + 24 * 60 * 60 * 1000),
            // 명세의 UserRead 예시 값
            user: {
                userIdx: 1,
                loginId,
                name: "홍길동",
                nickname: "길동이",
                email: "user@example.com",
                gender: "M",
                credits: 0,
                zipcode: "06234",
                address: "서울시 강남구",
                addressSub: "101호",
                loginType: "0001",
                loginTypeNm: "일반회원",
                exitYn: "N",
                profileImageUrl: null,
                regDate: "2026-08-01T10:30:00",
            },
        },
    }),
    loginWrong: {
        success: false,
        message: "아이디 또는 비밀번호가 올바르지 않습니다.",
        code: 401,
        error: "Bad credentials",
    },
    idTaken: {
        success: false,
        message: "이미 사용 중인 아이디입니다.",
        code: 400,
        error: "loginId duplicated",
    },
    ok: (message: string): ApiEnvelope => ({ success: true, message, code: 200 }),
    /** 실제 응답 형식 (2026-11-19). 중복일 때의 message 는 보지 못해 짐작한 것 */
    idCheck: (loginId: string, isAvailable: boolean): ApiEnvelope => ({
        success: true,
        message: isAvailable ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다.",
        code: 200,
        data: { isAvailable, loginId, canRejoin: false },
    }),
    /** 2026-11-18·19 에 실제 서버가 돌려준 응답 */
    dbDown: {
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
        code: 500,
        error: "org.springframework.jdbc.CannotGetJdbcConnectionException: Failed to obtain JDBC Connection",
    },
    /** 실제 응답의 필드는 barcode·productNm·type·color·brandNm 이다 (2026-11-19). modelNm 은 오지 않았다 */
    barcodeOk: (barcode: string): ApiEnvelope => ({
        success: true,
        message: "조회되었습니다.",
        code: 200,
        data: {
            barcodeIdx: 1,
            barcode,
            productNm: "네모 미니 피규어 시리즈 1",
            brandNm: "네모토이",
            modelNm: "NM-001",
        },
    }),
    barcodeEmpty: { success: true, message: "조회되었습니다.", code: 200, data: { barcodeIdx: 2, productNm: "" } },
    /** 실제 응답 (2026-11-19) */
    barcodeNotFound: {
        success: false,
        message: "요청 처리 중 오류가 발생했습니다.",
        code: 500,
        error: "등록된 바코드 정보를 찾을 수 없습니다.",
    },
    /** 바코드 등록 (NEMO-tabtab/api#4) — 서버 코드의 응답을 옮긴 것 */
    barcodeSaved: (data: unknown): ApiEnvelope => ({ success: true, message: "등록되었습니다.", code: 200, data }),
    barcodeExists: {
        success: false,
        message: "이미 등록된 바코드입니다.",
        code: 409,
        error: "이미 등록된 바코드입니다.",
    },
    /* 아래는 실제 응답을 옮긴 것 (2026-11-19) */
    health: { success: true, message: "ok", code: 200 },
    found: (data: unknown): ApiEnvelope => ({ success: true, message: "조회되었습니다.", code: 200, data }),
    /** 없는 상품 — 200 인데 data 가 없다 */
    productMissing: { success: true, message: "조회되었습니다.", code: 200 },
    /** 없는 카테고리·알람 — 500 */
    notFound: (what: string): ApiEnvelope => ({
        success: false,
        message: "요청 처리 중 오류가 발생했습니다.",
        code: 500,
        error: `${what} 정보를 찾을 수 없습니다.`,
    }),
    oddShape: { success: true, message: "로그인이 완료되었습니다.", code: 200, data: { accessToken: "x" } },
    notMocked: { success: false, message: "모의 서버에 없는 호출입니다.", code: 501 },
} satisfies Record<string, ApiEnvelope | ((...args: never[]) => ApiEnvelope)>;

async function readDto(body: BodyInit | null | undefined): Promise<Record<string, unknown>> {
    try {
        if (typeof body === "string") return JSON.parse(body);
        if (body instanceof FormData) {
            const dto = body.get("dto");
            return dto instanceof Blob ? JSON.parse(await dto.text()) : {};
        }
    } catch {
        // 아래에서 빈 값으로 다룬다
    }
    return {};
}

export function createMockFetch({ delayMs }: { delayMs: number }) {
    return async function mockFetch(input: string | URL, init: RequestInit = {}): Promise<Response> {
        if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));

        const url = new URL(String(input));
        const route = `${init.method ?? "GET"} ${url.pathname}`;
        const dto = await readDto(init.body);
        const loginId = String(dto.loginId ?? url.searchParams.get("loginId") ?? "");

        if (loginId === "offline") throw new TypeError("Failed to fetch");
        if (loginId === "down") return json(500, expected.dbDown);

        if (init.method === undefined || init.method === "GET") {
            const barcode = /^\/api\/barcode\/([^/]+)$/.exec(url.pathname)?.[1];
            if (barcode !== undefined) {
                if (barcode.startsWith("9999")) throw new TypeError("Failed to fetch");
                if (barcode.startsWith("0000")) return json(500, expected.barcodeNotFound);
                if (barcode.startsWith("7777")) return json(200, expected.barcodeEmpty);
                return json(200, expected.barcodeOk(decodeURIComponent(barcode)));
            }

            const one = /^\/api\/(product|category|alarm)\/(\d+)$/.exec(url.pathname);
            if (one) {
                const missing = one[2] === "999999";
                if (one[1] === "product") {
                    return json(200, missing ? expected.productMissing : expected.found(sample.product));
                }
                if (one[1] === "category") {
                    return missing
                        ? json(500, expected.notFound("카테고리"))
                        : json(200, expected.found(sample.categories[0]));
                }
                return missing ? json(500, expected.notFound("알람")) : json(200, expected.found(sample.alarms[0]));
            }

            const list = /^\/api\/(category|alarm)\/list$/.exec(url.pathname)?.[1];
            if (list !== undefined) {
                const all: unknown[] = list === "category" ? sample.categories : sample.alarms;
                // 실제 서버처럼 page·size 를 빼면 빈 목록을 준다
                const page = Number(url.searchParams.get("page") ?? 0);
                const size = Number(url.searchParams.get("size") ?? 0);
                const content = all.slice((page - 1) * size, page * size);
                return json(200, expected.found({ content, page, size, total: all.length }));
            }
        }

        switch (route) {
            case "POST /api/user/login":
                if (dto.password === "wrong") return json(401, expected.loginWrong);
                if (loginId === "odd") return json(200, expected.oddShape);
                return json(200, expected.loginOk(loginId));
            case "POST /api/barcode/insert": {
                const barcode = String(dto.barcode ?? "");
                if (barcode.startsWith("9999")) throw new TypeError("Failed to fetch");
                if (barcode.startsWith("8888")) return json(409, expected.barcodeExists);
                return json(
                    200,
                    expected.barcodeSaved({
                        barcode,
                        productNm: dto.productNm ?? null,
                        type: null,
                        color: null,
                        brandNm: dto.brandNm ?? null,
                    }),
                );
            }
            case "GET /api/health":
                return json(200, expected.health);
            case "GET /api/user/checkId":
                return json(200, expected.idCheck(loginId, loginId !== "taken"));
            case "POST /api/user/insert":
                if (loginId === "taken") return json(400, expected.idTaken);
                return json(200, expected.ok("회원가입이 완료되었습니다."));
            default:
                return json(501, expected.notMocked);
        }
    };
}

/** 화면용 — 누르고 기다리는 느낌이 나도록 조금 늦게 답한다 */
export const mockFetch = createMockFetch({ delayMs: 400 });
