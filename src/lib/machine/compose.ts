import { roundRect } from "@/lib/nemo/path";
import type { Drawing, Paint } from "@/lib/nemo/types";

import { MACHINE_MODEL_IDS, type MachineModelId } from "./models";
import { KAN_PER_CM, Sketch, at, frontOf, n, widthOf, type Block, type Face, type Point } from "./sketch";

/*
 * 기계 종류마다의 그림 — 실제 치수(cm)로 부품을 놓고, 크기에 따라 덜어 낼 것을 정한다.
 * 색은 먹·종이·cream 에 볼터치 한 점(손잡이)뿐이다. 물러난 옆면과 색이 있는 부품을 cream 으로 칠한다.
 * 생김새는 실제 기계의 사진을 보고 줄인 것이고, 상표나 글자는 그리지 않는다.
 */

/** 얼마나 자세히 그릴지 — 화면에서 1cm 가 몇 px 인지로 정한다 */
export type Detail = "low" | "mid" | "full";
/** 이만큼(px/cm)부터 동전 넣는 곳·가격표 같은 작은 부품까지 그린다. 2단 표준형이면 키 160px 남짓이다 */
export const FULL_FROM = 1;
/** 이만큼부터 캡슐과 상품 카드의 테두리를 그린다. 그 밑으로는 덩어리와 손잡이만 남긴다 */
export const MID_FROM = 0.5;

/** 선 굵기는 그림의 키에 비례하고, 이보다 가늘어지지 않는다(px) */
const WEIGHT = {
    out: { ratio: 0.012, min: 1.5 },
    in: { ratio: 0.0075, min: 1 },
    fine: { ratio: 0.005, min: 0.8 },
} as const;

interface Pen {
    s: Sketch;
    detail: Detail;
    /** 바깥 테두리, 안쪽 선, 가장 가는 선의 굵기(칸) */
    out: number;
    in: number;
    fine: number;
}

const SOLID = { front: "paper", side: "cream", top: "paper" } as const;
/** 색이 있는 부품(뚜껑·받침) — 앞도 cream 으로 칠해 흰 몸통과 가른다 */
const TINTED = { front: "cream", side: "cream", top: "paper" } as const;
/** 투명한 통 — 옆면도 희게 둬서 몸통보다 밝게 보인다 */
const GLASS = { front: "paper", side: "paper", top: "paper" } as const;

/** 캡슐 반지름(cm) — 48~65mm 캡슐을 6cm 쯤으로 본다 */
const CAPSULE = 3;

/** 통 안에 비치는 캡슐 한 줄. 통의 바탕과 다른 색으로 칠해야 보인다 */
function capsules(
    pen: Pen,
    block: Block,
    face: Face,
    alongs: readonly number[],
    z: number,
    fill: Paint,
    radius = CAPSULE,
) {
    for (const along of alongs) pen.s.roundOn(block, face, along, z, radius, { fill, w: pen.fine });
}

/** 손잡이 — 둥근 테 안에 볼터치 색 꼭지. 자세히 그릴 때는 잡고 돌리는 가로대를 긋는다 */
function handle(pen: Pen, block: Block, along: number, z: number, radius: number, ring: Paint) {
    const { s, detail } = pen;
    s.roundOn(block, "front", along, z, radius, { fill: ring, w: pen.in });
    s.roundOn(block, "front", along, z, radius * 0.52, { fill: "cheek", w: detail === "low" ? undefined : pen.fine });
    if (detail === "full") {
        const reach = (radius * 0.72) / block.w;
        s.lineOn(block, "front", [along - reach, z], [along + reach, z], pen.in);
    }
}

const BODY = 31;
const BIN = 27.5;
/** 2단 표준형의 한 단 높이(cm) — 아래는 손잡이가 달린 몸통, 위는 투명한 통 */
const TIER = BODY + BIN;

/**
 * 표준형의 한 단. 실제 기계(캡슐 스테이션)의 앞면 배치를 따른다:
 * 통에는 상품 카드, 몸통 위쪽에 가격표와 동전 넣는 곳, 가운데에 손잡이, 아래 왼쪽에 캡슐이 나오는 문, 오른쪽에 동전 받침.
 */
