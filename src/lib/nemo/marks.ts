import { LINE } from "./geometry";
import { point, star } from "./path";
import type { Stroke } from "./types";

/*
 * 표시 — 얼굴 밖에 붙는 작은 기호(땀방울, 반짝, 물음표…). 이모지 대신 먹선으로 그린다.
 * 몸의 오른쪽 위 빈자리에 놓는다. 몸이 기울어도 표시는 기울지 않는다.
 */

const line = (d: string, w: number = LINE.mark): Stroke => ({ d, w });

export const MARKS = {
    /** 땀방울 — 멋쩍을 때 */
    sweat: [{ d: "M106 30 C110.5 36.5 111.5 40 106 43.5 C100.5 40 101.5 36.5 106 30 Z", fill: "paper", w: LINE.mark }],
    /** 반짝 — 뿌듯할 때 */
    sparkle: [
        { d: star(108, 28, 7.5), fill: "ink" },
        { d: star(114.5, 42.5, 4), fill: "ink" },
    ],
    /** 물음표 */
    question: [line("M102 25 q0 -6.5 6 -6.5 q6 0 6 6 q0 4.5 -6 6.5 v3", 4), line(point(108, 42), 4.8)],
    /** 느낌표 */
    bang: [line("M108.5 14 v15.5", 4.6), line(point(108.5, 38.5), 5.2)],
    /** zzz */
    zzz: [line("M100 30 h9 l-9 10 h9"), line("M111 14.5 h6.5 l-6.5 7.5 h6.5", 3)],
    /** 테이프가 솟을 때 양옆에 붙는 짧은 선 */
    ticks: [line("M43.5 8.5 l-4.5 -4.5"), line("M76.5 8.5 l4.5 -4.5")],
    /** 테이프가 펄럭일 때의 바람 */
    wind: [line("M80.5 7.5 q4 -1.5 7.5 0.5"), line("M81.5 15.5 q3 -1 5.5 0")],
    /** 든 손을 흔드는 선 — 오른손 옆 */
    wave: [line("M116.5 34 q4.5 4.5 3.5 10.5"), line("M122.5 29.5 q6.5 6.5 5 16", 3)],
    /** 폴짝 뛴 자리 — 발밑 */
    hop: [line("M30 117 q5 2.5 10 0"), line("M80 117 q5 2.5 10 0")],
} satisfies Record<string, readonly Stroke[]>;

export type MarkId = keyof typeof MARKS;

/** 오른손 옆에 붙는 표시 — 입체 보기에서 오른팔과 함께 옆면 가운데로 옮긴다 */
export const RIGHT_HAND_MARKS: ReadonlySet<MarkId> = new Set<MarkId>(["wave"]);
