import { clamp, oklabToOklch, oklchToOklab, oklchToRgb, rgbChannels, rgbHex, type Oklch, type Rgb } from "./color";

/**
 * 색 갈래. 물건마다 뽑은 색을 이 갈래로 묶어 "무슨 색을 얼마나 모았는지" 센다.
 * 경계는 OKLCH 색상각이다 — sRGB 빨강 29°, 주황 55~70°, 노랑 110°, 초록 142°, 하늘 195~240°, 파랑 264°, 자홍 328°.
 * 예: 도라에몽의 파랑 ≈ 240°, 노진구 셔츠의 노랑 ≈ 100°, 짱구 셔츠의 빨강 ≈ 27°.
 */
export const FAMILIES = {
    red: "빨강",
    orange: "주황",
    yellow: "노랑",
    green: "초록",
    teal: "청록",
    blue: "파랑",
    purple: "보라",
    pink: "분홍",
    brown: "갈색",
} as const;

export type FamilyId = keyof typeof FAMILIES;

export const isFamilyId = (value: unknown): value is FamilyId => typeof value === "string" && value in FAMILIES;

export function familyOf({ l, c, h }: Oklch): FamilyId {
    // 어둡고 탁한 주황~노랑은 갈색(곰 인형, 나무 굿즈)
    if (h >= 20 && h < 95 && l < 0.62 && c < 0.14) return "brown";
    if (h >= 10 && h < 45) return "red";
    if (h >= 45 && h < 80) return "orange";
    if (h >= 80 && h < 118) return "yellow";
    if (h >= 118 && h < 170) return "green";
    if (h >= 170 && h < 220) return "teal";
    if (h >= 220 && h < 278) return "blue";
    if (h >= 278 && h < 318) return "purple";
    return "pink";
}

/** 모은 색 하나 — 같은 갈래로 묶인 물건들 */
export interface Swatch {
    family: FamilyId;
    label: string;
    /** 묶인 물건 색의 평균. 갈래의 대표색이 아니라 실제로 모은 물건의 색이다 */
    color: Oklch;
    /** 화면에 칠할 실제 색 */
    rgb: Rgb;
    /** 묶인 물건 수(수량 포함) */
    count: number;
    /** 전체 중 비율 0~1 */
    share: number;
}

export interface ColoredItem {
    color: Oklch;
    /** 같은 물건을 몇 개 가졌는지. 많이 가진 캐릭터가 더 크게 친다 */
    count: number;
}

/** 물건 색들을 갈래로 묶어 많은 순으로 */
export function buildPalette(items: readonly ColoredItem[]): Swatch[] {
    const groups = new Map<FamilyId, { count: number; l: number; a: number; b: number }>();
    let total = 0;
    for (const { color, count } of items) {
        const weight = Math.max(1, Math.floor(count) || 1);
        const lab = oklchToOklab(color);
        const family = familyOf(color);
        const group = groups.get(family) ?? { count: 0, l: 0, a: 0, b: 0 };
        group.count += weight;
        group.l += lab.l * weight;
        group.a += lab.a * weight;
        group.b += lab.b * weight;
        groups.set(family, group);
        total += weight;
    }

    return [...groups.entries()]
        .map(([family, group]) => {
            const color = oklabToOklch({ l: group.l / group.count, a: group.a / group.count, b: group.b / group.count });
            return {
                family,
                label: FAMILIES[family],
                color,
                rgb: oklchToRgb(color),
                count: group.count,
                share: group.count / total,
            };
        })
        .sort((x, y) => y.count - x.count || x.family.localeCompare(y.family));
}

/**
 * 좋아하는 캐릭터가 여럿일 때 앱에 칠하는 방식.
 * - top: 가장 많이 모은 색 하나
 * - blend: 모은 색을 비율대로 함께 (양 볼을 서로 다른 색, 제목 밑줄을 색 띠로, 바탕 귀퉁이에 번지듯)
 * - daily: 모은 색 중 하나로 날마다 돌아가며
 * - pick: 사용자가 고른 색 하나로 고정
 * - off: 지금의 흑백
 */
export const TINT_MODES = ["top", "blend", "daily", "pick", "off"] as const;
export type TintMode = (typeof TINT_MODES)[number];

export const isTintMode = (value: unknown): value is TintMode =>
    typeof value === "string" && (TINT_MODES as readonly string[]).includes(value);

/** 물감 번짐에 함께 쓸 최대 색 수 — 더 많으면 띠가 잘게 쪼개져 무슨 색인지 안 보인다 */
const BLEND_LIMIT = 4;
/** 이보다 적게 모은 색은 물감 번짐에서 뺀다 */
const BLEND_MIN_SHARE = 0.08;
/** 오늘의 색이 돌아가는 색 수 */
const DAILY_LIMIT = 5;

/** 로컬 날짜 기준 하루 번호 — 자정에 바뀐다 */
export const localDayNumber = (date: Date) =>
    Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000);

