import { PageShell, ProductCardSkeleton, Skeleton } from "@/components/common";

export default function Loading() {
    return (
        <PageShell width="wide" className="space-y-5">
            {/* 제목 줄 — 실제 헤더(제목 + 개수)와 같은 자리를 미리 잡아 화면이 튀지 않게 한다 */}
            <div className="flex items-start justify-between gap-4">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-10" />
            </div>

            {/* 카드가 채워질 때와 같은 기울기를 미리 준다 */}
            <div className="paste-grid grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(9.75rem,1fr))]">
                {Array.from({ length: 8 }).map((_, index) => (
                    <ProductCardSkeleton key={index} />
                ))}
            </div>
        </PageShell>
    );
}
