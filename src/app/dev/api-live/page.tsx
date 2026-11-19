import type { Metadata } from "next";

import { DevGate } from "@/components/dev/DevGate";

import ApiLive from "./ApiLive";

export const metadata: Metadata = {
    title: "API 연결 확인 — NEMO",
    robots: { index: false, follow: false },
};

/**
 * 개발 서버와 `NEXT_PUBLIC_ENABLE_DEV_TOOLS=true` 인 배포본에서는 늘 열린다.
 * 운영 앱에서는 마이 화면의 버전을 10번 연속으로 누른 기기에서만 열린다 (#123).
 * 읽기만 하는 화면이라 이렇게 연다 — `/dev/api-test` 는 데이터를 바꿀 수 있어 환경변수로만 연다.
 */
export default function ApiLivePage() {
    return (
        <DevGate>
            <ApiLive />
        </DevGate>
    );
}
