import { filterFor } from "./compose";
import { FACE, LINE } from "./geometry";
import { arc, circle, ellipse, point } from "./path";
import type { Box, Drawing, Layer, Stroke } from "./types";

/*
 * 캡슐 친구 "동글" — 네모가 맨 처음 담은 캡슐. 네모가 기억을 맡고 동글은 설렘을 맡는다
 * (docs/decisions/0008-character.md "캡슐 친구"). 코드에서는 capsule 로 부른다 — 이름이 바뀌어도 문서만 고치면 된다.
 *
 * 실제 가챠 캡슐처럼 두 쪽이다: 아래쪽 그릇에 얼굴이 있고, 위쪽 뚜껑이 기분을 드러낸다
 * (닫힘 · 들썩 · 열림). 팔다리가 없어서 구르고 튄다. 칸은 네모와 같은 크기다 — 나란히 놓으면 선 굵기가 같다.
 */

/** 몸 — 지름 42칸. 네모의 몸 너비(74칸)의 절반을 조금 넘는다 */
export const CAPSULE = {
    cx: 30,
    cy: 33,
    r: 21,
    /** 이음선이 몸의 양 끝에 닿는 높이. 가운데보다 조금 위라 아래쪽 그릇에 얼굴이 들어간다 */
    seamY: 29,
    /** 이음선이 가운데에서 아래로 처지는 만큼 — 둥근 몸을 감싸는 선으로 보인다 */
    seamSag: 4.5,
    /** `size`(px)가 가리키는 칸 수와 그림 칸. 열린 뚜껑과 표시가 들어갈 여백을 둔다 */
    unit: 72,
    box: { x: -6, y: -14, width: 72, height: 72 } satisfies Box,
} as const;

const { cx, cy, r, seamY, seamSag } = CAPSULE;
const half = Math.sqrt(r * r - (cy - seamY) ** 2);
const LEFT = Math.round((cx - half) * 100) / 100;
const RIGHT = Math.round((cx + half) * 100) / 100;
const SEAM = `Q${cx} ${seamY + seamSag} `;

/** 아래쪽 그릇 — 이음선에서 바닥을 돌아 닫는다(반 바퀴보다 긴 호) */
const BOWL = `M${LEFT} ${seamY} ${SEAM}${RIGHT} ${seamY} A${r} ${r} 0 1 1 ${LEFT} ${seamY} Z`;
/** 위쪽 뚜껑 — 이음선 위의 둥근 지붕 */
const DOME = `M${LEFT} ${seamY} A${r} ${r} 0 0 1 ${RIGHT} ${seamY} ${SEAM}${LEFT} ${seamY} Z`;

const paper = (d: string): Stroke => ({ d, fill: "paper", w: LINE.body });
const line = (d: string, w: number = LINE.mark): Stroke => ({ d, w });
const dot = (x: number, y: number, radius: number): Stroke => ({ d: circle(x, y, radius), fill: "ink" });

/** 얼굴 — 눈과 볼의 모양은 네모와 같고 몸에 맞춰 조금 작다. 입은 ω 가 아니라 작은 웃음이다 */
const EYE = { y: 40.5, gap: 7, r: 3.5 } as const;
const L = cx - EYE.gap;
const R = cx + EYE.gap;
const MOUTH_Y = 46.5;

const EYES = {
    dot: [dot(L, EYE.y, EYE.r), dot(R, EYE.y, EYE.r)],
    big: [dot(L, EYE.y - 0.5, 4.6), dot(R, EYE.y - 0.5, 4.6)],
    smile: [line(arc(L, EYE.y + 1.2, 3.8, -5.2), LINE.face), line(arc(R, EYE.y + 1.2, 3.8, -5.2), LINE.face)],
    asleep: [line(arc(L, EYE.y - 1, 3.8, 4.8), LINE.face), line(arc(R, EYE.y - 1, 3.8, 4.8), LINE.face)],
    /** 아래를 보는 눈 */
    down: [dot(L, EYE.y + 1.5, 3.2), dot(R, EYE.y + 1.5, 3.2)],
} satisfies Record<string, readonly Stroke[]>;

const MOUTHS = {
    /** 작은 웃음 — 기본 */
    smile: [line(arc(cx, MOUTH_Y, 3, 3), 3.4)],
    /** 벌린 입 */
    open: [{ d: `M${cx - 4} ${MOUTH_Y - 0.5} h8 q-0.5 5.5 -4 5.5 q-3.5 0 -4 -5.5 Z`, fill: "ink", w: 1.6 }],
    /** 놀란 입 */
    round: [{ d: ellipse(cx, MOUTH_Y + 1.5, 2.4, 3), w: 3.2 }],
    /** 처진 입 */
    frown: [line(arc(cx, MOUTH_Y + 2, 3, -3), 3.4)],
    /** 잠든 입 */
    tiny: [line(point(cx, MOUTH_Y + 1), 3.6)],
} satisfies Record<string, readonly Stroke[]>;

const CHEEKS: readonly Stroke[] = [
    { d: circle(cx - 10.8, 45.6, 3), fill: "cheek", opacity: FACE.cheekOpacity },
    { d: circle(cx + 10.8, 45.6, 3), fill: "cheek", opacity: FACE.cheekOpacity },
];

/** 뚜껑에 비친 빛 — 속이 비치는 플라스틱 캡슐이라는 표시. 뚜껑과 함께 움직인다 */
const GLINT: Stroke = line("M19.5 25 q1 -5 7 -8", 2.6);

/** 뚜껑 틈 — 캡슐의 기분이 드러나는 곳. 왼쪽 끝을 경첩 삼아 오른쪽이 들린다 */
const LIDS = {
    closed: undefined,
    /** 들썩 */
    ajar: `translate(0 -3) rotate(-9 ${LEFT} ${seamY})`,
    /** 열림 */
    open: `translate(1 -9) rotate(-38 ${LEFT} ${seamY})`,
} satisfies Record<string, string | undefined>;

