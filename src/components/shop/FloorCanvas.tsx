"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/common";
import { cn } from "@/lib/cn";
import { project, toUnits, turnBox, type Turn } from "@/lib/iso";
import type { SlotInfo } from "@/lib/shops/contents";
import type { Floor } from "@/lib/shops/schema";
import { floorScene, floorSize, narrowestSlot, numberSize } from "./floorScene";
import { IsoFloor } from "./IsoFloor";

const MIN_ZOOM = 1;
/** 가장 크게 볼 때 화면에 담기는 가로 길이(SVG 단위, 2m 남짓). 넓은 매장일수록 더 많이 확대할 수 있다 */
const CLOSEST_SPAN = 90;
/** 손가락이 이만큼(px) 움직이기 전까지는 끌기가 아니라 누르기로 본다 — 기기를 누를 때 손이 조금 떨려도 된다 */
const TAP_SLOP = 8;
/** 기기가 화면에서 이보다 좁으면(px) 손가락으로 하나만 짚기 어렵다 — 누르면 고르지 않고 그쪽을 크게 보여 준다 */
const HARD_TO_TAP = 18;
/** 크게 보여 줄 때 맞추는 기기 폭(px) */
const EASY_TO_TAP = 32;
/** 번호 글자가 이보다 작으면(px) 읽을 수 없으니 숨긴다 */
const READABLE = 6;

interface View {
    zoom: number;
    /** 화면 가운데가 그림 가운데에서 벗어난 거리(SVG 단위) */
    dx: number;
    dy: number;
}

const HOME: View = { zoom: 1, dx: 0, dy: 0 };
const clamp = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

export interface FloorCanvasProps {
    floor: Floor;
    /** 이 구조의 격자 한 칸 길이(cm) — `layout.cellCm` */
    cellCm: number;
    /** 화면 낭독기에 읽어 줄 지도 이름 */
    label: string;
    /** 이 층의 기기 자리마다의 번호와 내용 (`describeFloor`) */
    slots: readonly SlotInfo[];
    /** 볼터치 색으로 표시할 기기 */
    selectedId: string | null;
    /** 기기를 골랐을 때. 작게 보이는 기기를 손가락으로 누른 것이면 부르지 않고 그쪽을 크게 보여 준다 */
    onSelect: (slotId: string) => void;
    /** 처음 열 때 크게 보여 줄 기기 — 물건의 "뽑은 곳"에서 들어왔을 때 */
    focusId?: string | null;
}

/**
 * 한 층의 입체 지도와 조작 — 끌어서 이동, 두 손가락 확대, 90도씩 돌리기.
 * 손가락을 못 쓰는 환경을 위해 같은 조작을 단추로도 둔다.
 * 실제 매장은 폭 25cm 기기가 수십 대라 한눈에 볼 때는 기기 하나가 몇 px 뿐이다 — 그래서 작게 보이는 기기를 누르면
 * 바로 고르지 않고 누른 곳을 크게 보여 주고, 크게 보일 때 누르면 고른다.
 */
