import { describe, expect, it } from "vitest";

import { oklchToRgb, rgbToOklch } from "./color";
import { dominantColor } from "./extract";
import { buildPalette, chooseSwatches, familyOf, tintVars, type FamilyId } from "./palette";

/* 사진 대신 쓰는 작은 그림. 실제 캐릭터 그림이 아니라 "어떤 색이 얼마나 넓게, 어디에" 있는지만 흉내 낸다. */

type Rgb = [number, number, number];

function canvas(width: number, height: number, background: Rgb) {
    const data = new Uint8ClampedArray(width * height * 4);
    const paint = (test: (x: number, y: number) => boolean, [r, g, b]: Rgb) => {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!test(x, y)) continue;
                const i = (y * width + x) * 4;
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
                data[i + 3] = 255;
            }
        }
    };
    paint(() => true, background);
    return {
        data,
        circle: (cx: number, cy: number, radius: number, color: Rgb) =>
            paint((x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2, color),
        rect: (x0: number, y0: number, x1: number, y1: number, color: Rgb) =>
            paint((x, y) => x >= x0 && x < x1 && y >= y0 && y < y1, color),
    };
}

const familyOfImage = (data: Uint8ClampedArray, size: number) => {
    const color = dominantColor(data, size, size);
    return color && familyOf(color);
};

describe("색 변환", () => {
    it("sRGB → OKLCH → sRGB 를 오가도 같은 색이다", () => {
        for (const rgb of [
            [0, 160, 233],
            [232, 56, 47],
            [248, 211, 58],
            [28, 27, 25],
        ] as Rgb[]) {
            expect(oklchToRgb(rgbToOklch(...rgb))).toEqual(rgb);
        }
    });

    it("화면에 낼 수 없는 색은 채도만 줄여 낸다", () => {
        const [r, g, b] = oklchToRgb({ l: 0.86, c: 0.4, h: 264 });
        for (const channel of [r, g, b]) {
            expect(channel).toBeGreaterThanOrEqual(0);
            expect(channel).toBeLessThanOrEqual(255);
        }
        // 밝기는 그대로라 파랑 파스텔로 남는다
        expect(familyOf(rgbToOklch(r, g, b))).toBe("blue");
        expect(rgbToOklch(r, g, b).l).toBeCloseTo(0.86, 2);
    });
});

describe("색 갈래", () => {
    it.each<[string, Rgb, FamilyId]>([
        ["도라에몽 파랑", [0, 160, 233], "blue"],
        ["짱구 셔츠 빨강", [232, 56, 47], "red"],
        ["노진구 셔츠 노랑", [248, 211, 58], "yellow"],
        ["초록", [60, 170, 80], "green"],
        ["민트", [80, 200, 190], "teal"],
        ["보라", [140, 90, 200], "purple"],
        ["분홍", [245, 140, 180], "pink"],
        ["주황", [245, 140, 40], "orange"],
        ["곰 인형 갈색", [140, 95, 60], "brown"],
    ])("%s → %s", (_, rgb, family) => {
        expect(familyOf(rgbToOklch(...rgb))).toBe(family);
    });
});

describe("사진에서 대표 색 뽑기", () => {
    it("흰 배경 위 파란 몸통에 빨간 코·방울이 조금 있으면 파랑", () => {
        const image = canvas(48, 48, [250, 250, 248]);
        image.circle(24, 24, 17, [0, 160, 233]);
        image.circle(24, 27, 9, [255, 255, 255]); // 흰 배
        image.circle(24, 18, 2, [230, 0, 18]); // 빨간 코
        image.rect(14, 36, 34, 38, [230, 0, 18]); // 빨간 목줄
        image.circle(24, 39, 2, [250, 200, 30]); // 노란 방울
        expect(familyOfImage(image.data, 48)).toBe("blue");
    });

    it("나무 책상 위에서 살색 얼굴보다 넓은 빨간 셔츠가 이기면 빨강", () => {
        const image = canvas(48, 48, [200, 164, 126]);
        image.rect(14, 6, 34, 10, [20, 20, 20]); // 검은 머리
        image.rect(14, 10, 34, 22, [246, 210, 180]); // 얼굴
        image.rect(12, 22, 36, 36, [232, 56, 47]); // 빨간 셔츠
        image.rect(15, 36, 33, 42, [245, 200, 60]); // 노란 반바지
        expect(familyOfImage(image.data, 48)).toBe("red");
    });

    it("노란 셔츠와 파란 반바지면 더 넓은 노랑", () => {
        const image = canvas(48, 48, [245, 245, 245]);
        image.rect(15, 8, 33, 20, [246, 210, 180]);
        image.rect(12, 20, 36, 34, [248, 211, 58]);
        image.rect(14, 34, 34, 40, [43, 92, 171]);
        expect(familyOfImage(image.data, 48)).toBe("yellow");
    });

    it("흑백 물건(흰 배경·회색·검정)은 색이 없다", () => {
        const image = canvas(48, 48, [255, 255, 255]);
        image.circle(24, 24, 15, [128, 128, 128]);
        image.circle(24, 24, 6, [10, 10, 10]);
        expect(dominantColor(image.data, 48, 48)).toBeNull();
    });

    it("귀퉁이의 색보다 가운데의 색에 무게를 둔다", () => {
        // 같은 넓이의 빨강(귀퉁이)과 파랑(가운데)
        const image = canvas(48, 48, [250, 250, 250]);
        image.rect(0, 0, 12, 12, [232, 56, 47]);
        image.rect(18, 18, 30, 30, [0, 120, 220]);
        expect(familyOfImage(image.data, 48)).toBe("blue");
    });
});

