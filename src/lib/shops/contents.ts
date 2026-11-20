import { formatWon } from "@/lib/format";
import type { Floor, MachineList, Series, SeriesList, Slot } from "./schema";

/*
 * 내부 지도에 보여 줄 기기 정보를 묶는다 — 매장 구조의 자리와 기기 내용·시리즈를 이어 붙인다.
 * 화면은 자리 id 가 아니라 여기서 매긴 번호("3번 기기")로 기기를 부른다.
 */

/** 사람이 현장에서 확인한 지 이만큼 지나면 "지금은 다를 수 있다"고 알린다 */
export const STALE_DAYS = 30;

export interface TierContent {
    /** 아래부터 0 */
    tier: number;
    /** 비어 있거나 아직 확인하지 못한 단이면 null */
    series: Series | null;
    lastVerifiedAt: string | null;
}

export interface SlotInfo {
    slot: Slot;
    /** 층 안에서 매긴 번호(1부터). 북쪽 줄부터, 같은 줄에서는 서쪽부터 */
    number: number;
    /** 맨 위 단부터 */
    tiers: TierContent[];
    /** 들어 있는 시리즈 이름(겹치면 한 번만), 맨 위 단부터 */
    seriesNames: string[];
    /** "3,000원", "3,000~5,000원". 들어 있는 것이 없으면 null */
    priceText: string | null;
}

/** 한 층의 기기 자리마다 번호와 단별 내용을 붙인다. 번호 순서로 돌려준다 */
export function describeFloor(floor: Floor, machines: MachineList, series: SeriesList): SlotInfo[] {
    const seriesById = new Map(series.series.map((each) => [each.id, each]));
    const byPlace = new Map(machines.machines.map((machine) => [`${machine.slotId}/${machine.tier}`, machine]));

    // 돌려도 번호가 바뀌지 않게 원래 격자 위치로 매긴다
    const ordered = [...floor.slots].sort((a, b) => a.y - b.y || a.x - b.x);

    return ordered.map((slot, index) => {
        const tiers: TierContent[] = Array.from({ length: slot.tiers }, (_, offset) => {
            const tier = slot.tiers - 1 - offset;
            const machine = byPlace.get(`${slot.id}/${tier}`);
            return {
                tier,
                series: machine ? (seriesById.get(machine.seriesId) ?? null) : null,
                lastVerifiedAt: machine?.lastVerifiedAt ?? null,
            };
        });

        const filled = tiers.flatMap((each) => (each.series ? [each.series] : []));
        const prices = filled.map((each) => each.price);
        const low = Math.min(...prices);
        const high = Math.max(...prices);

        return {
            slot,
            number: index + 1,
            tiers,
            seriesNames: [...new Set(filled.map((each) => each.name))],
            priceText:
                prices.length === 0
                    ? null
                    : low === high
                      ? `${formatWon(low)}원`
                      : `${formatWon(low)}~${formatWon(high)}원`,
        };
    });
}

/** "2026-11-20" 이 now 로부터 며칠 전인지. 날짜만 비교한다(기기의 시간대 기준) */
export function daysSince(day: string, now: Date): number {
    const [year, month, date] = day.split("-").map(Number);
    const then = new Date(year, month - 1, date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today.getTime() - then.getTime()) / 86_400_000);
}

export const isStale = (day: string, now: Date) => daysSince(day, now) > STALE_DAYS;

/** 기기 하나를 한 줄로 — 목록의 제목과 화면 낭독기가 쓴다. "졸린 고양이 피규어 외 1종" */
export function seriesSummary(info: SlotInfo): string {
    const [first, ...rest] = info.seriesNames;
    if (!first) return "들어 있는 것을 아직 몰라요";
    return rest.length === 0 ? first : `${first} 외 ${rest.length}종`;
}

/** 화면 낭독기가 읽을 기기 이름. 지도 위 기기와 목록이 같은 이름을 쓴다 */
export function slotLabel(info: SlotInfo): string {
    return `${info.number}번 가챠 기기, ${info.slot.tiers}단, ${seriesSummary(info)}`;
}
