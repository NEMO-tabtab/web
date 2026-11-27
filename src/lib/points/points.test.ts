import { describe, expect, it } from "vitest";

import { ACHIEVEMENTS, LEVEL_THRESHOLDS } from "./rules";
import { levelFor, pointFacts, scorePoints } from "./score";
import type { PointRecord } from "./score";

const record = (options: { photo?: boolean; shop?: string; deleted?: boolean } = {}): PointRecord => ({
    deletedAt: options.deleted ? 1 : null,
    origin: options.shop === undefined ? null : { shopId: options.shop },
    hasPhoto: options.photo ?? false,
});

const line = (summary: ReturnType<typeof scorePoints>, id: string) => summary.lines.find((each) => each.id === id)!;

describe("pointFacts", () => {
    it("지운 물건은 어느 개수에도 들지 않는다", () => {
        const facts = pointFacts([
            record({ photo: true, shop: "A" }),
            record({ photo: true, shop: "B", deleted: true }),
        ]);
        expect(facts).toMatchObject({ items: 1, withPhoto: 1, withOrigin: 1, shops: 1 });
    });

    it("가챠샵은 같은 곳을 한 번만 세고, 빈 이름은 세지 않는다", () => {
        const facts = pointFacts([
            record({ shop: "A" }),
            record({ shop: "A" }),
            record({ shop: "B" }),
            record({ shop: " " }),
        ]);
        expect(facts).toMatchObject({ items: 4, withOrigin: 3, shops: 2 });
    });

    it("출석일과 서버 개수는 따로 받고, 안 주면 0과 모름(null)이다", () => {
        expect(pointFacts([])).toEqual({
            items: 0,
            withPhoto: 0,
            withOrigin: 0,
            shops: 0,
            attendanceDays: 0,
            barcodes: null,
            invites: null,
        });
        expect(pointFacts([], { attendanceDays: 3, barcodes: 0, invites: 2 })).toMatchObject({
            attendanceDays: 3,
            barcodes: 0,
            invites: 2,
        });
    });
});

