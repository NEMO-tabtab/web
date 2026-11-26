import { SPLASH_SYMBOL_SIZE } from "./launchSplash";
import { composeSymbol } from "./nemo/compose";
import { EXPORT_PADDING, toSvgString } from "./nemo/exportSvg";
import { COLORS, SYMBOL } from "./nemo/geometry";

/*
 * Android 앱 로딩 이미지의 원본 (#248, docs/android/splash/).
 *
 * Bubblewrap 은 로딩 이미지를 300dp 캔버스로 만들어 화면 가운데에 늘리지 않고 놓는다. 그 캔버스 가운데에 웹 로딩 화면과
 * 같은 심볼을 같은 크기(몸 폭 96dp)로 둔다 — 그래야 Android 로딩 화면에서 웹 로딩 화면으로 넘어갈 때 튀지 않는다.
 * 저장소의 `docs/android/splash/splash-mark.svg` 는 이 함수가 만든 것이고, 테스트가 둘이 같은지 맞춰 본다.
 * 캐릭터를 고쳐 테스트가 실패하면 `pnpm test -u` 로 다시 만들고 PNG 도 다시 뽑는다(README 의 "다시 만들기").
 */

/** Bubblewrap 로딩 이미지 캔버스의 한 변(dp) */
export const ANDROID_SPLASH_CANVAS = 300;

const round = (value: number) => Math.round(value * 100) / 100;

export function androidSplashSvg(): string {
    const symbol = toSvgString(composeSymbol(), SPLASH_SYMBOL_SIZE);
    // 내보낸 심볼은 둘레에 여백을 둔 정사각이다. 그 한 변을 dp 로 바꿔 캔버스 가운데에 놓는다
    const side = ((SYMBOL.canvas + EXPORT_PADDING * 2) * SPLASH_SYMBOL_SIZE) / SYMBOL.canvas;
    const offset = round((ANDROID_SPLASH_CANVAS - side) / 2);
    const placed = symbol.replace('<svg xmlns="http://www.w3.org/2000/svg"', `<svg x="${offset}" y="${offset}"`);
    const canvas = ANDROID_SPLASH_CANVAS;

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">\n` +
        "<!-- src/lib/launchSplashAsset.ts 가 만든 파일이다. 손으로 고치지 말고 pnpm test -u 로 다시 만든다 (#248) -->\n" +
        `<rect width="${canvas}" height="${canvas}" fill="${COLORS.paper}"/>\n` +
        `${placed}\n` +
        "</svg>\n"
    );
}
