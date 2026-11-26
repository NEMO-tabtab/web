"use client";

import { useEffect, useState } from "react";

import { SPLASH_FADE_MS, SPLASH_MAX_WAIT_MS, SPLASH_SEEN_ATTR, splashRemainingMs } from "@/lib/launchSplash";

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
 * 그림은 앱 아이콘(public/images/app-icon-maskable.svg)의 캐릭터 그대로다. Android 로딩 이미지(docs/android/splash/)와
 * 같은 그림·같은 크기여야 넘어갈 때 튀지 않는다. viewBox 를 캐릭터 경계로 잘라 두어 너비가 곧 캐릭터의 폭이다.
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
            <svg
                viewBox="17.5 16.5 65 70"
                className="h-auto w-24 overflow-visible min-[600px]:w-[120px]"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id="launch-rough" x="-6%" y="-6%" width="112%" height="112%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves={2} seed={5} result="n" />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="n"
                            scale="1.3"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
                <g filter="url(#launch-rough)">
                    <rect
                        x="20"
                        y="31"
                        width="60"
                        height="53"
                        rx="12"
                        fill="#ffffff"
                        stroke="#1c1b19"
                        strokeWidth="5"
                    />
                    <path
                        d="M42.5 19 L57.5 19 L57.5 39 L53.75 42.5 L50 39 L46.25 42.5 L42.5 39 Z"
                        fill="#ffffff"
                        stroke="#1c1b19"
                        strokeWidth="5"
                        strokeLinejoin="round"
                    />
                    {/* 볼터치는 앱 색을 따른다 — <head> 스크립트가 React 보다 먼저 변수를 칠해 두어 켜는 순간부터 같은 색이다 */}
                    <circle cx="32.5" cy="64" r="4.6" style={{ fill: "rgb(var(--color-cheek))" }} opacity="0.8" />
                    <circle cx="67.5" cy="64" r="4.6" style={{ fill: "rgb(var(--color-cheek-2))" }} opacity="0.8" />
                    <circle cx="41" cy="57" r="3.8" fill="#1c1b19" />
                    <circle cx="59" cy="57" r="3.8" fill="#1c1b19" />
                    <path
                        d="M44 67.5 q3 5 6 0 q3 5 6 0"
                        fill="none"
                        stroke="#1c1b19"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>
            </svg>
        </div>
    );
}
