"use client";

import { usePathname } from "next/navigation";

import { FAB, Icon } from "@/components/common";

/**
 * 물건 등록 퀵 메뉴 — 떠 있는 바코드 스캔·등록 버튼. 등록(+)은 사진만으로 끝나는 빠른 등록(#199)으로 간다.
 * 하단 메뉴의 '등록' 자리를 '지도'에 내주면서(#159) 등록은 이 버튼으로 한다. 주요 화면 어디서든 같은 자리에 뜬다.
 * 마이(설정)와 몰입 화면(등록·수정·스캐너), 내부 지도처럼 화면을 꽉 쓰는 곳에는 띄우지 않는다.
 */
const SHOWN_ON = ["/", "/product", "/shops", "/analysis"];

export function RegisterQuickMenu() {
    const pathname = usePathname();
    if (!SHOWN_ON.includes(pathname)) return null;

    return (
        // 좁은 화면에선 하단 탭 바 위로 띄우고, 넓은 화면에선 내비가 왼쪽 레일로 옮겨 가므로 화면 아래에 바짝 붙인다
        <div className="fixed bottom-20 right-4 z-30 flex flex-col gap-3 sm:bottom-7">
            <FAB
                href="/barcode"
                variant="solid"
                aria-label="바코드 스캔"
                icon={<Icon name="barcode" className="text-2xl" />}
            />
            <FAB
                href="/product/quick"
                variant="ink"
                aria-label="빠른 등록"
                icon={<Icon name="plus" className="text-2xl" strokeWidth={2.6} />}
            />
        </div>
    );
}
