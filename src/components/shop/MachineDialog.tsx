"use client";

import React from "react";

import { Price } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import { daysSince, isStale, type SlotInfo } from "@/lib/shops/contents";

export interface MachineDialogProps {
    info: SlotInfo | null;
    onClose: () => void;
}

/** 확인한 날을 사람 말로 — "오늘", "3일 전", "2026-08-01 (112일 전)" */
function verifiedText(day: string, now: Date): string {
    const days = daysSince(day, now);
    if (days <= 0) return "오늘";
    if (days <= 7) return `${days}일 전`;
    return `${day} (${days}일 전)`;
}

/** 고른 가챠 기기의 단별 내용. 맨 위 단부터 기기에 쌓인 순서 그대로 보여 준다 */
export function MachineDialog({ info, onClose }: MachineDialogProps) {
    const now = new Date();

    return (
        <Modal open={info !== null} onClose={onClose} title={info ? `${info.number}번 가챠 기기` : ""}>
            {info && (
                <>
                    <p className="text-[13px] text-ink-soft">{info.slot.tiers}단 · 위에서부터 보여 드려요</p>
                    <ol className="mt-3 divide-y divide-line">
                        {info.tiers.map((each) => (
                            <li key={each.tier} className="flex items-start gap-3 py-3">
                                <span className="w-9 shrink-0 pt-0.5 text-[13px] font-bold tabular-nums text-ink-soft">
                                    {each.tier + 1}단
                                </span>
                                {each.series ? (
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <p className="break-keep text-sm font-bold">{each.series.name}</p>
                                            {each.series.price !== undefined && (
                                                <Price value={each.series.price} size="sm" className="shrink-0" />
                                            )}
                                        </div>
                                        {each.lastVerifiedAt && (
                                            <p className="mt-1 text-[11px] text-ink-soft">
                                                {isStale(each.lastVerifiedAt, now)
                                                    ? `확인한 지 오래됐어요 · ${verifiedText(each.lastVerifiedAt, now)}. 지금은 다를 수 있어요.`
                                                    : `확인 ${verifiedText(each.lastVerifiedAt, now)}`}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="flex-1 text-sm text-ink-soft">비어 있거나 아직 확인하지 못했어요.</p>
                                )}
                            </li>
                        ))}
                    </ol>
                </>
            )}
        </Modal>
    );
}
