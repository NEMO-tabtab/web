/** 원 단위 금액 포맷. 숫자는 항상 sans + tabular-nums 로 렌더링한다(Price 참고). */
export function formatWon(value: number | string | null | undefined): string {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (numeric === null || numeric === undefined || Number.isNaN(numeric)) return "0";
    return numeric.toLocaleString("ko-KR");
}

/** 0으로 나누기를 피하는 퍼센트 계산. */
export function toPercent(value: number, total: number, digits = 1): string {
    if (!total) return "0";
    return ((value / total) * 100).toFixed(digits);
}
