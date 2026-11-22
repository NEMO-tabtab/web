"use client";

import React, { useEffect, useState } from "react";

import { Button, Icon, LoadingState, Price } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import { Tabs } from "@/components/common/Tabs";
import type { ProductOrigin } from "@/lib/db";
import { describeFloor, type SlotInfo } from "@/lib/shops/contents";
import { ShopDataError, loadShopInterior, loadShops, type ShopInterior } from "@/lib/shops/load";
import { makeOrigin } from "@/lib/shops/origin";
import type { Series, Shop } from "@/lib/shops/schema";
import { floorScene } from "./floorScene";
import { IsoFloor } from "./IsoFloor";
import { MachineList } from "./MachineList";

export interface OriginPickerProps {
    open: boolean;
    onClose: () => void;
    /** 고른 뽑은 곳과, 그 단에 들어 있던 시리즈(모르면 null) */
    onPick: (origin: ProductOrigin, series: Series | null) => void;
}

type Step =
    | { kind: "shops" }
    | { kind: "machines"; interior: ShopInterior; floorId: string }
    | { kind: "tiers"; interior: ShopInterior; floorId: string; info: SlotInfo };

type Loaded<T> = { status: "loading" } | { status: "ready"; value: T } | { status: "error"; offline: boolean };

const failure = (error: unknown) => ({
    status: "error" as const,
    offline: error instanceof ShopDataError && error.kind === "network",
});

const rowClass =
    "sticker sticker-press rounded-nemo bg-paper flex w-full items-center gap-3 px-3 py-2.5 text-left focus-visible:outline-ink focus-visible:outline-3 focus-visible:outline-offset-2";

/**
 * 물건을 뽑은 곳 고르기 — 굿즈샵 → 기기(내부 지도와 같은 번호) → 단.
 * 기기는 작은 내부 지도에서 눌러도 되고 목록에서 골라도 된다.
 */
export function OriginPicker({ open, onClose, onPick }: OriginPickerProps) {
    const [shops, setShops] = useState<Loaded<Shop[]>>({ status: "loading" });
    const [step, setStep] = useState<Step>({ kind: "shops" });
    const [opening, setOpening] = useState<Loaded<null> | null>(null);

    // 열 때마다 처음 단계부터. 굿즈샵 목록은 정적 파일이라 오프라인에서도 읽힌다
    useEffect(() => {
        if (!open) return;
        setStep({ kind: "shops" });
        setOpening(null);
        let cancelled = false;
        setShops({ status: "loading" });
        loadShops().then(
            (value) => !cancelled && setShops({ status: "ready", value }),
            (error: unknown) => !cancelled && setShops(failure(error)),
        );
        return () => {
            cancelled = true;
        };
    }, [open]);

    const openShop = (shop: Shop) => {
        setOpening({ status: "loading" });
        loadShopInterior(shop.id).then(
            (interior) => {
                if (!interior) {
                    setOpening({ status: "error", offline: false });
                    return;
                }
                setOpening(null);
                setStep({ kind: "machines", interior, floorId: interior.layout.floors[0].id });
            },
            (error: unknown) => setOpening(failure(error)),
        );
    };

    const title =
        step.kind === "shops"
            ? "어느 굿즈샵에서 뽑았나요?"
            : step.kind === "machines"
              ? `${step.interior.shop.name} — 어느 기기인가요?`
              : `${step.info.number}번 기기 — 몇째 단인가요?`;

    return (
        <Modal open={open} onClose={onClose} title={title}>
            {step.kind !== "shops" && (
                <Button
                    variant="ghost"
                    size="sm"
                    shape="pill"
                    className="-ml-2 mb-3"
                    leftIcon={<Icon name="arrow-left" />}
                    onClick={() =>
                        setStep(
                            step.kind === "tiers"
                                ? { kind: "machines", interior: step.interior, floorId: step.floorId }
                                : { kind: "shops" },
                        )
                    }
                >
                    {step.kind === "tiers" ? "기기 다시 고르기" : "굿즈샵 다시 고르기"}
                </Button>
            )}

            {step.kind === "shops" && <ShopStep shops={shops} opening={opening} onOpen={openShop} />}

            {step.kind === "machines" && (
                <MachineStep
                    interior={step.interior}
                    floorId={step.floorId}
                    onFloor={(floorId) => setStep({ ...step, floorId })}
                    onMachine={(info) =>
                        setStep({ kind: "tiers", interior: step.interior, floorId: step.floorId, info })
                    }
                />
            )}

            {step.kind === "tiers" && (
                <ol className="space-y-2">
                    {step.info.tiers.map((each) => (
                        <li key={each.tier}>
                            <button
                                type="button"
                                className={rowClass}
                                onClick={() => {
                                    const { shop, layout } = step.interior;
                                    const floor = layout.floors.find((one) => one.id === step.floorId)!;
                                    onPick(makeOrigin(shop, layout, floor, step.info, each.tier), each.series);
                                    onClose();
                                }}
                            >
                                <span className="w-9 shrink-0 text-[13px] font-bold tabular-nums text-ink-soft">
                                    {each.tier + 1}단
                                </span>
                                <span className="min-w-0 flex-1 break-keep text-sm font-bold">
                                    {each.series?.name ?? (
                                        <span className="font-normal text-ink-soft">비어 있거나 아직 몰라요</span>
                                    )}
                                </span>
                                {each.series && <Price value={each.series.price} size="sm" className="shrink-0" />}
                            </button>
                        </li>
                    ))}
                </ol>
            )}
        </Modal>
    );
}

