import { BODY, LINE, TAPE } from "./geometry";
import type { TapeId } from "./tape";
import type { Box, Stroke } from "./types";

/*
 * 입체 보기 — 정면 그림을 그대로 두고, 윗면과 옆면을 뒤로 덧붙인다(사투영).
 * 얼굴이 놓인 앞면이 정면 보기와 같아서 표정·팔다리·소품을 그대로 쓴다
 * (docs/decisions/0008-character.md "입체는 정면에 덧붙인다").
 * 큰 그림에만 쓴다 — 작은 크기에서는 안쪽 선이 뭉개진다.
 */

/** 이 크기(px)부터 입체로 그린다. 그보다 작으면 정면으로 돌아간다 */
export const SOLID_MIN = 160;

/**
 * 뒤로 물러나는 만큼(칸) — 오른쪽 위로.
 * 높이는 정면 보기에서 테이프가 몸 위로 솟은 높이와 같다: 정면의 꼭지는 윗면에 붙은 테이프를 눌러 그린 것이다.
 */
export const DEPTH = { x: 14, y: -(BODY.top - TAPE.top) } as const;

/**
 * 옆면의 가운데 — 입체에서 오른팔과 오른손에 든 것을 이만큼 옮긴다.
 * 그대로 두면 든 팔이 옆면의 뒤쪽 테두리와 겹쳐 보이지 않는다.
 */
export const SIDE_SHIFT = { x: DEPTH.x / 2, y: DEPTH.y / 2 } as const;

/** 입체 보기의 그림 칸 — 옆면과 윗면, 옮겨 놓은 표시가 들어간다 */
export const SOLID_BOX: Box = { x: 0, y: -16, width: 138, height: 136 };

const paper = (d: string, w: number = LINE.body): Stroke => ({ d, fill: "paper", w });

/*
 * 아래 좌표는 몸의 패스(BODY.path)를 DEPTH 만큼 옮겨 얻었다.
 * 둥근 모서리에서는 접선이 DEPTH 와 나란해지는 점(27,27 / 94.3,98.9)에서 바깥 선이 뒤로 이어진다.
 */
const TOP_FACE = "M27 27 L41 15 Q43 13.2 46 13 L102 12 Q106.5 12.2 108 14 L94 26 L32 25 Z";
const SIDE_FACE = "M94 26 L108 14 Q110 15 110 20 L111 80 Q111 85.5 108.3 86.9 L94.3 98.9 Z";
const OUTLINE = "M27 27 L41 15 Q43 13.2 46 13 L102 12 Q110 12 110 20 L111 80 Q111 85.5 108.3 86.9 L94.3 98.9";
/** 윗면과 옆면이 만나는 모서리 */
const RIDGE = "M94 26 L108 14";

/** 몸의 앞면 뒤에 그리는 것 — 닫힌 상자 */
export const SOLID_BACK = [
    { d: TOP_FACE, fill: "paper" },
    // 옆면은 물러난 면이라 옅게 칠한다 — 내부 지도(IsoFloor)의 동쪽 면과 같은 방식
    { d: SIDE_FACE, fill: "cream" },
    { d: OUTLINE, w: LINE.body },
    // 안쪽 선은 바깥 선보다 조금 가늘다
    { d: RIDGE, w: LINE.face },
] satisfies readonly Stroke[];

/** 몸의 앞면 뒤에 그리는 것 — 뚜껑이 열린 상자. 윗면 자리가 안쪽이 되고 날개 셋이 선다 */
export const SOLID_BACK_OPEN = [
    // 뒤쪽 날개 — 곧게 선다
    paper("M46 13 L49.5 -1.5 L98.5 -2.5 L102 12 Z"),
    { d: TOP_FACE, fill: "cream" },
    { d: SIDE_FACE, fill: "cream" },
    { d: OUTLINE, w: LINE.body },
    { d: RIDGE, w: LINE.face },
    // 왼쪽 날개는 바깥 위로 벌어지고, 오른쪽 날개는 옆면 쪽으로 젖혀진다
    // (오른쪽 모서리는 비스듬히 물러나서, 위로 벌리면 날개가 선처럼 가늘게 보인다)
    paper("M27 27 L41 15 L27 6.5 L13 18.5 Z"),
    paper("M94 26 L108 14 L121.5 19.5 L107.5 31.5 Z"),
] satisfies readonly Stroke[];

/** 테이프의 자락(앞면에 내려온 부분) — 오른쪽 변에서 왼쪽 변까지, 아래 지그재그 */
const FLAPS: Record<TapeId, string> = {
    rest: `L${TAPE.right} ${TAPE.notch} L64.5 ${TAPE.tip} L60 ${TAPE.notch} L55.5 ${TAPE.tip} L${TAPE.left} ${TAPE.notch}`,
    // 쫑긋 — 자락이 들린다
    perk: `L${TAPE.right} 33 L64.5 37 L60 33 L55.5 37 L${TAPE.left} 33`,
    // 축 — 자락이 길게 늘어진다
    droop: "L70.5 46 L66 50.5 L61.5 46.5 L57 50.5 L52.5 46",
    // 펄럭 — 자락 끝이 옆으로 날린다
    flutter: "L73.5 38 L70.5 43.5 L65 40.5 L61.5 45 L56 41",
};

/**
 * 입체 보기의 테이프 — 윗면을 가로질러 앞면으로 접혀 내려온다.
 * 윗면에 붙은 부분은 그대로 있고, 기분은 앞으로 내려온 자락에 드러난다.
 */
export const solidTape = (id: TapeId): Stroke[] => {
    const edge = BODY.top + 0.5;
    return [
        paper(
            `M${TAPE.left + DEPTH.x} ${edge + DEPTH.y} L${TAPE.right + DEPTH.x} ${edge + DEPTH.y - 0.2} L${TAPE.right} ${edge - 0.2} ${FLAPS[id]} L${TAPE.left} ${edge} Z`,
        ),
        // 앞면으로 접히는 자리
        { d: `M${TAPE.left} ${edge} L${TAPE.right} ${edge - 0.2}`, w: 3 },
    ];
};
