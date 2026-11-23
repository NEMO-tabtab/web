import React from "react";

import {
    backsOnto,
    boxFaces,
    drawOrder,
    isNearWall,
    onFace,
    project,
    roundOnFace,
    roundOnTop,
    toUnits,
    turnBox,
    turnFacing,
    turnSize,
    type Box,
    type Facing,
    type Point,
    type SideFace,
    type Turn,
} from "@/lib/iso";
import { groupBanks } from "@/lib/shops/banks";
import { slotLabel, type SlotInfo } from "@/lib/shops/contents";
import type { Fixture, Floor, Slot } from "@/lib/shops/schema";
import { acrossOf, entranceMat, floorSize, numberSize } from "./floorScene";

/** 보는 사람 쪽 벽과 거기에 등을 댄 기계 줄은 이 높이(20cm)로 낮춰 그린다 — 안이 가려지지 않게 */
const CUT_HEIGHT = 0.4;

type DrawnFixture = Fixture & { type: "fixture"; cut: boolean };
type DrawnBank = Box & { type: "bank"; id: string; slots: Slot[]; facing: Facing; cut: boolean };

const points = (shape: readonly Point[]) => shape.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** 먹선 — 확대해도 굵기가 그대로다. 벽·집기와 기계 줄의 테두리에 쓴다 */
const ink = {
    className: "stroke-ink",
    strokeWidth: 2,
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
} as const;
const thin = { ...ink, strokeWidth: 1.25, fill: "none" } as const;

/**
 * 기계 줄 안의 가는 선(기기 사이의 이음매, 단 사이의 금, 얼굴의 창과 손잡이).
 * 굵기를 화면이 아니라 그림에 맞춰서, 매장 전체를 볼 때는 흐려지고 크게 보면 또렷해진다 —
 * 폭 25cm 짜리 기기 80대에 굵은 선을 두르면 한눈에 볼 때 까맣게 뭉개진다.
 */
const seam = { strokeWidth: 0.9, strokeLinejoin: "round" } as const;
const hair = { strokeWidth: 0.55, strokeLinejoin: "round" } as const;

const frontOf = (facing: Facing | undefined): SideFace | null =>
    facing === "s" ? "south" : facing === "e" ? "east" : null;

/** 옆면에 가로로 긋는 금 (단 사이, 선반) */
function FaceLine({ box, face, z, fine = false }: { box: Box; face: SideFace; z: number; fine?: boolean }) {
    const [[x1, y1], [x2, y2]] = onFace(box, face, [0, 1], [z, z]);
    return fine ? (
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-ink" {...seam} />
    ) : (
        <line x1={x1} y1={y1} x2={x2} y2={y2} {...thin} />
    );
}

function Faces({ box, selected = false, fine = false }: { box: Box; selected?: boolean; fine?: boolean }) {
    const faces = boxFaces(box);
    // 면마다 채움을 달리해 색 없이 입체를 낸다 — 동쪽 면만 옅은 면.
    // 고른 기기만 볼터치 색으로 칠한다. 지도 아래 목록의 번호표와 같은 색이라 둘을 잇는다
    const light = selected ? "fill-cheek" : "fill-paper";
    const shade = selected ? "fill-cheek/60" : "fill-cream";
    const line = fine ? seam : ink;
    return (
        <>
            <polygon points={points(faces.south)} {...line} className={`${light} stroke-ink`} />
            {/* 옅은 볼터치 색은 비치는 색이라, 뒤에 선 기기의 금이 비치지 않게 흰 면을 먼저 깐다 */}
            {selected && <polygon points={points(faces.east)} className="fill-paper" />}
            <polygon points={points(faces.east)} {...line} className={`${shade} stroke-ink`} />
            <polygon points={points(faces.top)} {...line} className={`${light} stroke-ink`} />
        </>
    );
}

