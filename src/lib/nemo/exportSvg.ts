import { COLORS } from "./geometry";
import type { Drawing, FilterId } from "./types";

/*
 * 그림 한 장을 따로 떼어 쓸 수 있는 SVG 문자열로 만든다.
 * 화면에서는 손떨림 필터를 루트 레이아웃에서 참조하지만, 떼어 낸 SVG 에는 필터가 따라가지 않아 선이 곧게 나온다.
 * 그래서 필터를 그림 안에 넣는다. 칸(좌표)을 그대로 두므로 떨림의 모양도 화면과 같다.
 */

/** 손떨림 필터의 값 — src/app/layout.tsx 의 정의와 같아야 한다(exportSvg.test.ts 가 맞춰 본다) */
export const ROUGH_FILTERS: Record<FilterId, { baseFrequency: number; seed: number; scale: number }> = {
    "rough-line": { baseFrequency: 0.045, seed: 7, scale: 2.8 },
    "rough-line-sm": { baseFrequency: 0.09, seed: 3, scale: 1.3 },
};

/** 그림 둘레에 두는 여백(칸) — 필터가 획을 밀어내도 잘리지 않게 */
export const EXPORT_PADDING = 6;

const attr = (name: string, value: string | number | undefined) => (value === undefined ? "" : ` ${name}="${value}"`);
const px = (value: number) => Math.round(value * 100) / 100;

/** size 는 화면에서와 같은 뜻이다 — 캐릭터의 크기(px). 여백만큼 그림이 조금 더 크다 */
export function toSvgString(drawing: Drawing, size: number): string {
    const { box, unit, filter, layers } = drawing;
    const scale = size / unit;
    const x = box.x - EXPORT_PADDING;
    const y = box.y - EXPORT_PADDING;
    const width = box.width + EXPORT_PADDING * 2;
    const height = box.height + EXPORT_PADDING * 2;
    const rough = ROUGH_FILTERS[filter];

    const groups = layers
        .map((layer) => {
            const paths = layer.strokes
                .map(
                    (stroke) =>
                        `<path d="${stroke.d}" fill="${stroke.fill ? COLORS[stroke.fill] : "none"}"` +
                        attr("fill-opacity", stroke.opacity) +
                        ` stroke="${stroke.w ? COLORS.ink : "none"}"` +
                        attr("stroke-width", stroke.w ? px(stroke.w) : undefined) +
                        "/>",
                )
                .join("");
            return `<g${attr("transform", layer.transform)}>${paths}</g>`;
        })
        .join("");

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${px(width * scale)}" height="${px(height * scale)}" viewBox="${x} ${y} ${width} ${height}">` +
        '<defs><filter id="rough" x="-8%" y="-8%" width="116%" height="116%">' +
        `<feTurbulence type="fractalNoise" baseFrequency="${rough.baseFrequency}" numOctaves="2" seed="${rough.seed}" result="n"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="n" scale="${rough.scale}" xChannelSelector="R" yChannelSelector="G"/>` +
        "</filter></defs>" +
        `<g filter="url(#rough)" stroke-linecap="round" stroke-linejoin="round">${groups}</g>` +
        "</svg>"
    );
}
