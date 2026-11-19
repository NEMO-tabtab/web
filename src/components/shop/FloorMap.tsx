"use client";

import React, { useRef, useState } from "react";

import { Button } from "@/components/common";
import { sceneBounds, turnSize, type Turn } from "@/lib/iso";
import type { Floor } from "@/lib/shops/schema";
import { IsoFloor } from "./IsoFloor";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
/** 그림 둘레의 여백(SVG 단위) — 손그림 필터가 선을 밀어내도 잘리지 않게 */
const MARGIN = 14;

interface View {
    zoom: number;
    /** 화면 가운데가 그림 가운데에서 벗어난 거리(SVG 단위) */
    dx: number;
    dy: number;
}

const HOME: View = { zoom: 1, dx: 0, dy: 0 };
const clamp = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

export interface FloorMapProps {
    floor: Floor;
    /** 화면 낭독기에 읽어 줄 굿즈샵 이름 */
    shopName: string;
}

/**
 * 한 층의 입체 지도와 조작(끌어서 이동, 두 손가락 확대, 90도씩 돌리기).
 * 손가락을 못 쓰는 환경을 위해 같은 조작을 아래 단추로도 둔다.
 */
export function FloorMap({ floor, shopName }: FloorMapProps) {
    const [turn, setTurn] = useState<Turn>(0);
    const [view, setView] = useState<View>(HOME);
    const svgRef = useRef<SVGSVGElement>(null);
    const pointers = useRef(new Map<number, { x: number; y: number }>());

    const size = turnSize({ width: floor.width, depth: floor.depth }, turn);
    const tallest = Math.max(1, ...floor.fixtures.map((each) => each.h), ...floor.slots.map((each) => each.h));
    const scene = sceneBounds(size, tallest);
    const full = {
        x: scene.x - MARGIN,
        y: scene.y - MARGIN,
        width: scene.width + MARGIN * 2,
        height: scene.height + MARGIN * 2,
    };

    const width = full.width / view.zoom;
    const height = full.height / view.zoom;
    const viewBox = [
        full.x + full.width / 2 + view.dx - width / 2,
        full.y + full.height / 2 + view.dy - height / 2,
        width,
        height,
    ].join(" ");

    /** 확대한 만큼만 움직일 수 있다 — 그림이 화면 밖으로 사라지지 않는다 */
    const settle = (next: View): View => {
        const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next.zoom));
        return {
            zoom,
            dx: clamp(next.dx, (full.width - full.width / zoom) / 2),
            dy: clamp(next.dy, (full.height - full.height / zoom) / 2),
        };
    };

    const rotate = (by: 1 | 3) => {
        setTurn((current) => ((current + by) % 4) as Turn);
        // 돌리면 그림의 크기와 모양이 바뀐다 — 이전 위치가 뜻이 없으므로 처음 보기로 돌아간다
        setView(HOME);
    };

    const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    };

    const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        const previous = pointers.current.get(event.pointerId);
        const svg = svgRef.current;
        if (!previous || !svg) return;
        const current = { x: event.clientX, y: event.clientY };
        pointers.current.set(event.pointerId, current);

        if (pointers.current.size === 1) {
            const rect = svg.getBoundingClientRect();
            setView((before) => {
                // 화면 1px 이 SVG 단위로 얼마인지 — 그림은 상자 안에 비율을 지켜 들어간다
                const unitsPerPixel = Math.max(
                    full.width / before.zoom / rect.width,
                    full.height / before.zoom / rect.height,
                );
                return settle({
                    zoom: before.zoom,
                    dx: before.dx - (current.x - previous.x) * unitsPerPixel,
                    dy: before.dy - (current.y - previous.y) * unitsPerPixel,
                });
            });
            return;
        }

        if (pointers.current.size === 2) {
            const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)?.[1];
            if (!other) return;
            const before = Math.hypot(previous.x - other.x, previous.y - other.y);
            const after = Math.hypot(current.x - other.x, current.y - other.y);
            if (before > 0) setView((old) => settle({ ...old, zoom: old.zoom * (after / before) }));
        }
    };

    const onPointerEnd = (event: React.PointerEvent<SVGSVGElement>) => {
        pointers.current.delete(event.pointerId);
    };

    return (
        <div>
            <div className="sticker aspect-[4/3] w-full overflow-hidden rounded-nemo bg-paper">
                <svg
                    ref={svgRef}
                    role="img"
                    aria-label={`${shopName} ${floor.label} 내부 지도. 가챠 기기 자리 ${floor.slots.length}곳.`}
                    viewBox={viewBox}
                    // 지도 위에서는 손가락이 지도를 움직인다 — 브라우저의 스크롤·확대가 끼어들지 않게 한다
                    className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                >
                    <IsoFloor floor={floor} turn={turn} />
                </svg>
            </div>

            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="지도 조작">
                <Button variant="secondary" size="sm" shape="pill" onClick={() => rotate(3)}>
                    ↺ 왼쪽으로 돌리기
                </Button>
                <Button variant="secondary" size="sm" shape="pill" onClick={() => rotate(1)}>
                    ↻ 오른쪽으로 돌리기
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    shape="pill"
                    disabled={view.zoom >= MAX_ZOOM}
                    onClick={() => setView((old) => settle({ ...old, zoom: old.zoom * 1.5 }))}
                >
                    크게
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    shape="pill"
                    disabled={view.zoom <= MIN_ZOOM}
                    onClick={() => setView((old) => settle({ ...old, zoom: old.zoom / 1.5 }))}
                >
                    작게
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    shape="pill"
                    disabled={view.zoom === 1 && turn === 0}
                    onClick={() => {
                        setTurn(0);
                        setView(HOME);
                    }}
                >
                    처음 보기로
                </Button>
            </div>
        </div>
    );
}