function tier(pen: Pen, z0: number, w: number, d: number) {
    const { s, detail } = pen;
    const body: Block = { x: 0, y: 0, z: z0, w, d, h: BODY };
    const bin: Block = { x: 0, y: 0, z: z0 + BODY, w, d, h: BIN };
    const zb = bin.z;
    s.block(body, SOLID, pen.out);
    s.block(bin, SOLID, pen.out);

    s.rectOn(bin, "front", [0.08, 0.92], [zb + 2, zb + BIN - 1.6], { fill: "cream", w: pen.in }, 2);
    s.rectOn(bin, "side", [0.06, 0.94], [zb + 2, zb + BIN - 1.6], { fill: "paper", w: pen.in }, 2);
    if (detail !== "low") {
        capsules(pen, bin, "front", [0.3, 0.7], zb + 5.4, "paper");
        capsules(pen, bin, "side", [0.2, 0.4, 0.6, 0.8], zb + 5.4, "cream");
    }
    if (detail === "full") capsules(pen, bin, "side", [0.3, 0.5, 0.7], zb + 10.6, "cream");
    // 상품 카드 — 작게 그릴 때는 테두리 없이 흰 조각만 남긴다
    s.rectOn(
        bin,
        "front",
        [0.2, 0.8],
        [zb + 9.6, zb + BIN - 3.4],
        { fill: "paper", w: detail === "low" ? undefined : pen.fine },
        0.8,
    );
    if (detail === "full") {
        s.lineOn(bin, "front", [0.3, zb + 12.4], [0.7, zb + 12.4], pen.fine);
        s.lineOn(bin, "front", [0.3, zb + 14.6], [0.56, zb + 14.6], pen.fine);
    }

    s.rectOn(body, "front", [0.14, 0.56], [z0 + 2.6, z0 + 10.8], { fill: "ink" }, 1.6);
    handle(pen, body, 0.5, z0 + 18, 6, "paper");
    if (detail === "full") {
        s.rectOn(body, "front", [0.14, 0.5], [z0 + 25.6, z0 + 29.2], { fill: "cream", w: pen.fine }, 0.5);
        s.rectOn(body, "front", [0.68, 0.77], [z0 + 25.4, z0 + 29.4], { fill: "ink" });
        s.rectOn(body, "front", [0.68, 0.88], [z0 + 3.2, z0 + 7.6], { fill: "cream", w: pen.fine }, 0.6);
    }
}

/** 표준형 맨 위의 머리 — 이름표가 붙는 낮은 덮개 */
function cap(pen: Pen, z: number, w: number, d: number) {
    const lid: Block = { x: 1, y: 1.5, z, w: w - 2, d: d - 3, h: 4 };
    pen.s.block(lid, SOLID, pen.out);
    if (pen.detail !== "low") pen.s.rectOn(lid, "front", [0.2, 0.8], [z + 1.3, z + 2.7], { fill: "ink" });
}

/** 2단 표준형 28 × 45 × 130cm — 바퀴 달린 받침 위에 두 단, 맨 위에 머리 */
function standard(pen: Pen) {
    const [w, d] = [28, 45];
    const base: Block = { x: 0, y: 0, z: 3, w, d, h: 6 };
    if (pen.detail !== "low") {
        for (const along of [0.2, 0.8]) pen.s.roundOn(base, "front", along, 2.3, 2.3, { fill: "ink" });
        pen.s.roundOn(base, "side", 0.86, 2.3, 2.3, { fill: "ink" });
    }
    pen.s.block(base, SOLID, pen.out);
    tier(pen, 9, w, d);
    tier(pen, 9 + TIER, w, d);
    cap(pen, 9 + TIER * 2, w, d);
}

/** 1단 하프형 27 × 45 × 64cm — 표준형의 한 단. 바퀴 없이 낮은 발판 위에 선다 */
function half(pen: Pen) {
    const [w, d] = [27, 45];
    pen.s.block({ x: 0.8, y: 0.8, z: 0, w: w - 1.6, d: d - 1.6, h: 1.5 }, SOLID, pen.out);
    tier(pen, 1.5, w, d);
    cap(pen, 1.5 + TIER, w, d);
}

/** 탁상 상자형 23 × 30 × 44cm — 몸통 위에 네모난 투명 통과 뚜껑 */
function box(pen: Pen) {
    const { s, detail } = pen;
    const [w, d] = [23, 30];
    const body: Block = { x: 1, y: 1, z: 3, w: w - 2, d: d - 2, h: 14 };
    const glass: Block = { x: 2.2, y: 2.2, z: 17, w: w - 4.4, d: d - 4.4, h: 23 };
    s.block({ x: 0, y: 0, z: 0, w, d, h: 3 }, SOLID, pen.out);
    s.block(body, SOLID, pen.out);
    // 캡슐이 나오는 홈과, 그 위의 동전 장치
    s.rectOn(body, "front", [0.28, 0.72], [3.7, 7.6], { fill: "ink" }, 0.8);
    if (detail !== "low") s.rectOn(body, "front", [0.22, 0.78], [8.8, 16], { fill: "cream", w: pen.in }, 0.8);
    handle(pen, body, 0.5, 12.4, 2.7, "paper");

    s.block(glass, GLASS, pen.out);
    if (detail !== "low") {
        capsules(pen, glass, "front", [0.27, 0.73], 20, "cream", 2.5);
        capsules(pen, glass, "front", [0.5], 24.2, "cream", 2.5);
        capsules(pen, glass, "side", [0.2, 0.5, 0.8], 20, "cream", 2.5);
    }
    if (detail === "full") {
        capsules(pen, glass, "side", [0.35, 0.65], 24.2, "cream", 2.5);
        s.lineOn(glass, "side", [0.7, 37.5], [0.9, 32], pen.fine);
    }
    s.block({ x: 0.6, y: 0.6, z: 40, w: w - 1.2, d: d - 1.2, h: 4 }, SOLID, pen.out);
}

