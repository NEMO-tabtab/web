import { FACE, LINE } from "./geometry";
import { arc, circle, cutDisc, dash, ellipse, star } from "./path";
import type { Stroke } from "./types";

/*
 * 얼굴 부품. 기본은 점 눈 두 개·ω 입·볼 두 점이고, 표정은 그 모양을 조금 바꿔 만든다.
 * 눈썹과 그림자는 그리지 않는다(docs/decisions/0008-character.md "얼굴은 덜어 낸 채로 둔다").
 */

const { eyeY: Y, eyeLeftX: L, eyeRightX: R, eyeR, mouthY } = FACE;
/** 입은 몸의 가운데 세로선에 놓인다 */
const MX = (L + R) / 2;

const dot = (cx: number, cy: number, r: number = eyeR): Stroke => ({ d: circle(cx, cy, r), fill: "ink" });
const line = (d: string, w: number = LINE.face): Stroke => ({ d, w });

/** 눈 — 왼쪽, 오른쪽 순서 */
export const EYES = {
    /** 점 눈 — 기본 */
    dot: [dot(L, Y), dot(R, Y)],
    /** 위를 보는 눈 */
    up: [dot(L, Y - 3.5), dot(R, Y - 3.5)],
    /** 큰 눈 */
    big: [dot(L, Y, 5.8), dot(R, Y, 5.8)],
    /** 한쪽이 큰 눈 — 갸웃 */
    uneven: [dot(L, Y), dot(R, Y - 1, 5.6)],
    /** 웃는 눈 ⌒ ⌒ */
    smile: [line(arc(L, Y + 1.5, 4.8, -6.5)), line(arc(R, Y + 1.5, 4.8, -6.5))],
    /** 감은 눈 — — */
    closed: [line(dash(L, Y, 4.6)), line(dash(R, Y, 4.6))],
    /** 잠든 눈 ‿ ‿ */
    asleep: [line(arc(L, Y - 1.5, 4.8, 6)), line(arc(R, Y - 1.5, 4.8, 6))],
    /** 힘을 준 눈 — 윗부분이 안쪽으로 비스듬히 잘린다 */
    firm: [
        { d: cutDisc(L, Y, 5, 36, 14), fill: "ink" },
        { d: cutDisc(R, Y, 5, 14, 36), fill: "ink" },
    ],
    /** 반짝 눈 — 네 갈래 별 */
    sparkle: [
        { d: star(L, Y, 7.4, 0.26), fill: "ink" },
        { d: star(R, Y, 7.4, 0.26), fill: "ink" },
    ],
    /** 한쪽만 감은 눈 */
    wink: [dot(L, Y), line(arc(R, Y + 1.5, 4.8, -6.5))],
} satisfies Record<string, readonly Stroke[]>;

/** 입 */
export const MOUTHS = {
    /** ω — 기본 */
    omega: [line(`M${MX - 8} ${mouthY} q4 6 8 0 q4 6 8 0`)],
    /** 크게 웃는 ω */
    omegaBig: [line(`M${MX - 10} ${mouthY - 0.5} q5 7.5 10 0 q5 7.5 10 0`)],
    /** 벌린 입 — 먹으로 채운다 */
    open: [{ d: `M${MX - 6.5} ${mouthY} h13 q-0.5 8.5 -6.5 8.5 q-6 0 -6.5 -8.5 Z`, fill: "ink", w: 2 }],
    /** 작게 벌린 입 */
    small: [{ d: circle(MX, mouthY + 2.5, 2.4), w: 3.4 }],
    /** 놀란 입 o */
    round: [{ d: ellipse(MX, mouthY + 3.5, 3.4, 4.4), w: LINE.face }],
    /** 일자 입 */
    flat: [line(dash(MX, mouthY + 2.5, 5.5))],
    /** 물결 입 */
    wavy: [line(`M${MX - 8} ${mouthY + 2.5} q2.7 -4.2 5.3 0 q2.7 4.2 5.4 0 q2.7 -4.2 5.3 0`)],
    /** 작은 입 */
    tiny: [line(arc(MX, mouthY + 1.5, 3, 2.6))],
} satisfies Record<string, readonly Stroke[]>;

const cheeks = (r: number, opacity: number): Stroke[] => [
    // 왼쪽·오른쪽을 따로 둔다 — 두 볼의 색이 달라질 수 있다(#153)
    { d: circle(FACE.cheekLeftX, FACE.cheekY, r), fill: "cheek", opacity },
    { d: circle(FACE.cheekRightX, FACE.cheekY, r), fill: "cheek", opacity },
];

/** 볼터치 */
export const CHEEKS = {
    base: cheeks(FACE.cheekR, FACE.cheekOpacity),
    /** 기쁘거나 멋쩍을 때 — 조금 크고 진하다 */
    deep: cheeks(FACE.cheekR + 1.1, 1),
} satisfies Record<string, readonly Stroke[]>;

export type EyesId = keyof typeof EYES;
export type MouthId = keyof typeof MOUTHS;
export type CheeksId = keyof typeof CHEEKS;
