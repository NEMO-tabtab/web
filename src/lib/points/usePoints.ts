"use client";

import { useMemo } from "react";

import { useProductCovers } from "@/lib/db/hooks";

import { pointFacts, scorePoints } from "./score";
import type { PointSummary } from "./score";

/**
 * 화면이 포인트를 받는 입구(#181). 마이의 포인트·업적(#183)이 이것만 쓴다.
 * 저장소는 기존 읽기 훅으로만 읽는다(K1) — 대표 사진이 있는지만 보면 되어서 앱 색(TintProvider)과 같은 훅을 쓴다.
 * 출석일과 얻은 업적은 출석·업적 저장(#182), 서버 개수는 #185가 더한다. 그전에는 0과 "모름"으로 셈한다.
 * undefined 는 "아직 읽는 중"이다.
 */
export function usePoints(): PointSummary | undefined {
    const covers = useProductCovers();

    return useMemo(() => {
        if (!covers) return undefined;
        const records = covers.map(({ product, cover }) => ({
            deletedAt: product.deletedAt,
            origin: product.origin,
            hasPhoto: cover !== undefined,
        }));
        return scorePoints(pointFacts(records));
    }, [covers]);
}
