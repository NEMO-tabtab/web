/*
 * 앱을 켤 때의 로딩 화면(src/app/components/LaunchSplash.tsx)이 얼마나 머무는지.
 *
 * 앱을 켜면 Android 로딩 화면 → 웹 첫 화면 → 저장소를 읽은 홈이 0.1~0.3초 사이에 연달아 바뀌어 깜빡임으로 보인다.
 * 그래서 로딩 화면을 최소한 이만큼은 보여 준다. 시간은 페이지를 열기 시작한 순간(performance.now() 의 0)부터 센다 —
 * 불러오기가 이미 그만큼 걸렸으면 더 기다리지 않는다. Google 은 로딩 애니메이션을 1초 안쪽으로, Apple 은 일부러
 * 늦추지 말라고 권한다(#149).
 */

/** 페이지를 열기 시작한 뒤 로딩 화면을 최소한 보여 줄 시간 */
export const SPLASH_MIN_MS = 700;
/** 사라질 때 흐려지는 시간 */
export const SPLASH_FADE_MS = 250;
/** 글꼴을 기다리는 최대 시간 — 글꼴이 늦게 와도 이보다 오래 덮어 두지 않는다 */
export const SPLASH_MAX_WAIT_MS = 2_500;

/** 페이지를 열기 시작한 뒤 `elapsedMs` 가 지났을 때, 로딩 화면을 더 보여 줄 시간 */
export function splashRemainingMs(elapsedMs: number): number {
    return Math.max(0, Math.round(SPLASH_MIN_MS - elapsedMs));
}
