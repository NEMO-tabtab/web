import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fillEmptyFields, lookupBarcode } from "./barcode";
import { createMockFetch } from "./mock";

// 서버 주소는 모듈을 읽을 때 정해진다 — import 보다 먼저 넣는다
const BASE = vi.hoisted(() => (process.env.NEXT_PUBLIC_API_URL = "https://api.test"));
const mock = createMockFetch({ delayMs: 0 });

const respondWith = (status: number, body: unknown) =>
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(JSON.stringify(body), { status })),
    );

beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(mock));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("바코드 조회", () => {
    it("찾으면 이름·브랜드·모델명을 돌려준다", async () => {
        expect(await lookupBarcode(" 8801234567890 ")).toEqual({
            name: "네모 미니 피규어 시리즈 1",
            brandName: "네모토이",
            modelName: "NM-001",
        });
        expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe(`${BASE}/api/barcode/8801234567890`);
    });

    it("서버가 다른 필드 이름을 써도 읽는다 (UPCitemdb 식 title·brand·model)", async () => {
        respondWith(200, { success: true, data: { title: " 새우깡 ", brand: "농심", model: null, ean: "880" } });

        expect(await lookupBarcode("8801043014809")).toEqual({
            name: "새우깡",
            brandName: "농심",
            modelName: undefined,
        });
    });

    it("못 찾으면(명세대로 500) null", async () => {
        expect(await lookupBarcode("0000000000000")).toBeNull();
    });

    it("성공인데 쓸 만한 값이 없거나 data 가 없으면 null", async () => {
        expect(await lookupBarcode("7777000000000")).toBeNull();

        respondWith(200, { success: true, data: null });
        expect(await lookupBarcode("8801234567890")).toBeNull();
    });

    it("서버에 닿지 못하면 못 찾은 것으로 단정하지 않고 던진다", async () => {
        await expect(lookupBarcode("9999000000000")).rejects.toMatchObject({ name: "ApiError", kind: "network" });
    });

    it("data 가 객체가 아니면 형식 문제로 던진다", async () => {
        respondWith(200, { success: true, data: "새우깡" });
        await expect(lookupBarcode("8801234567890")).rejects.toMatchObject({ kind: "shape" });
    });

    it("주소에 넣을 수 없는 값은 서버를 부르지 않는다", async () => {
        expect(await lookupBarcode("../user/list")).toBeNull();
        expect(await lookupBarcode("")).toBeNull();
        expect(await lookupBarcode("https://example.com/qr?x=1")).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
    });

    it("너무 긴 값은 잘라서 받는다", async () => {
        respondWith(200, { success: true, data: { productNm: "가".repeat(500) } });
        expect((await lookupBarcode("8801234567890"))?.name).toHaveLength(100);
    });
});

describe("빈 칸만 채우기", () => {
    const empty = { name: "", brandName: "", modelName: "", memo: "" };
    const info = { name: "새우깡", brandName: "농심", modelName: undefined };

    it("비어 있는 칸을 채우고 무엇을 채웠는지 알려 준다", () => {
        expect(fillEmptyFields(empty, info)).toEqual({
            next: { name: "새우깡", brandName: "농심", modelName: "", memo: "" },
            filled: ["제품명", "브랜드"],
        });
    });

    it("사용자가 먼저 적은 값은 바꾸지 않는다", () => {
        const typed = { ...empty, name: "내 과자", memo: "선물" };

        expect(fillEmptyFields(typed, info)).toEqual({
            next: { name: "내 과자", brandName: "농심", modelName: "", memo: "선물" },
            filled: ["브랜드"],
        });
        expect(fillEmptyFields({ ...typed, brandName: "직접 적음" }, info).filled).toEqual([]);
    });

    it("공백만 있는 칸은 빈 칸으로 본다. 원래 값은 바꾸지 않는다", () => {
        const current = { ...empty, name: "   " };
        const { next } = fillEmptyFields(current, info);

        expect(next.name).toBe("새우깡");
        expect(current.name).toBe("   ");
    });
});
