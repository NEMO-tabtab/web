"use client";

import { useEffect, useState } from "react";

import { NemoSymbol } from "@/components/nemo/Nemo";
import {
    SPLASH_FADE_MS,
    SPLASH_MAX_WAIT_MS,
    SPLASH_SEEN_ATTR,
    SPLASH_SYMBOL_SIZE,
    splashRemainingMs,
} from "@/lib/launchSplash";

type Phase = "shown" | "leaving" | "gone";

/**
 * 앱을 켤 때의 로딩 화면 (#149).
 *
 * 서버에서도 그려 두어 웹의 첫 화면부터 바로 덮는다. 그래서 Android 로딩 화면이 걷히면 같은 그림이 같은 자리에
 * 이어서 보이고, 그 밑에서 홈의 "여는 중…"과 글꼴이 바뀌는 순간이 지나간다. 최소 0.7초 보여 준 뒤 흐려지며 사라진다.
 *
 * - 설치한 앱에서만 보인다. 브라우저 탭에서는 CSS(`display-mode: browser`)가 숨기고, 여기서도 바로 뺀다.
 * - JS 가 실패해도 남지 않도록 CSS 애니메이션이 3초 뒤 저절로 걷는다(globals.css 의 `.launch-splash`).
 * - 앱을 켠 뒤 처음 연 페이지에서만 보인다(#246). 화면을 옮길 때는 루트 레이아웃이 그대로라 다시 나오지 않고,
 *   새로고침·배포 뒤 이동처럼 페이지가 통째로 다시 열려도 같은 세션이면 `<head>` 스크립트(LAUNCH_BOOT_SCRIPT)가
 *   `<html data-splash-seen>` 을 붙여 CSS 가 처음부터 숨긴다. 여기서도 바로 뺀다.
 *
 * 그림은 앱 안의 로고와 같은 심볼이다(NemoSymbol, docs/design-system.md U8 — 캐릭터 SVG 를 따로 그리지 않는다, #248).
 * 몸 폭은 휴대폰 96px, 태블릿 120px(src/lib/launchSplash.ts). Android 로딩 이미지(docs/android/splash/)도 같은 원본에서
 * 같은 크기로 만든다 — 넘어갈 때 튀지 않게. 볼터치는 NemoSvg 가 앱 색 변수로 칠하고, `<head>` 스크립트가 React 보다
 * 먼저 변수를 칠해 두어 켜는 순간부터 같은 색이다.
 */
export default function LaunchSplash() {
    const [phase, setPhase] = useState<Phase>("shown");

    useEffect(() => {
        if (
            window.matchMedia?.("(display-mode: browser)").matches ||
            document.documentElement.hasAttribute(SPLASH_SEEN_ATTR)
        ) {
            setPhase("gone");
            return;
        }

        let cancelled = false;
        const timers: number[] = [];
        const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));

        void (async () => {
            // 제목의 손글씨 글꼴이 늦게 오면 글자가 한 번 바뀐다 — 그것도 덮개 밑에서 지나가게 한다
            await Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(SPLASH_MAX_WAIT_MS)]);
            await wait(splashRemainingMs(performance.now()));
            if (cancelled) return;

            if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
                setPhase("gone");
                return;
            }
            setPhase("leaving");
            await wait(SPLASH_FADE_MS);
            if (!cancelled) setPhase("gone");
        })();

        return () => {
            cancelled = true;
            for (const timer of timers) window.clearTimeout(timer);
        };
    }, []);

    if (phase === "gone") return null;

    return (
        <div className="launch-splash" data-phase={phase} aria-hidden="true">
            {/* 태블릿에서 1.25배 — SPLASH_TABLET_SCALE 과 같아야 한다 */}
            <div className="min-[600px]:scale-125">
                <NemoSymbol size={SPLASH_SYMBOL_SIZE} />
            </div>
        </div>
    );
}
