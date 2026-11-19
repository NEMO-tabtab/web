"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import { DEV_TOOLS_HOME, createTapCounter, unlockDevTools } from "@/lib/devTools";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

/**
 * 앱 버전 표시. 10번 연속으로 누르면 이 기기에서 개발자 메뉴가 열린다 (#123).
 * 보통 사용자에게는 그냥 버전 글자다 — 누를 수 있다는 티를 내지 않는다.
 */
export function DevEntrance() {
    const router = useRouter();
    const tap = useRef(createTapCounter());

    const onClick = () => {
        if (!tap.current()) return;
        if (unlockDevTools()) router.push(DEV_TOOLS_HOME);
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="mx-auto block cursor-default select-none px-4 py-2 font-sans text-xs tabular-nums text-ink-soft"
        >
            NEMO v{APP_VERSION}
        </button>
    );
}
