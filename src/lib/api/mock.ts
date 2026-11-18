import type { ApiEnvelope } from "./client";

/*
 * 모의 서버 — 명세에 적힌 예상 응답을 돌려준다. `NEXT_PUBLIC_API_MOCK=true` 일 때만 쓰이고,
 * 같은 응답을 테스트가 함께 쓴다. 실제 응답을 보게 되면 여기와 schemas.ts 를 같이 고친다.
 *
 * 입력값으로 상황을 고른다:
 *   아이디 `taken`    — 이미 쓰는 아이디 (중복 확인·가입 400)
 *   아이디 `down`     — 서버가 DB 에 연결하지 못함 (2026-11 에 실제로 본 500 응답)
 *   아이디 `offline`  — 응답 자체를 못 받음
 *   아이디 `odd`      — 성공인데 data 가 예상과 다른 형식
 *   비밀번호 `wrong`  — 로그인 401
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
    /** 2026-11-18·19 에 실제 서버가 돌려준 응답 */
    dbDown: {
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
        code: 500,
        error: "org.springframework.jdbc.CannotGetJdbcConnectionException: Failed to obtain JDBC Connection",
    },
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

        switch (route) {
            case "POST /api/user/login":
                if (dto.password === "wrong") return json(401, expected.loginWrong);
                if (loginId === "odd") return json(200, expected.oddShape);
                return json(200, expected.loginOk(loginId));
            case "GET /api/user/checkId":
                if (loginId === "taken") return json(400, expected.idTaken);
                return json(200, expected.ok("사용 가능한 아이디입니다."));
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
