import React from "react";

import { StrokePaths } from "@/components/nemo/NemoSvg";
import { cn } from "@/lib/cn";
import { composeMachinePull } from "@/lib/machine/compose";
import type { MachineModelId } from "@/lib/machine/models";

export interface GachaPullProps {
    /** 기계 종류. 주지 않으면 한 단짜리(1단 하프형) — 작은 자리에서도 손잡이가 크게 보인다 */
    model?: MachineModelId;
    /** 기계의 키(px). 캡슐이 굴러가 멈추는 자리만큼 그림이 왼쪽으로 조금 더 넓다 */
    size?: number;
    /** 주면 화면 낭독기가 읽는다. 없으면 장식으로 숨긴다 — 무슨 일이 있었는지는 옆의 문장이 전한다 */
    title?: string;
    className?: string;
}

/**
 * 가챠 기계가 돌아가는 모습(#244) — 손잡이가 네 번 딸깍 돌고, 캡슐이 나오는 곳에서 캡슐이 굴러 나온다.
 * 화면에 올라올 때 한 번 돈다. 다시 돌리려면 `key` 를 바꿔 다시 올린다.
 * 정면 그림에만 있다. 움직임을 줄이도록 설정한 기기에서는 돌지 않고, 캡슐이 나와 있는 모습만 보여 준다(globals.css).
 */
export function GachaPull({ model = "half-1", size = 120, title, className }: GachaPullProps) {
    const { drawing, handleLayer, capsuleLayer, travel, roll, hop, pivot, foot } = composeMachinePull(model, { size });
    const { box, unit, layers } = drawing;
    const scale = size / unit;
    const capsule = layers[capsuleLayer];
    // SVG 안에서 CSS 의 px 는 그림의 칸이다. 도는 중심을 그림에서 잰 자리로 직접 준다 —
    // 요소의 상자를 기준으로 삼는 방법(transform-box)은 브라우저마다 받쳐 주는 정도가 달라서 쓰지 않는다
    const path = {
        "--gacha-dx": `${travel.x}px`,
        "--gacha-dy": `${travel.y}px`,
        "--gacha-roll": `${roll}px`,
        "--gacha-hop": `${hop}px`,
        // 캡슐의 획은 가운데가 (0, 0) 이다
        transformOrigin: "0px 0px",
    } as React.CSSProperties;

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
                <g className="gacha-shake" style={{ transformOrigin: `${foot.x}px ${foot.y}px` }}>
                    {layers.map((layer, index) =>
                        index === capsuleLayer ? null : (
                            <g
                                key={index}
                                className={index === handleLayer ? "gacha-handle" : undefined}
                                style={
                                    index === handleLayer ? { transformOrigin: `${pivot.x}px ${pivot.y}px` } : undefined
                                }
                            >
                                <StrokePaths strokes={layer.strokes} />
                            </g>
                        ),
                    )}
                </g>
                {/* 바깥 g 가 캡슐이 나오는 곳에 놓고, 안쪽 g 가 거기서부터 굴린다 */}
                <g transform={capsule.transform}>
                    <g className="gacha-capsule" style={path}>
                        <StrokePaths strokes={capsule.strokes} />
                    </g>
                </g>
            </g>
        </svg>
    );
}