/** 상자의 보이는 세 면을 테두리만 — 기계 줄의 굵은 윤곽과 키보드 포커스 표시에 쓴다 */
function Outline({ box, className, width }: { box: Box; className?: string; width: number }) {
    const faces = boxFaces(box);
    return (
        <g className={`pointer-events-none fill-none stroke-ink ${className ?? ""}`}>
            {[faces.south, faces.east, faces.top].map((face, index) => (
                <polygon key={index} points={points(face)} {...ink} strokeWidth={width} />
            ))}
        </g>
    );
}

/**
 * 가챠 기기 한 단의 얼굴 — 실제 기계(반다이 캡슐 스테이션, Gacha.2 Ez)의 생김새를 따른다.
 * 위쪽 절반은 상품 카드가 붙은 투명 통, 아래쪽 몸통에는 둥근 손잡이와 캡슐이 나오는 곳.
 */
function MachineFace({ box, face, z, height }: { box: Box; face: SideFace; z: number; height: number }) {
    const length = face === "south" ? box.w : box.d;
    // 손잡이 지름은 기기 폭의 4할쯤. 옛 구조의 넓은 기기에서는 통을 넘지 않게 단 높이로 한 번 더 누른다
    const knob = Math.min(length * 0.2, height * 0.12);
    // 캡슐 지름은 6.5cm 쯤. 통 아래쪽, 상품 카드 밑으로 두 알이 보인다
    const capsule = Math.min(length * 0.13, height * 0.055);
    const at = (ratio: number) => z + height * ratio;
    return (
        <>
            <polygon
                points={points(onFace(box, face, [0.1, 0.9], [at(0.48), at(0.95)]))}
                {...hair}
                className="fill-line stroke-ink"
            />
            <polygon points={points(onFace(box, face, [0.2, 0.8], [at(0.63), at(0.91)]))} className="fill-paper" />
            {[0.33, 0.67].map((along) => (
                <polygon
                    key={along}
                    points={points(roundOnFace(box, face, along, at(0.555), capsule))}
                    {...hair}
                    className="fill-paper stroke-ink"
                />
            ))}
            <polygon
                points={points(roundOnFace(box, face, 0.5, at(0.31), knob))}
                {...hair}
                className="fill-paper stroke-ink"
            />
            <polygon points={points(roundOnFace(box, face, 0.5, at(0.31), knob * 0.4))} className="fill-ink" />
            <polygon points={points(onFace(box, face, [0.2, 0.62], [at(0.05), at(0.15)]))} className="fill-ink" />
        </>
    );
}

interface SlotBoxProps {
    slot: Slot;
    facing: Facing;
    info: SlotInfo | undefined;
    selected: boolean;
    /** 낮춰 그릴지 — 보는 사람 쪽 벽에 등을 댄 줄의 기기 */
    cut: boolean;
    onSelect: (slotId: string, byKeyboard: boolean) => void;
}

/**
 * 가챠 기기 자리 — 단마다 금을 긋고, 손잡이가 보이는 면에는 기기 얼굴을 그린다. 윗면에 번호를 적는다.
 * 누르거나 키보드(Enter·Space)로 고를 수 있는 버튼이다. 포커스는 굵은 테두리로 보여 준다.
 */
function SlotBox({ slot, facing, info, selected, cut, onSelect }: SlotBoxProps) {
    const box = cut ? { ...slot, h: CUT_HEIGHT } : slot;
    const tierHeight = slot.h / slot.tiers;
    const front = frontOf(facing);
    // 낮춘 기기는 바닥에 남은 자리만 보인다 — 단도 얼굴도 그리지 않는다
    const tiers = cut ? [] : Array.from({ length: slot.tiers }, (_, tier) => tier * tierHeight);
    const [numberX, numberY] = project(box.x + box.w / 2, box.y + box.d / 2, box.h);

    return (
        <g
            role="button"
            tabIndex={0}
            aria-label={info ? slotLabel(info) : "가챠 기기"}
            aria-haspopup="dialog"
            onClick={() => onSelect(slot.id, false)}
            onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                // Space 가 화면을 스크롤하지 않게 한다
                event.preventDefault();
                onSelect(slot.id, true);
            }}
            className="group cursor-pointer outline-none"
        >
            <Faces box={box} selected={selected} fine />
            {tiers.slice(1).map((z) => (
                <React.Fragment key={z}>
                    <FaceLine box={box} face="south" z={z} fine />
                    <FaceLine box={box} face="east" z={z} fine />
                </React.Fragment>
            ))}
            {front && tiers.map((z) => <MachineFace key={z} box={box} face={front} z={z} height={tierHeight} />)}
            {info && (
                // 작게 보여 읽을 수 없을 때는 지도 쪽에서 `data-number` 를 한꺼번에 숨긴다(FloorCanvas).
                // 그때그때 넣고 빼지 않는 까닭 — 크롬은 나중에 끼워 넣은 글자를 다시 그리지 않아 번호가 보이지 않았다
                <text
                    data-number=""
                    x={numberX}
                    y={numberY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={numberSize(acrossOf(slot))}
                    aria-hidden="true"
                    className="pointer-events-none fill-ink font-sans font-bold"
                >
                    {info.number}
                </text>
            )}
            <Outline box={box} width={4} className="opacity-0 group-focus-visible:opacity-100" />
        </g>
    );
}

