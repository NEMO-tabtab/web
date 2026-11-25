import { BODY, LINE, TAPE } from "./geometry";
import type { Stroke } from "./types";

/*
 * 테이프 — 네모의 기분이 드러나는 곳.
 * 몸 위로 솟은 꼭지와 얼굴 쪽으로 내려온 자락이 한 조각이다. 종이로 채워서 몸의 윗선을 덮는다.
 */

const { left: L, right: R, top: T, notch: N, tip: P } = TAPE;
const CX = BODY.cx;
/** 지그재그 이빨 하나의 반 너비 */
const HALF_TOOTH = (R - L) / 4;

/** 위로 dy 만큼 옮긴(음수면 올린) 곧은 테이프 */
const straight = (dy: number) =>
    [
        `M${L} ${T + dy}`,
        `L${R} ${T + dy}`,
        `L${R} ${N + dy}`,
        `L${CX + HALF_TOOTH} ${P + dy}`,
        `L${CX} ${N + dy}`,
        `L${CX - HALF_TOOTH} ${P + dy}`,
        `L${L} ${N + dy}`,
        "Z",
    ].join(" ");

const piece = (d: string): Stroke => ({ d, fill: "paper", w: LINE.body });

export const TAPES = {
    /** 기본 */
    rest: [piece(straight(0))],
    /** 쫑긋 — 놀라거나 신날 때 통째로 솟는다 */
    perk: [piece(straight(-7))],
    /** 축 — 풀이 죽으면 꼭지가 내려앉고 자락이 길게 늘어진다 */
    droop: [piece(`M${L} ${T + 5} L${R} ${T + 5} L${R + 1.5} ${N + 6} L${CX + 6} ${P + 6.5} L${CX + 1.5} ${N + 6.5} L${CX - 3} ${P + 6.5} L${L + 1.5} ${N + 6} Z`)],
    /** 펄럭 — 꼭지가 바람에 눕는다 */
    flutter: [
        piece(
            `M${L} ${BODY.top + 0.5} L${L + 4.5} ${T - 2} L${R + 4.5} ${T + 1} L${R} ${BODY.top + 0.5} L${R} ${N} L${CX + HALF_TOOTH} ${P} L${CX} ${N} L${CX - HALF_TOOTH} ${P} L${L} ${N} Z`,
        ),
    ],
} satisfies Record<string, readonly Stroke[]>;

export type TapeId = keyof typeof TAPES;
