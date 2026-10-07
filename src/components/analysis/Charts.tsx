"use client";

import React from "react";

import { cn } from "@/lib/cn";
import { toPercent } from "@/lib/format";

/* ------------------------------------------------------------------ *
 * 공통 — 손그림 차트의 색과 좌표계
 * ------------------------------------------------------------------ */

/**
 * SVG 의 stroke/fill 속성은 Tailwind 클래스를 받을 수 없어 토큰 값을 그대로 복제한다.
 * globals.css 의 `@theme` 과 값이 어긋나지 않게 함께 고칠 것.
 */
const INK = "#1c1b19"; // --color-ink
const INK_SOFT = "#8b8680"; // --color-ink-soft
const LINE = "#e9e7e2"; // --color-line

/**
 * 도넛 조각 명도 단계. 색이 아니라 밝기로만 구분하므로 **순서가 곧 의미**다 —
 * 슬롯을 돌려쓰지 않고 앞에서부터 차례로 채운다. 항목이 5개를 넘으면 호출부에서
 * 뒤쪽을 "기타"로 묶어 넘길 것(단계를 늘리면 인접한 두 조각을 구분할 수 없다).
 *
 * 가장 옅은 단계(#e9e7e2)는 흰 바탕과 대비가 1.2:1 뿐이라 **채움만으로는 보이지 않는다.**
 * 그래서 조각마다 2px 먹선 윤곽 + 조각 사이 바탕 간격을 함께 준다 — 강조 위계 2단계와 같은 원리로,
 * 이 시스템에서 경계를 만드는 것은 색이 아니라 선이다.
 */
export const donutRamp = [INK, INK_SOFT, "#c9c5be", LINE] as const;

/** y축 눈금 폭. 라벨("8,000만")이 잘리지 않을 만큼만 비운다. */
const AXIS_GUTTER = 54;
/** 끝점 마커가 카드 테두리에 물리지 않도록 오른쪽을 조금 들여 둔다. */
const END_INSET = 6;