/** 교환기의 앞 — 화면, 동전 넣는 곳, 동전이 나오는 받침 */
function ChangerFace({ box, face }: { box: Box; face: SideFace }) {
    const at = (ratio: number) => box.h * ratio;
    return (
        <>
            <polygon
                points={points(onFace(box, face, [0.16, 0.84], [at(0.6), at(0.86)]))}
                {...thin}
                className="fill-line stroke-ink"
            />
            <polygon points={points(onFace(box, face, [0.58, 0.84], [at(0.49), at(0.53)]))} className="fill-ink" />
            <polygon points={points(onFace(box, face, [0.2, 0.8], [at(0.18), at(0.3)]))} className="fill-ink" />
        </>
    );
}

function FixtureBox({ fixture, facing, cut }: { fixture: Fixture; facing: Facing | undefined; cut: boolean }) {
    const box = cut ? { ...fixture, h: CUT_HEIGHT } : fixture;
    const front = frontOf(facing);
    const sides: SideFace[] = ["south", "east"];
    const [topX, topY] = project(box.x + box.w / 2, box.y + box.d / 2, box.h);
    return (
        <g>
            <Faces box={box} />
            {fixture.kind === "shelf" &&
                // 선반은 50cm 마다
                Array.from({ length: Math.ceil(fixture.h) - 1 }, (_, index) => index + 1).flatMap((z) =>
                    sides.map((face) => <FaceLine key={`${face}${z}`} box={box} face={face} z={z} />),
                )}
            {fixture.kind === "counter" &&
                sides.map((face) => <FaceLine key={face} box={box} face={face} z={fixture.h - 0.16} />)}
            {fixture.kind === "changer" && front && <ChangerFace box={box} face={front} />}
            {fixture.kind === "changer" && (
                // 뒤에서 보면 그냥 상자라 윗면에 이름을 적는다. 기기 번호와 함께, 읽을 수 없게 작을 때는 숨는다
                <text
                    data-number=""
                    x={topX}
                    y={topY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={numberSize(acrossOf(box))}
                    className="pointer-events-none fill-ink font-sans font-bold"
                >
                    교환
                </text>
            )}
            {fixture.kind === "bin" && (
                // 빈 캡슐을 넣는 구멍
                <polygon
                    points={points(
                        roundOnTop(box.x + box.w / 2, box.y + box.d / 2, box.h, Math.min(box.w, box.d) * 0.3),
                    )}
                    className="fill-ink"
                />
            )}
        </g>
    );
}

export interface IsoFloorProps {
    floor: Floor;
    /** 이 구조의 격자 한 칸 길이(cm) — `layout.cellCm` */
    cellCm: number;
    /** 시계 방향으로 90도씩 돌린 횟수 */
    turn: Turn;
    /** 기기 자리마다의 번호와 내용 (`describeFloor`) */
    slots: readonly SlotInfo[];
    selectedId: string | null;
    /** byKeyboard — 키보드로 골랐는가. 손가락과 달리 잘못 누를 일이 없다 */
    onSelect: (slotId: string, byKeyboard: boolean) => void;
}

/**
 * 한 층을 위에서 비스듬히 내려다본 입체 그림(SVG `<g>`).
 * 데이터의 2D 격자를 돌리고, 뒤에서 앞 순서로 상자를 쌓아 그린다. 손그림 선은 루트 레이아웃의 `#rough-line-sm` 필터.
 * 지도를 끌거나 확대하는 동안 다시 그리지 않게 memo 로 감쌌다 — 그때 바뀌는 것은 바깥 `<svg>` 의 viewBox 뿐이다.
 */
export const IsoFloor = React.memo(function IsoFloor({
    floor,
    cellCm,
    turn,
    slots,
    selectedId,
    onSelect,
}: IsoFloorProps) {
    const infoById = new Map(slots.map((info) => [info.slot.id, info]));
    const original = floorSize(floor, cellCm);
    const size = turnSize(original, turn);
    /** 칸으로 적힌 것을 그림의 길이로 바꾸고 지도를 돌린 자리에 놓는다 */
    const place = <T extends Box>(box: T): T => turnBox(toUnits(box, cellCm), original, turn);

    const fixtures: DrawnFixture[] = floor.fixtures.map((fixture) => {
        const placed = place(fixture);
        return { ...placed, type: "fixture", cut: placed.kind === "wall" && isNearWall(placed, size) };
    });
    const cutWalls = fixtures.filter((fixture) => fixture.cut);
    const banks: DrawnBank[] = groupBanks(floor.slots).map((bank) => {
        const placed = place(bank);
        const facing = turnFacing(bank.slots[0].facing, turn);
        return {
            ...placed,
            type: "bank",
            facing,
            cut: cutWalls.some((wall) => backsOnto(placed, facing, wall)),
            // 한 줄 안에서도 먼 기기부터 그린다
            slots: bank.slots.map(place).sort((a, b) => a.x + a.y - (b.x + b.y)),
        };
    });
    const ordered = drawOrder<DrawnFixture | DrawnBank>([...fixtures, ...banks]);

    const mat = turnBox(entranceMat(floor, cellCm), original, turn);
    const [entranceX, entranceY] = project(mat.x + mat.w / 2, mat.y + mat.d / 2);

    const ground = [project(0, 0), project(size.width, 0), project(size.width, size.depth), project(0, size.depth)];
    // 바닥의 금은 50cm 마다 — 크기를 가늠하는 눈금이 된다
    const tiles = (length: number) => Array.from({ length: Math.ceil(length) - 1 }, (_, index) => index + 1);
    const gridLines = [
        ...tiles(size.width).map((x) => [project(x, 0), project(x, size.depth)]),
        ...tiles(size.depth).map((y) => [project(0, y), project(size.width, y)]),
    ];

    return (
        <g filter="url(#rough-line-sm)">
            <polygon points={points(ground)} {...ink} className="fill-paper stroke-ink" />
            {gridLines.map(([[x1, y1], [x2, y2]], index) => (
                <line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className="stroke-line"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                />
            ))}

            <polygon points={points(boxFaces(mat).top)} {...thin} className="fill-cream stroke-ink" />
            <text
                x={entranceX}
                y={entranceY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                className="fill-ink font-sans font-bold"
            >
                입구
            </text>

            {ordered.map((item) =>
                item.type === "bank" ? (
                    <g key={item.id}>
                        {item.slots.map((slot) => (
                            <SlotBox
                                key={slot.id}
                                slot={slot}
                                facing={item.facing}
                                info={infoById.get(slot.id)}
                                selected={slot.id === selectedId}
                                cut={item.cut}
                                onSelect={onSelect}
                            />
                        ))}
                        <Outline box={item.cut ? { ...item, h: CUT_HEIGHT } : item} width={2} />
                    </g>
                ) : (
                    <FixtureBox
                        key={item.id}
                        fixture={item}
                        facing={item.facing && turnFacing(item.facing, turn)}
                        cut={item.cut}
                    />
                ),
            )}
        </g>
    );
});
