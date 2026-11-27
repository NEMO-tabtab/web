/**
 * 앱 안에서 돌아갈 화면이 있는지(#250).
 * 떠 있는 + 버튼은 홈·제품·지도·분석 어디서든 뜨므로, 등록 화면의 뒤로 가기는 들어온 화면으로 돌아가야 한다.
 * 주소를 바로 열었을 때는 돌아갈 곳이 없으니 호출부가 정한 화면으로 보낸다.
 */

let last: string | null = null;
let steps = 0;

/** 화면이 바뀔 때마다 부른다(루트 레이아웃의 NavTrail). 같은 화면을 거듭 불러도 한 번으로 센다 */
export function visit(pathname: string): void {
    if (pathname === last) return;
    last = pathname;
    steps += 1;
}

/** 이번에 앱을 연 뒤로 화면을 한 번이라도 옮겼는가 */
export function hasMoved(): boolean {
    return steps > 1;
}

/** 테스트용 */
export function resetTrail(): void {
    last = null;
    steps = 0;
}

/** 브라우저가 알려 주는 "같은 앱 안의 앞 화면이 있는가". 지원하지 않는 브라우저에는 없다 */
interface NavigationLike {
    canGoBack?: boolean;
}

/**
 * 뒤로 가기로 앱 안의 앞 화면에 닿는가.
 * 브라우저가 직접 알려 주면 그 값을 쓰고(같은 출처의 기록만 센다), 아니면 화면을 옮긴 적이 있는지로 가늠한다.
 */
export function canGoBackInApp(navigation: NavigationLike | undefined, moved: boolean): boolean {
    if (typeof navigation?.canGoBack === "boolean") return navigation.canGoBack;
    return moved;
}
