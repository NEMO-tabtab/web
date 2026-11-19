"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

import { DEV_TOOLS_ALWAYS_ON, isDevToolsUnlocked } from "@/lib/devTools";

/**
 * 개발자 메뉴가 열린 기기에서만 내용을 보여 준다. 아니면 없는 페이지로 보인다.
 * 읽기만 하는 화면에만 쓸 것 — 가림일 뿐 잠금이 아니다 (src/lib/devTools.ts).
 */
export function DevGate({ children }: { children: React.ReactNode }) {
    // 기기에 저장된 값은 화면이 뜬 뒤에야 읽을 수 있다 — 그 전에는 아무것도 그리지 않는다
    const [state, setState] = useState<"checking" | "open" | "closed">(DEV_TOOLS_ALWAYS_ON ? "open" : "checking");

    useEffect(() => {
        if (!DEV_TOOLS_ALWAYS_ON) setState(isDevToolsUnlocked() ? "open" : "closed");
    }, []);

    if (state === "closed") notFound();
    if (state === "checking") return null;
    return <>{children}</>;
}
