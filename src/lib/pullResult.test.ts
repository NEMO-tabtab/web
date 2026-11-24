import { describe, expect, it } from "vitest";

import type { ProductCatalog } from "@/lib/db";
import { placeAll, summarize } from "./pullResult";

const item = (seriesName: string | null, variantName: string | null = null, count = 1) => ({
    count,
    catalog: seriesName === null ? null : ({ seriesId: null, seriesName, variantId: null, variantName } as ProductCatalog),
});

describe("placeAll", () => {
    it("시리즈를 적지 않은 물건은 알릴 것이 없다", () => {
        expect(placeAll([], [item(null)])).toEqual([{ kind: "plain" }]);
    });

    it("처음 넣는 시리즈는 new-series", () => {
        const [placement] = placeAll([item("산리오", "시나모롤")], [item("치이카와", "하치와레")]);
        expect(placement).toMatchObject({ kind: "new-series", seriesName: "치이카와", kinds: 1, owned: 1 });
    });

    it("가진 시리즈에서 처음 나온 종류는 new-variant, 이미 가진 종류는 duplicate", () => {
        const before = [item("치이카와", "하치와레")];
        const placements = placeAll(before, [item("치이카와", "우사기"), item("치이카와", "하치와레")]);
        expect(placements[0]).toMatchObject({ kind: "new-variant", variantName: "우사기", kinds: 2, owned: 1 });
        expect(placements[1]).toMatchObject({ kind: "duplicate", variantName: "하치와레", kinds: 2, owned: 2 });
    });

    it("한 번에 같은 종류를 둘 넣으면 첫째는 새 종류, 둘째는 중복이다", () => {
        const placements = placeAll([item("치이카와", "하치와레")], [item("치이카와", "모몽가"), item("치이카와", "모몽가")]);
        expect(placements.map((each) => each.kind)).toEqual(["new-variant", "duplicate"]);
    });

    it("띄어쓰기만 다른 이름은 같은 시리즈·종류로 본다", () => {
        const [placement] = placeAll([item("치이카와 마스코트", "하치와레")], [item("치이카와마스코트", "하치 와레")]);
        expect(placement).toMatchObject({ kind: "duplicate", owned: 2 });
    });

    it("가진 시리즈인데 종류를 적지 않으면 unknown — 모은 종류 수는 늘지 않는다", () => {
        const [placement] = placeAll([item("치이카와", "하치와레")], [item("치이카와")]);
        expect(placement).toMatchObject({ kind: "unknown", variantName: null, kinds: 1, owned: 0 });
    });

    it("가진 수는 수량을 더한다", () => {
        const [placement] = placeAll([item("치이카와", "하치와레", 2)], [item("치이카와", "하치와레")]);
        expect(placement).toMatchObject({ kind: "duplicate", owned: 3 });
    });

    it("기록에 catalog 칸이 아예 없어도(옛 기록) 멈추지 않는다", () => {
        expect(placeAll([{ count: 1 }], [item("치이카와", "하치와레")])[0]).toMatchObject({ kind: "new-series" });
    });
});

describe("summarize", () => {
    it("새 종류가 있으면 그것을 먼저 알린다", () => {
        const summary = summarize(
            placeAll([item("치이카와", "하치와레")], [item("치이카와", "우사기"), item("치이카와", "하치와레")]),
        );
        expect(summary.headline).toBe("새로운 종류 1개를 모았어요!");
        expect(summary.happy).toBe(true);
        expect(summary.series).toEqual([{ key: "name:치이카와", name: "치이카와", kinds: 2 }]);
    });

    it("새 시리즈의 첫 물건도 종류를 적었으면 새 종류로 센다", () => {
        expect(summarize(placeAll([], [item("치이카와", "하치와레")])).headline).toBe("새로운 종류 1개를 모았어요!");
    });

    it("종류 없이 새 시리즈만 시작했으면 그렇게 알린다", () => {
        const summary = summarize(placeAll([], [item("치이카와")]));
        expect(summary.headline).toBe("새 시리즈를 시작했어요!");
        expect(summary.happy).toBe(true);
    });

    it("모두 중복이면 담담하게 알린다", () => {
        const summary = summarize(placeAll([item("치이카와", "하치와레")], [item("치이카와", "하치와레")]));
        expect(summary.headline).toBe("이미 가진 종류가 또 나왔어요");
        expect(summary.happy).toBe(false);
    });

    it("시리즈를 적지 않았으면 개수만 알린다", () => {
        const summary = summarize(placeAll([], [item(null), item(null)]));
        expect(summary).toEqual({ headline: "2개 기록했어요", happy: false, series: [] });
    });
});
