import Image from "next/image";
import Link from "next/link";

import logo from "/public/images/logo.png";

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/80 backdrop-blur-md transition-all">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/xpressengine/XEIcon@2.3.3/xeicon.min.css" />
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <Image src={logo} alt="NEMO" className="h-8 w-auto" priority />
                </Link>
                {/* 추후 알림이나 검색 아이콘 등이 들어갈 자리 */}
                <div className="flex items-center gap-4">
                    {/* Placeholder for future icons */}
                </div>
            </div>
        </header>
    );
}
