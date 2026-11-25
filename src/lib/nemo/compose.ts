import { BODIES, TAPE_CUT } from "./body";
import { EXPRESSIONS, type Expression, type ExpressionId } from "./expressions";
import { CHEEKS, EYES, MOUTHS } from "./face";
import { BODY, CANVAS, SYMBOL } from "./geometry";
import { FREE_ARMS, arm, feet } from "./limbs";
import { MARKS, RIGHT_HAND_MARKS } from "./marks";
import { CANVAS_BOX, POSES, type Pose, type PoseId } from "./poses";
import { PROPS, RIGHT_HAND_PROPS } from "./props";
import { DEPTH, SIDE_SHIFT, SOLID_BACK, SOLID_BACK_OPEN, SOLID_BOX, SOLID_MIN, solidTape } from "./solid";
import { TAPES } from "./tape";
import type { Box, Drawing, FilterId, Layer, Stroke } from "./types";

/*
 * 부품을 한 장의 그림으로 조합한다. 크기에 따라 덜어 낼 것도 여기서 정한다.
 */

/** 이 크기(px) 이하에서는 작은 필터를 쓴다 — 큰 필터는 가는 획을 무너뜨린다 */
export const SMALL_FILTER_MAX = 40;
/** 이 크기(px) 이하에서는 소품과 표시(땀방울·물음표 등)를 그리지 않는다 — 점으로 뭉개진다 */
export const DETAIL_HIDDEN_MAX = 64;

export const filterFor = (size: number): FilterId => (size <= SMALL_FILTER_MAX ? "rough-line-sm" : "rough-line");

/** 얼굴 — 볼, 눈, 입. 아래에서 위로 */
const faceStrokes = (expression: Expression): Stroke[] => [
    ...CHEEKS[expression.cheeks],
    ...EYES[expression.eyes],
    ...MOUTHS[expression.mouth],
];

/** 정면이 기준이다. 입체는 큰 그림에만 쓴다 */
export type NemoView = "front" | "solid";

export interface NemoOptions {
    /** 주지 않으면 자세에 딸린 표정 */
    expression?: ExpressionId;
    pose?: PoseId;
    /** 입체는 SOLID_MIN(px) 이상에서만 그린다. 그보다 작으면 정면으로 그린다 */
    view?: NemoView;
    /** 그릴 크기(px). 작으면 소품과 표시를 빼고 필터를 바꾼다 */
    size?: number;
    /** 자세의 팔다리만 그리고 소품은 뺀다 — 장면에서 캡슐 친구가 소품 자리를 대신할 때 */
    bare?: boolean;
}

/** 두 칸을 모두 담는 가장 작은 칸 */
export const union = (a: Box, b: Box): Box => {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    return {
        x,
        y,
        width: Math.max(a.x + a.width, b.x + b.width) - x,
        height: Math.max(a.y + a.height, b.y + b.height) - y,
    };
};

