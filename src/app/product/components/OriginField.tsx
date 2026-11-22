"use client";

import React, { useState } from "react";
import Link from "next/link";

import { Button, Card, Heading, Icon } from "@/components/common";
import { OriginPicker } from "@/components/shop/OriginPicker";
import type { ProductOrigin } from "@/lib/db";
import { originHref, originLabel } from "@/lib/shops/origin";
import type { Series } from "@/lib/shops/schema";

export interface OriginFieldProps {
    value: ProductOrigin | null;
    onPick: (origin: ProductOrigin, series: Series | null) => void;
    onClear: () => void;
    /** 고른 뒤 무엇을 채웠는지 알리는 한 줄 */
    notice?: string | null;
}

/** 등록·수정 화면의 "어디서 뽑았나요?" 칸 — 굿즈샵·기기·단을 고르고, 고른 곳을 내부 지도에서 볼 수 있다 */
export function OriginField({ value, onPick, onClear, notice }: OriginFieldProps) {
    const [picking, setPicking] = useState(false);

    return (
        <Card padding="sm" className="space-y-3">
            <Heading level={3} as="h2">
                어디서 뽑았나요?
            </Heading>

            {value ? (
                <>
                    <div className="flex items-start gap-2.5 rounded-nemo border border-line bg-cream px-3 py-2.5">
                        <Icon name="map-pin" className="text-lg leading-6" />
                        <div className="min-w-0 flex-1">
                            <p className="break-keep text-sm font-bold">{originLabel(value)}</p>
                            {value.seriesName && <p className="mt-0.5 text-[13px] text-ink-soft">{value.seriesName}</p>}
                            {/* 저장하지 않은 수정은 이동하면 사라진다 — 저장된 물건을 볼 때 쓰는 길이다 */}
                            <Link
                                href={originHref(value)}
                                className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-bold text-ink underline underline-offset-2"
                            >
                                내부 지도에서 보기
                                <Icon name="chevron-right" />
                            </Link>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            shape="pill"
                            onClick={() => setPicking(true)}
                        >
                            다시 고르기
                        </Button>
                        <Button type="button" variant="ghost" size="sm" shape="pill" onClick={onClear}>
                            지우기
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <p className="text-[13px] text-ink-soft">
                        가챠에서 뽑았다면 굿즈샵과 기기를 골라 두세요. 나중에 내부 지도에서 그 기기를 다시 찾을 수
                        있어요.
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        shape="pill"
                        leftIcon={<Icon name="map-pin" />}
                        onClick={() => setPicking(true)}
                    >
                        굿즈샵·기기 고르기
                    </Button>
                </>
            )}

            {notice && (
                <p role="status" className="text-[13px] font-bold text-ink">
                    {notice}
                </p>
            )}

            <OriginPicker open={picking} onClose={() => setPicking(false)} onPick={onPick} />
        </Card>
    );
}
