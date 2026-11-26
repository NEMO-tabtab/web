import { describe, expect, it } from "vitest";

import {
    LAUNCH_BOOT_SCRIPT,
    SPLASH_FADE_MS,
    SPLASH_MIN_MS,
    SPLASH_SEEN_ATTR,
    SPLASH_SEEN_KEY,
    splashRemainingMs,
} from "./launchSplash";

/** 세션 저장소 흉내 — 앱 하나를 켠 동안 남는다 */
function memorySession() {
    const items = new Map<string, string>();
    return {
        items,
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => void items.set(key, value),
    };
}

/** 페이지를 한 번 연다 — `<head>` 스크립트를 돌리고, 로딩 화면이 보이는지(숨김 표시가 없는지) 돌려준다 */
function openPage(session: Pick<Storage, "getItem" | "setItem">): boolean {
    const attributes = new Set<string>();
    const document = { documentElement: { setAttribute: (name: string) => void attributes.add(name) } };
    new Function("sessionStorage", "document", LAUNCH_BOOT_SCRIPT)(session, document);
    return !attributes.has(SPLASH_SEEN_ATTR);
}

describe("로딩 화면은 앱을 켠 뒤 처음 연 페이지에서만 (#246)", () => {
    it("처음 연 페이지에서는 보이고, 봤다고 적어 둔다", () => {
        const session = memorySession();
        expect(openPage(session)).toBe(true);
        expect(session.items.has(SPLASH_SEEN_KEY)).toBe(true);
    });

    it("같은 앱에서 페이지가 다시 열리면(새로고침·배포 뒤 이동) 보이지 않는다", () => {
        const session = memorySession();
        openPage(session);
        expect(openPage(session)).toBe(false);
        expect(openPage(session)).toBe(false);
    });

    it("앱을 완전히 닫았다 다시 켜면(세션 저장소가 비면) 다시 보인다", () => {
        openPage(memorySession());
        expect(openPage(memorySession())).toBe(true);
    });

    it("세션 저장소를 쓸 수 없으면 지금처럼 매번 보인다 — 오류로 멈추지 않는다", () => {
        const blocked = {
            getItem: () => {
                throw new Error("SecurityError");
            },
            setItem: () => {
                throw new Error("SecurityError");
            },
        };
        expect(openPage(blocked)).toBe(true);
        expect(openPage(blocked)).toBe(true);
    });
});

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
