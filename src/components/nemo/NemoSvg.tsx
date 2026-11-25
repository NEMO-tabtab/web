import React from "react";

import { cn } from "@/lib/cn";
import { COLORS } from "@/lib/nemo/geometry";
import type { Drawing } from "@/lib/nemo/types";

export interface NemoSvgProps {
    drawing: Drawing;
    /** px 단위 정사각 */
    size: number;
    /** 주면 화면 낭독기가 읽는다. 없으면 장식으로 숨긴다 */
    title?: string;
    className?: string;
}

/**
 * 조합한 그림(src/lib/nemo/compose.ts)을 SVG 로 옮긴다. 캐릭터 그림은 모두 이 한 곳을 거친다.
 * 패스는 곧고, 손떨림은 루트 레이아웃의 필터(#rough-line)가 낸다.
 */
export function NemoSvg({ drawing, size, title, className }: NemoSvgProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox={drawing.viewBox}
            role={title ? "img" : undefined}
            aria-hidden={title ? undefined : true}
            aria-label={title}
            // 필터의 변위가 획을 캔버스 밖으로 밀어낸다 — 없으면 테두리가 잘린다
            className={cn("overflow-visible", className)}
        >
            <g filter={`url(#${drawing.filter})`} strokeLinecap="round" strokeLinejoin="round">
                {drawing.layers.map((layer, layerIndex) => (
                    <g key={layerIndex} transform={layer.transform}>
                        {layer.strokes.map((stroke, index) => (
                            <path
                                key={index}
                                d={stroke.d}
                                fill={stroke.fill ? COLORS[stroke.fill] : "none"}
                                fillOpacity={stroke.opacity}
                                stroke={stroke.w ? COLORS.ink : "none"}
                                strokeWidth={stroke.w}
                            />
                        ))}
                    </g>
                ))}
            </g>
        </svg>
    );
}
