import type { Metadata, Viewport } from "next";
import { Gaegu, Noto_Sans_KR } from "next/font/google";

import AppChrome from "./components/AppChrome";
import BottomNavigation from "@/components/common/BottomNavigation";
import "./globals.css";

const hand = Gaegu({
    weight: ["400", "700"],
    subsets: ["latin"],
    variable: "--font-hand",
    display: "swap",
});

const noto = Noto_Sans_KR({
    weight: ["400", "500", "700"],
    subsets: ["latin"],
    variable: "--font-noto",
    display: "swap",
});

export const metadata: Metadata = {
    title: "NEMO — 당신의 가치를 찾아보세요",
    description: "가지고 있는 물건을 하나하나 기록하고, 그 가치를 한눈에 확인해요.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "NEMO",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#ffffff",
    // 하단 내비를 화면 끝까지 붙이려면 safe-area 값이 필요하다 (cover가 아니면 항상 0)
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className={`${hand.variable} ${noto.variable} antialiased`}>
            <body className="font-sans">
                {/* xi-* 아이콘 전역 의존성 */}
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/xpressengine/XEIcon@2.3.3/xeicon.min.css" />

                {/* 손그림 러프 라인 — SVG 변위 필터 정의 (캐릭터·아이콘이 참조) */}
                <svg aria-hidden="true" width="0" height="0" className="absolute">
                    <filter id="rough-line" x="-8%" y="-8%" width="116%" height="116%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n" />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="n"
                            scale="2.8"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                    <filter id="rough-line-sm" x="-8%" y="-8%" width="116%" height="116%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="3" result="n" />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="n"
                            scale="1.3"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </svg>

                {/* 좁은 화면은 하단 탭 바, 넓은 화면은 왼쪽 세로 레일.
                    전환은 뷰포트 리사이즈라 CSS만으로 즉시 따라간다. */}
                <div className="mx-auto flex min-h-dvh w-full max-w-[1600px]">
                    <AppChrome>
                        <BottomNavigation />
                    </AppChrome>
                    <div className="w-full min-w-0 flex-1 pb-16 sm:pb-0">{children}</div>
                </div>
            </body>
        </html>
    );
}
