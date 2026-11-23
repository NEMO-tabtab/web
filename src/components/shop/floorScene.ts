import { UNIT_ACROSS, UNIT_CM, sceneBounds, turnSize, type Box, type Facing, type Size, type Turn } from "@/lib/iso";
import type { Floor } from "@/lib/shops/schema";

/** 그림 둘레의 여백(SVG 단위) — 손그림 필터가 선을 밀어내도 잘리지 않게 */
const MARGIN = 14;

/** 바닥 크기를 그림의 길이(1 = 50cm)로 */
export function floorSize(floor: Floor, cellCm: number): Size {
    const scale = cellCm / UNIT_CM;
    return { width: floor.width * scale, depth: floor.depth * scale };
}

/** 한 층 그림 전체를 담는 화면 범위(여백 포함). 내부 지도와 기기 고르기 창이 함께 쓴다 */
export function floorScene(floor: Floor, cellCm: number, turn: Turn) {
    const scale = cellCm / UNIT_CM;
    const size = turnSize(floorSize(floor, cellCm), turn);
    const tallest = Math.max(1, ...[...floor.fixtures, ...floor.slots].map((each) => each.h * scale));
    const scene = sceneBounds(size, tallest);
    return {
        x: scene.x - MARGIN,
        y: scene.y - MARGIN,
        width: scene.width + MARGIN * 2,
        height: scene.height + MARGIN * 2,
    };
}

/** 상자의 좁은 쪽 변이 화면에서 가로로 차지하는 길이(SVG 단위) — 기기 하나가 얼마나 넓게 보이는지 */
export const acrossOf = (box: Pick<Box, "w" | "d">) => Math.min(box.w, box.d) * UNIT_ACROSS;

/** 이 층에서 가장 좁게 보이는 기기의 폭(SVG 단위). 기기가 없으면 null */
export function narrowestSlot(floor: Floor, cellCm: number): number | null {
    if (floor.slots.length === 0) return null;
    return Math.min(...floor.slots.map(acrossOf)) * (cellCm / UNIT_CM);
}

/** 기기 윗면에 적는 번호의 글자 크기(SVG 단위). 윗면이 좁으면 그 안에 들어가게 줄인다 */
export const numberSize = (across: number) => Math.min(11, across * 0.54);

/**
 * 입구 깔개가 놓일 자리 — 입구 칸에서 가장 가까운 바닥 변에 붙여 폭 1m, 깊이 50cm 로 둔다.
 * 칸 크기와 상관없이 같은 크기로 보이게 하려고 칸이 아니라 길이로 잡는다.
 */
export function entranceMat(floor: Floor, cellCm: number): Box {
    const scale = cellCm / UNIT_CM;
    const { width, depth } = floorSize(floor, cellCm);
    const x = (floor.entrance.x + 0.5) * scale;
    const y = (floor.entrance.y + 0.5) * scale;

    const gaps: Record<Facing, number> = { n: y, s: depth - y, w: x, e: width - x };
    const edge = (Object.keys(gaps) as Facing[]).reduce((near, each) => (gaps[each] < gaps[near] ? each : near));
    const within = (start: number, length: number, limit: number) => Math.max(0, Math.min(limit - length, start));

    if (edge === "n" || edge === "s") {
        const w = Math.min(2, width);
        return { x: within(x - w / 2, w, width), y: edge === "n" ? 0 : depth - 1, w, d: 1, h: 0 };
    }
    const d = Math.min(2, depth);
    return { x: edge === "w" ? 0 : width - 1, y: within(y - d / 2, d, depth), w: 1, d, h: 0 };
}
