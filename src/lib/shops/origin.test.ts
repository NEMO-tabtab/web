import { describe, expect, it } from "vitest";

import { describeFloor } from "./contents";
import { makeOrigin, originHref, originLabel, originShort } from "./origin";
import { sampleLayout, sampleMachines, sampleSeries, sampleShops } from "./sample";

const shop = sampleShops.shops[0];
const floor = sampleLayout.floors[0];
const [slotA, slotB] = describeFloor(floor, sampleMachines, sampleSeries);

describe("뽑은 곳 만들기", () => {
    it("고른 순간의 굿즈샵 이름·층·기기 번호·단·시리즈를 적어 둔다", () => {
        expect(makeOrigin(shop, sampleLayout, floor, slotA, 1)).toEqual({
            shopId: "sample-shop",
            shopName: "예시 굿즈샵",
            layoutVersion: 1,
            floorId: "f2",
            floorLabel: "2층",
            slotId: "slot-a",
            machineNumber: 1,
            tier: 1,
            seriesId: "sample-bread",
            seriesName: "예시 빵 키링",
        });
    });

    it("비어 있거나 모르는 단도 고를 수 있다 — 시리즈만 비운다", () => {
        expect(makeOrigin(shop, sampleLayout, floor, slotB, 1)).toMatchObject({
            slotId: "slot-b",
            tier: 1,
            seriesId: null,
            seriesName: null,
        });
    });

    it("기기에 없는 단이면 던진다", () => {
        expect(() => makeOrigin(shop, sampleLayout, floor, slotA, 5)).toThrow();
    });
});

describe("뽑은 곳 글로 옮기기", () => {
    const origin = makeOrigin(shop, sampleLayout, floor, slotA, 0);

    it("단은 1부터 센다", () => {
        expect(originLabel(origin)).toBe("예시 굿즈샵 · 2층 1번 기기 1단");
        expect(originShort(origin)).toBe("예시 굿즈샵 · 1번 기기");
    });

    it("내부 지도 주소에 굿즈샵과 기기를 담는다", () => {
        const url = new URL(originHref(origin), "https://example.com");
        expect(url.pathname).toBe("/shops/view");
        expect(url.searchParams.get("id")).toBe("sample-shop");
        expect(url.searchParams.get("slot")).toBe("slot-a");
    });
});
