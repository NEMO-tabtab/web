import { beforeEach, describe, expect, it, vi } from "vitest";

import { fakeToken } from "@/lib/api/mock";

import { clearSession, readSession, saveSession, subscribeSession, tokenExpiresAt } from "./session";

const KEY = "nemo:session";
const NOW = 1_800_000_000_000;
const user = { userIdx: 7, loginId: "nemo01", nickname: "네모", profileImageUrl: undefined };

function memoryStorage() {
    const data = new Map<string, string>();
    return {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
    };
}

beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
});

describe("로그인 상태", () => {
    it("저장한 것을 다시 읽고, 값이 그대로면 같은 객체를 돌려준다", () => {
        expect(readSession(NOW)).toBeNull();
        expect(saveSession({ token: fakeToken(7, NOW + 60_000), user }, NOW)).toBe(true);

        const session = readSession(NOW);
        expect(session).toMatchObject({ user: { userIdx: 7, loginId: "nemo01", nickname: "네모" }, savedAt: NOW });
        expect(readSession(NOW)).toBe(session);
    });

    it("토큰이 만료되면 로그인 전으로 돌아간다", () => {
        saveSession({ token: fakeToken(7, NOW + 60_000), user }, NOW);

        expect(readSession(NOW + 59_000)).not.toBeNull();
        expect(readSession(NOW + 61_000)).toBeNull();
    });

    it("만료를 알 수 없는 토큰은 그대로 둔다", () => {
        saveSession({ token: "opaque-token", user }, NOW);

        expect(tokenExpiresAt("opaque-token")).toBeNull();
        expect(readSession(NOW + 10 ** 12)).not.toBeNull();
    });

    it("망가진 값은 로그인 전으로 본다", () => {
        localStorage.setItem(KEY, "{not json");
        expect(readSession(NOW)).toBeNull();

        localStorage.setItem(KEY, JSON.stringify({ token: "", user: {} }));
        expect(readSession(NOW)).toBeNull();
    });

    it("로그아웃하면 지워지고, 지켜보는 쪽에 알린다", () => {
        const listener = vi.fn();
        const unsubscribe = subscribeSession(listener);

        saveSession({ token: "opaque-token", user }, NOW);
        clearSession();
        expect(listener).toHaveBeenCalledTimes(2);
        expect(readSession(NOW)).toBeNull();
        expect(localStorage.getItem(KEY)).toBeNull();

        unsubscribe();
        saveSession({ token: "opaque-token", user }, NOW);
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it("저장소를 쓸 수 없으면 false 를 돌려주고 던지지 않는다", () => {
        vi.stubGlobal("localStorage", {
            getItem: () => {
                throw new Error("denied");
            },
            setItem: () => {
                throw new Error("denied");
            },
            removeItem: () => {
                throw new Error("denied");
            },
        });

        expect(saveSession({ token: "opaque-token", user }, NOW)).toBe(false);
        expect(readSession(NOW)).toBeNull();
        expect(() => clearSession()).not.toThrow();
    });
});
