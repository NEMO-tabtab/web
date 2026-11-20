import { sceneBounds, turnSize, type Turn } from "@/lib/iso";
import type { Floor } from "@/lib/shops/schema";

/** 그림 둘레의 여백(SVG 단위) — 손그림 필터가 선을 밀어내도 잘리지 않게 */
const MARGIN = 14;

/** 한 층 그림 전체를 담는 화면 범위(여백 포함). 내부 지도와 기기 고르기 창이 함께 쓴다 */
export function floorScene(floor: Floor, turn: Turn) {
    const size = turnSize({ width: floor.width, depth: floor.depth }, turn);
    const tallest = Math.max(1, ...floor.fixtures.map((each) => each.h), ...floor.slots.map((each) => each.h));
    const scene = sceneBounds(size, tallest);
    return {
        x: scene.x - MARGIN,
        y: scene.y - MARGIN,
        width: scene.width + MARGIN * 2,
        height: scene.height + MARGIN * 2,
    };
}
