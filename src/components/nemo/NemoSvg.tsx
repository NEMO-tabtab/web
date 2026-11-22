import React from "react";

import { cn } from "@/lib/cn";
import { COLORS } from "@/lib/nemo/geometry";
import type { Drawing, Paint, Stroke } from "@/lib/nemo/types";

/**
 * 화면에서는 볼터치를 앱 색(src/lib/tint)의 변수로 칠한다 — 도라에몽을 모으면 볼이 파랗게 물든다.
 * fill 속성에는 CSS 변수를 쓸 수 없어 style 로 덮는다. 꺼져 있으면 변수 기본값이 COLORS 와 같은 #f0c1b2 다.
 * 내려받는 그림(exportSvg)은 COLORS 의 원래 색 그대로 둔다.
 */
const LIVE_FILL: Partial<Record<Paint, React.CSSProperties>> = {
    cheek: { fill: "rgb(var(--color-cheek))" },
    cheek2: { fill: "rgb(var(--color-cheek-2))" },
};

export interface NemoSvgProps {
    drawing: Drawing;
    /** px 단위 정사각 */
    size: number;
    /** 주면 화면 낭독기가 읽는다. 없으면 장식으로 숨긴다 */
    title?: string;
    className?: string;
}

/** 획의 목록을 SVG 패스로 옮긴다. 그림의 층을 따로 감싸 움직여야 하는 곳(GachaPull)도 이것을 쓴다 */
export function StrokePaths({ strokes }: { strokes: readonly Stroke[] }) {
    return (
        <>
            {strokes.map((stroke, index) => (
                <path
                    key={index}
                    d={stroke.d}
                    fill={stroke.fill ? COLORS[stroke.fill] : "none"}
                    style={stroke.fill ? LIVE_FILL[stroke.fill] : undefined}
                    fillOpacity={stroke.opacity}
                    stroke={stroke.w ? COLORS.ink : "none"}
                    strokeWidth={stroke.w}
                />
            ))}
        </>
    );
}

/**
 * 조합한 그림(src/lib/nemo/compose.ts)을 SVG 로 옮긴다. 캐릭터 그림은 모두 이 한 곳을 거친다.
 * 패스는 곧고, 손떨림은 루트 레이아웃의 필터(#rough-line)가 낸다.
 */
export function NemoSvg({ drawing, size, title, className }: NemoSvgProps) {
    const { box, unit } = drawing;
    // size 는 캐릭터의 크기다. 소품 때문에 그림 칸이 넓어지면 그만큼 자리를 더 차지한다
    const scale = size / unit;
    return (
        <svg
            width={box.width * scale}
            height={box.height * scale}
            viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
            role={title ? "img" : undefined}
            aria-hidden={title ? undefined : true}
            aria-label={title}
            // 필터의 변위가 획을 캔버스 밖으로 밀어낸다 — 없으면 테두리가 잘린다
            className={cn("overflow-visible", className)}
        >
            <g filter={`url(#${drawing.filter})`} strokeLinecap="round" strokeLinejoin="round">
                {drawing.layers.map((layer, layerIndex) => (
                    <g key={layerIndex} transform={layer.transform}>
                        <StrokePaths strokes={layer.strokes} />
                    </g>
                ))}
            </g>
        </svg>
    );
}