/** 축 눈금용 축약 표기 — "102,040,000" 처럼 길어지지 않게 억/만 단위로 자른다. */
export function compactWon(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
    if (abs >= 10_000) return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만`;
    return value.toLocaleString("ko-KR");
}

/**
 * y축 눈금을 1·2·2.5·5 배수로 떨어뜨리고, 축 범위도 그 눈금에 맞춰 넓힌다.
 *
 * 최솟값~최댓값을 플롯 높이에 그대로 늘려 담으면 눈금이 "9,352만" 처럼 읽을 수 없는 수가 되고,
 * 무엇보다 **변화폭이 실제보다 과장된다**. 눈금에 맞춰 범위를 넓히면 둘 다 해결된다.
 */
export function niceScale(min: number, max: number, tickCount = 4) {
    const span = max - min || Math.abs(max) || 1;
    const rough = span / Math.max(1, tickCount - 1);
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude;

    const lo = Math.floor(min / step) * step;
    // 모든 값이 같으면 lo === hi 가 되어 0으로 나누게 된다 — 한 칸 띄운다.
    const hi = Math.ceil(max / step) * step === lo ? lo + step : Math.ceil(max / step) * step;

    const ticks: number[] = [];
    // 누적 오차(0.30000000000000004)만 걷어낸다. 반올림해 버리면 0.5 같은 실제 소수 눈금이
    // 라벨은 "1", 선은 0.5 자리에 그려져 축이 거짓말을 하게 된다.
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));

    return { min: lo, max: hi, ticks };
}

/** SSR 에서 useLayoutEffect 경고가 나지 않게 갈아끼운다. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * 컨테이너의 실제 폭(px)을 잰다.
 *
 * 차트를 픽셀 좌표로 그리기 위해 필요하다. `viewBox="0 0 100 100"` 을
 * `preserveAspectRatio="none"` 으로 늘려 쓰면 편하지만, 그러면 `#rough-line-sm` 의
 * 노이즈까지 가로로 늘어나 선이 뭉개진다. 1 유저단위 = 1px 을 지켜야 손그림 결이
 * 하단 내비 아이콘과 같은 굵기로 찍힌다.
 */
function useMeasuredWidth(fallback: number) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = React.useState(fallback);

    useIsomorphicLayoutEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === "undefined") return;

        const observer = new ResizeObserver((entries) => {
            const next = entries[0]?.contentRect.width ?? 0;
            if (next > 0) setWidth(next);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return [ref, width] as const;
}

/* ------------------------------------------------------------------ *
 * LineChart — 시간에 따른 변화
 * ------------------------------------------------------------------ */

interface DataPoint {
    label: string;
    value: number;
}

export interface LineChartProps {
    data: DataPoint[];
    /** 선 색. 기본은 먹선. */
    color?: string;
    /** 플롯 높이(px). 아래 x축 라벨 줄은 여기에 포함되지 않는다. */
    height?: number;
    /** y축 눈금 표기. 기본은 억/만 축약. */
    formatValue?: (value: number) => string;
    /** 스크린리더용 설명. 기본은 기간과 최저·최고값. */
    ariaLabel?: string;
    className?: string;
}

/**
 * 한 줄짜리 추이 그래프. 계열이 하나뿐이라 범례를 두지 않고,
 * 끝점 마커 하나만 직접 라벨 자리로 쓴다(모든 점에 숫자를 붙이지 않는다).
 */
export const LineChart = ({
    data,
    color = INK,
    height = 200,
    formatValue = compactWon,
    ariaLabel,
    className,
}: LineChartProps) => {
    const [ref, width] = useMeasuredWidth(560);

    if (!data.length) {
        return <p className="text-ink-soft py-16 text-center text-sm">그릴 자료가 없어요.</p>;
    }

    const lastIndex = data.length - 1;
    const lastPoint = data[lastIndex];

    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    // 눈금에 값이 붙지 않는 그리드는 장식일 뿐이다 — 축 범위 자체를 읽을 수 있는 수로 맞춘다.
    const scale = niceScale(minValue, maxValue);

    // 위아래 여백은 눈금 라벨과 끝점 마커가 플롯 밖으로 새지 않을 만큼만.
    const top = 12;
    const bottom = height - 10;
    const left = AXIS_GUTTER;
    const right = Math.max(left + 1, width - END_INSET);

    const xAt = (i: number) => (data.length < 2 ? right : left + (i / (data.length - 1)) * (right - left));
    const yAt = (value: number) => bottom - ((value - scale.min) / (scale.max - scale.min)) * (bottom - top);

    // 라벨이 촘촘하면 겹친다 — 점이 많아지면 처음·중간·끝만 남긴다.
    const labelIndices =
        data.length <= 6 ? data.map((_, i) => i) : [...new Set([0, Math.floor(lastIndex / 2), lastIndex])];

    const points = data.map((d, i) => `${xAt(i).toFixed(2)},${yAt(d.value).toFixed(2)}`).join(" ");
    // 바탕까지 내려 채우는 옅은 먹 워시. 그라데이션은 이 시스템에 없다 — 균일한 농도로 깐다.
    const wash = `${left},${height + 2} ${points} ${right.toFixed(2)},${height + 2}`;

    return (
        <div className={cn("w-full", className)}>
            <div ref={ref} className="relative w-full" style={{ height }}>
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    role="img"
                    aria-label={
                        ariaLabel ??
                        `${data[0].label}부터 ${lastPoint.label}까지의 추이. 최저 ${formatValue(minValue)}, 최고 ${formatValue(maxValue)}.`
                    }
                    className="block h-full w-full overflow-visible"
                >
                    {/* 손그림 결은 마크에만 건다 — 눈금 글자는 필터 밖에 두어야 읽힌다 */}
                    <g filter="url(#rough-line-sm)">
                        {scale.ticks.map((value, i) => (
                            <line
                                key={i}
                                x1={left}
                                y1={yAt(value)}
                                x2={right}
                                y2={yAt(value)}
                                stroke={LINE}
                                strokeWidth={1}
                            />
                        ))}

                        <polygon points={wash} fill={color} fillOpacity={0.08} />

                        <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </g>

                    {scale.ticks.map((value, i) => (
                        <text
                            key={i}
                            x={left - 10}
                            y={yAt(value)}
                            textAnchor="end"
                            dominantBaseline="middle"
                            fill={INK_SOFT}
                            className="text-[11px] tabular-nums"
                        >
                            {formatValue(value)}
                        </text>
                    ))}
                </svg>

                {/* 끝점 마커 — SVG 안의 <circle> 은 필터·스케일에 함께 휘므로 밖에서 CSS 로 찍는다.
                    바탕색 링이 선과 마커를 떼어 놓는다(테두리를 두르지 않는다). */}
                <span
                    aria-hidden="true"
                    className="ring-paper absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
                    style={{
                        left: `${(xAt(lastIndex) / width) * 100}%`,
                        top: `${(yAt(lastPoint.value) / height) * 100}%`,
                        backgroundColor: color,
                    }}
                />
            </div>

            {/* x축 라벨 — 각 라벨을 자기 데이터 점의 x좌표에 못 박는다.
                justify-between 으로 흩뿌리면 표시하는 점이 띄엄띄엄일 때 라벨이 엉뚱한 자리를 가리킨다. */}
            <div className="relative mt-2 h-4">
                {labelIndices.map((i) => (
                    <span
                        key={i}
                        className="text-ink-soft absolute top-0 -translate-x-1/2 text-xs whitespace-nowrap tabular-nums"
                        style={{ left: `${(xAt(i) / width) * 100}%` }}
                    >
                        {data[i].label}
                    </span>
                ))}
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ *
 * DonutChart — 전체 대비 비중
 * ------------------------------------------------------------------ */

interface DonutSlice {
    label: string;
    value: number;
    /** 생략하면 `donutRamp` 의 같은 순서 단계를 쓴다. */
    color?: string;
}

export interface DonutChartProps {
    data: DonutSlice[];
    /** 지름(px). */
    size?: number;
    /** 가운데 라벨. 기본은 비중이 가장 큰 항목의 이름. */
    centerLabel?: React.ReactNode;
    /** 가운데 값. 기본은 비중이 가장 큰 항목의 퍼센트. */
    centerValue?: React.ReactNode;
    className?: string;
}

/**
 * 한눈에 보는 비중. 조각이 6개를 넘거나 값이 서로 비슷하면 도넛 대신 목록으로 보여줄 것 —
 * 명도만으로는 인접한 두 조각의 크기를 비교할 수 없다.
 *
 * 호출부는 반드시 옆에 값이 적힌 목록(범례)을 함께 둔다. 옅은 조각은 채움만으로
 * 읽히지 않으므로 목록이 실질적인 표(table view) 역할을 한다.
 */
export const DonutChart = ({ data, size = 160, centerLabel, centerValue, className }: DonutChartProps) => {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);

    if (!data.length || total <= 0) {
        return <p className="text-ink-soft py-16 text-center text-sm">그릴 자료가 없어요.</p>;
    }

    const cx = size / 2;
    const cy = size / 2;
    const rOuter = size * 0.44; // 2px 먹선이 잘리지 않게 여유를 둔다
    const rInner = size * 0.29;

    // 12시 방향에서 시계 방향으로 감는다.
    let cursor = -Math.PI / 2;
    const slices = data.map((item, i) => {
        const start = cursor;
        const extent = (item.value / total) * Math.PI * 2;
        cursor += extent;

        return {
            ...item,
            start,
            end: start + extent,
            // 단계가 모자라면 마지막 단계를 반복한다 — 새 명도를 지어내지 않는다.
            fill: item.color ?? donutRamp[Math.min(i, donutRamp.length - 1)],
        };
    });

    /** 조각 하나의 경로. 양끝을 조금씩 깎아 조각 사이에 바탕색 간격을 남긴다. */
    const slicePath = (start: number, end: number) => {
        const gap = Math.min(2 / rOuter, (end - start) / 3); // 바깥 둘레 기준 약 2px
        const a0 = start + gap / 2;
        const a1 = end - gap / 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const at = (r: number, a: number) =>
            `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;

        return [
            `M ${at(rOuter, a0)}`,
            `A ${rOuter} ${rOuter} 0 ${large} 1 ${at(rOuter, a1)}`,
            `L ${at(rInner, a1)}`,
            `A ${rInner} ${rInner} 0 ${large} 0 ${at(rInner, a0)}`,
            "Z",
        ].join(" ");
    };

    const biggest = slices.reduce((a, b) => (b.value > a.value ? b : a));

    return (
        <div
            className={cn("relative flex shrink-0 items-center justify-center", className)}
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                role="img"
                aria-label={slices.map((s) => `${s.label} ${toPercent(s.value, total)}퍼센트`).join(", ")}
                className="block h-full w-full overflow-visible"
            >
                <g filter="url(#rough-line-sm)">
                    {slices.map((slice) => (
                        <path
                            key={slice.label}
                            d={slicePath(slice.start, slice.end)}
                            fill={slice.fill}
                            stroke={INK}
                            strokeWidth={2}
                            strokeLinejoin="round"
                        />
                    ))}
                </g>
            </svg>

            {/* 가운데는 직접 라벨 자리 — 가장 큰 조각 하나만 글자로 못 박는다 */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-ink-soft max-w-[56%] truncate text-xs">{centerLabel ?? biggest.label}</span>
                <span className="text-ink font-sans text-lg font-bold tabular-nums">
                    {centerValue ?? `${toPercent(biggest.value, total)}%`}
                </span>
            </div>
        </div>
    );
};