/** 지금 앱에 칠할 색들. 첫 색이 주인공이다. 칠하지 않으면 빈 배열 */
export function chooseSwatches(
    mode: TintMode,
    palette: readonly Swatch[],
    pick: FamilyId | null,
    day: number,
): Swatch[] {
    if (mode === "off" || palette.length === 0) return [];
    switch (mode) {
        case "blend": {
            const chosen = palette.filter((swatch) => swatch.share >= BLEND_MIN_SHARE).slice(0, BLEND_LIMIT);
            return chosen.length > 0 ? chosen : [palette[0]];
        }
        case "daily": {
            const pool = palette.slice(0, DAILY_LIMIT);
            return [pool[((day % pool.length) + pool.length) % pool.length]];
        }
        case "pick":
            // 고른 색의 물건을 모두 지웠으면 가장 많은 색으로 돌아간다
            return [palette.find((swatch) => swatch.family === pick) ?? palette[0]];
        default:
            return [palette[0]];
    }
}

/* 캐릭터 색 하나에서 앱에 칠할 톤을 만든다. 밝기는 정해 두고 색상각만 캐릭터를 따른다 —
 * 그래야 노랑이든 파랑이든 먹 글씨가 같은 대비로 읽힌다. */

/** 노랑 언저리는 밝아야 노랗게 보인다 — 다른 색과 같은 밝기(0.86)로 맞추면 카키색으로 탁해진다 */
const isYellowish = (h: number) => h >= 75 && h < 125;

/** 볼터치 — 지금 #f0c1b2 와 비슷한 밝기의 파스텔. 위에 먹 글씨를 올려도 읽힌다 */
const cheekTone = ({ c, h }: Oklch): Oklch =>
    isYellowish(h) ? { l: 0.9, c: Math.min(c, 0.13), h } : { l: 0.86, c: Math.min(c, 0.11), h };
/** 포인트 선(제목 밑줄) — 캐릭터 색에 가깝게. 흰 바탕에서 보일 만큼만 밝기를 누른다.
 * 채도를 넉넉히 두는 이유: 빨강을 탁하게 누르면 삭제·오류 색(danger #d0554e)과 거의 같아진다. */
const accentTone = ({ l, c, h }: Oklch): Oklch => ({ l: clamp(l, 0.55, 0.8), c: clamp(c, 0.08, 0.21), h });
/** 바탕 — 종이에 물이 아주 살짝 든 정도 */
const washTone = ({ c, h }: Oklch): Oklch => ({ l: 0.975, c: Math.min(c * 0.2, 0.018), h });
/** 바탕 귀퉁이에 번지는 물감 (물감 번짐에서만) */
const bloomTone = ({ c, h }: Oklch): Oklch =>
    isYellowish(h) ? { l: 0.93, c: Math.min(c, 0.13), h } : { l: 0.88, c: Math.min(c, 0.1), h };

/** 물감 번짐의 번지는 자리 — 첫 색이 왼쪽 위, 둘째가 오른쪽, 셋째가 아래 … */
const BLOOM_SPOTS = ["0% 0%", "100% 30%", "10% 100%", "95% 95%"];

export interface TintVars {
    /** documentElement 에 붙일 CSS 변수 */
    vars: Record<string, string>;
    /** 상태 표시줄 색(meta theme-color) */
    themeColor: string;
}

/** 이 이름들만 붙였다 뗀다 — 다른 코드가 쓰는 변수를 건드리지 않도록 */
export const TINT_VAR_NAMES = [
    "--color-cheek",
    "--color-cheek-2",
    "--color-accent",
    "--color-wash",
    "--tint-stripe",
    "--tint-bloom",
] as const;

/** 칠할 색들 → CSS 변수. 빈 배열이면 null(지금의 흑백 그대로) */
export function tintVars(swatches: readonly Swatch[]): TintVars | null {
    if (swatches.length === 0) return null;
    const [first, second] = swatches;
    const wash = oklchToRgb(washTone(first.color));

    const vars: Record<string, string> = {
        "--color-cheek": rgbChannels(oklchToRgb(cheekTone(first.color))),
        "--color-cheek-2": rgbChannels(oklchToRgb(cheekTone((second ?? first).color))),
        "--color-accent": rgbChannels(oklchToRgb(accentTone(first.color))),
        "--color-wash": rgbChannels(wash),
    };

    if (swatches.length > 1) {
        // 띠는 고른 색끼리의 비율로 나눈다 — 칸마다 경계를 딱 잘라 색이 섞여 탁해지지 않게 한다
        const sum = swatches.reduce((total, swatch) => total + swatch.share, 0);
        let start = 0;
        const stops = swatches.map((swatch) => {
            const end = start + (swatch.share / sum) * 100;
            const stop = `rgb(${rgbChannels(oklchToRgb(accentTone(swatch.color)))}) ${start.toFixed(1)}% ${end.toFixed(1)}%`;
            start = end;
            return stop;
        });
        vars["--tint-stripe"] = `linear-gradient(90deg, ${stops.join(", ")})`;
        vars["--tint-bloom"] = swatches
            .map(
                (swatch, index) =>
                    `radial-gradient(circle at ${BLOOM_SPOTS[index]}, rgb(${rgbChannels(oklchToRgb(bloomTone(swatch.color)))} / 0.55), transparent 55%)`,
            )
            .join(", ");
    }

    return { vars, themeColor: rgbHex(wash) };
}
