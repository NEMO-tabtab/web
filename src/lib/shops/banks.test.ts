import { describe, expect, it } from "vitest";

import { groupBanks } from "./banks";
import type { Slot } from "./schema";

/** 25cm 칸의 표준 기계 — 남·북을 보면 폭 1 × 깊이 2, 동·서를 보면 폭 2 × 깊이 1 */
const machine = (id: string, x: number, y: number, facing: Slot["facing"], tiers = 2): Slot => {
    const eastWest = facing === "n" || facing === "s";
    return { id, x, y, w: eastWest ? 1 : 2, d: eastWest ? 2 : 1, h: tiers === 3 ? 8 : 5, facing, tiers };
};

const ids = (slots: readonly Slot[]) => slots.map((slot) => slot.id);

describe("기계 줄로 묶기", () => {
    it("나란히 붙은 기기는 한 줄이고, 줄을 따라 순서대로다", () => {
        const [bank, ...rest] = groupBanks([machine("c", 5, 1, "s"), machine("a", 3, 1, "s"), machine("b", 4, 1, "s")]);
        expect(rest).toEqual([]);
        expect(ids(bank.slots)).toEqual(["a", "b", "c"]);
        expect(bank).toMatchObject({ id: "a", x: 3, y: 1, w: 3, d: 2, h: 5 });
    });

    it("동·서를 보는 기기는 남북으로 줄을 선다", () => {
        const [bank] = groupBanks([machine("b", 1, 4, "e"), machine("a", 1, 3, "e"), machine("c", 1, 5, "e")]);
        expect(ids(bank.slots)).toEqual(["a", "b", "c"]);
        expect(bank).toMatchObject({ x: 1, y: 3, w: 2, d: 3 });
    });

    it("사이가 뜨면 다른 줄이다", () => {
        const banks = groupBanks([machine("a", 3, 1, "s"), machine("b", 4, 1, "s"), machine("c", 6, 1, "s")]);
        expect(banks.map((bank) => ids(bank.slots))).toEqual([["a", "b"], ["c"]]);
    });

    it("등을 맞댄 두 줄은 따로 묶는다 — 보는 쪽이 다르다", () => {
        const banks = groupBanks([
            machine("west-1", 7, 7, "w"),
            machine("west-2", 7, 8, "w"),
            machine("east-1", 9, 7, "e"),
            machine("east-2", 9, 8, "e"),
        ]);
        expect(banks.map((bank) => ids(bank.slots))).toEqual([
            ["west-1", "west-2"],
            ["east-1", "east-2"],
        ]);
    });

    it("높이가 다르면(2단 옆의 3단) 다른 줄이다", () => {
        const banks = groupBanks([machine("low", 3, 1, "s", 2), machine("high", 4, 1, "s", 3)]);
        expect(banks).toHaveLength(2);
    });

    it("빠뜨리는 자리가 없고, 넣은 배열은 바꾸지 않는다", () => {
        const slots = [machine("b", 4, 1, "s"), machine("a", 3, 1, "s"), machine("z", 1, 9, "e")];
        const banks = groupBanks(slots);
        expect(banks.flatMap((bank) => ids(bank.slots)).sort()).toEqual(["a", "b", "z"]);
        expect(ids(slots)).toEqual(["b", "a", "z"]);
    });
});