const color = (rgb: Rgb) => rgbToOklch(...rgb);
const BLUE = color([0, 160, 233]);
const YELLOW = color([248, 211, 58]);
const RED = color([232, 56, 47]);

describe("모은 색과 칠하는 방식", () => {
    const palette = buildPalette([
        { color: BLUE, count: 3 },
        { color: BLUE, count: 2 },
        { color: YELLOW, count: 3 },
        { color: RED, count: 2 },
        // 수량을 비워 둔 물건도 1개로 센다
        { color: color([60, 170, 80]), count: 0 },
    ]);

    it("갈래별로 묶어 수량이 많은 순으로 센다", () => {
        expect(palette.map((s) => [s.family, s.count])).toEqual([
            ["blue", 5],
            ["yellow", 3],
            ["red", 2],
            ["green", 1],
        ]);
        expect(palette.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1);
    });

    it("제일 많은 색은 하나만, 물감 번짐은 비율이 작은 색을 빼고 최대 4색", () => {
        expect(chooseSwatches("top", palette, null, 0).map((s) => s.family)).toEqual(["blue"]);
        // 초록은 11개 중 1개(9%)라 8% 기준을 겨우 넘는다
        expect(chooseSwatches("blend", palette, null, 0).map((s) => s.family)).toEqual([
            "blue",
            "yellow",
            "red",
            "green",
        ]);
    });

    it("물감 번짐은 8% 보다 적게 모은 색을 섞지 않는다", () => {
        const mostlyBlue = buildPalette([
            { color: BLUE, count: 19 },
            { color: RED, count: 1 },
        ]);
        expect(chooseSwatches("blend", mostlyBlue, null, 0).map((s) => s.family)).toEqual(["blue"]);
    });

    it("오늘의 색은 날마다 돌아가고, 고른 색이 없어지면 가장 많은 색으로 돌아간다", () => {
        const days = [0, 1, 2, 3, 4].map((day) => chooseSwatches("daily", palette, null, day)[0].family);
        expect(days).toEqual(["blue", "yellow", "red", "green", "blue"]);
        expect(chooseSwatches("pick", palette, "yellow", 0)[0].family).toBe("yellow");
        expect(chooseSwatches("pick", palette, "purple", 0)[0].family).toBe("blue");
    });

    it("끄거나 모은 색이 없으면 칠하지 않는다", () => {
        expect(chooseSwatches("off", palette, null, 0)).toEqual([]);
        expect(tintVars(chooseSwatches("top", [], null, 0))).toBeNull();
    });

    it("한 색이면 띠·번짐 없이, 여러 색이면 오른쪽 볼과 띠·번짐이 생긴다", () => {
        const single = tintVars(chooseSwatches("top", palette, null, 0))!;
        expect(single.vars["--tint-stripe"]).toBeUndefined();
        expect(single.vars["--color-cheek-2"]).toBe(single.vars["--color-cheek"]);

        const blend = tintVars(chooseSwatches("blend", palette, null, 0))!;
        expect(blend.vars["--color-cheek-2"]).not.toBe(blend.vars["--color-cheek"]);
        expect(blend.vars["--tint-stripe"]).toMatch(/^linear-gradient\(90deg, rgb\(/);
        expect(blend.vars["--tint-bloom"].match(/radial-gradient/g)).toHaveLength(4);
    });

    it("볼터치 위의 먹 글씨는 어느 캐릭터 색이든 충분한 대비(7:1 이상)로 읽힌다", () => {
        // WCAG 상대 휘도
        const luminance = ([r, g, b]: number[]) => {
            const lin = (v: number) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
            return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        };
        const ink = luminance([28, 27, 25]);
        for (const family of [BLUE, YELLOW, RED, color([60, 170, 80]), color([140, 90, 200])]) {
            const cheek = tintVars(buildPalette([{ color: family, count: 1 }]))!.vars["--color-cheek"];
            const ratio = (luminance(cheek.split(" ").map(Number)) + 0.05) / (ink + 0.05);
            expect(ratio).toBeGreaterThanOrEqual(7);
        }
    });

    it("빨강 캐릭터의 밑줄은 삭제·오류 색(danger)과 구별된다", () => {
        const accent = tintVars(buildPalette([{ color: RED, count: 1 }]))!.vars["--color-accent"];
        const [r, g, b] = accent.split(" ").map(Number);
        const danger = rgbToOklch(208, 85, 78);
        const mine = rgbToOklch(r, g, b);
        expect(mine.c - danger.c).toBeGreaterThan(0.03);
    });
});
