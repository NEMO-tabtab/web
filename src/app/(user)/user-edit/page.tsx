import Link from "next/link";

import { EmptyState, PageHeader, PageShell } from "@/components/common";

/**
 * 프로필 수정은 잠시 닫아 둔다 (#104).
 *
 * 예전 화면은 개인정보를 암호화되지 않은 주소와 고정된 사용자 번호로 주고받았다.
 * 로그인 상태와 서버의 토큰 검증이 준비되면 `src/lib/api` 를 거치는 화면으로 다시 연다.
 */
export default function UserEditPage() {
    return (
        <PageShell className="space-y-6">
            <PageHeader title="프로필 수정" />
            <EmptyState
                title="프로필 수정은 준비 중이에요"
                description="로그인 기능을 다듬는 동안 잠시 닫아 두었어요. 기록한 물건은 그대로 쓸 수 있어요."
                action={
                    <Link href="/user-info" className="text-sm font-bold underline underline-offset-4">
                        마이로 돌아가기
                    </Link>
                }
            />
        </PageShell>
    );
}
