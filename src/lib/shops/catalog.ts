import type { Series } from "./schema";

/*
 * 가챠 카탈로그(작품·시리즈·종류)에서 화면이 쓰는 계산. 데이터 형식은 schema.ts, 입력 안내는 docs/catalog.md.
 */

export interface VariantOdds {
    variantId: string;
    /** 0~1 */
    odds: number;
    /** 회사가 밝힌 값이 아니라 남은 확률을 똑같이 나눠 계산한 값 — 화면에 "추정"으로 적는다 */
    estimated: boolean;
}

/**
 * 종류별 확률. 회사가 밝힌 값은 그대로 쓰고, 밝히지 않은 종류끼리는 남은 확률을 똑같이 나눈다(#165 결정).
 * 아무것도 밝히지 않았으면 모두 1/n 이 된다. "시크릿 1/24" 처럼 일부만 알려진 시리즈도 그대로 적을 수 있다.
 * 종류 목록이 없으면 빈 배열.
 */
export function variantOdds(series: Pick<Series, "lineup">): VariantOdds[] {
    const lineup = series.lineup ?? [];
    const known = lineup.reduce((sum, variant) => sum + (variant.odds ?? 0), 0);
    const unknownCount = lineup.filter((variant) => variant.odds === undefined).length;
    // 형식 검사가 합이 1 을 넘지 않게 막지만, 오차 안에서 살짝 넘어도 음수가 되지 않게 0 에서 자른다
    const share = unknownCount > 0 ? Math.max(0, 1 - known) / unknownCount : 0;

    return lineup.map((variant) =>
        variant.odds === undefined
            ? { variantId: variant.id, odds: share, estimated: true }
            : { variantId: variant.id, odds: variant.odds, estimated: false },
    );
}
