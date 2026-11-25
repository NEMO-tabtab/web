import { CANVAS, LINE } from "./geometry";
import type { Stroke } from "./types";

/*
 * 팔다리 — 먹선 한 획이다. 손은 그리지 않고, 소품은 획의 끝에 붙는다
 * (docs/decisions/0008-character.md "팔다리는 먹선 한 획이다").
 * 왼쪽 것만 적고 오른쪽은 가운데 세로선에 대칭으로 뒤집는다.
 */

type Point = readonly [number, number];
/** 시작, 휘는 점, 끝 */
type Bend = readonly [Point, Point, Point];

const flip = ([x, y]: Point): Point => [CANVAS - x, y];
const curve = ([from, via, to]: Bend) => `M${from[0]} ${from[1]} Q${via[0]} ${via[1]} ${to[0]} ${to[1]}`;
const limb = (bend: Bend, side: "left" | "right", [dx, dy]: Point = [0, 0]): Stroke => {
    const placed = side === "left" ? bend : ([flip(bend[0]), flip(bend[1]), flip(bend[2])] as const);
    const moved = placed.map(([x, y]): Point => [x + dx, y + dy]) as unknown as Bend;
    return { d: curve(moved), w: LINE.body };
};

/** 왼팔(화면의 왼쪽). 몸 뒤에서 나온다 */
const ARMS = {
    /** 내린 팔 — 옆으로 살짝 벌어진다 */
    rest: [[22, 66], [11, 69], [18, 81]],
    /** 든 팔 — 인사, 만세 */
    up: [[22, 62], [10, 60], [10, 43]],
    /** 옆으로 내민 팔 — 소품을 든다 */
    out: [[22, 66], [14, 67], [9, 59]],
    /** 앞에 펼친 것의 옆을 잡은 팔 */
    hold: [[22, 70], [12, 78], [20, 89]],
    /** 얼굴 앞에 든 것의 손잡이를 쥔 팔 */
    grip: [[22, 72], [13, 79], [18, 86]],
    /** 허리에 짚은 팔 */
    hip: [[22, 63], [8, 71], [21, 81]],
    /** 축 늘어진 팔 — 몸 선과 붙지 않게 조금 떨어뜨린다 */
    limp: [[22, 68], [12, 76], [15, 89]],
} satisfies Record<string, Bend>;

/** 왼발. 아래로 내려와 감긴다 */
const FEET = {
    /** 안쪽으로 감긴 발 — 기본 */
    rest: [[42, 101], [42, 111], [53, 109]],
    /** 바깥으로 벌린 발 — 뛸 때 */
    apart: [[40, 101], [39, 110], [28, 109]],
} satisfies Record<string, Bend>;

export type ArmId = keyof typeof ARMS;
export type FeetId = keyof typeof FEET;

/**
 * 몸에 붙어 있지 않아도 되는 팔 — 입체 보기에서 옆면 가운데로 옮겨 그릴 수 있다.
 * 나머지(hold·grip·hip)는 끝이 몸이나 얼굴 앞의 소품에 닿아 있어 옮기면 어긋난다.
 */
export const FREE_ARMS: ReadonlySet<ArmId> = new Set<ArmId>(["rest", "up", "out", "limp"]);

/** shift 는 팔을 통째로 옮기는 만큼(칸) */
export const arm = (side: "left" | "right", id: ArmId, shift?: Point): Stroke => limb(ARMS[id], side, shift);
/** 두 발 — 왼쪽, 오른쪽 */
export const feet = (id: FeetId): Stroke[] => [limb(FEET[id], "left"), limb(FEET[id], "right")];
