import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import Header from "./components/Header";
import BottomNavigation from "@/components/common/BottomNavigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansKr = Noto_Sans_KR({
    subsets: ["latin"],
    weight: ["100", "300", "400", "500", "700", "900"],
    variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
    title: "NEMO",
    description: "NEMO - 당신의 가치를 찾아보세요",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#ffffff",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className={`${inter.variable} ${notoSansKr.variable}`}>
            <body className="font-sans bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 pb-16 md:pb-0">
                    {children}
                </div>
                <div className="md:hidden">
                    <BottomNavigation />
                </div>
            </body>
        </html>
    );
}
