"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, EmptyState, ErrorState, PageHeader, PageShell, Skeleton } from "@/components/common";
import { ShopMap } from "@/components/shop/ShopMap";
import { ShopDataError, loadShops } from "@/lib/shops/load";
import type { Shop } from "@/lib/shops/schema";

type State = { status: "loading" } | { status: "ready"; shops: Shop[] } | { status: "error"; offline: boolean };

const viewHref = (shopId: string) => `/shops/view?id=${encodeURIComponent(shopId)}`;

/**
 * 굿즈샵 지도 — 가챠 기기가 있는 굿즈샵을 지도와 목록으로 보여 주고, 고르면 내부 지도로 들어간다.
 * 목록은 늘 함께 보여 준다. 지도를 쓸 수 없을 때(오프라인 등)도, 지도를 만지기 어려운 사람도 같은 곳에 닿는다.
 */
export default function ShopsPage() {
    const router = useRouter();
    const [state, setState] = useState<State>({ status: "loading" });

    const load = useCallback(() => {
        setState({ status: "loading" });
        loadShops()
            .then((shops) => setState({ status: "ready", shops }))
            .catch((error: unknown) =>
                setState({ status: "error", offline: error instanceof ShopDataError && error.kind === "network" }),
            );
    }, []);

    useEffect(load, [load]);

    // 지도가 다시 그려지지 않도록 바뀌지 않는 함수를 넘긴다
    const openShop = useCallback((shopId: string) => router.push(viewHref(shopId)), [router]);

    return (
        <PageShell>
            <PageHeader title="굿즈샵" description="가챠 기기가 있는 굿즈샵을 지도에서 찾아요." />

            <div className="mt-6">
                {state.status === "loading" && (
                    <div aria-busy="true">
                        <Skeleton className="aspect-[4/3] h-auto w-full rounded-nemo" />
                        <Skeleton className="mt-6 h-16 w-full rounded-nemo" />
                    </div>
                )}

                {state.status === "error" && (
                    <ErrorState
                        title="굿즈샵 목록을 불러오지 못했어요"
                        description={
                            state.offline
                                ? "인터넷에 연결한 뒤 다시 시도해 주세요."
                                : "굿즈샵 정보에 문제가 있어요. 잠시 후 다시 시도해 주세요."
                        }
                        action={
                            <Button variant="secondary" shape="pill" onClick={load}>
                                다시 시도
                            </Button>
                        }
                    />
                )}

                {state.status === "ready" && state.shops.length === 0 && (
                    <EmptyState
                        title="아직 등록된 굿즈샵이 없어요"
                        description="굿즈샵이 추가되면 여기 지도에서 볼 수 있어요."
                    />
                )}

                {state.status === "ready" && state.shops.length > 0 && (
                    <>
                        <ShopMap shops={state.shops} onSelect={openShop} />

                        <section className="mt-6" aria-labelledby="shop-list-title">
                            <h2 id="shop-list-title" className="font-display text-lg">
                                굿즈샵 {state.shops.length}곳
                            </h2>
                            <ul className="mt-3 space-y-2">
                                {state.shops.map((shop) => (
                                    <li key={shop.id}>
                                        <ShopRow shop={shop} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </>
                )}
            </div>
        </PageShell>
    );
}

function ShopRow({ shop }: { shop: Shop }) {
    const where = [shop.address, shop.floorNote].filter(Boolean).join(" · ");
    const text = (
        <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{shop.name}</span>
            <span className="mt-0.5 block truncate text-[11px] text-ink-soft">{where}</span>
        </span>
    );

    // 내부 지도가 아직 없는 굿즈샵은 들어갈 곳이 없으므로 링크로 만들지 않는다
    if (shop.layoutVersion === undefined) {
        return (
            <div className="flex items-center gap-3 rounded-nemo border border-line bg-cream px-4 py-3">
                {text}
                <span className="shrink-0 text-[11px] text-ink-soft">내부 지도 준비 중</span>
            </div>
        );
    }

    return (
        <Link
            href={viewHref(shop.id)}
            className="sticker sticker-press flex items-center gap-3 rounded-nemo bg-paper px-4 py-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
            {text}
            <span className="shrink-0 text-[13px] font-bold">내부 지도</span>
            <i className="xi-angle-right-min shrink-0 text-lg text-ink-soft" aria-hidden="true" />
        </Link>
    );
}
