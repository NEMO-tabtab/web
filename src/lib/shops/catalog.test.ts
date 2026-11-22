import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { variantOdds } from "./catalog";
import { ShopDataError, loadCatalog } from "./load";
import { findCatalogMismatches, seriesListSchema, titleListSchema, type SeriesList, type TitleList } from "./schema";

const titles: TitleList = { schemaVersion: 1, titles: [{ id: "jjk", name: "주술회전", aliases: ["呪術廻戦"] }] };

const seriesList = (series: SeriesList["series"][number]): unknown => ({ schemaVersion: 1, series: [series] });

/** 형식 검사의 첫 오류 문구. 통과하면 null */
const firstIssue = (raw: unknown) => {
    const parsed = seriesListSchema.safeParse(raw);
    return parsed.success ? null : parsed.error.issues[0].message;
};

const lineup = (...odds: (number | undefined)[]) =>
    odds.map((value, index) => ({ id: `v${index + 1}`, name: `종류 ${index + 1}`, odds: value }));

describe("시리즈 형식", () => {
    it("예전 형식(이름·가격만)도 그대로 읽힌다", () => {
        expect(firstIssue(seriesList({ id: "old", name: "예전 시리즈", price: 3000 }))).toBeNull();
    });

    it("새 칸을 모두 채운 시리즈를 읽는다", () => {
        expect(
            firstIssue(
                seriesList({
                    id: "jjk-capsule-2",
                    name: "주술회전 캡슐 피규어 vol.2",
                    price: 4000,
                    priceShops: 3,
                    priceJpy: 400,
                    titleId: "jjk",
                    aliases: ["呪術廻戦 カプセルフィギュア2"],
                    maker: "반다이",
                    kind: "gacha",
                    releasedAt: "2026-11",
                    lineup: [
                        { id: "gojo", name: "고죠 사토루" },
                        { id: "secret", name: "시크릿", secret: true, odds: 0.05 },
                    ],
                    sources: ["https://example.com/item"],
                    checkedAt: "2026-11-23",
                }),
            ),
        ).toBeNull();
    });

    it("손으로 입력할 때 흔한 실수를 시리즈 id 와 함께 알려 준다", () => {
        expect(
            firstIssue(
                seriesList({
                    id: "s",
                    name: "s",
                    price: 0,
                    lineup: lineup(undefined, undefined).map((v) => ({ ...v, id: "same" })),
                }),
            ),
        ).toBe("s: 종류 id 가 겹친다");
        expect(firstIssue(seriesList({ id: "s", name: "s", price: 0, releasedAt: "2026-13" }))).toContain(
            "2026-11 처럼",
        );
        expect(firstIssue(seriesList({ id: "S 1", name: "s", price: 0 }))).not.toBeNull();
    });

    it("확률을 모두 적었으면 합이 1 이어야 한다(1/3 을 0.333 으로 적는 오차는 허용)", () => {
        expect(
            firstIssue(seriesList({ id: "s", name: "s", price: 0, lineup: lineup(0.333, 0.333, 0.333) })),
        ).toBeNull();
        expect(firstIssue(seriesList({ id: "s", name: "s", price: 0, lineup: lineup(0.5, 0.3) }))).toBe(
            "s: 모든 종류에 확률을 적었는데 합이 1 이 아니다(0.800)",
        );
    });

    it("일부만 적었으면 남는 확률이 있어야 한다", () => {
        expect(firstIssue(seriesList({ id: "s", name: "s", price: 0, lineup: lineup(0.04, undefined) }))).toBeNull();
        expect(firstIssue(seriesList({ id: "s", name: "s", price: 0, lineup: lineup(1, undefined) }))).toContain(
            "이미 1 이다",
        );
    });
});

