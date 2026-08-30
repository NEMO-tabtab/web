"use client";

import Link from "next/link";

import { Button, ErrorState, PageShell } from "@/components/common";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <PageShell>
            <ErrorState
                title="제품 정보를 불러오지 못했어요"
                description="잠시 후 다시 시도해주세요."
                action={
                    // 수정 화면은 내비가 숨겨지는 몰입 흐름이라 빠져나갈 길을 함께 둔다
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button variant="primary" shape="pill" onClick={reset}>
                            다시 시도
                        </Button>
                        <Link
                            href="/product"
                            className="sticker sticker-press bg-paper rounded-full px-4 py-2 text-sm font-bold"
                        >
                            목록으로
                        </Link>
                    </div>
                }
            />
        </PageShell>
    );
}
