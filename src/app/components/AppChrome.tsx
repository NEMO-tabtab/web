"use client";

import { usePathname } from "next/navigation";

const CHROMELESS_PREFIXES = ["/design-system"];

/**
 * 전역 크롬(내비게이션)을 특정 라우트에서 숨긴다.
 *
 * `/design-system` 은 루트 레이아웃 아래에 중첩돼 있어 자체 layout.tsx로는 루트 크롬을
 * 제거할 수 없다. children으로 받으므로 감싸인 컴포넌트는 서버 렌더링을 유지한다.
 */
export default function AppChrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    if (CHROMELESS_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) {
        return null;
    }

    return <>{children}</>;
}
