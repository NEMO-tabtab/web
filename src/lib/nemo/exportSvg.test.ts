import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { composeCapsule } from "./capsule";
import { composeNemo, composeSymbol } from "./compose";
import { EXPORT_PADDING, ROUGH_FILTERS, toSvgString } from "./exportSvg";
import { COLORS } from "./geometry";
import { composeScene } from "./scenes";
import { SOLID_MIN } from "./solid";
import type { FilterId } from "./types";

describe("따로 떼어 쓰는 SVG", () => {
    it("필터 값이 루트 레이아웃의 정의와 같다", () => {
        // 화면의 필터는 src/app/layout.tsx 에 있다. 두 곳의 값이 갈리면 내려받은 그림의 떨림이 화면과 달라진다
        const layout = readFileSync("src/app/layout.tsx", "utf8");
        for (const id of Object.keys(ROUGH_FILTERS) as FilterId[]) {
            const block = layout.slice(layout.indexOf(`id="${id}"`));
            const read = (name: string) => Number(new RegExp(`${name}="([\\d.]+)"`).exec(block)?.[1]);
            expect(read("baseFrequency")).toBe(ROUGH_FILTERS[id].baseFrequency);
            expect(read("seed")).toBe(ROUGH_FILTERS[id].seed);
            expect(read("scale")).toBe(ROUGH_FILTERS[id].scale);
        }
    });

    it("필터를 그림 안에 품고, 바깥의 필터를 가리키지 않는다", () => {
        const svg = toSvgString(composeNemo({ expression: "happy" }), 120);
        expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
        expect(svg).toContain('<filter id="rough"');
        expect(svg).toContain('filter="url(#rough)"');
        expect(svg).not.toContain("rough-line");
        expect(svg).toContain(`baseFrequency="${ROUGH_FILTERS["rough-line"].baseFrequency}"`);
        // 심볼은 작은 필터
        expect(toSvgString(composeSymbol(), 100)).toContain(`scale="${ROUGH_FILTERS["rough-line-sm"].scale}"`);
    });

    it("그림의 모든 획과 층의 움직임이 들어간다", () => {
        for (const drawing of [
            composeNemo({ expression: "curious" }),
            composeNemo({ pose: "snap", view: "solid", size: SOLID_MIN }),
            composeCapsule({ expression: "pop" }),
            composeScene("store", SOLID_MIN),
        ]) {
            const svg = toSvgString(drawing, 200);
            for (const layer of drawing.layers) {
                if (layer.transform) expect(svg).toContain(`transform="${layer.transform}"`);
                for (const stroke of layer.strokes) expect(svg).toContain(`d="${stroke.d}"`);
            }
        }
    });

    it("색은 원본의 값 그대로다", () => {
        const svg = toSvgString(composeNemo({ view: "solid", size: SOLID_MIN }), SOLID_MIN);
        for (const color of [COLORS.ink, COLORS.paper, COLORS.cheek, COLORS.cream]) expect(svg).toContain(color);
    });

    it("둘레에 여백을 두고, 크기는 화면에서와 같은 뜻이다", () => {
        const drawing = composeNemo();
        const svg = toSvgString(drawing, 240);
        const side = drawing.box.width + EXPORT_PADDING * 2;
        expect(svg).toContain(`viewBox="${-EXPORT_PADDING} ${-EXPORT_PADDING} ${side} ${side}"`);
        // 120칸이 240px — 한 칸이 2px
        expect(svg).toContain(`width="${side * 2}" height="${side * 2}"`);
    });
});
