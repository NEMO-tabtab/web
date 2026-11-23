"use client";

import React, { useCallback, useState } from "react";

import type { SlotInfo } from "@/lib/shops/contents";
import type { Floor } from "@/lib/shops/schema";
import { FloorCanvas } from "./FloorCanvas";
import { MachineDialog } from "./MachineDialog";
import { MachineList } from "./MachineList";

export interface FloorMapProps {
    floor: Floor;
    /** 이 구조의 격자 한 칸 길이(cm) — `layout.cellCm` */
    cellCm: number;
    /** 화면 낭독기에 읽어 줄 굿즈샵 이름 */
    shopName: string;
    /** 이 층의 기기 자리마다의 번호와 내용 (`describeFloor`) */
    slots: readonly SlotInfo[];
    /** 처음부터 표시해 둘 기기 — 물건의 "뽑은 곳"에서 들어왔을 때. 정보 창은 열지 않는다 */
    initialSelectedId?: string | null;
}

/**
 * 한 층의 입체 지도와 그 아래 기기 목록.
 * 지도의 기기나 목록을 누르면 기기 정보 창이 열린다. 지도의 조작은 `FloorCanvas` 가 맡는다.
 */
export function FloorMap({ floor, cellCm, shopName, slots, initialSelectedId = null }: FloorMapProps) {
    const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
    const [dialogOpen, setDialogOpen] = useState(false);

    const open = useCallback((slotId: string) => {
        setSelectedId(slotId);
        setDialogOpen(true);
    }, []);

    return (
        <div>
            <FloorCanvas
                floor={floor}
                cellCm={cellCm}
                label={`${shopName} ${floor.label} 내부 지도. 가챠 기기 ${slots.length}곳.`}
                slots={slots}
                selectedId={selectedId}
                onSelect={open}
                focusId={initialSelectedId}
            />

            <p className="mt-4 text-[13px] text-ink-soft">
                지도를 끌어서 움직이고, 두 손가락으로 벌려 크게 볼 수 있어요. 기기를 누르면 무엇이 들어 있는지 보여요.
                기기가 작게 보일 때는 누른 곳이 먼저 커져요.
            </p>

            <section className="mt-6" aria-labelledby={`machines-${floor.id}`}>
                <h2 id={`machines-${floor.id}`} className="font-display text-lg">
                    {floor.label} 가챠 기기 {slots.length}곳
                </h2>
                <div className="mt-3">
                    <MachineList slots={slots} selectedId={selectedId} onSelect={open} />
                </div>
            </section>

            <MachineDialog
                info={dialogOpen ? (slots.find((info) => info.slot.id === selectedId) ?? null) : null}
                onClose={() => setDialogOpen(false)}
            />
        </div>
    );
}
