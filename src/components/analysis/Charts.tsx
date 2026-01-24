"use client";

import React from "react";
import { Card } from "@/components/common/Card";
import { Text } from "@/components/common/Typography";

interface DataPoint {
    label: string;
    value: number;
}

interface LineChartProps {
    data: DataPoint[];
    color?: string;
    height?: number;
}

export const LineChart = ({ data, color = "#F59E0B", height = 200 }: LineChartProps) => {
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue || 1; // Avoid division by zero

    // SVG 좌표 계산
    const points = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.value - minValue) / range) * 80 - 10; // 10% padding top/bottom
            return `${x},${y}`;
        })
        .join(" ");

    // 영역 채우기를 위한 path (시작점과 끝점을 바닥으로 연결)
    const fillPoints = `0,100 ${points} 100,100`;

    return (
        <div className="w-full" style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* 그라데이션 정의 */}
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* 배경 그리드 라인 (옵션) */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="2" />

                {/* 영역 채우기 */}
                <polygon points={fillPoints} fill="url(#chartGradient)" />

                {/* 라인 그래프 */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke" // 선 두께 유지
                />

                {/* 데이터 포인트 (마지막 점만 강조) */}
                {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    const y = 100 - ((d.value - minValue) / range) * 80 - 10;

                    // 마지막 점이거나 특정 조건일 때만 점 표시
                    if (i === data.length - 1) {
                        return (
                            <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        );
                    }
                    return null;
                })}
            </svg>

            {/* X축 라벨 */}
            <div className="flex justify-between mt-2 text-xs text-gray-400">
                {data.map((d, i) => (
                    // 공간 부족을 피하기 위해 일부 라벨만 표시 (예: 처음, 중간, 끝)
                    (i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) && (
                        <span key={i}>{d.label}</span>
                    )
                ))}
            </div>
        </div>
    );
};

interface DonutChartProps {
    data: { label: string; value: number; color: string }[];
    size?: number;
}

export const DonutChart = ({ data, size = 160 }: DonutChartProps) => {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    let currentAngle = 0;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                {data.map((item, i) => {
                    const percentage = item.value / total;
                    const dashArray = percentage * 314; // 2 * PI * R (R=50) -> but using r=40 so 2*PI*40 ≈ 251.3
                    // r=40일 때 둘레는 약 251.3
                    const r = 40;
                    const circumference = 2 * Math.PI * r;
                    const strokeDasharray = `${percentage * circumference} ${circumference}`;
                    const strokeDashoffset = -currentAngle * circumference; // 누적 각도만큼 오프셋

                    // 다음 시작 각도 업데이트 (0~1 사이 값으로 누적)
                    currentAngle += percentage;

                    // 누적된 값을 다시 계산해서 stroke-dashoffset을 설정하는 방식은 CSS/SVG에서 조금 복잡할 수 있음.
                    // 간단하게 circle을 겹쳐서 그리는 방식 사용 (dasharray 활용)

                    return (
                        <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r={r}
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="15"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={-(currentAngle - percentage) * circumference} // 이전 각도부터 시작
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Text weight="bold" size="sm" color="text-gray-400">Total</Text>
                <Text weight="bold" size="lg">100%</Text>
            </div>
        </div>
    );
};
