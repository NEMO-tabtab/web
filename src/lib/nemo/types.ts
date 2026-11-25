/*
 * 캐릭터 그림의 자료형.
 * 그림은 `Icon`(src/components/common/Icon.tsx)처럼 "획의 목록"으로 두고, 컴포넌트는 그리기만 한다.
 */

/** 칠하는 색의 이름. 실제 값은 geometry.ts 의 COLORS 한 곳에 있다 */
export type Paint = "ink" | "paper" | "cheek" | "cream";

/** 한 획 — 패스 하나와 그 선·채움. 선은 늘 먹색이다 */
export interface Stroke {
    d: string;
    /** 먹선 굵기(칸). 없으면 선을 긋지 않는다 */
    w?: number;
    /** 채움 색. 없으면 채우지 않는다 */
    fill?: Paint;
    /** 채움의 불투명도. 볼터치만 쓴다 */
    opacity?: number;
}

/** 함께 움직이는 획의 묶음. transform 은 SVG 문법 그대로 */
export interface Layer {
    transform?: string;
    strokes: readonly Stroke[];
}

/** 손떨림 필터 — src/app/layout.tsx 에 정의돼 있다 */
export type FilterId = "rough-line" | "rough-line-sm";

/** 다 조합한 그림 한 장 */
export interface Drawing {
    viewBox: string;
    filter: FilterId;
    /** 아래에서 위로 쌓는 순서 */
    layers: Layer[];
}