const MARKS = {
    /** 들썩일 때 위로 튀는 선 */
    ticks: [line("M22.5 2 l-2.5 -5.5"), line("M33 0 l1 -6"), line("M43 3 l3.5 -5")],
    /** 뚜껑이 열릴 때 틈에서 나오는 선 */
    burst: [line("M57 21 l5.5 -3.5"), line("M58.5 28.5 l6.5 0.5"), line("M52 13 l3.5 -5.5")],
    /** 굴러온 자국 — 뒤쪽의 휜 선과 바닥 */
    roll: [line("M3.5 21 q-5.5 11 -0.5 23"), line("M-3 27 q-3.5 6.5 -0.5 13", 3), line("M6 57 h9 M20 57 h4", 3)],
    /** 튀어 오른 자리 */
    hop: [line("M16 57.5 q14 3.5 28 0", 3)],
    zzz: [line("M51 11 h7 l-7 8 h7"), line("M60 0 h5 l-5 6 h5", 3)],
} satisfies Record<string, readonly Stroke[]>;

export interface CapsuleExpression {
    /** 화면과 문서에 쓰는 이름 */
    label: string;
    /** 쓰는 순간 */
    when: string;
    eyes: keyof typeof EYES;
    mouth: keyof typeof MOUTHS;
    lid: keyof typeof LIDS;
    /** 볼터치를 그리지 않는다 */
    pale?: boolean;
    marks?: readonly (keyof typeof MARKS)[];
    /** 몸을 굴린 각도(도) */
    turn?: number;
    /** 몸을 띄우는 높이(칸) */
    lift?: number;
}

/*
 * 표정 목록 — 이 맵이 원본이다. 문서 화면(/design-system/character/friend)이 이 맵을 돌며 그린다.
 * 네모보다 적다. 캡슐 친구는 말을 하지 않고 화면의 화자도 아니어서, 네모 옆에서 거드는 얼굴만 있으면 된다.
 */
export const CAPSULE_EXPRESSIONS = {
    base: { label: "기본", when: "네모 옆에 있을 때", eyes: "dot", mouth: "smile", lid: "closed" },
    bounce: {
        label: "들썩",
        when: "새 종류가 나왔을 때 — 뚜껑이 들썩인다",
        eyes: "smile",
        mouth: "open",
        lid: "ajar",
        marks: ["ticks", "hop"],
        lift: 4,
    },
    pop: {
        label: "열림",
        when: "깜짝 놀랐을 때 — 뚜껑이 열린다",
        eyes: "big",
        mouth: "round",
        lid: "open",
        marks: ["burst"],
    },
    roll: {
        label: "데굴",
        when: "기다리는 동안 — 굴러다닌다",
        eyes: "dot",
        mouth: "smile",
        lid: "closed",
        marks: ["roll"],
        turn: 24,
    },
    sad: { label: "시무룩", when: "찾지 못했을 때", eyes: "down", mouth: "frown", lid: "closed", pale: true },
    sleep: {
        label: "쿨쿨",
        when: "오프라인, 쉬는 동안",
        eyes: "asleep",
        mouth: "tiny",
        lid: "closed",
        marks: ["zzz"],
        turn: -14,
    },
} satisfies Record<string, CapsuleExpression>;

export type CapsuleExpressionId = keyof typeof CAPSULE_EXPRESSIONS;
export const CAPSULE_EXPRESSION_IDS = Object.keys(CAPSULE_EXPRESSIONS) as CapsuleExpressionId[];

/** 이 크기(px) 이하에서는 표시를 그리지 않는다 */
export const CAPSULE_MARKS_HIDDEN_MAX = 40;

export interface CapsuleOptions {
    expression?: CapsuleExpressionId;
    /** 그릴 크기(px). 작으면 표시를 빼고 필터를 바꾼다 */
    size?: number;
}

/** 캡슐 친구의 층 — 장면(scenes.ts)이 네모 옆에 옮겨 놓을 수 있게 층만 따로 낸다 */
export function capsuleLayers(expression: CapsuleExpressionId, withMarks: boolean): Layer[] {
    const picked: CapsuleExpression = CAPSULE_EXPRESSIONS[expression];
    const moves = [
        picked.lift ? `translate(0 ${-picked.lift})` : undefined,
        picked.turn ? `rotate(${picked.turn} ${cx} ${cy})` : undefined,
    ].filter(Boolean);
    const body = moves.join(" ") || undefined;
    const lid = [...moves, LIDS[picked.lid]].filter(Boolean).join(" ") || undefined;
    const layers: Layer[] = [
        {
            transform: body,
            strokes: [paper(BOWL), ...(picked.pale ? [] : CHEEKS), ...EYES[picked.eyes], ...MOUTHS[picked.mouth]],
        },
        // 뚜껑은 그릇 위에 얹힌다. 닫혀 있으면 두 조각의 이음선이 한 줄로 겹친다
        { transform: lid, strokes: [paper(DOME), GLINT] },
    ];
    if (withMarks && picked.marks) {
        layers.push({ strokes: picked.marks.flatMap((id) => MARKS[id]) });
    }
    return layers;
}

/** 캡슐 친구 한 장 */
export function composeCapsule({ expression = "base", size = CAPSULE.unit }: CapsuleOptions = {}): Drawing {
    return {
        box: CAPSULE.box,
        unit: CAPSULE.unit,
        filter: filterFor(size),
        layers: capsuleLayers(expression, size > CAPSULE_MARKS_HIDDEN_MAX),
    };
}
