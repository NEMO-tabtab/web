import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    applyReviewed,
    assignIds,
    matchCandidate,
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
    시군구코드: "11440",
    시군구명: "마포구",
    도로명주소: "서울특별시 마포구 어울마당로 1",
    지번주소: "서울특별시 마포구 서교동 1-1",
    건물명: "",
    층정보: "2",
    경도: "126.92",
    위도: "37.55",
    ...over,
});
const candidate = (over: Record<string, string> = {}) => toCandidate(row(over))!;
const kindOf = (over: Record<string, string>) => matchCandidate(row(over))?.kind ?? null;

describe("CSV 한 줄 나누기", () => {
    it("따옴표 안의 쉼표와 따옴표를 칸 안의 글자로 둔다", () => {
        expect(splitCsvLine('a,"b,c","d ""e""",,f')).toEqual(["a", "b,c", 'd "e"', "", "f"]);
    });
});

describe("후보 고르기", () => {
    it.each(["네모가챠", "갓챠겟챠", "가차토이구디점", "미도Gacha", "달천캡슐토이", "캡슐 토이샵"])(
        "%s 는 가챠 가게다",
        (name) => {
            expect(kindOf({ 상호명: name })).toBe("gacha");
        },
    );

    it("지점명에만 있어도 후보다", () => {
        expect(kindOf({ 상호명: "토이랜드", 지점명: "가챠점" })).toBe("gacha");
    });

    it.each(["대빵인형뽑기고대점", "뽑아핑대학로", "뽑짱", "캐치팡 오목교점", "캐칭덕성대점", "크레인짱"])(
        "%s 는 뽑기 가게다",
        (name) => {
            expect(kindOf({ 상호명: name, 상권업종대분류명: "예술·스포츠", 상권업종소분류명: "전자 게임장" })).toBe(
                "claw",
            );
        },
    );

    it("가챠와 뽑기가 함께 든 이름은 가챠 가게로 본다", () => {
        expect(kindOf({ 상호명: "가차가차뽑기방" })).toBe("gacha");
    });

    it("캐치·크레인은 오락·장난감 업종일 때만 본다", () => {
        expect(kindOf({ 상호명: "젬크레인", 상권업종소분류명: "시계/귀금속 소매업" })).toBeNull();
        expect(
            kindOf({ 상호명: "캐치필라테스", 상권업종대분류명: "예술·스포츠", 상권업종소분류명: "스쿼시/라켓볼장" }),
        ).toBeNull();
    });

    it("프랜차이즈 지점은 이름에 뽑기가 없어도 후보다 — 오락·장난감 업종일 때만", () => {
        const arcade = { 상권업종대분류명: "예술·스포츠", 상권업종소분류명: "전자 게임장" };
        expect(matchCandidate(row({ 상호명: "블링팝", ...arcade }))).toEqual({ kind: "franchise", matched: "블링팝" });
        expect(kindOf({ 상호명: "봉봉 스테이션 응암점", ...arcade })).toBe("franchise");
        expect(kindOf({ 상호명: "반다이남코캡슐6" })).toBe("franchise");
        expect(kindOf({ 상호명: "미니돌", 상권업종소분류명: "액세서리/잡화 소매업" })).toBeNull();
    });

    it.each(["엄마가차린밥상연동점", "고려종가차례상", "뚜껑열려내가차린PC방", "토이랜드"])(
        "%s 는 후보가 아니다",
        (name) => {
            expect(kindOf({ 상호명: name })).toBeNull();
        },
    );

    it("음식점은 이름이 맞아도 뺀다", () => {
        expect(kindOf({ 상호명: "카페인가챠", 상권업종대분류명: "음식" })).toBeNull();
        expect(kindOf({ 상호명: "뽑기분식", 상권업종대분류명: "음식" })).toBeNull();
    });
});

describe("후보로 바꾸기", () => {
    it("지점명을 붙이고 층을 읽기 좋게 바꾼다. id 는 아직 없다", () => {
        expect(toCandidate(row({ 지점명: "홍대점", 건물명: "네모빌딩" }))).toEqual({
            review: "todo",
            sourceId: "MA010120220805228047",
            kind: "gacha",
            matched: "가챠",
            name: "네모가챠 홍대점",
            address: "서울특별시 마포구 어울마당로 1",
            floorNote: "2층",
            lat: 37.55,
            lng: 126.92,
            sido: "서울특별시",
            sigungu: "마포구",
            region: "11440",
            category: "장난감 소매업",
            building: "네모빌딩",
        });
    });

    it("지하·모르는 층·도로명주소가 없는 곳", () => {
        expect(candidate({ 층정보: "지" }).floorNote).toBe("지하");
        expect(candidate({ 층정보: "" }).floorNote).toBeUndefined();
        expect(candidate({ 도로명주소: "" }).address).toBe("서울특별시 마포구 서교동 1-1");
    });

    it("이름에 이미 든 지점명은 다시 붙이지 않는다", () => {
        expect(candidate({ 상호명: "네모가챠홍대점", 지점명: "홍대점" }).name).toBe("네모가챠홍대점");
    });

    it("후보가 아니거나 좌표·지역코드가 없으면 만들지 않는다", () => {
        expect(toCandidate(row({ 상호명: "토이랜드" }))).toBeNull();
        expect(toCandidate(row({ 위도: "" }))).toBeNull();
        expect(toCandidate(row({ 시군구코드: "" }))).toBeNull();
    });
});

