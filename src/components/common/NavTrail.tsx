"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { visit } from "@/lib/navTrail";

/** 화면을 옮길 때마다 적어 둔다 — 등록 화면의 뒤로 가기가 돌아갈 곳이 있는지 알기 위해서다(#250). 그리는 것은 없다 */
export function NavTrail() {
    const pathname = usePathname();
    useEffect(() => {
        visit(pathname);
    }, [pathname]);
    return null;
}