describe("종류별 확률", () => {
    it("아무것도 밝히지 않았으면 모두 1/n — 추정으로 표시", () => {
        const odds = variantOdds({ lineup: lineup(undefined, undefined, undefined, undefined) });
        expect(odds.map((each) => each.odds)).toEqual([0.25, 0.25, 0.25, 0.25]);
        expect(odds.every((each) => each.estimated)).toBe(true);
    });

    it("시크릿 1/24 만 알려졌으면 나머지가 남은 확률을 똑같이 나눈다", () => {
        const odds = variantOdds({ lineup: lineup(undefined, undefined, 1 / 24) });
        expect(odds[0].odds).toBeCloseTo(23 / 48);
        expect(odds[1].odds).toBeCloseTo(23 / 48);
        expect(odds[2]).toEqual({ variantId: "v3", odds: 1 / 24, estimated: false });
    });

    it("모두 밝혔으면 그대로 쓴다", () => {
        expect(variantOdds({ lineup: lineup(0.7, 0.3) })).toEqual([
            { variantId: "v1", odds: 0.7, estimated: false },
            { variantId: "v2", odds: 0.3, estimated: false },
        ]);
    });

    it("종류 목록이 없으면 빈 배열", () => {
        expect(variantOdds({})).toEqual([]);
    });
});

describe("작품과 시리즈", () => {
    it("없는 작품을 가리키는 시리즈를 찾는다", () => {
        const series = seriesListSchema.parse({
            schemaVersion: 1,
            series: [
                { id: "a", name: "a", price: 0, titleId: "jjk" },
                { id: "b", name: "b", price: 0, titleId: "nope" },
                { id: "c", name: "c", price: 0 },
            ],
        });
        expect(findCatalogMismatches(titles, series)).toEqual(["b: 없는 작품 nope"]);
    });

    it("작품 id 가 겹치면 거른다", () => {
        const parsed = titleListSchema.safeParse({ schemaVersion: 1, titles: [titles.titles[0], titles.titles[0]] });
        expect(parsed.success).toBe(false);
    });
});

describe("카탈로그 불러오기", () => {
    const serve = (files: Record<string, unknown>) =>
        vi.stubGlobal(
            "fetch",
            vi.fn(async (input: string) =>
                files[input] === undefined
                    ? new Response("not found", { status: 404 })
                    : new Response(JSON.stringify(files[input])),
            ),
        );

    afterEach(() => vi.unstubAllGlobals());

    it("작품과 시리즈를 함께 읽는다", async () => {
        serve({
            "/shops/titles.json": titles,
            "/shops/series.json": seriesList({ id: "a", name: "a", price: 0, titleId: "jjk" }),
        });
        const catalog = await loadCatalog();
        expect(catalog.titles.titles[0].name).toBe("주술회전");
        expect(catalog.series.series[0].titleId).toBe("jjk");
    });

    it("없는 작품을 가리키면 반쯤 맞는 카탈로그를 돌려주지 않고 던진다", async () => {
        serve({
            "/shops/titles.json": titles,
            "/shops/series.json": seriesList({ id: "a", name: "a", price: 0, titleId: "nope" }),
        });
        await expect(loadCatalog()).rejects.toBeInstanceOf(ShopDataError);
        await expect(loadCatalog()).rejects.toMatchObject({ kind: "invalid" });
    });
});

describe("저장소에 든 실제 카탈로그 (public/shops)", () => {
    const root = path.join(process.cwd(), "public/shops");
    const read = (file: string) => JSON.parse(readFileSync(path.join(root, file), "utf8")) as unknown;
    /** 손으로 고친 데이터가 틀렸을 때 어느 파일의 어디가 왜 틀렸는지 바로 보이게 문구 목록으로 비교한다 */
    const problems = (schema: typeof seriesListSchema | typeof titleListSchema, file: string) => {
        const parsed = schema.safeParse(read(file));
        if (parsed.success) return [];
        return parsed.error.issues.map((issue) =>
            issue.path.length > 0 ? `${file} ${issue.path.join(".")}: ${issue.message}` : `${file}: ${issue.message}`,
        );
    };

    it("작품·시리즈가 형식에 맞고 서로 맞는다", () => {
        expect(problems(titleListSchema, "titles.json")).toEqual([]);
        expect(problems(seriesListSchema, "series.json")).toEqual([]);
        expect(
            findCatalogMismatches(
                titleListSchema.parse(read("titles.json")),
                seriesListSchema.parse(read("series.json")),
            ),
        ).toEqual([]);
    });
});
