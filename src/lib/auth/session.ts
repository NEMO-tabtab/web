import { z } from "zod";

import type { LoginData } from "@/lib/api/schemas";

/*
 * 로그인 상태 — 이 기기의 localStorage 에 둔다.
 *
 * 보관하는 것은 토큰과 화면에 필요한 최소 정보(번호·아이디·닉네임·프로필 그림 주소)뿐이다.
 * 이메일·주소 같은 개인정보는 남기지 않는다.
 * 보관 위치(쿠키 방식 포함)의 최종 결정은 #97 에서 한다 — 그때 이 파일만 바꾸면 되게 화면은 여기만 거친다.
 */

const KEY = "nemo:session";

const sessionSchema = z.object({
    token: z.string().min(1),
    user: z.object({
        userIdx: z.number().int(),
        loginId: z.string().min(1),
        nickname: z.string().optional(),
        profileImageUrl: z.string().optional(),
    }),
    savedAt: z.number(),
});

export type Session = z.infer<typeof sessionSchema>;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function storage(): Storage | null {
    try {
        return globalThis.localStorage ?? null;
    } catch {
        // 사생활 보호 모드 등 — 로그인 상태를 남기지 못할 뿐 앱은 계속 쓴다
        return null;
    }
}

/** JWT 의 만료 시각(ms). JWT 가 아니거나 exp 가 없으면 null — 그때는 만료를 모르는 것으로 둔다 */
export function tokenExpiresAt(token: string): number | null {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;
        const padded = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(payload.length / 4) * 4, "=");
        const { exp } = JSON.parse(atob(padded)) as { exp?: unknown };
        return typeof exp === "number" ? exp * 1000 : null;
    } catch {
        return null;
    }
}

function parse(raw: string | null, now: number): Session | null {
    if (!raw) return null;
    try {
        const parsed = sessionSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return null;
        const expiresAt = tokenExpiresAt(parsed.data.token);
        if (expiresAt !== null && expiresAt <= now) return null;
        return parsed.data;
    } catch {
        return null;
    }
}

// useSyncExternalStore 는 값이 그대로면 같은 객체를 돌려받아야 한다
let cache: { raw: string | null; session: Session | null } = { raw: null, session: null };

/** 지금 로그인 상태. 없거나, 망가졌거나, 토큰이 만료됐으면 null */
export function readSession(now: number = Date.now()): Session | null {
    let raw: string | null = null;
    try {
        raw = storage()?.getItem(KEY) ?? null;
    } catch {
        return null;
    }
    if (raw !== cache.raw) cache = { raw, session: parse(raw, now) };

    // 읽어 둔 뒤에 만료됐을 수 있다
    const expiresAt = cache.session ? tokenExpiresAt(cache.session.token) : null;
    if (expiresAt !== null && expiresAt <= now) cache = { raw, session: null };

    return cache.session;
}

/** 저장하지 못하면 false — 로그인은 됐지만 다음에 다시 로그인해야 한다 */
export function saveSession(data: LoginData, now: number = Date.now()): boolean {
    const session: Session = { token: data.token, user: data.user, savedAt: now };
    try {
        const target = storage();
        if (!target) return false;
        target.setItem(KEY, JSON.stringify(session));
        notify();
        return true;
    } catch {
        return false;
    }
}

/** 로그아웃 — 이 기기의 로그인 상태만 지운다. 기록한 물건은 건드리지 않는다 */
export function clearSession(): void {
    try {
        storage()?.removeItem(KEY);
    } catch {
        // 지울 것이 없다
    }
    notify();
}

export function subscribeSession(listener: () => void): () => void {
    listeners.add(listener);
    // 다른 탭에서 로그인·로그아웃한 것도 따라간다
    const onStorage = (event: StorageEvent) => {
        if (event.key === KEY || event.key === null) listener();
    };
    globalThis.addEventListener?.("storage", onStorage as EventListener);
    return () => {
        listeners.delete(listener);
        globalThis.removeEventListener?.("storage", onStorage as EventListener);
    };
}
