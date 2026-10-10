import Link from "next/link";

import { EmptyState, PageShell } from "@/components/common";

/**
 * 서비스 워커가 미리 받아 두지 못한 화면을 오프라인에서 열었을 때 대신 보여준다.
 * 물건 데이터는 기기에 있으니, 미리 받아 둔 홈으로 돌려보낸다.
 */
export default function OfflinePage() {
    return (
        <PageShell>
            <EmptyState
                title="지금은 오프라인이에요"
                description="이 화면은 인터넷이 연결돼야 열 수 있어요. 기록해 둔 물건은 홈에서 그대로 볼 수 있어요."
                action={
                    <Link
                        href="/"
                        className="sticker sticker-press bg-ink font-display text-paper rounded-full px-5 py-2.5"
                    >
                        홈으로
                    </Link>
                }
            />
        </PageShell>
    );
}