export function FloorCanvas({ floor, cellCm, label, slots, selectedId, onSelect, focusId = null }: FloorCanvasProps) {
    const [turn, setTurn] = useState<Turn>(0);
    const [view, setView] = useState<View>(HOME);
    /** 지도 상자의 크기(px). 재기 전에는 null */
    const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const pressedAt = useRef(new Map<number, { x: number; y: number }>());
    /** 이번 손짓이 끌기·확대였는가 — 그랬다면 손을 뗄 때 기기를 고르지 않는다 */
    const moved = useRef(false);

    useEffect(() => {
        const element = frameRef.current;
        if (!element) return;
        const measure = () => setFrame({ width: element.clientWidth, height: element.clientHeight });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const full = useMemo(() => floorScene(floor, cellCm, turn), [floor, cellCm, turn]);
    const maxZoom = Math.max(4, full.width / CLOSEST_SPAN);
    /** 처음 보기에서 SVG 단위 1이 화면에서 몇 px 인가 — 그림은 상자 안에 비율을 지켜 들어간다 */
    const fit = frame && Math.min(frame.width / full.width, frame.height / full.height);
    /** 이 층에서 가장 좁게 보이는 기기의 폭(SVG 단위). 기기가 없으면 null */
    const narrow = useMemo(() => narrowestSlot(floor, cellCm), [floor, cellCm]);
    /** 그 기기가 처음 보기에서 차지하는 폭(px) */
    const slotPixels = fit && narrow ? narrow * fit : null;
    /** 기기 윗면의 번호를 읽을 수 있는 크기인가. 상자 크기를 재기 전에는 숨겨 둔다 */
    const readable = fit !== null && numberSize(narrow ?? Infinity) * fit * view.zoom >= READABLE;

    const width = full.width / view.zoom;
    const height = full.height / view.zoom;
    const viewBox = [
        full.x + full.width / 2 + view.dx - width / 2,
        full.y + full.height / 2 + view.dy - height / 2,
        width,
        height,
    ].join(" ");

    /** 확대한 만큼만 움직일 수 있다 — 그림이 화면 밖으로 사라지지 않는다 */
    const settle = useCallback(
        (next: View): View => {
            const zoom = Math.min(maxZoom, Math.max(MIN_ZOOM, next.zoom));
            return {
                zoom,
                dx: clamp(next.dx, (full.width - full.width / zoom) / 2),
                dy: clamp(next.dy, (full.height - full.height / zoom) / 2),
            };
        },
        [full, maxZoom],
    );

    /** 그 기기가 손가락으로 짚을 만한 크기로 화면 가운데에 오게 한다 */
    const focusOn = useCallback(
        (slotId: string) => {
            const slot = floor.slots.find((each) => each.id === slotId);
            if (!slot || !slotPixels) return;
            const placed = turnBox(toUnits(slot, cellCm), floorSize(floor, cellCm), turn);
            const [x, y] = project(placed.x + placed.w / 2, placed.y + placed.d / 2, placed.h / 2);
            setView((old) =>
                settle({
                    zoom: Math.max(old.zoom, EASY_TO_TAP / slotPixels),
                    dx: x - (full.x + full.width / 2),
                    dy: y - (full.y + full.height / 2),
                }),
            );
        },
        [floor, cellCm, turn, full, slotPixels, settle],
    );

    // 표시해 둔 기기가 있으면 처음 한 번 그 기기를 크게 보여 준다. 한눈에 봐도 큰 매장(옛 구조)은 그대로 둔다
    const focused = useRef(false);
    useEffect(() => {
        if (focused.current || !focusId || !slotPixels) return;
        focused.current = true;
        if (slotPixels < HARD_TO_TAP) focusOn(focusId);
    }, [focusId, slotPixels, focusOn]);

    const press = (slotId: string, byKeyboard: boolean) => {
        if (!byKeyboard) {
            // 끌다가 손을 뗀 것이면 고르지 않는다
            if (moved.current) return;
            if (slotPixels && slotPixels * view.zoom < HARD_TO_TAP && view.zoom < maxZoom) {
                focusOn(slotId);
                return;
            }
        }
        onSelect(slotId);
    };
    // IsoFloor 는 memo 라 넘기는 함수가 매번 바뀌면 끌 때마다 다시 그린다 — 바뀌지 않는 함수로 감싼다
    const pressRef = useRef(press);
    useEffect(() => {
        pressRef.current = press;
    });
    const pressStable = useCallback((slotId: string, byKeyboard: boolean) => pressRef.current(slotId, byKeyboard), []);

    const rotate = (by: 1 | 3) => {
        setTurn((current) => ((current + by) % 4) as Turn);
        // 돌리면 그림의 크기와 모양이 바뀐다 — 이전 위치가 뜻이 없으므로 처음 보기로 돌아간다
        setView(HOME);
    };

    const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
        const point = { x: event.clientX, y: event.clientY };
        if (pointers.current.size === 0) moved.current = false;
        pointers.current.set(event.pointerId, point);
        pressedAt.current.set(event.pointerId, point);
        // 두 손가락이면 누르기가 아니라 확대다
        if (pointers.current.size > 1) moved.current = true;
    };

    const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        const previous = pointers.current.get(event.pointerId);
        const svg = svgRef.current;
        if (!previous || !svg) return;
        const current = { x: event.clientX, y: event.clientY };
        pointers.current.set(event.pointerId, current);

        if (!moved.current) {
            const start = pressedAt.current.get(event.pointerId) ?? previous;
            if (Math.hypot(current.x - start.x, current.y - start.y) < TAP_SLOP) return;
            moved.current = true;
        }
        // 끌기가 시작된 뒤에만 포인터를 붙잡는다. 처음부터 붙잡으면 손을 뗄 때의 클릭이 지도 전체로 가서
        // 기기를 누를 수 없다
        if (!svg.hasPointerCapture(event.pointerId)) svg.setPointerCapture(event.pointerId);

        if (pointers.current.size === 1) {
            const rect = svg.getBoundingClientRect();
            setView((before) => {
                // 화면 1px 이 SVG 단위로 얼마인지
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
        pressedAt.current.delete(event.pointerId);
    };

    return (
        <div>
            <div ref={frameRef} className="sticker aspect-[4/3] w-full overflow-hidden rounded-nemo bg-paper">
                <svg
                    ref={svgRef}
                    role="group"
                    aria-label={label}
                    viewBox={viewBox}
                    className={cn(
                        // 지도 위에서는 손가락이 지도를 움직인다 — 브라우저의 스크롤·확대가 끼어들지 않게 한다
                        "h-full w-full cursor-grab touch-none select-none active:cursor-grabbing",
                        // 번호가 점처럼 보일 만큼 작을 때는 숨긴다 — 매장 전체를 볼 때 기기 80대의 번호는 얼룩일 뿐이다
                        !readable && "[&_[data-number]]:opacity-0",
                    )}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                >
                    <IsoFloor
                        floor={floor}
                        cellCm={cellCm}
                        turn={turn}
                        slots={slots}
                        selectedId={selectedId}
                        onSelect={pressStable}
                    />
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
                    disabled={view.zoom >= maxZoom}
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
