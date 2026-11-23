/*
 * 내부 지도의 입체 그림 계산 (docs/decisions/0004-map-and-indoor-map.md).
 *
 * 데이터는 위에서 내려다본 2D 격자뿐이고, 입체는 여기서 계산한다.
 * 여기서 길이 1은 늘 50cm 다(UNIT_CM). 격자 한 칸의 길이는 구조마다 다를 수 있으므로(25cm, 예전 것은 50cm)
 * 칸으로 적힌 상자는 toUnits 로 맞춘 뒤에 넘긴다 — 그래야 칸 크기가 달라도 같은 크기로 그려진다.
 * 보는 사람은 늘 남동쪽 위에 있다 — 격자의 (0,0)이 화면 맨 위(가장 먼 곳)에 온다.
 * 지도를 돌릴 때는 시점을 옮기지 않고 격자를 90도씩 돌린 뒤 같은 식으로 그린다.
 */

/** 그림에서 길이 1이 뜻하는 실제 길이(cm) */
export const UNIT_CM = 50;

/** 길이 1(50cm)이 화면에서 차지하는 길이(SVG 단위) */
export const UNIT = 28;

const COS30 = Math.sqrt(3) / 2;
const SIN30 = 0.5;

export type Point = readonly [x: number, y: number];

/** 시계 방향으로 90도씩 돌린 횟수 */
export type Turn = 0 | 1 | 2 | 3;

export type Facing = "n" | "e" | "s" | "w";

export interface Size {
    width: number;
    depth: number;
}

/** 바닥에 놓인 상자 — 길이 1은 50cm. 정수가 아닐 수 있다(25cm 칸, 낮춘 벽) */
export interface Box {
    x: number;
    y: number;
    w: number;
    d: number;
    h: number;
}

/** 칸으로 적힌 상자를 그림의 길이(1 = 50cm)로 바꾼다. 자리·높이 말고는 그대로 둔다 */
export function toUnits<T extends Box>(box: T, cellCm: number): T {
    const scale = cellCm / UNIT_CM;
    return { ...box, x: box.x * scale, y: box.y * scale, w: box.w * scale, d: box.d * scale, h: box.h * scale };
}

/** 바닥 위의 자리와 높이를 화면 좌표로 바꾼다 */
export function project(x: number, y: number, z = 0): Point {
    return [(x - y) * UNIT * COS30, (x + y) * UNIT * SIN30 - z * UNIT];
}

/** 바닥과 나란한 길이 1이 화면에서 가로로 차지하는 길이(SVG 단위) — 기기 하나가 화면에서 얼마나 넓은지 잴 때 쓴다 */
export const UNIT_ACROSS = UNIT * COS30;

/** 돌린 뒤의 바닥 크기 — 한 번 돌릴 때마다 가로와 세로가 바뀐다 */
export function turnSize(size: Size, turn: Turn): Size {
    return turn % 2 === 0 ? size : { width: size.depth, depth: size.width };
}

/** 상자를 바닥과 함께 시계 방향으로 turn 번 돌린 자리. 높이와 그 밖의 값은 그대로 둔다 */
export function turnBox<T extends Box>(box: T, size: Size, turn: Turn): T {
    let { x, y, w, d } = box;
    let { width, depth } = size;
    for (let step = 0; step < turn; step += 1) {
        // 시계 방향 90도: 북쪽 변이 동쪽 변이 된다
        [x, y, w, d] = [depth - (y + d), x, d, w];
        [width, depth] = [depth, width];
    }
    return { ...box, x, y, w, d };
}

const FACINGS: readonly Facing[] = ["n", "e", "s", "w"];

/** 바닥을 돌리면 물체가 보는 쪽도 같이 돈다 */
export function turnFacing(facing: Facing, turn: Turn): Facing {
    return FACINGS[(FACINGS.indexOf(facing) + turn) % 4];
}

/**
 * 상자에서 보이는 세 면. 보는 사람이 남동쪽 위에 있으므로 윗면, 남쪽 면(화면 왼쪽), 동쪽 면(화면 오른쪽)만 보인다.
 * 각 면은 꼭짓점 넷 — 옆면은 아래 둘, 위 둘 순서다.
 */
export function boxFaces({ x, y, w, d, h }: Box): { top: Point[]; south: Point[]; east: Point[] } {
    return {
        top: [project(x, y, h), project(x + w, y, h), project(x + w, y + d, h), project(x, y + d, h)],
        south: [project(x, y + d), project(x + w, y + d), project(x + w, y + d, h), project(x, y + d, h)],
        east: [project(x + w, y + d), project(x + w, y), project(x + w, y, h), project(x + w, y + d, h)],
    };
}

export type SideFace = "south" | "east";

/** 옆면 위의 한 점. along 은 면을 따라 가는 비율(0~1, 화면 왼쪽에서 오른쪽으로), z 는 높이다 */
export function faceAt(box: Box, face: SideFace, along: number, z: number): Point {
    return face === "south"
        ? project(box.x + box.w * along, box.y + box.d, z)
        : project(box.x + box.w, box.y + box.d * (1 - along), z);
}

