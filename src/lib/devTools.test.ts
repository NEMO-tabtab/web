import { describe, expect, it } from "vitest";

import { createTapCounter } from "./devTools";

/** 같은 간격으로 n 번 누르고, 누를 때마다의 결과를 돌려준다 */
function tapTimes(tap: (now: number) => boolean, times: number, startAt: number, everyMs: number) {
    return Array.from({ length: times }, (_, index) => tap(startAt + index * everyMs));
}

describe("연속으로 누르기", () => {
    it("10번째에만 열린다", () => {
        const results = tapTimes(createTapCounter(), 10, 0, 200);

        expect(results.slice(0, 9)).toEqual(Array(9).fill(false));
        expect(results[9]).toBe(true);
    });

    it("띄엄띄엄 누르면 몇 번을 눌러도 열리지 않는다", () => {
        expect(tapTimes(createTapCounter(), 30, 0, 2_000)).not.toContain(true);
    });

    it("중간에 쉬면 처음부터 다시 센다", () => {
        const tap = createTapCounter();

        expect(tapTimes(tap, 9, 0, 200)).not.toContain(true);
        // 한참 쉰 뒤의 한 번은 10번째가 아니라 첫 번째다
        expect(tap(10_000)).toBe(false);
        expect(tapTimes(tap, 9, 10_200, 200)).toEqual([...Array(8).fill(false), true]);
    });

    it("열린 뒤에는 다시 10번을 눌러야 한다", () => {
        const tap = createTapCounter();
        tapTimes(tap, 10, 0, 100);

        expect(tap(1_100)).toBe(false);
        expect(tapTimes(tap, 9, 1_200, 100)[8]).toBe(true);
    });
});
