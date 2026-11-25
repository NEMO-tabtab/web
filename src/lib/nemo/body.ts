import { BODY, LINE, TAPE } from "./geometry";
import type { Stroke } from "./types";

/*
 * 몸 — 종이로 채운 상자. 몸이 곧 하는 일이라, 뚜껑을 열어 담고 일이 잘못되면 구겨진다.
 * back 은 몸의 앞면보다 먼저(뒤에), over 는 얼굴까지 다 그린 뒤(위에) 그린다.
 */

const paper = (d: string, w: number = LINE.body): Stroke => ({ d, fill: "paper", w });
const crease = (d: string): Stroke => ({ d, w: LINE.mark });

interface BodyShape {
    back: readonly Stroke[];
    front: readonly Stroke[];
    over: readonly Stroke[];
}

/** 오른쪽 위 모서리가 눌려 들어간 몸 */
const CRUMPLED_PATH =
    "M25 34 Q24 26 32 25 L75 24.4 L83 32.5 L89.5 28.5 L96.2 42 L97 92 Q97 100 89 101 L31 102 Q23 102 23 94 Z";

export const BODIES = {
    /** 닫힌 상자 — 기본 */
    box: { back: [], front: [paper(BODY.path)], over: [] },
    /** 뚜껑 열림 — 양옆 날개가 벌어지고 안쪽이 보인다 */
    open: {
        back: [
            // 뒤쪽 날개 — 곧게 서 있다
            paper("M33 17.5 L36.5 3.5 L84 3 L87.5 17 Z"),
            // 안쪽 — 물러난 면이라 옅게 칠한다
            { d: "M25 25 L32 17.5 L88.5 17 L95.5 24.5 Z", fill: "cream", w: LINE.face },
            // 왼쪽·오른쪽 날개 — 바깥으로 벌어진다
            paper("M25 25 L32 17.5 L17.5 9.5 L10 17 Z"),
            paper("M95.5 24.5 L88.5 17 L103 9 L110.5 16.5 Z"),
        ],
        front: [paper(BODY.path)],
        over: [],
    },
    /** 구겨짐 — 한쪽 모서리가 눌리고, 테이프 두 조각을 엇갈려 붙였다 */
    crumpled: {
        back: [],
        front: [paper(CRUMPLED_PATH)],
        over: [
            crease("M78.5 36.5 l6 5"),
            crease("M87.5 43 l5 2"),
            // 엇갈려 붙인 테이프 — 이마 왼쪽
            paper("M30.5 39.5 L33.5 36.5 L42.5 45.5 L39.5 48.5 Z", 3),
            paper("M39.5 36.5 L42.5 39.5 L33.5 48.5 L30.5 45.5 Z", 3),
        ],
    },
} satisfies Record<string, BodyShape>;

export type BodyId = keyof typeof BODIES;

/**
 * 뚜껑이 열린 몸에 붙는 테이프 — 위로 솟는 꼭지 없이 앞면에 남은 자락만.
 * 뚜껑이 열려 있는 동안에는 테이프가 기분을 드러내지 못한다.
 */
export const TAPE_CUT = [
    paper(
        `M${TAPE.left} ${BODY.top + 2} L${TAPE.right} ${BODY.top + 2} L${TAPE.right} ${TAPE.notch} L${BODY.cx + 4.5} ${TAPE.tip} L${BODY.cx} ${TAPE.notch} L${BODY.cx - 4.5} ${TAPE.tip} L${TAPE.left} ${TAPE.notch} Z`,
    ),
] satisfies readonly Stroke[];
