import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ApiConsole from "./ApiConsole";

export const metadata: Metadata = {
    title: "API 테스트 — NEMO",
    robots: { index: false, follow: false },
};

/**
 * 개발 서버에선 항상 열리고, 배포본에선 `NEXT_PUBLIC_ENABLE_DEV_TOOLS=true` 일 때만 열린다.
 * 폰으로 시험하려면 Vercel 미리보기 환경에 이 값을 켠다 — 프로덕션엔 켜지 말 것
 * (실제 데이터를 지우는 호출도 들어 있다).
 */
const enabled = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true";

export default function ApiTestPage() {
    if (!enabled) notFound();
    return <ApiConsole />;
}
