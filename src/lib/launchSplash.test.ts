import { describe, expect, it } from "vitest";

import { SPLASH_FADE_MS, SPLASH_MIN_MS, splashRemainingMs } from "./launchSplash";

describe("로딩 화면을 더 보여 줄 시간", () => {
    it("페이지를 막 열었으면 0.7초를 다 기다린다", () => {
        expect(splashRemainingMs(0)).toBe(700);
    });

    it("불러오는 데 걸린 시간만큼 덜 기다린다", () => {
        expect(splashRemainingMs(500)).toBe(200);
        expect(splashRemainingMs(699.6)).toBe(0);
    });

    it("이미 0.7초를 넘겼으면 더 기다리지 않는다", () => {
        expect(splashRemainingMs(900)).toBe(0);
        expect(splashRemainingMs(5_000)).toBe(0);
    });

    it("흐려지는 시간까지 더해도 1초를 넘지 않는다 (Google 권장)", () => {
        expect(SPLASH_MIN_MS + SPLASH_FADE_MS).toBeLessThanOrEqual(1_000);
    });
});
