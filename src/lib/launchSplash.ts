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

/*
 * 앱을 켠 뒤 처음 연 페이지에서만 보인다(#246).
 *
 * 화면을 옮길 때는 루트 레이아웃이 그대로라 다시 나오지 않는다. 하지만 페이지 전체를 새로 받으면 다시 그려진다.
 * 당겨서 새로고침할 때, 새 버전이 배포된 뒤 화면을 처음 옮길 때(Next 가 빌드 번호가 다르면 페이지를 통째로 다시 연다),
 * 아이콘으로 다시 들어와 시작 주소(홈)가 다시 열릴 때가 그렇다. 그래서 "이번에 켠 앱에서 이미 보였다"는 표시를 세션
 * 저장소에 둔다. 세션 저장소는 같은 앱 안에서는 새로고침해도 남고, 앱을 완전히 닫으면 지워진다.
 */

/** 이번 세션에서 로딩 화면을 이미 보였다는 표시(세션 저장소) */
export const SPLASH_SEEN_KEY = "nemo:launch-splash-seen";
/** 이미 보인 세션이면 `<html>` 에 붙는 속성. globals.css 가 이걸 보고 로딩 화면을 처음부터 숨긴다 */
export const SPLASH_SEEN_ATTR = "data-splash-seen";

/**
 * `<head>` 에서 React 보다 먼저 돈다. 로딩 화면은 서버에서 그려 두므로, 이미 본 세션이면 첫 프레임부터 숨겨야 한다.
 * 처음이면 표시를 남기고 그대로 보인다. 세션 저장소를 못 쓰면 아무것도 하지 않는다 — 지금처럼 매번 보이는 쪽이
 * 안전하다(보이더라도 저절로 걷힌다).
 */
export const LAUNCH_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(SPLASH_SEEN_KEY)};if(sessionStorage.getItem(k)){document.documentElement.setAttribute(${JSON.stringify(SPLASH_SEEN_ATTR)},"")}else{sessionStorage.setItem(k,"1")}}catch(e){}})()`;
