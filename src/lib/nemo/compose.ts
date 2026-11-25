import { ARMS_REST, BODY_STROKES, FEET_REST } from "./body";
import { EXPRESSIONS, type Expression, type ExpressionId } from "./expressions";
import { CHEEKS, EYES, MOUTHS } from "./face";
import { BODY, CANVAS, SYMBOL } from "./geometry";
import { MARKS } from "./marks";
import { TAPES } from "./tape";
import type { Drawing, FilterId, Layer, Stroke } from "./types";

/*
 * 부품을 한 장의 그림으로 조합한다. 크기에 따라 덜어 낼 것도 여기서 정한다.
 */

/** 이 크기(px) 이하에서는 작은 필터를 쓴다 — 큰 필터는 가는 획을 무너뜨린다 */
export const SMALL_FILTER_MAX = 40;
/** 이 크기(px) 이하에서는 표시(땀방울·물음표 등)를 그리지 않는다 — 점으로 뭉개진다 */
export const MARKS_HIDDEN_MAX = 64;

export const filterFor = (size: number): FilterId => (size <= SMALL_FILTER_MAX ? "rough-line-sm" : "rough-line");

/** 얼굴 면에 놓이는 것 — 테이프, 볼, 눈, 입. 아래에서 위로 */
const faceStrokes = (expression: Expression): Stroke[] => [
    ...TAPES[expression.tape],
    ...CHEEKS[expression.cheeks],
    ...EYES[expression.eyes],
    ...MOUTHS[expression.mouth],
];

export interface NemoOptions {
    expression?: ExpressionId;
    /** 그릴 크기(px). 작으면 표시를 빼고 필터를 바꾼다 */
    size?: number;
}

/** 전신 정면 */
export function composeNemo({ expression = "base", size = CANVAS }: NemoOptions = {}): Drawing {
    const picked: Expression = EXPRESSIONS[expression];
    const layers: Layer[] = [
        {
            // 발밑 가운데를 축으로 기울인다
            transform: picked.lean ? `rotate(${picked.lean} ${BODY.cx} ${BODY.bottom})` : undefined,
            // 팔다리는 몸 뒤에 있다
            strokes: [...ARMS_REST, ...FEET_REST, ...BODY_STROKES, ...faceStrokes(picked)],
        },
    ];
    if (picked.marks && size > MARKS_HIDDEN_MAX) {
        layers.push({ strokes: picked.marks.flatMap((id) => MARKS[id]) });
    }
    return { viewBox: `0 0 ${CANVAS} ${CANVAS}`, filter: filterFor(size), layers };
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
        viewBox: `${SYMBOL.x} ${SYMBOL.y} ${SYMBOL.canvas} ${SYMBOL.canvas}`,
        // 심볼은 크기와 상관없이 작은 필터 — 변위가 커지면 24px 에서 획이 끊긴다
        filter: "rough-line-sm",
        layers: [{ strokes: bolder([...BODY_STROKES, ...faceStrokes(picked)]) }],
    };
}
