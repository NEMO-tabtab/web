import { ellipse } from "@/lib/nemo/path";
import type { Box, Paint, Stroke } from "@/lib/nemo/types";

/*
 * 기계 그림을 그리는 도구 — 실제 길이(cm)로 적은 상자·원기둥·공을 그림의 획으로 바꾼다. 보기는 둘이다.
 * - 입체(solid): 위에서 비스듬히 내려다본 모습(등각 투영). 내부 지도(src/lib/iso.ts)와 같은 각도다.
 * - 정면(front): 손잡이가 달린 앞면을 똑바로 본 모습. 깊이는 보이지 않는다.
 * 칸의 크기는 두 보기 모두 내부 지도와 같다(50cm = 28칸). 그래서 손떨림 필터(#rough-line-sm)가 같은 떨림을 낸다.
 *
 * 좌표: x 는 기계의 폭(앞에서 볼 때 왼쪽 → 오른쪽), y 는 깊이(뒤 → 앞), z 는 높이(바닥 → 위).
 * 입체 그림에서 앞면은 왼쪽 아래, 옆면은 오른쪽 아래, 윗면은 위에 보인다.
 */

/** 1cm 가 그림에서 몇 칸인가 */
export const KAN_PER_CM = 28 / 50;

/** 캐릭터와 같은 이름을 쓴다 — 정면과 입체 */
export type MachineView = "solid" | "front";

const COS30 = Math.sqrt(3) / 2;
const SIN30 = 0.5;
/** 바닥에 누운 원은 입체 그림에서 가로로 √2·cos30°배, 세로로 √2·sin30°배인 타원으로 보인다 */
const WIDE = Math.SQRT2 * COS30;
const FLAT = Math.SQRT2 * SIN30;

export type Point = readonly [x: number, y: number];

/** 입체 — 공간의 한 점(cm)을 그림의 점(칸)으로 */
export const solidAt = (x: number, y: number, z: number): Point => [
    (x - y) * COS30 * KAN_PER_CM,
    ((x + y) * SIN30 - z) * KAN_PER_CM,
];

/** 정면 — 깊이(y)는 버린다 */
export const frontAt = (x: number, _y: number, z: number): Point => [x * KAN_PER_CM, -z * KAN_PER_CM];

/** 상자 — 왼쪽 뒤 아래 모서리와 크기(cm) */
export interface Block {
    x: number;
    y: number;
    z: number;
    w: number;
    d: number;
    h: number;
}

/** 옆으로 선 면 둘 — 손잡이가 달린 앞면과, 깊이 쪽 옆면. 정면 보기에서는 앞면만 보인다 */
export type Face = "front" | "side";

export interface Style {
    fill?: Paint;
    /** 먹선 굵기(칸). 없으면 선을 긋지 않는다 */
    w?: number;
}

/** 좌표는 소수 둘째 자리까지만 남긴다 */
export const n = (value: number) => Math.round(value * 100) / 100;
const polygon = (points: readonly Point[]) => `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join(" L")} Z`;

/** 면의 가로 길이(cm) */
export const faceLength = (block: Block, face: Face) => (face === "front" ? block.w : block.d);

/**
 * 획을 쌓으면서 그림이 차지하는 칸을 잰다. 먼저 그린 것이 아래에 깔린다 —
 * 아래에서 위로, 뒤에서 앞으로 그린다.
 * 같은 부품 목록을 어느 보기로든 그린다: 정면 보기에서는 옆면과 윗면에 놓은 것을 건너뛴다.
 */
export class Sketch {
    readonly strokes: Stroke[] = [];
    private left = Infinity;
    private top = Infinity;
    private right = -Infinity;
    private bottom = -Infinity;

    constructor(readonly view: MachineView = "solid") {}

    private get flat() {
        return this.view === "front";
    }

    /** 공간의 한 점(cm)을 그림의 점(칸)으로 */
    at(x: number, y: number, z: number): Point {
        return this.flat ? frontAt(x, y, z) : solidAt(x, y, z);
    }

    /** 면의 왼쪽 끝에서 잰 길이(cm)와 높이(cm)로 면 위의 점을 찾는다 */
    private onFace(block: Block, face: Face, across: number, z: number): Point {
        return face === "front"
            ? this.at(block.x + across, block.y + block.d, z)
            : this.at(block.x + block.w, block.y + block.d - across, z);
    }