function ShopStep({
    shops,
    opening,
    onOpen,
}: {
    shops: Loaded<Shop[]>;
    opening: Loaded<null> | null;
    onOpen: (shop: Shop) => void;
}) {
    if (shops.status === "loading" || opening?.status === "loading") {
        return <LoadingState label="굿즈샵을 여는 중…" className="min-h-[10rem]" />;
    }
    if (shops.status === "error" || opening?.status === "error") {
        const offline = (shops.status === "error" && shops.offline) || (opening?.status === "error" && opening.offline);
        return (
            <p role="alert" className="py-6 text-center text-sm text-ink-soft">
                {offline
                    ? "인터넷에 연결한 뒤 다시 시도해 주세요."
                    : "굿즈샵 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."}
            </p>
        );
    }

    // 내부 지도가 있는 굿즈샵만 고를 수 있다 — 기기를 골라야 하므로
    const choosable = shops.value.filter((shop) => shop.layoutVersion !== undefined);
    if (choosable.length === 0) {
        return <p className="py-6 text-center text-sm text-ink-soft">아직 고를 수 있는 굿즈샵이 없어요.</p>;
    }

    return (
        <ul className="space-y-2">
            {choosable.map((shop) => (
                <li key={shop.id}>
                    <button type="button" className={rowClass} onClick={() => onOpen(shop)}>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{shop.name}</span>
                            <span className="mt-0.5 block truncate text-[11px] text-ink-soft">
                                {[shop.address, shop.floorNote].filter(Boolean).join(" · ")}
                            </span>
                        </span>
                        <Icon name="chevron-right" className="shrink-0 text-lg text-ink-soft" />
                    </button>
                </li>
            ))}
        </ul>
    );
}

function MachineStep({
    interior,
    floorId,
    onFloor,
    onMachine,
}: {
    interior: ShopInterior;
    floorId: string;
    onFloor: (floorId: string) => void;
    onMachine: (info: SlotInfo) => void;
}) {
    const { layout, machines, series } = interior;
    const floor = layout.floors.find((each) => each.id === floorId) ?? layout.floors[0];
    const slots = describeFloor(floor, machines, series);
    const scene = floorScene(floor, 0);
    const pick = (slotId: string) => {
        const info = slots.find((each) => each.slot.id === slotId);
        if (info) onMachine(info);
    };

    return (
        <div className="space-y-3">
            {layout.floors.length > 1 && (
                <Tabs
                    aria-label="층"
                    items={layout.floors.map((each) => ({ value: each.id, label: each.label }))}
                    value={floor.id}
                    onChange={onFloor}
                />
            )}
            {/* 고르기용 작은 지도 — 움직이지 않는다. 기기를 누르면 바로 다음 단계로 간다 */}
            <div className="aspect-[4/3] w-full overflow-hidden rounded-nemo border border-line bg-paper">
                <svg
                    role="group"
                    aria-label={`${floor.label} 내부 지도`}
                    viewBox={`${scene.x} ${scene.y} ${scene.width} ${scene.height}`}
                    className="h-full w-full select-none"
                >
                    <IsoFloor floor={floor} turn={0} slots={slots} selectedId={null} onSelect={pick} />
                </svg>
            </div>
            <MachineList slots={slots} selectedId={null} onSelect={pick} />
        </div>
    );
}