/** 옆면 위의 네모 — 기기 창이나 단 사이의 금처럼 면에 붙여 그리는 것 */
export function onFace(
    box: Box,
    face: SideFace,
    along: readonly [number, number],
    z: readonly [number, number],
): Point[] {
    return [
        faceAt(box, face, along[0], z[0]),
        faceAt(box, face, along[1], z[0]),
        faceAt(box, face, along[1], z[1]),
        faceAt(box, face, along[0], z[1]),
    ];
}

/** 원을 여러 각형으로 그릴 때의 꼭짓점 수 — 작게 보이는 것들이라 이만하면 둥글다 */
const ROUND_STEPS = 14;
const angles = Array.from({ length: ROUND_STEPS }, (_, step) => (step / ROUND_STEPS) * Math.PI * 2);

/** 옆면에 붙은 원(기기 손잡이) — 가운데는 (along, z), 반지름 radius 는 길이다. 비스듬한 면 위라 화면에서는 찌그러진다 */
export function roundOnFace(box: Box, face: SideFace, along: number, z: number, radius: number): Point[] {
    const length = face === "south" ? box.w : box.d;
    return angles.map((angle) =>
        faceAt(box, face, along + (Math.cos(angle) * radius) / length, z + Math.sin(angle) * radius),
    );
}

/** 바닥과 나란한 원(수거함 구멍) — 가운데는 (x, y), 높이 z */
export function roundOnTop(x: number, y: number, z: number, radius: number): Point[] {
    return angles.map((angle) => project(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, z));
}

/** a 가 b 보다 먼저(뒤에) 그려져야 하는가 — 화면에서 겹칠 수 있는데 a 가 더 먼 경우 */
function isBehind(a: Box, b: Box): boolean {
    const northOf = a.y + a.d <= b.y;
    const westOf = a.x + a.w <= b.x;
    const southOf = b.y + b.d <= a.y;
    const eastOf = b.x + b.w <= a.x;
    // 북쪽이면서 동쪽(또는 서쪽이면서 남쪽)이면 화면에서 좌우로 완전히 떨어져 있어 순서가 상관없다
    return (northOf && !eastOf) || (westOf && !southOf);
}

/**
 * 뒤에 있는 것부터 그리도록 줄을 세운다.
 * 단순히 x+y 로 줄 세우면 긴 벽 옆의 작은 상자가 뒤집힌다 — 상자끼리의 앞뒤 관계로 차례를 정한다.
 * 앞뒤가 맞물려 차례를 정할 수 없는 드문 경우에는 남은 것을 가운데 점 기준으로 그린다.
 */
export function drawOrder<T extends Box>(boxes: readonly T[]): T[] {
    const depthOf = (box: Box) => box.x + box.w / 2 + box.y + box.d / 2;
    const waiting = [...boxes].sort((a, b) => depthOf(a) - depthOf(b));
    const ordered: T[] = [];

    while (waiting.length > 0) {
        const index = waiting.findIndex((box) => !waiting.some((other) => other !== box && isBehind(other, box)));
        ordered.push(...waiting.splice(index === -1 ? 0 : index, 1));
    }
    return ordered;
}

/**
 * 보는 사람 쪽(남쪽·동쪽) 변을 따라 선 벽인가.
 * 이런 벽을 제 높이로 그리면 매장 안이 통째로 가려지므로, 그릴 때 낮춰서 "잘라 낸 벽"으로 보여 준다.
 */
export function isNearWall(box: Box, size: Size): boolean {
    const alongSouth = box.y + box.d === size.depth && box.w > box.d;
    const alongEast = box.x + box.w === size.width && box.d > box.w;
    return alongSouth || alongEast;
}

/**
 * 등을 그 벽에 대고 섰는가 — 북쪽을 보는 것은 남쪽 벽에, 서쪽을 보는 것은 동쪽 벽에 등을 댄다.
 * 보는 사람 쪽 벽은 낮춰 그리므로(isNearWall), 거기에 등을 댄 기계 줄도 같이 낮춰야 뒷모습이 매장 안을 가리지 않는다.
 * 남쪽·동쪽을 보는 것은 앞이 보이는 쪽이라 해당하지 않는다.
 */
export function backsOnto(box: Box, facing: Facing, wall: Box): boolean {
    if (facing === "n") return wall.y === box.y + box.d && wall.x < box.x + box.w && box.x < wall.x + wall.w;
    if (facing === "w") return wall.x === box.x + box.w && wall.y < box.y + box.d && box.y < wall.y + wall.d;
    return false;
}

/** 바닥과 가장 높은 물체까지 모두 담는 화면 범위 */
export function sceneBounds(size: Size, maxHeight: number): { x: number; y: number; width: number; height: number } {
    const left = project(0, size.depth)[0];
    const right = project(size.width, 0)[0];
    const top = project(0, 0, maxHeight)[1];
    const bottom = project(size.width, size.depth)[1];
    return { x: left, y: top, width: right - left, height: bottom - top };
}
