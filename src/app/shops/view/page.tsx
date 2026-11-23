"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button, EmptyState, ErrorState, PageHeader, PageShell, Skeleton } from "@/components/common";
import { Tabs } from "@/components/common/Tabs";
import { FloorMap } from "@/components/shop/FloorMap";
import { describeFloor } from "@/lib/shops/contents";
import { ShopDataError, loadShopInterior, type ShopInterior } from "@/lib/shops/load";

type State =
    | { status: "loading" }
    | { status: "none" }
    | { status: "ready"; interior: ShopInterior }
    | { status: "error"; offline: boolean };

/**
 * 굿즈샵 내부 지도 — `/shops/view?id=…`.
 * 동적 경로 대신 쿼리를 쓰는 이유는 `/product/edit?id=…` 와 같다: 정적 화면 하나라서 서비스 워커가 미리 받아 두고,
 * 처음 여는 굿즈샵도 오프라인에서 열린다(데이터도 public/shops 의 정적 파일이다).
 */
function ShopView() {
    const router = useRouter();
    const params = useSearchParams();
    const id = params.get("id");
    /** 표시해 둘 기기 — 물건의 "뽑은 곳"에서 들어오면 붙는다(`&slot=…`) */
    const slotId = params.get("slot");
    const [state, setState] = useState<State>({ status: "loading" });
    const [floorId, setFloorId] = useState<string | null>(null);

    const load = useCallback(() => {
        if (!id) {
            setState({ status: "none" });
            return () => {};
        }
        // 다른 굿즈샵으로 넘어간 뒤에 늦게 온 응답이 화면을 덮지 않게 한다
        let stale = false;
        setState({ status: "loading" });
        loadShopInterior(id)
            .then((interior) => {
                if (stale) return;
                setState(interior ? { status: "ready", interior } : { status: "none" });
                setFloorId(null);
            })
            .catch((error: unknown) => {
                if (stale) return;
                setState({ status: "error", offline: error instanceof ShopDataError && error.kind === "network" });
            });
        return () => {
            stale = true;
        };
    }, [id]);

    useEffect(() => load(), [load]);

    if (state.status === "loading") {
        return (
            <PageShell aria-busy="true">
                <PageHeader title="내부 지도" onBack={() => router.back()} />
                {/* 지도와 같은 크기로 자리를 잡아 둔다 */}
                <Skeleton className="mt-6 aspect-[4/3] h-auto w-full rounded-nemo" />
            </PageShell>
        );
    }

    if (state.status === "none") {
        return (
            <PageShell>
                <PageHeader title="내부 지도" onBack={() => router.back()} />
                <EmptyState
                    className="mt-6"
                    title="내부 지도가 아직 없어요"
                    description="이 굿즈샵은 아직 내부 지도를 그리지 못했어요. 준비되면 여기에서 볼 수 있어요."
                />
            </PageShell>
        );
    }

    if (state.status === "error") {
        return (
            <PageShell>
                <PageHeader title="내부 지도" onBack={() => router.back()} />
                <ErrorState
                    className="mt-6"
                    title="내부 지도를 불러오지 못했어요"
                    description={
                        state.offline
                            ? "인터넷에 연결한 뒤 다시 시도해 주세요."
                            : "지도 정보에 문제가 있어요. 잠시 후 다시 시도해 주세요."
                    }
                    action={
                        <Button variant="secondary" shape="pill" onClick={load}>
                            다시 시도
                        </Button>
                    }
                />
            </PageShell>
        );
    }

    const { shop, layout, machines, series } = state.interior;
    // 층을 고르기 전에는 표시할 기기가 있는 층을 먼저 보여 준다
    const markedFloor = slotId
        ? layout.floors.find((each) => each.slots.some((slot) => slot.id === slotId))
        : undefined;
    const floor = layout.floors.find((each) => each.id === floorId) ?? markedFloor ?? layout.floors[0];
    const slots = describeFloor(floor, machines, series);
    const marked = floor === markedFloor ? slots.find((info) => info.slot.id === slotId) : undefined;

    return (
        <PageShell>
            <PageHeader
                title={shop.name}
                description={[shop.address, shop.floorNote].filter(Boolean).join(" · ")}
                onBack={() => router.back()}
            />

            {layout.floors.length > 1 && (
                <Tabs
                    className="mt-6"
                    aria-label="층"
                    items={layout.floors.map((each) => ({ value: each.id, label: each.label }))}
                    value={floor.id}
                    onChange={setFloorId}
                />
            )}

            {marked && (
                <p className="mt-4 text-[13px] text-ink">
                    볼터치 색으로 표시한 <strong>{marked.number}번 기기</strong>에서 뽑았어요.
                </p>
            )}
            {/* 기록해 둔 기기가 지금 구조에 없을 때 — 매장을 고쳐 새 구조 버전을 내면 예전 기록의 자리가 사라질 수 있다 */}
            {slotId && !markedFloor && (
                <p className="mt-4 text-[13px] text-ink-soft">
                    물건을 뽑은 기기를 지금 지도에서 찾지 못했어요. 그 뒤로 매장 구조가 바뀌었을 수 있어요.
                </p>
            )}

            <div className="mt-4">
                {/* key — 층을 바꾸면 돌린 방향과 확대를 처음으로 되돌린다 */}
                <FloorMap
                    key={floor.id}
                    floor={floor}
                    cellCm={layout.cellCm}
                    shopName={shop.name}
                    slots={slots}
                    initialSelectedId={marked?.slot.id ?? null}
                />
            </div>
        </PageShell>
    );
}

export default function ShopViewPage() {
    return (
        <Suspense>
            <ShopView />
        </Suspense>
    );
}
