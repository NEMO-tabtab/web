import Image from "next/image";
import Link from "next/link";

import logo from "/public/images/logo.png";

export default function Header() {
    return (
        <header className="sticky z-[9990] top-0 left-0 right-0 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.1)] bg-white">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/xpressengine/XEIcon@2.3.3/xeicon.min.css" />
            <div className="container-1280 px flex items-center lg:h-20 h-14">
                <Link href="/">
                    <Image src={logo} alt="NEMO" className="w-auto lg:h-6 h-5" />
                </Link>
            </div>
        </header>
    );
}
