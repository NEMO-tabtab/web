import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    clearBarcodeCache,
    contributeBarcode,
    contributionPayload,
    fillEmptyFields,
    lookupBarcode,
    shouldOfferContribution,
    tidyContributionText,
} from "./barcode";
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
    clearBarcodeCache();
    vi.stubGlobal("fetch", vi.fn(mock));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("조회 결과 기억", () => {
    it("스캐너와 등록 화면이 이어서 물어도 서버는 한 번만 부른다", async () => {
        const first = await lookupBarcode("8801234567890");
        const second = await lookupBarcode("8801234567890");

        expect(second).toEqual(first);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("조회 중에 또 물으면 같은 요청을 함께 기다린다", async () => {
        const [first, second] = await Promise.all([lookupBarcode("8801234567890"), lookupBarcode("8801234567890")]);

        expect(second).toEqual(first);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("못 찾은 것은 1분만 기억한다", async () => {
        expect(await lookupBarcode("0000000000000", 0)).toBeNull();
        expect(await lookupBarcode("0000000000000", 30_000)).toBeNull();
        expect(fetch).toHaveBeenCalledTimes(1);

        expect(await lookupBarcode("0000000000000", 61_000)).toBeNull();
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("연결 실패는 기억하지 않는다 — 다시 물으면 다시 부른다", async () => {
        await expect(lookupBarcode("9999000000000")).rejects.toMatchObject({ kind: "network" });
        await expect(lookupBarcode("9999000000000")).rejects.toMatchObject({ kind: "network" });
        expect(fetch).toHaveBeenCalledTimes(2);
    });
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

describe("못 찾은 바코드 공유하기", () => {
    /** fetch 로 나간 요청 중 바코드 등록만 골라 본문을 읽는다 */
    const sentBodies = () =>
        vi
            .mocked(fetch)
            .mock.calls.filter(([url, init]) => String(url).endsWith("/api/barcode/insert") && init?.method === "POST")
            .map(([, init]) => JSON.parse(String(init?.body)));

    it("바코드·제품명·브랜드만 보낸다", async () => {
        expect(
            await contributeBarcode({ barcode: "4570117912345", name: "치이카와 마스코트", brandName: "BANDAI" }),
        ).toBe("saved");

        expect(vi.mocked(fetch).mock.calls[0][0]).toBe(`${BASE}/api/barcode/insert`);
        expect(sentBodies()).toEqual([{ barcode: "4570117912345", productNm: "치이카와 마스코트", brandNm: "BANDAI" }]);
    });

    it("빈 브랜드는 보내지 않는다", async () => {
        await contributeBarcode({ barcode: "4570117912345", name: "치이카와", brandName: "  " });

        expect(sentBodies()).toEqual([{ barcode: "4570117912345", productNm: "치이카와" }]);
    });

    it("올린 뒤에는 같은 바코드를 다시 물어도 서버를 부르지 않고 올린 값을 준다", async () => {
        expect(await lookupBarcode("0000117912345")).toBeNull();
        await contributeBarcode({ barcode: "0000117912345", name: "치이카와", brandName: "BANDAI" });

        expect(await lookupBarcode("0000117912345")).toEqual({ name: "치이카와", brandName: "BANDAI" });
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("이미 누가 올렸으면(409) 덮어쓰지 않았다고 알리고, 다음 조회는 서버에 다시 묻는다", async () => {
        respondWith(500, { success: false, message: "요청 처리 중 오류가 발생했습니다.", code: 500 });
        expect(await lookupBarcode("8888117912345")).toBeNull(); // 못 찾음 — 1분 동안 기억한다

        vi.stubGlobal("fetch", vi.fn(mock));
        expect(await contributeBarcode({ barcode: "8888117912345", name: "새 이름" })).toBe("exists");

        // 그사이 올라간 값을 받는다 (모의 서버의 조회는 찾은 것으로 답한다)
        expect(await lookupBarcode("8888117912345")).not.toBeNull();
        expect(fetch).toHaveBeenCalledTimes(2); // 등록 + 다시 조회
    });

    it("서버에 닿지 못하거나 서버가 고장이면 던진다 — 화면이 다시 시도를 띄운다", async () => {
        await expect(contributeBarcode({ barcode: "9999117912345", name: "치이카와" })).rejects.toMatchObject({
            kind: "network",
        });

        respondWith(500, { success: false, message: "요청 처리 중 오류가 발생했습니다.", code: 500 });
        await expect(contributeBarcode({ barcode: "4570117912345", name: "치이카와" })).rejects.toMatchObject({
            kind: "http",
            status: 500,
        });
    });

    it("올릴 수 없는 값이면 서버를 부르지 않는다", async () => {
        await expect(contributeBarcode({ barcode: "4570/117912345", name: "치이카와" })).rejects.toThrow(RangeError);
        await expect(contributeBarcode({ barcode: "4570117912345", name: "   " })).rejects.toThrow(RangeError);
        expect(fetch).not.toHaveBeenCalled();
    });
});

describe("올릴 값 다듬기", () => {
    it("앞뒤 공백·줄바꿈·연속 공백을 정리한다", () => {
        expect(
            contributionPayload({ barcode: " 4570117912345 ", name: " 치이카와\n  마스코트 ", brandName: "\tBANDAI " }),
        ).toEqual({
            barcode: "4570117912345",
            name: "치이카와 마스코트",
            brandName: "BANDAI",
        });
    });

    it("서버 한도(50자)를 넘는 이름은 자른다 — 이모지를 반쪽으로 남기지 않는다", () => {
        const long = contributionPayload({ barcode: "4570117912345", name: "가".repeat(60) });
        expect(long?.name).toHaveLength(50);

        const emoji = contributionPayload({ barcode: "4570117912345", name: `${"가".repeat(49)}🐻` });
        expect(emoji?.name).toBe("가".repeat(49));
    });

    it("표기가 갈라지는 글자(원 숫자·전각·반각 가타카나)는 한 가지로 맞추고, 한글 자모는 그대로 둔다", () => {
        expect(
            contributionPayload({ barcode: "4570117912345", name: "ﾁｲｶﾜ ﾏｽｺｯﾄ ｶﾞﾁｬ ③", brandName: "ＢＡＮＤＡＩ" }),
        ).toEqual({ barcode: "4570117912345", name: "チイカワ マスコット ガチャ 3", brandName: "BANDAI" });

        expect(contributionPayload({ barcode: "4570117912345", name: "ㅋㅋ 키링 ⑫" })?.name).toBe("ㅋㅋ 키링 12");
    });

    it("칸에서 손을 뗐을 때 넣을 값은 보낼 값과 같다", () => {
        expect(tidyContributionText(" 치이카와\n  마스코트 ①")).toBe("치이카와 마스코트 1");
        expect(tidyContributionText(" \t ")).toBe("");
    });

    it("서버가 받지 않는 바코드(30자 넘음·다른 글자)나 빈 이름이면 null", () => {
        expect(contributionPayload({ barcode: "1".repeat(31), name: "이름" })).toBeNull();
        expect(contributionPayload({ barcode: "123", name: "이름" })).toBeNull();
        expect(contributionPayload({ barcode: "4570 117912345", name: "이름" })).toBeNull();
        expect(contributionPayload({ barcode: "4570117912345", name: "\n " })).toBeNull();
    });
});

describe("올릴지 물을 때", () => {
    const saved = { barcode: "4570117912345", name: "치이카와", brandName: "" };

    it("서버가 못 찾은 바코드를 그대로 저장했을 때만 묻는다", () => {
        expect(shouldOfferContribution("4570117912345", saved)).toBe(true);
        expect(shouldOfferContribution("4570117912345", { ...saved, barcode: " 4570117912345 " })).toBe(true);
    });

    it("조회가 못 찾음으로 끝나지 않았으면(찾음·실패·오프라인·직접 입력) 묻지 않는다", () => {
        expect(shouldOfferContribution(null, saved)).toBe(false);
    });

    it("저장 전에 바코드 칸을 고쳤으면 묻지 않는다", () => {
        expect(shouldOfferContribution("4570117912345", { ...saved, barcode: "4570117999999" })).toBe(false);
        expect(shouldOfferContribution("4570117912345", { ...saved, barcode: "" })).toBe(false);
    });

    it("올릴 수 없는 값이면 묻지 않는다", () => {
        expect(shouldOfferContribution("1".repeat(31), { ...saved, barcode: "1".repeat(31) })).toBe(false);
    });
});