describe("검수 파일에 합치기", () => {
    const a = candidate();
    const b = candidate({ 상가업소번호: "MA02", 상호명: "두모가챠", 도로명주소: "서울특별시 마포구 와우산로 1" });

    it("검수한 결과·매긴 id·고친 이름을 덮어쓰지 않는다", () => {
        const reviewed = { ...a, review: "ok" as const, id: "kr-11-440-001", name: "네모가챠 본점", note: "방문" };
        const { candidates, added } = mergeCandidates([reviewed], [a, b], ["서울특별시"]);
        expect(candidates.find((each) => each.sourceId === a.sourceId)).toEqual(reviewed);
        expect(added).toEqual([b]);
    });

    it("같은 이름·같은 주소로 두 번 등록된 곳은 하나만 남긴다", () => {
        const twin = { ...a, sourceId: "MA99", category: "기념품점" };
        expect(mergeCandidates([], [a, twin], ["서울특별시"]).candidates).toEqual([a]);
    });

    it("이번 자료에 없는 후보는 지우지 않고 알려 준다 — 뽑은 시도 안에서만, 손으로 더한 후보는 빼고", () => {
        const busan = { ...b, sourceId: "MA03", sido: "부산광역시", region: "26110" };
        const byHand = { ...b, name: "손으로 더한 가챠", sourceId: undefined };
        const { candidates, gone } = mergeCandidates([a, busan, byHand], [], ["서울특별시"]);
        expect(candidates).toHaveLength(3);
        expect(gone).toEqual([a]);
    });
});

describe("굿즈샵 id 매기기", () => {
    const ok = (over: Record<string, string>) => ({ ...candidate(over), review: "ok" as const });
    const first = ok({ 상가업소번호: "MA01" });
    const second = ok({ 상가업소번호: "MA02", 상호명: "두모가챠" });
    const jongno = ok({ 상가업소번호: "MA03", 상호명: "종로가챠", 시군구코드: "11110", 시군구명: "종로구" });

    it("국가-시도-시군구-그 시군구에서 몇 번째. 상가업소번호 순으로 매긴다", () => {
        const ids = assignIds([second, jongno, first], []).map((each) => each.id);
        expect(ids).toEqual(["kr-11-440-002", "kr-11-110-001", "kr-11-440-001"]);
    });

    it("검수를 통과하지 않은 후보에는 매기지 않는다", () => {
        expect(assignIds([candidate(), { ...candidate(), review: "no" as const }], []).map((each) => each.id)).toEqual([
            undefined,
            undefined,
        ]);
    });

    it("이미 매긴 id 는 그대로 두고, 그 시군구의 가장 큰 번호 다음부터 매긴다 — 빠진 번호를 다시 쓰지 않는다", () => {
        const kept = { ...first, id: "kr-11-440-005" };
        const dropped = { ...ok({ 상가업소번호: "MA00" }), review: "no" as const, id: "kr-11-440-009" };
        const ids = assignIds([kept, dropped, second], ["kr-11-440-007", "nemo-virtual"]).map((each) => each.id);
        expect(ids).toEqual(["kr-11-440-005", "kr-11-440-009", "kr-11-440-010"]);
    });

    it("손으로 더한 후보(상가업소번호 없음)는 뒤에 매긴다", () => {
        const byHand = { ...ok({ 상호명: "가나다 가챠 코너" }), sourceId: undefined };
        expect(assignIds([byHand, first], []).map((each) => each.id)).toEqual(["kr-11-440-002", "kr-11-440-001"]);
    });

    it("999곳을 넘으면 자릿수가 늘어난다", () => {
        expect(assignIds([first], ["kr-11-440-999"])[0].id).toBe("kr-11-440-1000");
    });
});

describe("굿즈샵 목록에 싣기", () => {
    const index = {
        schemaVersion: 1,
        shops: [{ id: "nemo-virtual", name: "예시", address: "없음", lat: 37, lng: 127, layoutVersion: 1 }],
    };
    const ok = { ...candidate(), review: "ok" as const };
    const no = { ...candidate({ 상가업소번호: "MA03" }), review: "no" as const };

    it("검수를 통과한 것만, 지도에 필요한 칸만 더하고, 매긴 id 를 후보에도 남긴다", () => {
        const { index: next, candidates, added } = applyReviewed(index, [ok, no]);
        expect(added).toEqual([
            { id: "kr-11-440-001", name: ok.name, address: ok.address, floorNote: "2층", lat: ok.lat, lng: ok.lng },
        ]);
        expect(candidates.map((each) => each.id)).toEqual(["kr-11-440-001", undefined]);
        expect(shopListSchema.safeParse(next).success).toBe(true);
    });

    it("다시 돌려도 같은 결과다 — 이미 목록에 있는 굿즈샵은 건드리지 않는다", () => {
        const once = applyReviewed(index, [ok]);
        const renamed = once.candidates.map((each) => ({ ...each, name: "바뀐 이름" }));
        const twice = applyReviewed(once.index, renamed);
        expect(twice.index).toEqual(once.index);
        expect(twice.added).toEqual([]);
    });
});

describe("저장소의 검수 파일(scripts/shops/candidates.json)", () => {
    const file = JSON.parse(readFileSync(path.join(process.cwd(), "scripts/shops/candidates.json"), "utf8"));

    it("모두 통과시켜도 굿즈샵 목록 형식에 맞는다", () => {
        const all = file.candidates.map((each: object) => ({ ...each, review: "ok" }));
        const { index } = applyReviewed({ schemaVersion: 1, shops: [] }, all);
        const parsed = shopListSchema.safeParse(index);
        expect(parsed.success ? null : parsed.error.issues[0]).toBeNull();
        expect(index.shops).toHaveLength(file.candidates.length);
    });

    it("검수 결과는 todo·ok·no 중 하나이고, 지역코드가 있다", () => {
        const wrong = file.candidates.filter(
            (each: { review: string; region: string }) =>
                !["todo", "ok", "no"].includes(each.review) || !/^\d{5}$/.test(each.region),
        );
        expect(wrong).toEqual([]);
    });
});
