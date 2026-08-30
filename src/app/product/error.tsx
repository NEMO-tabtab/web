"use client";

import { Button, ErrorState, PageShell } from "@/components/common";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <PageShell width="wide">
            <ErrorState
                title="제품 목록을 불러오지 못했어요"
                description="잠시 후 다시 시도해주세요."
                action={
                    // 이 화면의 유일한 동작이므로 강조 1(먹 채움)을 준다
                    <Button variant="primary" shape="pill" onClick={reset}>
                        다시 시도
                    </Button>
                }
            />
        </PageShell>
    );
}
