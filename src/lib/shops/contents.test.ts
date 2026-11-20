import { describe, expect, it } from "vitest";

import { daysSince, describeFloor, isStale, seriesSummary, slotLabel } from "./contents";
import { sampleLayout, sampleMachines, sampleSeries } from "./sample";
import type { MachineList } from "./schema";

const floor = sampleLayout.floors[0];

describe("층의 기기 정보", () => {
    it("북쪽 줄부터, 같은 줄에서는 서쪽부터 번호를 매긴다", () => {
        const shuffled = { ...floor, slots: [...floor.slots].reverse() };
        const infos = describeFloor(shuffled, sampleMachines, sampleSeries);
        expect(infos.map((info) => [info.number, info.slot.id])).toEqual([
            [1, "slot-a"],
            [2, "slot-b"],
        ]);
    });

    it("단은 맨 위부터 늘어놓고, 기기 내용이 없는 단은 비워 둔다", () => {
        const [, slotB] = describeFloor(floor, sampleMachines, sampleSeries);
        expect(slotB.tiers.map((each) => [each.tier, each.series?.id ?? null])).toEqual([
            [1, null],
            [0, "sample-cats"],
        ]);
        expect(slotB.tiers[0].lastVerifiedAt).toBeNull();
    });

    it("시리즈 이름은 한 번씩만, 가격은 범위로 적는다", () => {
        const [slotA, slotB] = describeFloor(floor, sampleMachines, sampleSeries);
        expect(slotA.seriesNames).toEqual(["예시 빵 키링", "예시 고양이 피규어"]);
        expect(slotA.priceText).toBe("3,000~4,000원");
        expect(slotB.priceText).toBe("3,000원");

        const sameTwice: MachineList = {
            ...sampleMachines,
            machines: sampleMachines.machines.map((machine) => ({ ...machine, seriesId: "sample-cats" })),
        };
        expect(describeFloor(floor, sameTwice, sampleSeries)[0].seriesNames).toEqual(["예시 고양이 피규어"]);
    });

    it("아무것도 모르는 기기는 가격 없이 그렇다고 말한다", () => {
        const empty: MachineList = { ...sampleMachines, machines: [] };
        const [info] = describeFloor(floor, empty, sampleSeries);
        expect(info.priceText).toBeNull();
        expect(seriesSummary(info)).toBe("들어 있는 것을 아직 몰라요");
    });

    it("화면 낭독기용 이름에 번호·단 수·들어 있는 것이 들어간다", () => {
        const [slotA] = describeFloor(floor, sampleMachines, sampleSeries);
        expect(slotLabel(slotA)).toBe("1번 가챠 기기, 2단, 예시 빵 키링 외 1종");
    });
});

describe("확인한 날", () => {
    const now = new Date(2026, 10, 21, 23, 30);

    it("날짜만 보고 며칠 지났는지 센다", () => {
        expect(daysSince("2026-11-21", now)).toBe(0);
        expect(daysSince("2026-11-20", now)).toBe(1);
        expect(daysSince("2026-08-01", now)).toBe(112);
    });

    it("30일이 넘으면 오래된 것으로 본다", () => {
        expect(isStale("2026-10-22", now)).toBe(false);
        expect(isStale("2026-10-21", now)).toBe(true);
    });
});
