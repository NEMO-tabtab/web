import type { Oklch } from "./color";
import { TINT_VAR_NAMES, isFamilyId, isTintMode, type FamilyId, type TintMode, type TintVars } from "./palette";

/*
 * 앱 색의 설정과 계산 결과는 localStorage 에 둔다. 물건 기록이 아니라 이 기기의 꾸밈이라
 * IndexedDB 저장 구조(src/lib/db)와 백업 형식에 넣지 않는다. 지워져도 사진에서 다시 계산한다.
 * localStorage 는 사생활 보호 모드 등에서 막힐 수 있어 모든 읽기·쓰기를 try 로 감싼다.
 */

const SETTINGS_KEY = "nemo:tint-settings";
/** 색 뽑는 방법을 바꾸면 뒤의 번호를 올린다 — 예전 방법으로 뽑은 색을 버리고 다시 계산한다 */
const COLORS_KEY = "nemo:tint-colors:v1";
/** 마지막으로 칠한 변수 — 앱을 켤 때 첫 화면부터 같은 색으로 그리려고 남긴다(TINT_BOOT_SCRIPT) */
const APPLIED_KEY = "nemo:tint-applied";

export interface TintSettings {
    mode: TintMode;
    /** mode 가 pick 일 때 고른 색 */
    pick: FamilyId | null;
}

/** 처음부터 켜 둔다. 기본 방식을 바꾸려면 여기만 고친다(docs/design-system.md "정하지 못한 것") */
export const DEFAULT_SETTINGS: TintSettings = { mode: "top", pick: null };

export function loadSettings(): TintSettings {
    try {
        const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null");
        return {
            mode: isTintMode(raw?.mode) ? raw.mode : DEFAULT_SETTINGS.mode,
            pick: isFamilyId(raw?.pick) ? raw.pick : null,
        };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: TintSettings): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // 저장하지 못해도 이번 실행 동안은 고른 대로 보인다
    }
}

/** 사진 id → 뽑은 색. null 은 "살펴봤는데 색이 없었다" */
export type ColorCache = Record<string, Oklch | null>;

/** 저장 꼴: 소수 셋째 자리까지 [l, c, h], 색 없음은 0 */
type StoredColor = [number, number, number] | 0;

export function loadColorCache(): ColorCache {
    try {
        const raw = JSON.parse(localStorage.getItem(COLORS_KEY) ?? "{}") as Record<string, StoredColor>;
        const cache: ColorCache = {};
        for (const [id, value] of Object.entries(raw)) {
            if (value === 0) cache[id] = null;
            else if (Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)) {
                cache[id] = { l: value[0], c: value[1], h: value[2] };
            }
        }
        return cache;
    } catch {
        return {};
    }
}

/** 지금 있는 사진의 것만 남겨 저장한다 — 지운 사진의 색이 쌓이지 않게 */
export function saveColorCache(cache: ColorCache, liveIds: ReadonlySet<string>): void {
    const round = (v: number) => Math.round(v * 1000) / 1000;
    const stored: Record<string, StoredColor> = {};
    for (const [id, color] of Object.entries(cache)) {
        if (!liveIds.has(id)) continue;
        stored[id] = color ? [round(color.l), round(color.c), round(color.h)] : 0;
    }
    try {
        localStorage.setItem(COLORS_KEY, JSON.stringify(stored));
    } catch {
        // 저장하지 못하면 다음에 켤 때 다시 계산할 뿐이다
    }
}

/** 기본 상태 표시줄 색 — src/app/layout.tsx 의 viewport.themeColor 와 같다 */
const DEFAULT_THEME_COLOR = "#ffffff";

/** 계산한 색을 화면에 칠하고, 다음에 켤 때를 위해 남긴다. null 이면 지금의 흑백으로 되돌린다 */
export function applyTint(tint: TintVars | null): void {
    const root = document.documentElement;
    for (const name of TINT_VAR_NAMES) {
        const value = tint?.vars[name];
        if (value) root.style.setProperty(name, value);
        else root.style.removeProperty(name);
    }
    // 색이 칠해졌을 때만 보이는 장치(하단 메뉴의 현재 탭 표시)가 이 표시를 본다
    root.toggleAttribute("data-tint", tint !== null);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tint?.themeColor ?? DEFAULT_THEME_COLOR);

    try {
        if (tint) localStorage.setItem(APPLIED_KEY, JSON.stringify(tint));
        else localStorage.removeItem(APPLIED_KEY);
    } catch {
        // 남기지 못하면 다음에 켤 때 잠깐 흑백으로 보였다가 칠해진다
    }
}

/**
 * <head> 에 그대로 넣는 스크립트. React 가 뜨기 전에 지난번 색을 칠해 둔다 —
 * 그러지 않으면 켤 때마다 흑백 화면이 잠깐 보였다가 색이 든다.
 * applyTint 와 같은 일을 하므로 저장 꼴을 바꾸면 함께 고친다.
 */
export const TINT_BOOT_SCRIPT = `(function(){try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(APPLIED_KEY)})||"null");if(!t||!t.vars)return;var r=document.documentElement;for(var k in t.vars)r.style.setProperty(k,t.vars[k]);r.setAttribute("data-tint","")}catch(e){}})()`;
