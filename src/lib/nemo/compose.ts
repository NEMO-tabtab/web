import { BODIES, TAPE_CUT } from "./body";
import { EXPRESSIONS, type Expression, type ExpressionId } from "./expressions";
import { CHEEKS, EYES, MOUTHS } from "./face";
import { BODY, CANVAS, SYMBOL } from "./geometry";
import { arm, feet } from "./limbs";
import { MARKS } from "./marks";
import { CANVAS_BOX, POSES, type Pose, type PoseId } from "./poses";
import { PROPS } from "./props";
import { TAPES } from "./tape";
import type { Drawing, FilterId, Layer, Stroke } from "./types";

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

export interface NemoOptions {
    /** 주지 않으면 자세에 딸린 표정 */
    expression?: ExpressionId;
    pose?: PoseId;
    /** 그릴 크기(px). 작으면 소품과 표시를 빼고 필터를 바꾼다 */
    size?: number;
}

/** 전신 정면 */
export function composeNemo({ expression, pose = "stand", size = CANVAS }: NemoOptions = {}): Drawing {
    const stance: Pose = POSES[pose];
    const picked: Expression = EXPRESSIONS[expression ?? stance.expression];
    const detailed = size > DETAIL_HIDDEN_MAX;
    const props = detailed ? (stance.props ?? []) : [];
    // 소품을 뺀 작은 그림에서는 소품을 들던 팔이 허공에 뜬다 — 서 있는 팔다리로 돌아간다
    const limbs: Pose = stance.props && !detailed ? POSES.stand : stance;
    const body = BODIES[stance.body];
    // 뚜껑이 열리면 테이프는 앞면에 남은 자락뿐이다
    const tape = stance.body === "open" ? TAPE_CUT : TAPES[picked.tape];
    // 소품을 든 자세는 기울이지 않는다 — 손과 소품이 어긋난다
    const lean = props.length === 0 ? picked.lean : undefined;
    const lift = stance.lift ? `translate(0 ${-stance.lift})` : undefined;
    const tilt = lean ? `rotate(${lean} ${BODY.cx} ${BODY.bottom})` : undefined;

    const layers: Layer[] = [
        {
            // 띄운 다음, 발밑 가운데를 축으로 기울인다
            transform: [lift, tilt].filter(Boolean).join(" ") || undefined,
            strokes: [
                // 팔다리는 몸 뒤에 있다
                arm("left", limbs.arms[0]),
                arm("right", limbs.arms[1]),
                ...feet(limbs.feet),
                ...body.back,
                ...body.front,
                ...tape,
                ...faceStrokes(picked),
                ...body.over,
            ],
        },
    ];
    if (props.length > 0) {
        layers.push({ strokes: props.flatMap((id) => PROPS[id]) });
    }
    if (detailed) {
        // 표정에 딸린 표시는 몸과 함께 뜨고, 자세에 딸린 표시(손 흔드는 선, 발밑 선)는 제자리에 있다
        const fromFace = stance.quiet ? [] : (picked.marks ?? []);
        if (fromFace.length > 0) layers.push({ transform: lift, strokes: fromFace.flatMap((id) => MARKS[id]) });
        if (stance.marks) layers.push({ strokes: stance.marks.flatMap((id) => MARKS[id]) });
    }
    return {
        box: detailed && stance.box ? stance.box : CANVAS_BOX,
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
