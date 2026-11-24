import type { Product } from "@/lib/db";
import { seriesKey, variantKey } from "@/lib/series";

/*
 * 등록한 순간의 반응(#202) — 방금 넣은 물건이 그 시리즈에서 어떤 자리인지 가른다.
 * 새 종류인지, 이미 가진 종류가 또 나왔는지, 시리즈를 처음 시작했는지.
 * 화면과 떼어 둔 순수 함수라 테스트로 확인한다(pullResult.test.ts).
 */

/**
 * - plain        : 시리즈를 적지 않았다 (알릴 것이 없다)
 * - new-series   : 이 시리즈의 첫 물건
 * - new-variant  : 가진 시리즈에서 처음 나온 종류
 * - duplicate    : 이미 가진 종류가 또 나왔다
 * - unknown      : 가진 시리즈인데 종류를 적지 않았다
 */
export type Placement =
    | { kind: "plain" }
    | {
          kind: "new-series" | "new-variant" | "duplicate" | "unknown";
          seriesKey: string;
          seriesName: string;
          /** 종류를 적지 않았으면 null */
          variantName: string | null;
          /** 이 물건까지 넣었을 때 그 시리즈에서 모은 종류 수 */
          kinds: number;
          /** 이 물건까지 넣었을 때 그 종류를 가진 수. 종류를 모르면 0 */
          owned: number;
      };

type Counted = Pick<Product, "catalog" | "count">;

/**
 * `before`(등록 전의 기록)에 `added` 를 차례로 넣으면서 하나씩 자리를 가른다.
 * 한 번에 같은 종류를 둘 넣으면 첫째는 새 종류, 둘째는 중복이다.
 */
export function placeAll(before: Counted[], added: Counted[]): Placement[] {
    /** 시리즈 → 종류 → 가진 수. 종류를 모르는 물건만 있는 시리즈는 빈 Map 으로 남는다 */
    const owned = new Map<string, Map<string, number>>();
    const put = (item: Counted): { series: string; variant: string | null; first: boolean } | null => {
        if (!item.catalog) return null;
        const series = seriesKey(item.catalog);
        const first = !owned.has(series);
        const variants = owned.get(series) ?? new Map<string, number>();
        owned.set(series, variants);
        const variant = variantKey(item.catalog);
        if (variant) variants.set(variant, (variants.get(variant) ?? 0) + item.count);
        return { series, variant, first };
    };

    for (const item of before) put(item);

    return added.map((item) => {
        const hadVariant = item.catalog
            ? (owned.get(seriesKey(item.catalog))?.has(variantKey(item.catalog) ?? "") ?? false)
            : false;
        const placed = put(item);
        if (!placed || !item.catalog) return { kind: "plain" };

        const variants = owned.get(placed.series)!;
        return {
            kind: placed.first ? "new-series" : !placed.variant ? "unknown" : hadVariant ? "duplicate" : "new-variant",
            seriesKey: placed.series,
            seriesName: item.catalog.seriesName,
            variantName: placed.variant ? item.catalog.variantName : null,
            kinds: variants.size,
            owned: placed.variant ? (variants.get(placed.variant) ?? 0) : 0,
        };
    });
}

export interface PullSummary {
    /** 맨 위에 크게 보여 줄 한 줄 */
    headline: string;
    /** 좋은 일이 있었는가 — 새 종류나 새 시리즈. 움직임과 볼터치를 여기에만 쓴다 */
    happy: boolean;
    /** 시리즈마다 한 줄: 이번에 넣은 뒤 모은 종류 수 */
    series: { key: string; name: string; kinds: number }[];
}

/** 자리 목록을 한 줄 문구와 시리즈별 요약으로 모은다 */
export function summarize(placements: Placement[]): PullSummary {
    let fresh = 0;
    let duplicates = 0;
    let started = 0;
    const series = new Map<string, { key: string; name: string; kinds: number }>();

    for (const placement of placements) {
        if (placement.kind === "plain") continue;
        // 새 시리즈의 첫 물건도 종류를 적었으면 새 종류다
        if (placement.kind === "new-variant" || (placement.kind === "new-series" && placement.variantName)) fresh += 1;
        if (placement.kind === "duplicate") duplicates += 1;
        if (placement.kind === "new-series") started += 1;
        // 뒤에 넣은 것이 더 많은 종류를 센다
        series.set(placement.seriesKey, {
            key: placement.seriesKey,
            name: placement.seriesName,
            kinds: placement.kinds,
        });
    }

    const count = placements.length;
    const headline =
        fresh > 0
            ? `새로운 종류 ${fresh}개를 모았어요!`
            : started > 0
              ? "새 시리즈를 시작했어요!"
              : duplicates > 0
                ? duplicates === count
                    ? "이미 가진 종류가 또 나왔어요"
                    : `${count}개 기록했어요 · 가진 종류 ${duplicates}개`
                : `${count}개 기록했어요`;

    return { headline, happy: fresh > 0 || started > 0, series: [...series.values()] };
}
