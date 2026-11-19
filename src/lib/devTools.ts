/*
 * 개발자 메뉴 — 운영 앱에서 연결 확인 화면(/dev/api-live)으로 들어가는 숨은 입구 (#123).
 *
 * 잠금이 아니라 가림이다. 누르는 방법을 아는 사람은 누구나 들어온다.
 * 그래서 이 방법으로는 읽기만 하는 화면만 연다 — 데이터를 바꾸는 화면을 여기에 걸지 말 것.
 */

const UNLOCK_KEY = "nemo:dev-tools";

/** 개발 서버이거나, 배포할 때 일부러 켠 경우. 이때는 누르지 않아도 열려 있다 */
export const DEV_TOOLS_ALWAYS_ON =
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true";

export const DEV_TOOLS_HOME = "/dev/api-live";

export const TAPS_TO_UNLOCK = 10;
/** 이보다 오래 쉬면 처음부터 다시 센다 */
const TAP_GAP_MS = 1_500;

/**
 * 연속으로 누른 횟수를 센다. `needed` 번째에 true 를 돌려주고 다시 0 부터 센다.
 * 누르는 사이가 `gapMs` 를 넘으면 그 누름을 첫 번째로 친다.
 */
export function createTapCounter(needed: number = TAPS_TO_UNLOCK, gapMs: number = TAP_GAP_MS) {
    let count = 0;
    let lastAt = -Infinity;

    return function tap(now: number = Date.now()): boolean {
        count = now - lastAt > gapMs ? 1 : count + 1;
        lastAt = now;
        if (count < needed) return false;
        count = 0;
        lastAt = -Infinity;
        return true;
    };
}

export function isDevToolsUnlocked(): boolean {
    try {
        return window.localStorage.getItem(UNLOCK_KEY) === "1";
    } catch {
        return false;
    }
}

/** 이 기기에서 개발자 메뉴를 연다. 저장소를 쓸 수 없으면(사생활 보호 모드 등) false */
export function unlockDevTools(): boolean {
    try {
        window.localStorage.setItem(UNLOCK_KEY, "1");
        return true;
    } catch {
        return false;
    }
}

export function lockDevTools(): void {
    try {
        window.localStorage.removeItem(UNLOCK_KEY);
    } catch {
        // 저장소를 못 쓰면 애초에 열려 있지 않다
    }
}
