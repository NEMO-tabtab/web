import { describe, expect, it } from "vitest";

import { SPLASH_SYMBOL_SIZE } from "./launchSplash";
import { ANDROID_SPLASH_CANVAS, androidSplashSvg } from "./launchSplashAsset";
import { composeSymbol } from "./nemo/compose";

describe("Android 로딩 이미지 (#248)", () => {
    const svg = androidSplashSvg();

    it("저장소의 원본 SVG 가 캐릭터 원본에서 만든 것과 같다 — 다르면 pnpm test -u 로 다시 만들고 PNG 도 다시 뽑는다", async () => {
        await expect(svg).toMatchFileSnapshot("../../docs/android/splash/splash-mark.svg");
    });

    it("300dp 흰 캔버스 한가운데에 놓인다", () => {
        expect(svg).toContain(`viewBox="0 0 ${ANDROID_SPLASH_CANVAS} ${ANDROID_SPLASH_CANVAS}"`);
        expect(svg).toContain('fill="#ffffff"');

        const inner = /<svg x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg);
        expect(inner).not.toBeNull();
        const [, x, y, width, height] = inner!.map(Number);
        expect(x + width / 2).toBeCloseTo(ANDROID_SPLASH_CANVAS / 2, 1);
        expect(y + height / 2).toBeCloseTo(ANDROID_SPLASH_CANVAS / 2, 1);
    });

    it("웹 로딩 화면과 같은 심볼의 획을 모두 담는다", () => {
        for (const stroke of composeSymbol().layers.flatMap((layer) => layer.strokes)) {
            expect(svg).toContain(`d="${stroke.d}"`);
        }
        expect(SPLASH_SYMBOL_SIZE).toBe(120);
    });
});
