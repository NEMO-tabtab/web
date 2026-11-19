import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockFetch, expected, sample } from "./mock";
import {
    checkHealth,
    getServerAlarm,
    getServerCategory,
    getServerProduct,
    isNotFound,
    listServerAlarms,
    listServerCategories,
} from "./read";

// 서버 주소는 모듈을 읽을 때 정해진다 — import 보다 먼저 넣는다
const BASE = vi.hoisted(() => (process.env.NEXT_PUBLIC_API_URL = "https://api.test"));
const mock = createMockFetch({ delayMs: 0 });

const respondWith = (status: number, body: unknown) =>
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(JSON.stringify(body), { status })),
    );

const calledUrl = () => new URL(String(vi.mocked(fetch).mock.calls[0][0]));

beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(mock));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("서버 상태", () => {
    it("깨어 있으면 조용히 끝난다", async () => {
        await expect(checkHealth()).resolves.toBeUndefined();
        expect(calledUrl().href).toBe(`${BASE}/api/health`);
    });

    it("DB 에 연결하지 못한 서버는 실패로 본다", async () => {
        respondWith(500, expected.dbDown);
        await expect(checkHealth()).rejects.toMatchObject({ kind: "http", status: 500 });
    });
});

describe("상품 한 건", () => {
    it("값이 없는 필드는 null 로 오고, 형식에 없는 필드는 버린다", async () => {
        const product = await getServerProduct(1);

        expect(product).toMatchObject({ productIdx: 1, productNm: "맥북프로", productPrice: null, place: "책상" });
        expect(product).not.toHaveProperty("serialNo");
    });

    it("없는 상품은 200 에 data 없이 온다 — null", async () => {
        expect(await getServerProduct(999999)).toBeNull();
    });

    it("이름이 없는 상품은 형식 오류로 던진다", async () => {
        respondWith(200, expected.found({ ...sample.product, productNm: null }));
        await expect(getServerProduct(1)).rejects.toMatchObject({ kind: "shape" });
    });
});

describe("목록", () => {
    it("page·size 를 늘 넣어 보낸다 (빼면 서버가 빈 목록을 준다)", async () => {
        const page = await listServerCategories();

        expect(calledUrl().search).toBe("?page=1&size=20");
        expect(page).toMatchObject({ page: 1, size: 20, total: 3 });
        expect(page.content.map((category) => category.categoryNm)).toEqual(["전자기기", "의류", "취미"]);
    });

    it("쪽을 나눠 받는다", async () => {
        const page = await listServerCategories({ page: 2, size: 2 });
        expect(page.content.map((category) => category.categoryNm)).toEqual(["취미"]);
    });

    it("알람은 물건 번호로 거를 수 있다", async () => {
        const page = await listServerAlarms({ productIdx: 1 });

        expect(calledUrl().searchParams.get("productIdx")).toBe("1");
        expect(page.content[0]).toEqual(sample.alarms[0]);
    });

    it("content 가 배열이 아니면 형식 오류로 던진다", async () => {
        respondWith(200, expected.found({ content: null, page: 1, size: 20, total: 0 }));
        await expect(listServerAlarms()).rejects.toMatchObject({ kind: "shape" });
    });
});

describe("없음과 서버 고장 가르기", () => {
    it("없는 카테고리·알람은 500 으로 오지만 null 로 돌려준다", async () => {
        expect(await getServerCategory(999999)).toBeNull();
        expect(await getServerAlarm(999999)).toBeNull();
    });

    it("있는 것은 그대로 돌려준다", async () => {
        expect(await getServerCategory(1)).toEqual(sample.categories[0]);
        expect(await getServerAlarm(1)).toEqual(sample.alarms[0]);
    });

    it("DB 가 꺼진 500 은 없음으로 보지 않고 던진다", async () => {
        respondWith(500, expected.dbDown);

        const error = await getServerCategory(1).catch((caught: unknown) => caught);
        expect(error).toMatchObject({ kind: "http", status: 500 });
        expect(isNotFound(error)).toBe(false);
    });

    it("404 로 바뀌어도 없음으로 본다", async () => {
        respondWith(404, { success: false, message: "없음", code: 404 });
        expect(await getServerAlarm(1)).toBeNull();
    });
});
