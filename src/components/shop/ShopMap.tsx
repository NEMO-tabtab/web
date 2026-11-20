"use client";

import React, { useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/common";
import {
    MapUnavailableError,
    createShopMap,
    isMapConfigured,
    onMapAuthFailure,
    type MapProblem,
    type MapShop,
    type ShopMapHandle,
} from "@/lib/map/naver";

export interface ShopMapProps {
    shops: readonly MapShop[];
    /** 마커를 누르면 굿즈샵 id 로 부른다. 바뀌지 않는 함수를 넘길 것 — 바뀌면 지도를 다시 그린다 */
    onSelect: (shopId: string) => void;
}

const PROBLEM_TEXT: Record<MapProblem, string> = {
    offline: "인터넷에 연결되면 지도가 보여요. 지금은 아래 목록에서 골라 주세요.",
    "no-key": "지금은 지도를 보여 드릴 수 없어요. 아래 목록에서 골라 주세요.",
    auth: "지금은 지도를 보여 드릴 수 없어요. 아래 목록에서 골라 주세요.",
    load: "지도를 불러오지 못했어요. 아래 목록에서 골라 주세요.",
};

/**
 * 굿즈샵 위치 지도. 지도를 쓸 수 없으면(오프라인, 키 없음, 인증 실패) 짧은 안내로 바뀌고,
 * 화면 아래의 목록이 같은 일을 한다. 오프라인이었다가 연결되면 다시 불러온다.
 */
export function ShopMap({ shops, onSelect }: ShopMapProps) {
    const elementRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<"loading" | "ready" | MapProblem>(isMapConfigured() ? "loading" : "no-key");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!isMapConfigured() || !elementRef.current) return;
        let handle: ShopMapHandle | null = null;
        let cancelled = false;
        setState("loading");

        // 키가 틀렸다는 알림은 지도를 만든 뒤에 늦게 올 수 있다
        const stopListening = onMapAuthFailure(() => {
            setState("auth");
            handle?.destroy();
            handle = null;
        });

        createShopMap(elementRef.current, shops, onSelect)
            .then((created) => {
                if (cancelled) created.destroy();
                else {
                    handle = created;
                    setState("ready");
                }
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                if (error instanceof MapUnavailableError) {
                    setState(error.problem);
                    return;
                }
                // 예상하지 못한 실패(지도 라이브러리 안의 오류 등) — 화면은 목록으로 넘기고, 원인은 개발자 도구에 남긴다
                console.error(error);
                setState("load");
            });

        return () => {
            cancelled = true;
            stopListening();
            handle?.destroy();
        };
    }, [shops, onSelect, attempt]);

    // 오프라인이라 못 그렸으면, 연결되는 순간 다시 시도한다
    useEffect(() => {
        if (state !== "offline") return;
        const retry = () => setAttempt((count) => count + 1);
        window.addEventListener("online", retry);
        return () => window.removeEventListener("online", retry);
    }, [state]);

    const problem = state !== "loading" && state !== "ready" ? state : null;

    return (
        <div>
            {problem && (
                <p role="status" className="sticker rounded-nemo bg-cream px-4 py-3 text-[13px] text-ink-soft">
                    {PROBLEM_TEXT[problem]}
                </p>
            )}
            {/* 지도는 이 칸에 그린다. 쓸 수 없을 때도 칸은 남겨 둔다 — 다시 시도할 때 같은 칸을 쓴다 */}
            <div
                className={
                    problem ? "hidden" : "sticker relative aspect-[4/3] w-full overflow-hidden rounded-nemo bg-cream"
                }
            >
                {/* 크기는 h-full·w-full 로 준다. 네이버가 이 칸의 position 을 relative 로 바꿔서 inset 으로는 높이가 0 이 된다 */}
                <div ref={elementRef} role="region" aria-label="굿즈샵 지도" className="h-full w-full" />
                {state === "loading" && (
                    <Skeleton className="absolute inset-0 h-auto rounded-none" aria-label="지도를 불러오는 중" />
                )}
            </div>
        </div>
    );
}
