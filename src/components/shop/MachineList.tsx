import React from "react";

import { Badge, Icon, IconTile } from "@/components/common";
import { cn } from "@/lib/cn";
import { isStale, seriesSummary, slotLabel, type SlotInfo } from "@/lib/shops/contents";

export interface MachineListProps {
    slots: readonly SlotInfo[];
    selectedId: string | null;
    onSelect: (slotId: string) => void;
}

/**
 * 지도 아래의 기기 목록. 지도를 만지기 어려운 사람도 같은 정보에 닿을 수 있게 하고,
 * 번호표 색으로 지금 고른 기기가 지도의 어느 것인지 잇는다.
 */
export function MachineList({ slots, selectedId, onSelect }: MachineListProps) {
    const now = new Date();

    return (
        <ul className="space-y-2">
            {slots.map((info) => {
                const selected = info.slot.id === selectedId;
                const stale = info.tiers.some((each) => each.lastVerifiedAt && isStale(each.lastVerifiedAt, now));
                return (
                    <li key={info.slot.id}>
                        <button
                            type="button"
                            aria-label={slotLabel(info)}
                            aria-haspopup="dialog"
                            onClick={() => onSelect(info.slot.id)}
                            className={cn(
                                "sticker sticker-press flex w-full items-center gap-3 rounded-nemo bg-paper px-3 py-2.5 text-left",
                                "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink",
                            )}
                        >
                            <IconTile size="sm" shape="circle" tone={selected ? "cheek" : "default"} aria-hidden="true">
                                <span className="font-sans text-sm font-bold tabular-nums">{info.number}</span>
                            </IconTile>
                            <span className="min-w-0 flex-1" aria-hidden="true">
                                <span className="block truncate text-sm font-bold">{seriesSummary(info)}</span>
                                <span className="mt-0.5 block text-[11px] tabular-nums text-ink-soft">
                                    {info.slot.tiers}단{info.priceText && ` · ${info.priceText}`}
                                </span>
                            </span>
                            {stale && (
                                <Badge variant="warning" size="sm" className="shrink-0" aria-hidden="true">
                                    확인 오래됨
                                </Badge>
                            )}
                            <Icon name="chevron-right" className="shrink-0 text-lg text-ink-soft" />
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
