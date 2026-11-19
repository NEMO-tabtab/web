import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ApiLive from "./ApiLive";

export const metadata: Metadata = {
    title: "API 연결 확인 — NEMO",
    robots: { index: false, follow: false },
};

/** `/dev/api-test` 와 같은 조건으로 열린다 — 개발 서버, 또는 `NEXT_PUBLIC_ENABLE_DEV_TOOLS=true` 인 배포본 */
const enabled = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true";

export default function ApiLivePage() {
    if (!enabled) notFound();
    return <ApiLive />;
}