    /** 면 위의 한 점(칸). along 은 면의 왼쪽 0 → 오른쪽 1, z 는 바닥에서의 높이(cm) */
    pointOn(block: Block, face: Face, along: number, z: number): Point {
        return this.onFace(block, face, along * faceLength(block, face), z);
    }

    /** 이 보기에서 그 면이 보이는가 */
    private shows(face: Face) {
        return face === "front" || !this.flat;
    }

    private touch(points: readonly Point[]) {
        for (const [x, y] of points) {
            this.left = Math.min(this.left, x);
            this.right = Math.max(this.right, x);
            this.top = Math.min(this.top, y);
            this.bottom = Math.max(this.bottom, y);
        }
    }

    private add(d: string, style: Style) {
        this.strokes.push({ d, ...style });
    }

    /** 그림 전체를 담는 칸. margin 은 선 굵기와 손떨림이 밀어내는 만큼의 여백(칸) */
    box(margin: number): Box {
        return {
            x: n(this.left - margin),
            y: n(this.top - margin),
            width: n(this.right - this.left + margin * 2),
            height: n(this.bottom - this.top + margin * 2),
        };
    }

    /**
     * 원기둥에서 보는 사람 쪽으로 가장 튀어나온 선 위의 점 — 둥근 몸의 "앞"이다.
     * 둥근 몸에는 면이 없어서, 손잡이나 나오는 곳을 이 선에 맞춰 놓는다. 정면 보기에서는 가운데 선이다.
     */
    frontOf(cx: number, cy: number, radius: number, z: number): Point {
        return this.flat ? this.at(cx, cy, z) : this.at(cx + radius / Math.SQRT2, cy + radius / Math.SQRT2, z);
    }

    /** 원기둥이나 공이 그림에서 차지하는 가로 반지름(칸). 입체 그림에서는 √1.5배로 보인다 */
    widthOf(radius: number): number {
        return radius * (this.flat ? 1 : WIDE) * KAN_PER_CM;
    }

    /** 바닥과 나란한 원의 앞쪽 끝이 가운데보다 얼마나 아래로 보이는가(칸). 정면에서는 한 줄로 겹쳐 0 이다 */
    sinkOf(radius: number): number {
        return this.flat ? 0 : radius * FLAT * KAN_PER_CM;
    }

    /** 상자 — 입체에서는 보이는 세 면, 정면에서는 앞면 하나 */
    block(block: Block, faces: { front: Paint; side: Paint; top: Paint }, w: number) {
        const { x, y, z, w: width, d, h } = block;
        const front = [
            this.at(x, y + d, z + h),
            this.at(x + width, y + d, z + h),
            this.at(x + width, y + d, z),
            this.at(x, y + d, z),
        ];
        if (this.flat) {
            this.touch(front);
            this.add(polygon(front), { fill: faces.front, w });
            return;
        }
        const side = [
            this.at(x + width, y + d, z + h),
            this.at(x + width, y, z + h),
            this.at(x + width, y, z),
            this.at(x + width, y + d, z),
        ];
        const top = [
            this.at(x, y, z + h),
            this.at(x + width, y, z + h),
            this.at(x + width, y + d, z + h),
            this.at(x, y + d, z + h),
        ];
        this.touch([...front, ...side, ...top]);
        this.add(polygon(front), { fill: faces.front, w });
        this.add(polygon(side), { fill: faces.side, w });
        this.add(polygon(top), { fill: faces.top, w });
    }

    /**
     * 면 위의 네모. along 은 면의 왼쪽 0 → 오른쪽 1, z 는 바닥에서의 높이(cm).
     * radius(cm)를 주면 모서리를 둥글린다.
     */
    rectOn(
        block: Block,
        face: Face,
        along: readonly [number, number],
        z: readonly [number, number],
        style: Style,
        radius = 0,
    ) {
        if (!this.shows(face)) return;
        const length = faceLength(block, face);
        const [u0, u1] = [along[0] * length, along[1] * length];
        const [v0, v1] = z;
        const p = (u: number, v: number) => this.onFace(block, face, u, v);
        const corners = [p(u0, v1), p(u1, v1), p(u1, v0), p(u0, v0)];
        this.touch(corners);
        const r = Math.min(radius, (u1 - u0) / 2, (v1 - v0) / 2);
        if (r <= 0) {
            this.add(polygon(corners), style);
            return;
        }
        const q = ([x, y]: Point) => `${n(x)} ${n(y)}`;
        this.add(
            [
                `M${q(p(u0 + r, v1))}`,
                `L${q(p(u1 - r, v1))} Q${q(p(u1, v1))} ${q(p(u1, v1 - r))}`,
                `L${q(p(u1, v0 + r))} Q${q(p(u1, v0))} ${q(p(u1 - r, v0))}`,
                `L${q(p(u0 + r, v0))} Q${q(p(u0, v0))} ${q(p(u0, v0 + r))}`,
                `L${q(p(u0, v1 - r))} Q${q(p(u0, v1))} ${q(p(u0 + r, v1))}`,
                "Z",
            ].join(" "),
            style,
        );
    }