/** 전신 */
export function composeNemo({
    expression,
    pose = "stand",
    view = "front",
    size = CANVAS,
    bare = false,
}: NemoOptions = {}): Drawing {
    const stance: Pose = POSES[pose];
    const picked: Expression = EXPRESSIONS[expression ?? stance.expression];
    const detailed = size > DETAIL_HIDDEN_MAX;
    const solid = view === "solid" && size >= SOLID_MIN;
    const props = detailed && !bare ? (stance.props ?? []) : [];
    // 소품을 뺀 작은 그림에서는 소품을 들던 팔이 허공에 뜬다 — 서 있는 팔다리로 돌아간다
    const limbs: Pose = stance.props && !detailed ? POSES.stand : stance;
    const body = BODIES[stance.body];
    const open = stance.body === "open";
    // 뚜껑이 열리면 테이프는 앞면에 남은 자락뿐이다
    const tape = open ? TAPE_CUT : solid ? solidTape(picked.tape) : TAPES[picked.tape];
    // 입체에서는 앞면 뒤에 윗면과 옆면이 온다
    const back = solid ? (open ? SOLID_BACK_OPEN : SOLID_BACK) : body.back;
    // 입체에서 오른팔은 옆면 가운데에서 나온다 — 몸이나 얼굴 앞의 소품에 닿아 있는 팔만 제자리에 둔다
    const sideways = solid && FREE_ARMS.has(limbs.arms[1]);
    const toSide = sideways ? `translate(${SIDE_SHIFT.x} ${SIDE_SHIFT.y})` : undefined;
    const rightArm = arm("right", limbs.arms[1], sideways ? [SIDE_SHIFT.x, SIDE_SHIFT.y] : undefined);
    // 소품을 든 자세는 기울이지 않는다 — 손과 소품이 어긋난다
    const lean = props.length === 0 ? picked.lean : undefined;
    const lift = stance.lift ?? 0;
    const tilt = lean ? `rotate(${lean} ${BODY.cx} ${BODY.bottom})` : undefined;

    const layers: Layer[] = [
        {
            // 띄운 다음, 발밑 가운데를 축으로 기울인다
            transform: [lift ? `translate(0 ${-lift})` : undefined, tilt].filter(Boolean).join(" ") || undefined,
            strokes: [
                // 팔다리는 몸 뒤에 있다. 입체에서는 오른팔만 옆면 앞으로 나온다
                arm("left", limbs.arms[0]),
                ...(solid ? [] : [rightArm]),
                ...feet(limbs.feet),
                ...back,
                ...(solid ? [rightArm] : []),
                ...body.front,
                ...tape,
                ...faceStrokes(picked),
                ...body.over,
            ],
        },
    ];
    // 오른손에 든 소품과 그 옆의 표시는 오른팔을 따라 옮긴다
    const inHand = props.filter((id) => sideways && RIGHT_HAND_PROPS.has(id));
    const placed = props.filter((id) => !inHand.includes(id));
    if (placed.length > 0) layers.push({ strokes: placed.flatMap((id) => PROPS[id]) });
    if (inHand.length > 0) layers.push({ transform: toSide, strokes: inHand.flatMap((id) => PROPS[id]) });
    if (detailed) {
        // 표정에 딸린 표시는 몸과 함께 뜬다. 입체에서는 오른쪽 위 자리를 옆면이 차지하므로 그 너머로 옮긴다
        const fromFace = stance.quiet ? [] : (picked.marks ?? []);
        const dx = solid ? DEPTH.x + 2 : 0;
        const dy = (solid ? DEPTH.y : 0) - lift;
        if (fromFace.length > 0) {
            layers.push({
                transform: dx || dy ? `translate(${dx} ${dy})` : undefined,
                strokes: fromFace.flatMap((id) => MARKS[id]),
            });
        }
        // 자세에 딸린 표시(발밑 선 등)는 몸이 떠도 제자리에 있다. 오른손 옆의 것만 팔을 따라간다
        for (const id of stance.marks ?? []) {
            layers.push({ transform: RIGHT_HAND_MARKS.has(id) ? toSide : undefined, strokes: MARKS[id] });
        }
    }
    const posed = detailed && stance.box ? stance.box : CANVAS_BOX;
    const whole = solid ? union(posed, SOLID_BOX) : posed;
    return {
        // 오른팔을 옮긴 만큼 오른쪽 위로 자리를 더 잡는다
        box: sideways
            ? { x: whole.x, y: whole.y + SIDE_SHIFT.y, width: whole.width + SIDE_SHIFT.x, height: whole.height - SIDE_SHIFT.y }
            : whole,
        unit: CANVAS,
        filter: filterFor(size),
        layers,
    };
}

const bolder = (strokes: readonly Stroke[]): Stroke[] =>
    strokes.map((stroke) => (stroke.w ? { ...stroke, w: stroke.w * SYMBOL.lineScale } : stroke));

/**
 * 심볼 — 팔다리와 표시를 덜어 낸 얼굴. 헤더·로그인처럼 좁은 자리에 쓴다.
 * 몸·테이프·얼굴은 전신의 것 그대로라 표정이 그대로 따라온다. 기울기는 쓰지 않는다.
 */
export function composeSymbol({ expression = "base" }: Pick<NemoOptions, "expression"> = {}): Drawing {
    const picked: Expression = EXPRESSIONS[expression];
    return {
        box: { x: SYMBOL.x, y: SYMBOL.y, width: SYMBOL.canvas, height: SYMBOL.canvas },
        unit: SYMBOL.canvas,
        // 심볼은 크기와 상관없이 작은 필터 — 변위가 커지면 24px 에서 획이 끊긴다
        filter: "rough-line-sm",
        layers: [{ strokes: bolder([...BODIES.box.front, ...TAPES[picked.tape], ...faceStrokes(picked)]) }],
    };
}
