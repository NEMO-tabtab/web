import { BODY, LINE } from "./geometry";
import type { Stroke } from "./types";

/* 몸과 팔다리. 팔다리는 먹선 한 획이고 손은 그리지 않는다 */

const limb = (d: string): Stroke => ({ d, w: LINE.body });

/** 몸 — 종이로 채운 상자 */
export const BODY_STROKES = [{ d: BODY.path, fill: "paper", w: LINE.body }] satisfies readonly Stroke[];

/** 팔 — 몸 뒤에서 나와 옆으로 살짝 벌어진다. 왼쪽, 오른쪽 */
export const ARMS_REST = [limb("M22 66 q-11 3 -4 15"), limb("M98 66 q11 3 4 15")] satisfies readonly Stroke[];

/** 발 — 아래로 내려와 안쪽으로 감긴다. 왼쪽, 오른쪽 */
export const FEET_REST = [limb("M42 101 q0 10 11 8"), limb("M78 101 q0 10 -11 8")] satisfies readonly Stroke[];
