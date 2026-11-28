import type { Metadata } from "next";

import { DevGate } from "@/components/dev/DevGate";

import CutoutLab from "./CutoutLab";

export const metadata: Metadata = {
    title: "배경 지우기 실험 — NEMO",
    robots: { index: false, follow: false },
};

/**
 * 배경 지우기 실험(#215). 개발자 메뉴가 열린 기기에서만 보인다.
 * 기기의 사진을 읽기만 하고 아무것도 저장하지 않으니 `/dev/api-live` 와 같은 방식으로 연다.
 */
export default function CutoutPage() {
    return (
        <DevGate>
            <CutoutLab />
        </DevGate>
    );
}
