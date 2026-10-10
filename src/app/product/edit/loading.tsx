import { LoadingState, PageShell } from "@/components/common";

export default function Loading() {
    return (
        <PageShell>
            <LoadingState label="제품 정보를 여는 중…" />
        </PageShell>
    );
}