describe("scorePoints", () => {
    it("기록이 없으면 0점, 레벨 1, 다음 업적은 첫 기록", () => {
        const summary = scorePoints(pointFacts([]));
        expect(summary.total).toBe(0);
        expect(summary.level).toEqual({ level: 1, floor: 0, next: 50 });
        expect(summary.achievements.every((each) => !each.done)).toBe(true);
        expect(summary.next?.achievement.id).toBe("first-item");
    });

    it("등록·사진·뽑은 곳·가챠샵을 섞어 셈한다", () => {
        const summary = scorePoints(
            pointFacts([
                record({ photo: true, shop: "A" }),
                record({ photo: true }),
                record({ shop: "A" }),
                record({ photo: true, shop: "B", deleted: true }),
            ]),
        );
        expect(line(summary, "item")).toMatchObject({ count: 3, points: 30 });
        expect(line(summary, "photo")).toMatchObject({ count: 2, points: 10 });
        expect(line(summary, "origin")).toMatchObject({ count: 2, points: 10 });
        expect(line(summary, "shop")).toMatchObject({ count: 1, points: 20 });
        // 첫 기록 10 + 첫 가챠샵 10
        expect(line(summary, "achievement")).toMatchObject({ count: 2, points: 20 });
        expect(summary.total).toBe(90);
        expect(summary.level).toEqual({ level: 2, floor: 50, next: 150 });
        expect(summary.newlyMet).toEqual(["first-item", "first-shop"]);
    });

    it("물건을 지우면 그 몫이 빠진다", () => {
        const before = scorePoints(pointFacts([record({ photo: true }), record()]));
        const after = scorePoints(pointFacts([record({ photo: true }), record({ deleted: true })]));
        expect(before.total - after.total).toBe(10);
    });

    it("출석일마다 5점, 7일이면 출석 업적", () => {
        const summary = scorePoints(pointFacts([], { attendanceDays: 7 }));
        expect(line(summary, "attendance")).toMatchObject({ count: 7, points: 35 });
        expect(summary.total).toBe(35 + 30);
        expect(summary.newlyMet).toEqual(["attendance-7"]);
    });

    it("업적은 한 번 얻으면 남는다 — 조건이 모자라도 기기에 적혀 있으면 얻은 것", () => {
        const summary = scorePoints(pointFacts([record(), record(), record()]), new Map([["items-10", 1000]]));
        const items10 = summary.achievements.find((each) => each.achievement.id === "items-10")!;
        expect(items10).toMatchObject({ done: true, earnedAt: 1000, current: 3, remaining: 0 });
        // 물건 30 + 첫 기록 10 + 물건 10개 30
        expect(summary.total).toBe(70);
        // 이미 적힌 것은 다시 적으라고 하지 않는다
        expect(summary.newlyMet).toEqual(["first-item"]);
    });

    it("규칙표에서 빠진 업적은 셈하지 않는다", () => {
        const summary = scorePoints(pointFacts([]), new Map([["gone", 5]]));
        expect(summary.total).toBe(0);
        expect(line(summary, "achievement").count).toBe(0);
    });

    it("서버 개수를 모르면 0점으로 두고 표시하며, 그 업적은 다음 업적으로 고르지 않는다", () => {
        const unknown = scorePoints(pointFacts(Array.from({ length: 9 }, () => record())));
        expect(line(unknown, "barcode")).toMatchObject({ count: 0, points: 0, unknown: true });
        expect(line(unknown, "invite")).toMatchObject({ unknown: true });
        expect(unknown.achievements.find((each) => each.achievement.id === "first-barcode")?.unknown).toBe(true);
        // 물건 9개 — 물건 10개까지 1개 남은 것이 가장 가깝다
        expect(unknown.next).toMatchObject({ remaining: 1, achievement: { id: "items-10" } });

        const known = scorePoints(pointFacts([], { barcodes: 2, invites: 1 }));
        expect(line(known, "barcode")).toMatchObject({ count: 2, points: 60, unknown: false });
        expect(line(known, "invite")).toMatchObject({ count: 1, points: 50 });
        // 바코드 60 + 초대 50 + 첫 바코드 기여 30
        expect(known.total).toBe(140);
    });

    it("업적을 모두 얻으면 다음 업적은 없다", () => {
        const all = new Map(ACHIEVEMENTS.map((each) => [each.id, 1]));
        expect(scorePoints(pointFacts([]), all).next).toBeNull();
    });
});

describe("levelFor", () => {
    it("구간의 시작에서 레벨이 오르고, 마지막 레벨에서는 다음이 없다", () => {
        expect(levelFor(49)).toEqual({ level: 1, floor: 0, next: 50 });
        expect(levelFor(50)).toEqual({ level: 2, floor: 50, next: 150 });
        const last = LEVEL_THRESHOLDS.length;
        expect(levelFor(LEVEL_THRESHOLDS[last - 1])).toEqual({
            level: last,
            floor: LEVEL_THRESHOLDS[last - 1],
            next: null,
        });
        expect(levelFor(1_000_000).level).toBe(last);
    });
});

describe("규칙표", () => {
    it("업적 id 는 겹치지 않고 기기에 적을 수 있는 모양이다", () => {
        const ids = ACHIEVEMENTS.map((each) => each.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
    });

    it("업적은 목표와 포인트가 0보다 크다", () => {
        for (const each of ACHIEVEMENTS) {
            expect(each.goal).toBeGreaterThan(0);
            expect(each.points).toBeGreaterThan(0);
        }
    });

    it("레벨 구간은 0에서 시작해 오른다", () => {
        expect(LEVEL_THRESHOLDS[0]).toBe(0);
        for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
            expect(LEVEL_THRESHOLDS[i]).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1]);
        }
    });
});