/** 탁상 큐브형 33 × 36 × 53cm — 색 있는 받침과 뚜껑 사이에 흰 몸통, 앞에 큰 손잡이 */
function cube(pen: Pen) {
    const { s, detail } = pen;
    const [w, d] = [33, 36];
    const body: Block = { x: 0.8, y: 0.8, z: 4.5, w: w - 1.6, d: d - 1.6, h: 39.5 };
    s.block({ x: 0, y: 0, z: 0, w, d, h: 4.5 }, TINTED, pen.out);
    s.block(body, SOLID, pen.out);
    s.rectOn(body, "front", [0.48, 0.9], [6.3, 15.2], { fill: "ink" }, 1.4);
    handle(pen, body, 0.27, 19.6, 5.4, "cream");

    // 몸통의 위쪽 절반이 속이 비치는 통이다
    s.rectOn(body, "front", [0.08, 0.92], [27.6, 42], { fill: "cream", w: pen.in }, 2.4);
    s.rectOn(body, "side", [0.08, 0.92], [27.6, 42], { fill: "paper", w: pen.in }, 2.4);
    if (detail !== "low") {
        capsules(pen, body, "front", [0.27, 0.53, 0.78], 31, "paper");
        capsules(pen, body, "side", [0.25, 0.5, 0.75], 31, "cream");
    }
    if (detail === "full") {
        capsules(pen, body, "front", [0.4, 0.66], 36.2, "paper");
        capsules(pen, body, "side", [0.38, 0.63], 36.2, "cream");
    }
    s.block({ x: 0.4, y: 0.4, z: 44, w: w - 0.8, d: d - 0.8, h: 9 }, TINTED, pen.out);
}

/** 스파이럴 타워형 58 × 58 × 142cm — 둥근 받침, 캡슐이 나오는 몸통, 나선이 든 투명 기둥, 손잡이 머리, 둥근 통 */
function spiral(pen: Pen) {
    const { s, detail } = pen;
    const c = 29;
    const yAt = (z: number) => at(c, c, z)[1];
    const x = at(c, c, 0)[0];

    s.cylinder(c, c, [0, 9], 29, { side: "cream", top: "paper" }, pen.out);
    s.cylinder(c, c, [9, 33], 15, { side: "paper", top: "paper" }, pen.out);
    // 캡슐이 나오는 곳 — 몸통에서 보는 사람 쪽으로
    const exitTop = frontOf(c, c, 15, 25);
    const exitBottom = frontOf(c, c, 15, 13);
    const exitHalf = widthOf(15) * 0.42;
    s.path(
        roundRect(exitTop[0] - exitHalf, exitTop[1], exitHalf * 2, exitBottom[1] - exitTop[1], 1.2),
        [
            [exitTop[0] - exitHalf, exitTop[1]],
            [exitTop[0] + exitHalf, exitBottom[1]],
        ],
        { fill: "ink" },
    );

    s.cylinder(c, c, [33, 92], 11, { side: "paper", top: "paper" }, pen.in);
    if (detail !== "low") {
        // 나선 — 기둥의 앞쪽으로 도는 반 바퀴만 그린다. 오른쪽으로 내려간다
        const reach = widthOf(11);
        const sag = (reach / Math.sqrt(3)) * 2;
        for (const z of [40, 53, 66, 79]) {
            const left: Point = [x - reach, yAt(z + 5)];
            const right: Point = [x + reach, yAt(z)];
            const dip: Point = [x, yAt(z + 2.5) + sag];
            s.path(
                `M${n(left[0])} ${n(left[1])} Q${n(dip[0])} ${n(dip[1])} ${n(right[0])} ${n(right[1])}`,
                [left, right],
                {
                    w: pen.in,
                },
            );
            // 나선을 타고 내려오는 캡슐
            if (detail === "full" && (z === 53 || z === 79)) {
                s.spot([x - reach * 0.15, yAt(z + 2.5) + sag * 0.5 - widthOf(CAPSULE) * 0.6], widthOf(CAPSULE), {
                    fill: "cream",
                    w: pen.fine,
                });
            }
        }
    }

    s.cylinder(c, c, [92, 109], 14.5, { side: "cream", top: "paper" }, pen.out);
    const knob = frontOf(c, c, 14.5, 100.5);
    s.spot(knob, 5.2 * KAN_PER_CM, { fill: "paper", w: pen.in });
    s.spot(knob, 2.7 * KAN_PER_CM, { fill: "cheek", w: detail === "low" ? undefined : pen.fine });
    if (detail === "full") {
        const slot: Point = [knob[0] + widthOf(14.5) * 0.56, knob[1] - 2.2 * KAN_PER_CM];
        s.path(roundRect(slot[0], slot[1], 1.5 * KAN_PER_CM, 4.4 * KAN_PER_CM, 0.2), [slot], { fill: "ink" });
    }

    // 둥근 통과 그 안의 캡슐
    const radius = 15.5;
    const center = at(c, c, 109 + radius);
    const seen = widthOf(radius);
    s.ball(c, c, 109 + radius, radius, { fill: "paper", w: pen.out });
    if (detail !== "low") {
        const inside: Point[] = [
            [-0.42, 0.38],
            [0.05, 0.55],
            [0.48, 0.3],
        ];
        if (detail === "full") inside.push([-0.12, 0.1], [0.3, -0.05]);
        for (const [dx, dy] of inside) {
            s.spot([center[0] + dx * seen, center[1] + dy * seen], widthOf(CAPSULE), { fill: "cream", w: pen.fine });
        }
    }
    if (detail === "full") {
        // 통에 비친 빛
        const on = (degrees: number): Point => [
            center[0] + Math.cos((degrees * Math.PI) / 180) * seen * 0.78,
            center[1] + Math.sin((degrees * Math.PI) / 180) * seen * 0.78,
        ];
        const [from, to] = [on(200), on(245)];
        const bend = seen * 0.78;
        s.path(`M${n(from[0])} ${n(from[1])} A${n(bend)} ${n(bend)} 0 0 1 ${n(to[0])} ${n(to[1])}`, [from, to], {
            w: pen.fine,
        });
    }
    s.cylinder(c, c, [139.6, 142], 5.5, { side: "cream", top: "paper" }, pen.in);
}

