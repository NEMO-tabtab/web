import { ApiError, apiFetch, jsonPart } from "./client";
import { loginDataSchema, loginIdCheckSchema, type LoginData } from "./schemas";

/*
 * 인증 호출. 화면은 fetch 를 직접 부르지 않고 여기를 거친다.
 *
 * 명세에 없어 가정한 것 (실제 응답을 보면 고친다):
 * - 로그인 실패는 401 또는 400, 혹은 200 에 success:false 로 온다
 * - 가입할 때 아이디 중복은 400·409, 혹은 200 에 success:false 로 온다
 *
 * 실제 응답으로 확인한 것 (2026-11-19):
 * - 아이디 중복 확인은 중복이어도 200 이고, 쓸 수 있는지는 data.isAvailable 에 담긴다
 */

export function login(loginId: string, password: string): Promise<LoginData> {
    return apiFetch({ method: "POST", path: "/api/user/login", json: { loginId, password } }, loginDataSchema);
}

/** 명세의 UserWrite 중 가입 화면이 받는 것 */
export interface SignupInput {
    loginId: string;
    password: string;
    name: string;
    nickname: string;
    email: string;
    gender: string;
    zipcode: string;
    address: string;
    addressSub: string;
}

export async function signup(input: SignupInput): Promise<void> {
    const form = new FormData();
    form.append("dto", jsonPart(input));
    await apiFetch({ method: "POST", path: "/api/user/insert", form });
}

/** 서버가 요청을 받아들이지 않았다 — 입력(아이디·비밀번호·중복)의 문제 */
export function isRejected(error: unknown): boolean {
    if (!(error instanceof ApiError)) return false;
    if (error.kind === "envelope") return true;
    return error.kind === "http" && (error.status === 400 || error.status === 401 || error.status === 409);
}

/** 쓸 수 있는 아이디인지. 서버가 답하지 못하면(꺼짐·지연) 던진다 — 부르는 쪽은 "모름"으로 다룬다 */
export async function checkLoginId(loginId: string): Promise<"available" | "taken"> {
    const data = await apiFetch({ method: "GET", path: "/api/user/checkId", query: { loginId } }, loginIdCheckSchema);
    return data.isAvailable ? "available" : "taken";
}
