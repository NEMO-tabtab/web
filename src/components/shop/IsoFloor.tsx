import React from "react";

import {
    boxFaces,
    drawOrder,
    isNearWall,
    onFace,
    project,
    turnBox,
    turnFacing,
    turnSize,
    type Box,
    type Facing,
    type Point,
    type Turn,
} from "@/lib/iso";
import type { Fixture, Floor, Slot } from "@/lib/shops/schema";

/** 보는 사람 쪽 벽은 이 높이(칸)로 낮춰 그린다 — 안이 가려지지 않게 */
const CUT_WALL_HEIGHT = 0.4;

type Item = (Fixture & { type: "fixture" }) | (Slot & { type: "slot" });

const points = (shape: readonly Point[]) => shape.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** 먹선 — 확대해도 굵기가 그대로다 */
const ink = {
    className: "stroke-ink",
    strokeWidth: 2,
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
} as const;
const thin = { ...ink, strokeWidth: 1.25, fill: "none" } as const;

/** 옆면에 가로로 긋는 금 (단 사이, 선반) */
function FaceLine({ box, face, z }: { box: Box; face: "south" | "east"; z: number }) {
    const [[x1, y1], [x2, y2]] = onFace(box, face, [0, 1], [z, z]);
    return <line x1={x1} y1={y1} x2={x2} y2={y2} {...thin} />;
}

function Faces({ box }: { box: Box }) {
    const faces = boxFaces(box);
    return (
        <>
            {/* 면마다 채움을 달리해 색 없이 입체를 낸다 — 동쪽 면만 옅은 면 */}
            <polygon points={points(faces.south)} {...ink} className="fill-paper stroke-ink" />
            <polygon points={points(faces.east)} {...ink} className="fill-cream stroke-ink" />
            <polygon points={points(faces.top)} {...ink} className="fill-paper stroke-ink" />
        </>
    );
}

/** 가챠 기기 자리 — 단마다 금을 긋고, 손잡이가 보이는 면에는 창과 손잡이를 그린다 */
function SlotBox({ slot, facing }: { slot: Slot; facing: Facing }) {
    const tierHeight = slot.h / slot.tiers;
    const front = facing === "s" ? "south" : facing === "e" ? "east" : null;
    const tiers = Array.from({ length: slot.tiers }, (_, tier) => tier * tierHeight);

    return (
        <g>
            <Faces box={slot} />
            {tiers.slice(1).map((z) => (
                <React.Fragment key={z}>
                    <FaceLine box={slot} face="south" z={z} />
                    <FaceLine box={slot} face="east" z={z} />
                </React.Fragment>
            ))}
            {front &&
                tiers.map((z) => (
                    <React.Fragment key={z}>
                        <polygon
                            points={points(
                                onFace(slot, front, [0.18, 0.82], [z + tierHeight * 0.36, z + tierHeight * 0.86]),
                            )}
                            {...thin}
                            className="fill-paper stroke-ink"
                        />
                        <polygon
                            points={points(
                                onFace(slot, front, [0.42, 0.58], [z + tierHeight * 0.1, z + tierHeight * 0.24]),
                            )}
                            className="fill-ink"
                        />
                    </React.Fragment>
                ))}
        </g>
    );
}

function FixtureBox({ fixture, cut }: { fixture: Fixture; cut: boolean }) {
    const box = cut ? { ...fixture, h: CUT_WALL_HEIGHT } : fixture;
    return (
        <g>
            <Faces box={box} />
            {fixture.kind === "shelf" &&
                Array.from({ length: fixture.h - 1 }, (_, index) => index + 1).map((z) => (
                    <React.Fragment key={z}>
                        <FaceLine box={box} face="south" z={z} />
                        <FaceLine box={box} face="east" z={z} />
                    </React.Fragment>
                ))}
        </g>
    );
}

export interface IsoFloorProps {
    floor: Floor;
    /** 시계 방향으로 90도씩 돌린 횟수 */
    turn: Turn;
}

/**
 * 한 층을 위에서 비스듬히 내려다본 입체 그림(SVG `<g>`).
 * 데이터의 2D 격자를 돌리고, 뒤에서 앞 순서로 상자를 쌓아 그린다. 손그림 선은 루트 레이아웃의 `#rough-line-sm` 필터.
 */
export function IsoFloor({ floor, turn }: IsoFloorProps) {
    const original = { width: floor.width, depth: floor.depth };
    const size = turnSize(original, turn);

    const items: Item[] = [
        ...floor.fixtures.map((fixture) => ({ ...fixture, type: "fixture" as const })),
        ...floor.slots.map((slot) => ({ ...slot, type: "slot" as const })),
    ];
    const ordered = drawOrder(items.map((item) => turnBox(item, original, turn)));

    const entrance = turnBox({ ...floor.entrance, w: 1, d: 1, h: 0 }, original, turn);
    const [entranceX, entranceY] = project(entrance.x + 0.5, entrance.y + 0.5);

    const ground = [project(0, 0), project(size.width, 0), project(size.width, size.depth), project(0, size.depth)];
    const gridLines = [
        ...Array.from({ length: size.width - 1 }, (_, index) => [
            project(index + 1, 0),
            project(index + 1, size.depth),
        ]),
        ...Array.from({ length: size.depth - 1 }, (_, index) => [
            project(0, index + 1),
            project(size.width, index + 1),
        ]),
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

            <polygon points={points(boxFaces(entrance).top)} {...thin} className="fill-cream stroke-ink" />
            <text
                x={entranceX}
                y={entranceY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                className="fill-ink font-sans font-bold"
            >
                입구
            </text>

            {ordered.map((item) =>
                item.type === "slot" ? (
                    <SlotBox key={item.id} slot={item} facing={turnFacing(item.facing, turn)} />
                ) : (
                    <FixtureBox key={item.id} fixture={item} cut={item.kind === "wall" && isNearWall(item, size)} />
                ),
            )}
        </g>
    );
}
