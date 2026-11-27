import type { Product } from "@/lib/db";

import { ACHIEVEMENTS, ACTIVITY_RULES, LEVEL_THRESHOLDS } from "./rules";
import type { Achievement, ActivityId, PointFacts } from "./rules";

/*
 * 기록(사실)과 규칙표로 포인트를 셈한다(결정 기록 0006). 잔액을 저장하지 않으니, 물건을 고치거나 지우거나
 * 백업을 가져와도 맞출 것이 없다 — 다시 셈하면 된다.
 * 화면과 떼어 둔 순수 함수라 테스트로 확인한다(points.test.ts).
 */

/** 물건 한 건에서 포인트에 쓰는 것만 */
export interface PointRecord {
    deletedAt?: Product["deletedAt"];
    origin?: Pick<NonNullable<Product["origin"]>, "shopId"> | null;
    hasPhoto: boolean;
}

/** 기기 밖에서 오는 사실. 출석일은 #182, 서버 개수는 #185가 채운다 */
export interface ExtraFacts {
    attendanceDays?: number;
    barcodes?: number | null;
    invites?: number | null;
}

/** 물건 기록에서 사실을 뽑는다. 지운 물건은 어느 개수에도 들지 않는다 */
export function pointFacts(records: readonly PointRecord[], extra: ExtraFacts = {}): PointFacts {
    let items = 0;
    let withPhoto = 0;
    let withOrigin = 0;
    const shops = new Set<string>();

    for (const record of records) {
        if (record.deletedAt) continue;
        items += 1;
        if (record.hasPhoto) withPhoto += 1;
        // 예전 백업에서 온 기록은 shopId 가 비어 있을 수 있다 — 빈 이름은 가챠샵으로 세지 않는다
        const shopId = record.origin?.shopId?.trim();
        if (shopId) {
            withOrigin += 1;
            shops.add(shopId);
        }
    }

    return {
        items,
        withPhoto,
        withOrigin,
        shops: shops.size,
        attendanceDays: extra.attendanceDays ?? 0,
        barcodes: extra.barcodes ?? null,
        invites: extra.invites ?? null,
    };
}

/** 내역 한 줄 — 활동 하나, 또는 업적을 모은 줄 */
export interface PointLine {
    id: ActivityId | "achievement";
    label: string;
    unit: string;
    /** 센 개수 */
    count: number;
    /** 이 줄의 포인트 */
    points: number;
    /** 서버 개수를 몰라서(로그인 전) 셈하지 못했다 */
    unknown: boolean;
}

export interface AchievementProgress {
    achievement: Achievement;
    done: boolean;
    /** 기기에 적힌 달성 시각. 아직 적지 않았으면 null */
    earnedAt: number | null;
    /** 지금 사실의 값. 모르면 0 */
    current: number;
    /** 얻기까지 남은 수. 얻었으면 0 */
    remaining: number;
    /** 서버 개수를 몰라서 나아갈 수 없다 */
    unknown: boolean;
}

export interface LevelInfo {
    /** 1부터 */
    level: number;
    /** 이 레벨이 시작되는 포인트 */
    floor: number;
    /** 다음 레벨이 시작되는 포인트. 마지막 레벨이면 null */
    next: number | null;
}

export interface PointSummary {
    total: number;
    /** 활동 순서대로, 맨 끝에 업적 */
    lines: PointLine[];
    level: LevelInfo;
    /** 규칙표 순서대로 */
    achievements: AchievementProgress[];
    /** 조건은 채웠는데 기기에 아직 적지 않은 업적의 id — 출석·업적 저장(#182)이 이것을 적는다 */
    newlyMet: string[];
    /** 얻지 못한 업적 중 가장 가까운 것. 모두 얻었으면 null */
    next: AchievementProgress | null;
}

export function levelFor(total: number): LevelInfo {
    let index = 0;
    while (index + 1 < LEVEL_THRESHOLDS.length && total >= LEVEL_THRESHOLDS[index + 1]) index += 1;
    return {
        level: index + 1,
        floor: LEVEL_THRESHOLDS[index],
        next: LEVEL_THRESHOLDS[index + 1] ?? null,
    };
}

/**
 * 포인트를 셈한다.
 * `earned`는 기기에 적힌 업적 달성(id → 처음 얻은 시각)이다. 업적은 한 번 얻으면 남으므로(0006),
 * 지금 조건이 모자라도 여기 있으면 얻은 것으로 본다. 규칙표에서 빠진 id는 셈하지 않는다.
 */
export function scorePoints(facts: PointFacts, earned: ReadonlyMap<string, number> = new Map()): PointSummary {
    const lines: PointLine[] = ACTIVITY_RULES.map((rule) => {
        const value = facts[rule.fact];
        const count = value ?? 0;
        return {
            id: rule.id,
            label: rule.label,
            unit: rule.unit,
            count,
            points: count * rule.points,
            unknown: value === null,
        };
    });

    const achievements: AchievementProgress[] = ACHIEVEMENTS.map((achievement) => {
        const value = facts[achievement.fact];
        const current = value ?? 0;
        const earnedAt = earned.get(achievement.id) ?? null;
        const done = earnedAt !== null || current >= achievement.goal;
        return {
            achievement,
            done,
            earnedAt,
            current,
            remaining: done ? 0 : achievement.goal - current,
            unknown: value === null,
        };
    });

    const done = achievements.filter((progress) => progress.done);
    lines.push({
        id: "achievement",
        label: "업적",
        unit: "개",
        count: done.length,
        points: done.reduce((sum, progress) => sum + progress.achievement.points, 0),
        unknown: false,
    });

    const total = lines.reduce((sum, line) => sum + line.points, 0);

    return {
        total,
        lines,
        level: levelFor(total),
        achievements,
        newlyMet: done.filter((progress) => progress.earnedAt === null).map((progress) => progress.achievement.id),
        next: nearest(achievements),
    };
}

/** 남은 비율이 가장 적은 업적. 같으면 규칙표에서 앞선 것. 서버 개수를 모르는 업적은 고르지 않는다 */
function nearest(achievements: AchievementProgress[]): AchievementProgress | null {
    let best: AchievementProgress | null = null;
    for (const progress of achievements) {
        if (progress.done || progress.unknown) continue;
        const left = progress.remaining / progress.achievement.goal;
        if (!best || left < best.remaining / best.achievement.goal) best = progress;
    }
    return best;
}
