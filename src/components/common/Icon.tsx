import React from "react";

import { cn } from "@/lib/cn";

/*
 * 앱 전용 손그림 아이콘. 하단 내비 아이콘과 같은 결로 그린다:
 * 24칸 SVG, 먹선(currentColor) 2px, 둥근 끝, 손그림 필터(#rough-line-sm, 루트 레이아웃에 정의).
 * 색 이모지와 범용 아이콘 폰트(XEIcon) 대신 이것을 쓴다(docs/design-system.md U4).
 *
 * 크기는 글자 크기를 따른다(기본 1em) — `className="text-lg"` 처럼 주면 아이콘 폰트와 같은 감각으로 쓴다.
 */

/** 한 획. w 를 주면 그 획만 굵기가 다르다(가는 보조선 등) */
type Stroke = { d: string; w?: number; fill?: boolean };

const circle = (cx: number, cy: number, r: number) =>
    `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;

const ICONS = {
    // ── 방향 ──
    "arrow-left": [{ d: "M19 12 H5.5 M11 6 L5 12 L11 18" }],
    "arrow-up": [{ d: "M12 19 V5.5 M6 11 L12 5 L18 11" }],
    "chevron-right": [{ d: "M9.5 6 L15.5 12 L9.5 18" }],
    "chevron-down": [{ d: "M6 9.5 L12 15.5 L18 9.5" }],

    // ── 동작 ──
    close: [{ d: "M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5" }],
    "close-circle": [{ d: circle(12, 12, 8.5) }, { d: "M9.5 9.5 L14.5 14.5 M14.5 9.5 L9.5 14.5" }],
    check: [{ d: "M5 12.5 L10 17.5 L19 7" }],
    plus: [{ d: "M12 5 V19 M5 12 H19" }],
    pencil: [{ d: "M5 19 L6 15 L15.5 5.5 L18.5 8.5 L9 18 Z" }, { d: "M13.5 7.5 L16.5 10.5", w: 1.7 }],
    search: [{ d: circle(10.5, 10.5, 6) }, { d: "M15 15 L19.5 19.5" }],
    download: [{ d: "M12 4.5 V14.5 M7.5 10.5 L12 15 L16.5 10.5 M5 19 H19" }],
    upload: [{ d: "M12 15 V5 M7.5 9.5 L12 5 L16.5 9.5 M5 19 H19" }],
    "external-link": [{ d: "M13.5 5 H19 V10.5 M19 5 L11 13 M17 14 V18 Q17 19 16 19 H6 Q5 19 5 18 V8 Q5 7 6 7 H10" }],
    /** 4분의 3 원 — animate-spin 과 함께 쓴다 */
    spinner: [{ d: "M12 4 A8 8 0 1 1 4 12" }],

    // ── 물건·기록 ──
    box: [{ d: "M4 8.5 L12 4.5 L20 8.5 L20 17 L12 21 L4 17 Z" }, { d: "M4 8.5 L12 12.5 L20 8.5 M12 12.5 V21", w: 1.7 }],
    barcode: [
        { d: "M4.5 6 V18 M10.5 6 V18 M16.5 6 V18", w: 2.2 },
        { d: "M7.5 6 V18 M13 6 V18 M19.5 6 V18", w: 1.2 },
    ],
    camera: [
        { d: "M4 8.5 Q4 7 5.5 7 H8 L9.5 5 H14.5 L16 7 H18.5 Q20 7 20 8.5 V17 Q20 18.5 18.5 18.5 H5.5 Q4 18.5 4 17 Z" },
        { d: circle(12, 12.5, 3.2) },
    ],
    image: [
        { d: "M5.5 5 H18.5 Q19.5 5 19.5 6 V18 Q19.5 19 18.5 19 H5.5 Q4.5 19 4.5 18 V6 Q4.5 5 5.5 5 Z" },
        { d: "M4.5 16 L9.5 11 L13 14.5 L15.5 12 L19.5 16" },
        { d: circle(15.5, 8.8, 1.4), w: 1.7 },
    ],
    "map-pin": [
        { d: "M12 20.5 C8 16 6 13 6 9.8 A6 6 0 0 1 18 9.8 C18 13 16 16 12 20.5 Z" },
        { d: circle(12, 9.8, 2.2), w: 1.7 },
    ],
    /** 저장 공간 — 서랍 두 칸 */
    storage: [{ d: "M5 5.5 H19 V11 H5 Z M5 13 H19 V18.5 H5 Z" }, { d: "M8 8.3 H11 M8 15.8 H11", w: 1.7 }],
    "chart-pie": [{ d: circle(12, 12, 8) }, { d: "M12 4 V12 H20", w: 1.7 }],
    "calendar-check": [
        { d: "M6 6.5 H18 Q19 6.5 19 7.5 V18 Q19 19 18 19 H6 Q5 19 5 18 V7.5 Q5 6.5 6 6.5 Z M5 10.5 H19" },
        { d: "M9 4.5 V8.5 M15 4.5 V8.5" },
        { d: "M9.5 14.8 L11.4 16.6 L15 13", w: 1.7 },
    ],
    users: [
        { d: circle(9, 8.5, 3) },
        { d: "M3.5 19 C4 15.5 6.3 14 9 14 C11.7 14 14 15.5 14.5 19" },
        { d: "M15.5 6 A2.6 2.6 0 0 1 15.5 11 M17 14.2 C19 14.8 20.2 16.4 20.5 19", w: 1.7 },
    ],
    warning: [{ d: "M12 4.5 L20.5 19 H3.5 Z" }, { d: "M12 10 V14 M12 16.6 V16.7", w: 2.4 }],

    // ── 카테고리 ──
    /** 전자기기 — 노트북 */
    laptop: [{ d: "M6 6 H18 Q19 6 19 7 V15 H5 V7 Q5 6 6 6 Z" }, { d: "M3 18.5 H21 L19 15 H5 Z" }],
    /** 가구 — 의자 */
    chair: [
        { d: "M7 11 V4.5 Q7 3.5 8 3.5 H16 Q17 3.5 17 4.5 V11" },
        { d: "M5.5 11 H18.5 V13.5 H5.5 Z" },
        { d: "M7 13.5 V20 M17 13.5 V20" },
    ],
    /** 의류 — 반팔 셔츠 */
    shirt: [{ d: "M9 4.5 L4.5 7.5 L6.5 11 L8 10 V19.5 H16 V10 L17.5 11 L19.5 7.5 L15 4.5 Q12 7 9 4.5 Z" }],
    /** 도서 — 펼친 책 */
    book: [
        { d: "M12 6.5 Q8.5 4.5 4.5 5 V18 Q8.5 17.5 12 19.5 Q15.5 17.5 19.5 18 V5 Q15.5 4.5 12 6.5 Z" },
        { d: "M12 6.5 V19.5", w: 1.7 },
    ],
} satisfies Record<string, readonly Stroke[]>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "name"> {
    name: IconName;
    /** 기본은 글자 크기(1em) */
    size?: number | string;
    /** 기본 2 — 하단 내비의 활성 아이콘처럼 굵게 쓰려면 2.6 */
    strokeWidth?: number;
    /** 주면 화면 낭독기가 읽는다. 없으면 장식으로 숨긴다 */
    title?: string;
}

export function Icon({ name, size = "1em", strokeWidth = 2, title, className, ...props }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            role={title ? "img" : undefined}
            aria-hidden={title ? undefined : true}
            aria-label={title}
            // 아이콘 폰트처럼 글자 줄에 맞춰 앉힌다
            className={cn("inline-block shrink-0 align-[-0.125em]", className)}
            {...props}
        >
            <g filter="url(#rough-line-sm)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                {(ICONS[name] as readonly Stroke[]).map((stroke, index) => (
                    <path
                        key={index}
                        d={stroke.d}
                        strokeWidth={stroke.w ? (stroke.w * strokeWidth) / 2 : strokeWidth}
                        fill={stroke.fill ? "currentColor" : "none"}
                    />
                ))}
            </g>
        </svg>
    );
}

/** 물건 카테고리 → 아이콘. 없는 카테고리는 상자 */
const CATEGORY_ICONS: Record<string, IconName> = {
    전자기기: "laptop",
    가구: "chair",
    의류: "shirt",
    도서: "book",
};

export const categoryIcon = (category: string): IconName => CATEGORY_ICONS[category] ?? "box";
