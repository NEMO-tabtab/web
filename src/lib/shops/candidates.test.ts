import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    applyReviewed,
    isCandidate,
    mergeCandidates,
    splitCsvLine,
    toCandidate,
} from "../../../scripts/shops/candidates.mjs";
import { shopListSchema } from "./schema";

/** 상가정보 한 줄 — 검사에 쓰는 칸만 */
const row = (over: Record<string, string> = {}) => ({
    상가업소번호: "MA010120220805228047",
    상호명: "네모가챠",
    지점명: "",
    상권업종대분류명: "소매",
    상권업종소분류명: "장난감 소매업",
    시도명: "서울특별시",
    도로명주소: "서울특별시 마포구 어울마당로 1",
    지번주소: "서울특별시 마포구 서교동 1-1",
    건물명: "",
    층정보: "2",
    경도: "126.92",
    위도: "37.55",
    ...over,
});

describe("CSV 한 줄 나누기", () => {
    it("따옴표 안의 쉼표와 따옴표를 칸 안의 글자로 둔다", () => {
        expect(splitCsvLine('a,"b,c","d ""e""",,f')).toEqual(["a", "b,c", 'd "e"', "", "f"]);
    });
});

describe("후보 고르기", () => {
    it.each(["네모가챠", "갓챠겟챠", "가차토이구디점", "미도Gacha", "달천캡슐토이", "캡슐 토이샵"])(
        "%s 는 후보다",
        (name) => {
            expect(isCandidate(row({ 상호명: name }))).toBe(true);
        },
    );

    it("지점명에만 있어도 후보다", () => {
        expect(isCandidate(row({ 상호명: "토이랜드", 지점명: "가챠점" }))).toBe(true);
    });

    it.each(["엄마가차린밥상연동점", "고려종가차례상", "뚜껑열려내가차린PC방", "인형뽑기방"])(
        "%s 는 후보가 아니다",
        (name) => {
            expect(isCandidate(row({ 상호명: name }))).toBe(false);
        },
    );

    it("음식점은 이름이 맞아도 뺀다", () => {
        expect(isCandidate(row({ 상호명: "카페인가챠", 상권업종대분류명: "음식" }))).toBe(false);
    });
});

describe("후보로 바꾸기", () => {
    it("상가업소번호로 id 를 만들고 층을 읽기 좋게 바꾼다", () => {
        expect(toCandidate(row({ 지점명: "홍대점", 건물명: "네모빌딩" }))).toEqual({
            review: "todo",
            id: "sb-ma010120220805228047",
            name: "네모가챠 홍대점",
            address: "서울특별시 마포구 어울마당로 1",
            floorNote: "2층",
            lat: 37.55,
            lng: 126.92,
            sido: "서울특별시",
            category: "장난감 소매업",
            building: "네모빌딩",
        });
    });

    it("지하·모르는 층·도로명주소가 없는 곳", () => {
        expect(toCandidate(row({ 층정보: "지" }))?.floorNote).toBe("지하");
        expect(toCandidate(row({ 층정보: "" }))?.floorNote).toBeUndefined();
        expect(toCandidate(row({ 도로명주소: "" }))?.address).toBe("서울특별시 마포구 서교동 1-1");
    });

    it("이름에 이미 든 지점명은 다시 붙이지 않는다", () => {
        expect(toCandidate(row({ 상호명: "네모가챠홍대점", 지점명: "홍대점" }))?.name).toBe("네모가챠홍대점");
    });

    it("좌표가 없으면 후보로 만들지 않는다", () => {
        expect(toCandidate(row({ 위도: "" }))).toBeNull();
    });
});

describe("검수 파일에 합치기", () => {
    const a = toCandidate(row())!;
    const b = toCandidate(row({ 상가업소번호: "MA02", 상호명: "두모가챠", 도로명주소: "서울특별시 중구 명동길 1" }))!;

    it("검수한 결과와 고친 이름을 덮어쓰지 않는다", () => {
        const reviewed = { ...a, review: "ok" as const, name: "네모가챠 본점", note: "2026-11 방문" };
        const { candidates, added } = mergeCandidates([reviewed], [a, b], ["서울특별시"]);
        expect(candidates.find((each) => each.id === a.id)).toEqual(reviewed);
        expect(added).toEqual([b]);
    });

    it("같은 이름·같은 주소로 두 번 등록된 곳은 하나만 남긴다", () => {
        const twin = { ...a, id: "sb-twin", category: "기념품점" };
        expect(mergeCandidates([], [a, twin], ["서울특별시"]).candidates).toEqual([a]);
    });

    it("이번 자료에 없는 후보는 지우지 않고 알려 준다 — 뽑은 시도 안에서만", () => {
        const busan = { ...b, id: "sb-busan", sido: "부산광역시" };
        const { candidates, gone } = mergeCandidates([a, busan], [], ["서울특별시"]);
        expect(candidates).toHaveLength(2);
        expect(gone).toEqual([a]);
    });
});

describe("굿즈샵 목록에 싣기", () => {
    const index = {
        schemaVersion: 1,
        shops: [{ id: "nemo-virtual", name: "예시", address: "없음", lat: 37, lng: 127, layoutVersion: 1 }],
    };
    const ok = { ...toCandidate(row())!, review: "ok" as const };
    const no = { ...toCandidate(row({ 상가업소번호: "MA03" }))!, review: "no" as const };

    it("검수를 통과한 것만, 지도에 필요한 칸만 더한다", () => {
        const { index: next, added } = applyReviewed(index, [ok, no]);
        expect(added).toEqual([
            { id: ok.id, name: ok.name, address: ok.address, floorNote: "2층", lat: ok.lat, lng: ok.lng },
        ]);
        expect(shopListSchema.safeParse(next).success).toBe(true);
    });

    it("이미 목록에 있는 굿즈샵은 건드리지 않는다", () => {
        const once = applyReviewed(index, [ok]).index;
        expect(applyReviewed(once, [{ ...ok, name: "바뀐 이름" }]).index).toEqual(once);
    });
});

describe("저장소의 검수 파일(scripts/shops/candidates.json)", () => {
    const file = JSON.parse(readFileSync(path.join(process.cwd(), "scripts/shops/candidates.json"), "utf8"));

    it("모두 통과시켜도 굿즈샵 목록 형식에 맞는다", () => {
        const all = file.candidates.map((each: object) => ({ ...each, review: "ok" }));
        const { index } = applyReviewed({ schemaVersion: 1, shops: [] }, all);
        const parsed = shopListSchema.safeParse(index);
        expect(parsed.success ? null : parsed.error.issues[0]).toBeNull();
    });

    it("검수 결과는 todo·ok·no 중 하나다", () => {
        expect(
            file.candidates.filter((each: { review: string }) => !["todo", "ok", "no"].includes(each.review)),
        ).toEqual([]);
    });
});