    /** 면 위의 원. 입체에서는 비스듬히 누운 타원으로 보인다. radius 는 cm */
    roundOn(block: Block, face: Face, along: number, z: number, radius: number, style: Style) {
        if (!this.shows(face)) return;
        const center = along * faceLength(block, face);
        const steps = 24;
        const points = Array.from({ length: steps }, (_, index) => {
            const angle = (index / steps) * Math.PI * 2;
            return this.onFace(block, face, center + Math.cos(angle) * radius, z + Math.sin(angle) * radius);
        });
        this.touch(points);
        this.add(polygon(points), style);
    }

    /** 면 위의 곧은 선. 두 끝을 [along, z] 로 준다 */
    lineOn(block: Block, face: Face, from: readonly [number, number], to: readonly [number, number], w: number) {
        if (!this.shows(face)) return;
        const length = faceLength(block, face);
        const a = this.onFace(block, face, from[0] * length, from[1]);
        const b = this.onFace(block, face, to[0] * length, to[1]);
        this.touch([a, b]);
        this.add(`M${n(a[0])} ${n(a[1])} L${n(b[0])} ${n(b[1])}`, { w });
    }

    /** 세로로 선 원기둥. 입체에서는 옆면을 먼저, 윗면을 그 위에 그린다. 정면에서는 네모로 보인다 */
    cylinder(
        cx: number,
        cy: number,
        z: readonly [number, number],
        radius: number,
        paint: { side: Paint; top: Paint },
        w: number,
    ) {
        const [x, low] = this.at(cx, cy, z[0]);
        const high = this.at(cx, cy, z[1])[1];
        const rx = this.widthOf(radius);
        const ry = this.sinkOf(radius);
        this.touch([
            [x - rx, high - ry],
            [x + rx, low + ry],
        ]);
        if (this.flat) {
            this.add(
                polygon([
                    [x - rx, high],
                    [x + rx, high],
                    [x + rx, low],
                    [x - rx, low],
                ]),
                { fill: paint.side, w },
            );
            return;
        }
        // 왼쪽 위 → 왼쪽 아래 → 아래 타원의 앞쪽 반 → 오른쪽 위 → 위 타원의 앞쪽 반
        this.add(
            [
                `M${n(x - rx)} ${n(high)}`,
                `L${n(x - rx)} ${n(low)}`,
                `A${n(rx)} ${n(ry)} 0 0 0 ${n(x + rx)} ${n(low)}`,
                `L${n(x + rx)} ${n(high)}`,
                `A${n(rx)} ${n(ry)} 0 0 1 ${n(x - rx)} ${n(high)}`,
                "Z",
            ].join(" "),
            { fill: paint.side, w },
        );
        this.add(ellipse(x, high, rx, ry), { fill: paint.top, w });
    }

    /** 공 — 어느 쪽에서 봐도 원이다 */
    ball(cx: number, cy: number, cz: number, radius: number, style: Style) {
        this.spot(this.at(cx, cy, cz), this.widthOf(radius), style);
    }

    /** 그림 위에 바로 놓는 원. 자리와 반지름을 칸으로 준다 — 둥근 몸 앞에 붙은 손잡이처럼 면이 없는 곳에 쓴다 */
    spot([x, y]: Point, radius: number, style: Style) {
        this.touch([
            [x - radius, y - radius],
            [x + radius, y + radius],
        ]);
        this.add(ellipse(x, y, radius, radius), style);
    }

    /** 그림 위에 바로 긋는 획. points 는 칸을 재는 데만 쓴다 */
    path(d: string, points: readonly Point[], style: Style) {
        this.touch(points);
        this.add(d, style);
    }
}
