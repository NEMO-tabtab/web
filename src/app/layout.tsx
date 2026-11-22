import type { Metadata, Viewport } from "next";
import { Gaegu, Noto_Sans_KR } from "next/font/google";

import AppChrome from "./components/AppChrome";
import LaunchSplash from "./components/LaunchSplash";
import StoragePersist from "./components/StoragePersist";
import TintProvider from "./components/TintProvider";
import BottomNavigation from "@/components/common/BottomNavigation";
import { RegisterQuickMenu } from "@/components/product/RegisterQuickMenu";
import { TINT_BOOT_SCRIPT } from "@/lib/tint/storage";
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
        // 앱 색(TINT_BOOT_SCRIPT)이 React 보다 먼저 <html> 의 style 과 data-tint 를 바꾼다 — 그 차이는 경고하지 않게 한다
        <html lang="ko" className={`${hand.variable} ${noto.variable} antialiased`} suppressHydrationWarning>
            <head>
                {/* 지난번에 칠한 앱 색을 첫 화면부터 — 흑백이 잠깐 보였다가 색이 드는 깜빡임을 막는다 */}
                <script dangerouslySetInnerHTML={{ __html: TINT_BOOT_SCRIPT }} />
            </head>
            <body className="font-sans">

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

                {/* 앱을 켤 때의 로딩 화면 — 서버에서 그려 두어 첫 화면부터 덮는다 */}
                <LaunchSplash />

                {/* 좁은 화면은 하단 탭 바, 넓은 화면은 왼쪽 세로 레일.
                    전환은 뷰포트 리사이즈라 CSS만으로 즉시 따라간다. */}
                <TintProvider>
                    <div className="mx-auto flex min-h-dvh w-full max-w-[1600px]">
                        <AppChrome>
                            <BottomNavigation />
                            <RegisterQuickMenu />
                        </AppChrome>
                        <div className="w-full min-w-0 flex-1 pb-16 sm:pb-0">{children}</div>
                    </div>
                </TintProvider>
                <StoragePersist />
            </body>
        </html>
    );
}
