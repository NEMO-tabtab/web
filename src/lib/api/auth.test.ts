import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as auth from "./auth";
import type { SignupInput } from "./auth";
import * as client from "./client";
import { ApiError } from "./client";
import { describeApiError } from "./errors";
import { createMockFetch, expected } from "./mock";

// 서버 주소는 모듈을 읽을 때 정해진다 — import 보다 먼저 넣는다
const BASE = vi.hoisted(() => (process.env.NEXT_PUBLIC_API_URL = "https://api.test"));
const mock = createMockFetch({ delayMs: 0 });

const member: SignupInput = {
    loginId: "nemo01",
    password: "password1",
    name: "네모",
    nickname: "네모",
    email: "nemo@example.com",
    gender: "F",
    zipcode: "06234",
    address: "서울시",
    addressSub: "101호",
};

/** 실패를 잡아 사용자 문구까지 바꿔 본다 */
async function failure(run: () => Promise<unknown>, overrides = {}) {
    try {
        await run();
    } catch (error) {
        return { error: error as ApiError, notice: describeApiError(error, overrides) };
    }
    throw new Error("실패해야 하는 호출이 성공했다");
}

beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(mock));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const call = <T>(run: (api: typeof auth) => Promise<T>) => run(auth);

describe("로그인", () => {
    it("성공하면 토큰과 앱이 쓰는 사용자 정보만 돌려준다", async () => {
        const data = await call((api) => api.login("nemo01", "password1"));

        expect(data.token.split(".")).toHaveLength(3);
        // 이메일·주소 같은 나머지 필드는 버린다
        expect(data.user).toEqual({ userIdx: 1, loginId: "nemo01", nickname: "길동이", profileImageUrl: undefined });
    });

    it("비밀번호가 틀리면 401 이고, 화면이 준 문구로 알린다", async () => {
        const { error, notice } = await failure(() => call((api) => api.login("nemo01", "wrong")), {
            401: "아이디 또는 비밀번호가 맞지 않아요.",
        });

        expect(error).toMatchObject({ name: "ApiError", kind: "http", status: 401 });
        expect(notice).toEqual({ message: "아이디 또는 비밀번호가 맞지 않아요.", retryable: false });
    });

    it("서버가 DB 에 연결하지 못하면 내부 정보 없이 서버 문제로 알린다", async () => {
        const { error, notice } = await failure(() => call((api) => api.login("down", "password1")), {
            401: "아이디 또는 비밀번호가 맞지 않아요.",
        });

        expect(error).toMatchObject({ kind: "http", status: 500 });
        expect(notice.retryable).toBe(true);
        expect(notice.message).toBe("서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.");
        expect(notice.message).not.toContain("JDBC");
    });

    it("응답을 못 받으면 연결 문제로 알린다", async () => {
        const { error, notice } = await failure(() => call((api) => api.login("offline", "password1")));

        expect(error.kind).toBe("network");
        expect(notice).toEqual({ message: "서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.", retryable: true });
    });

    it("성공 응답의 형식이 예상과 다르면 깨지지 않고 형식 문제로 알린다", async () => {
        const { error, notice } = await failure(() => call((api) => api.login("odd", "password1")));

        expect(error).toMatchObject({ kind: "shape", status: 200 });
        expect(notice.retryable).toBe(false);
        expect(notice.message).toContain("서버 응답을 읽지 못했어요");
    });
});

describe("회원가입", () => {
    it("dto 를 application/json 파트로 보낸다", async () => {
        await call((api) => api.signup(member));

        const [url, init] = vi.mocked(fetch).mock.calls[0];
        expect(String(url)).toBe(`${BASE}/api/user/insert`);
        const dto = (init?.body as FormData).get("dto") as Blob;
        expect(dto.type).toBe("application/json");
        expect(JSON.parse(await dto.text())).toEqual(member);
    });

    it("이미 쓰는 아이디면 서버가 한 말을 보여 준다 (내부 정보는 빼고)", async () => {
        const { error, notice } = await failure(() => call((api) => api.signup({ ...member, loginId: "taken" })));

        expect(error).toMatchObject({ kind: "http", status: 400 });
        expect(notice.message).toBe(expected.idTaken.message);
        expect(notice.message).not.toContain(expected.idTaken.error);
    });
});

describe("아이디 중복 확인", () => {
    it("쓸 수 있으면 available, 이미 있으면 taken", async () => {
        expect(await call((api) => api.checkLoginId("nemo01"))).toBe("available");
        expect(await call((api) => api.checkLoginId("taken"))).toBe("taken");
    });

    it("200 이어도 isAvailable 이 false 면 taken 이다 (실제 서버의 응답 방식)", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response(JSON.stringify(expected.idCheck("nemo01", false)), { status: 200 })),
        );
        expect(await auth.checkLoginId("nemo01")).toBe("taken");
    });

    it("isAvailable 이 없는 응답이면 available 로 단정하지 않고 던진다", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response(JSON.stringify(expected.ok("사용 가능한 아이디입니다.")), { status: 200 })),
        );
        await expect(auth.checkLoginId("nemo01")).rejects.toMatchObject({ kind: "shape" });
    });

    it("서버가 답하지 못하면 taken 으로 단정하지 않고 던진다", async () => {
        await expect(call((api) => api.checkLoginId("down"))).rejects.toMatchObject({ kind: "http", status: 500 });
    });
});

describe("오류 문구", () => {
    it("제한 시간을 넘기면 서버가 깨어나는 중이라고 알린다", async () => {
        vi.stubGlobal(
            "fetch",
            (_url: string, init: RequestInit) =>
                new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new Error()))),
        );
        const { error, notice } = await failure(() =>
            client.apiFetch({ method: "GET", path: "/api/health", timeoutMs: 5 }),
        );

        expect(error.kind).toBe("timeout");
        expect(notice).toEqual({ message: "서버가 깨어나는 중이에요. 1~2분 뒤 다시 시도해 주세요.", retryable: true });
    });

    it("JSON 이 아닌 응답(게이트웨이 오류 화면 등)", async () => {
        vi.stubGlobal("fetch", async () => new Response("<html>502</html>", { status: 502 }));
        const { error, notice } = await failure(() => client.apiFetch({ method: "GET", path: "/api/health" }));

        expect(error.kind).toBe("parse");
        expect(notice.retryable).toBe(false);
    });

    it("200 인데 success:false 면 서버가 한 말을 쓴다", async () => {
        vi.stubGlobal(
            "fetch",
            async () =>
                new Response(JSON.stringify({ success: false, message: "탈퇴한 지 30일이 지나지 않았습니다." })),
        );
        const { error, notice } = await failure(() => client.apiFetch({ method: "GET", path: "/api/user/checkId" }));

        expect(error.kind).toBe("envelope");
        expect(notice.message).toBe("탈퇴한 지 30일이 지나지 않았습니다.");
    });

    it("너무 긴 서버 문구와 ApiError 가 아닌 오류는 기본 문구로 바꾼다", () => {
        const long = new ApiError("x", "http", 400, { success: false, message: "가".repeat(200) });
        expect(describeApiError(long).message).toBe("요청을 처리하지 못했어요. 입력한 내용을 확인해 주세요.");
        expect(describeApiError(new Error("boom")).message).toBe("문제가 생겼어요. 다시 시도해 주세요.");
    });
});
