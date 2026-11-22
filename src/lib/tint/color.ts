/**
 * 앱 색(물들이기)에 쓰는 색 계산.
 *
 * 사람 눈에 고르게 보이는 OKLab·OKLCH 공간에서 계산한다. sRGB 의 HSL 로 밝기를 맞추면
 * 같은 밝기 값이라도 노랑은 하얗게, 파랑은 어둡게 보여서 캐릭터마다 파스텔 톤이 들쭉날쭉해진다.
 * 변환식은 Björn Ottosson 의 OKLab 정의(https://bottosson.github.io/posts/oklab/)를 그대로 옮겼다.
 */

/** l: 밝기 0~1, c: 채도(대략 0~0.37), h: 색상각 0~360 */
export interface Oklch {
    l: number;
    c: number;
    h: number;
}

export interface Oklab {
    l: number;
    a: number;
    b: number;
}

/** 0~255 정수 세 개 */
export type Rgb = readonly [number, number, number];

const toLinear = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

const fromLinear = (channel: number) =>
    channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;

/** 0~255 sRGB → OKLab */
export function rgbToOklab(red: number, green: number, blue: number): Oklab {
    const r = toLinear(red / 255);
    const g = toLinear(green / 255);
    const b = toLinear(blue / 255);

    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

    return {
        l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    };
}

/** OKLab → 선형이 아닌 sRGB 0~1. 범위를 벗어난 값은 그대로 돌려준다(범위 검사용) */
function oklabToUnitRgb({ l: L, a, b }: Oklab): [number, number, number] {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);

    return [
        fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ];
}

export function oklabToOklch({ l, a, b }: Oklab): Oklch {
    const h = (Math.atan2(b, a) * 180) / Math.PI;
    return { l, c: Math.hypot(a, b), h: h < 0 ? h + 360 : h };
}

export function oklchToOklab({ l, c, h }: Oklch): Oklab {
    const rad = (h * Math.PI) / 180;
    return { l, a: c * Math.cos(rad), b: c * Math.sin(rad) };
}

export function rgbToOklch(red: number, green: number, blue: number): Oklch {
    return oklabToOklch(rgbToOklab(red, green, blue));
}

const inGamut = (rgb: [number, number, number]) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

/**
 * 화면에 낼 수 있는 sRGB 색으로 바꾼다. 범위를 벗어나면 밝기와 색상각은 두고 채도만 줄인다
 * — 밝기를 건드리면 파스텔·바탕 톤이 캐릭터마다 달라진다.
 */
export function oklchToRgb(color: Oklch): Rgb {
    let rgb = oklabToUnitRgb(oklchToOklab(color));
    if (!inGamut(rgb)) {
        let low = 0;
        let high = color.c;
        for (let step = 0; step < 20; step++) {
            const mid = (low + high) / 2;
            const candidate = oklabToUnitRgb(oklchToOklab({ ...color, c: mid }));
            if (inGamut(candidate)) {
                low = mid;
                rgb = candidate;
            } else {
                high = mid;
            }
        }
        rgb = oklabToUnitRgb(oklchToOklab({ ...color, c: low }));
    }
    const channel = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255);
    return [channel(rgb[0]), channel(rgb[1]), channel(rgb[2])];
}

/** CSS 변수에 넣는 꼴 — `rgb(var(--color-cheek) / 0.5)` 처럼 투명도를 붙일 수 있게 채널만 적는다 */
export const rgbChannels = ([r, g, b]: Rgb) => `${r} ${g} ${b}`;

export const rgbHex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