const DRAW: Record<MachineModelId, (pen: Pen) => void> = {
    "standard-2": standard,
    "half-1": half,
    "tabletop-box": box,
    "tabletop-cube": cube,
    "spiral-tower": spiral,
};

const sketchOf = (id: MachineModelId, detail: Detail, widths: { out: number; in: number; fine: number }) => {
    const pen: Pen = { s: new Sketch(), detail, ...widths };
    DRAW[id](pen);
    return pen.s;
};

/**
 * 그림의 키(칸) — 선과 여백을 뺀, 기계가 그림에서 차지하는 높이.
 * 가장 자세한 그림으로 잰다. 작게 그릴 때 바퀴 같은 부품이 빠져도 키는 그대로 둔다.
 */
const SPANS = new Map<MachineModelId, number>(
    MACHINE_MODEL_IDS.map((id) => [id, sketchOf(id, "full", { out: 0, in: 0, fine: 0 }).box(0).height]),
);
export const machineSpan = (id: MachineModelId): number => SPANS.get(id) as number;

/** 이 크기(px)로 그리면 얼마나 자세히 그려지는가 */
export function detailFor(id: MachineModelId, size: number): Detail {
    const pxPerCm = (size / machineSpan(id)) * KAN_PER_CM;
    return pxPerCm >= FULL_FROM ? "full" : pxPerCm >= MID_FROM ? "mid" : "low";
}

/** 여러 기계를 같은 축척으로 나란히 세울 때의 크기(px) — 1cm 를 몇 px 로 그릴지를 준다 */
export const sizeAtScale = (id: MachineModelId, pxPerCm: number): number => (machineSpan(id) / KAN_PER_CM) * pxPerCm;

export interface MachineOptions {
    /** 그릴 크기(px) — 기계의 키. 작으면 작은 부품을 덜어 낸다 */
    size?: number;
}

/** 기계 한 대의 그림. 캐릭터와 같은 자료형이라 같은 부품으로 그리고 같은 방법으로 내보낸다 */
export function composeMachine(id: MachineModelId, { size = 160 }: MachineOptions = {}): Drawing {
    const unit = machineSpan(id);
    const pxPerKan = size / unit;
    const weight = (line: keyof typeof WEIGHT) => Math.max(WEIGHT[line].min, size * WEIGHT[line].ratio) / pxPerKan;
    const widths = { out: weight("out"), in: weight("in"), fine: weight("fine") };
    const sketch = sketchOf(id, detailFor(id, size), widths);
    return {
        // 여백 — 테두리 굵기의 절반과 손떨림이 밀어내는 만큼
        box: sketch.box(widths.out / 2 + 1.5),
        unit,
        filter: "rough-line-sm",
        layers: [{ strokes: sketch.strokes }],
    };
}
