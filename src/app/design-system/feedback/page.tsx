import {
    Button,
    Card,
    EmptyState,
    ErrorState,
    LoadingState,
    ProductCardSkeleton,
    Skeleton,
    Text,
} from "@/components/common";

import { ClassName, DocSection, PageHeader } from "../_components/DocSection";

export default function FeedbackPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Feedback"
                description="비어 있음 · 실패 · 로딩. 세 상태 모두 같은 높이(min-h-[18rem])와 같은 먹선 스티커 골격을 써서 화면이 튀지 않습니다."
            />

            <DocSection
                title="EmptyState"
                description="아이콘을 주지 않으면 네모가 대신 섭니다. 이 시스템에 점선은 없으므로 비어 있음은 캐릭터와 문장이 말합니다."
            >
                <EmptyState title="아직 등록된 물건이 없어요" description="첫 물건을 등록하면 여기에 표시됩니다." />
            </DocSection>

            <DocSection
                title="EmptyState — 아이콘 · 액션"
                description="맥락이 분명할 때는 캐릭터 대신 이모지를 세운다."
            >
                <EmptyState
                    icon="🔍"
                    title="검색 결과가 없어요"
                    description="다른 이름이나 카테고리로 찾아보세요."
                    action={<Button variant="secondary">필터 초기화</Button>}
                />
                <Text size="sm" tone="muted">
                    <ClassName>action</ClassName> 에는 다음 걸음이 분명할 때만 버튼을 넣으세요. 빈 화면에서 주 동작(먹
                    채움)까지 쓰면 강조가 두 겹이 됩니다.
                </Text>
            </DocSection>

            <DocSection
                title="ErrorState"
                description="EmptyState 와 같은 골격. danger 는 아이콘 웰에만 남기고 표면은 물들이지 않는다."
            >
                <ErrorState
                    title="제품 목록을 불러오는데 실패했습니다"
                    description="잠시 후 다시 시도해주세요."
                    action={<Button variant="secondary">다시 시도</Button>}
                />
                <Text size="sm" tone="muted">
                    컨테이너에 <ClassName>role=&quot;alert&quot;</ClassName> 가 붙어 있어 실패가 보조기기에 즉시
                    전달됩니다.
                </Text>
            </DocSection>

            <DocSection
                title="LoadingState"
                description="무엇이 올지 모를 때의 기본 로딩. 큰 스피너 대신 작은 먹선 원 하나와 한마디."
            >
                <Card padding="none">
                    <LoadingState label="제품 정보를 불러오는 중…" />
                </Card>
                <Text size="sm" tone="muted">
                    라벨 기본값은 <ClassName>여는 중…</ClassName> 입니다. 카드 없이 흐름에 한 줄만 놓고 싶으면{" "}
                    <ClassName>py-16 text-center text-sm text-ink-soft</ClassName> 문단으로 대신해도 됩니다.
                </Text>
            </DocSection>

            <DocSection
                title="Skeleton"
                description="레이아웃을 아는 화면에서는 스피너 대신 스켈레톤을 씁니다 — 로딩이 끝나도 콘텐츠가 튀지 않습니다."
            >
                <Card padding="lg" className="space-y-4">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton lines={3} />
                </Card>
                <Text size="sm" tone="muted">
                    자리 표시는 색이 아니라 옅은 면(<ClassName>bg-cream</ClassName>)으로만 알립니다. 제품 목록 로딩
                    화면은 실제 카드 골격을 흉내내는 <ClassName>ProductCardSkeleton</ClassName> 을 씁니다.
                </Text>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <ProductCardSkeleton key={index} />
                    ))}
                </div>
            </DocSection>

            <DocSection title="고르는 법">
                <Card variant="sunken" padding="md">
                    <ul className="space-y-2.5">
                        <li>
                            <Text size="sm" tone="muted">
                                올 것의 모양을 안다 → <ClassName>Skeleton</ClassName>
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                모양을 모른다 · 짧게 기다린다 → <ClassName>LoadingState</ClassName>
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                다 왔는데 0건이다 → <ClassName>EmptyState</ClassName>
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                못 왔다 → <ClassName>ErrorState</ClassName> (되돌릴 동작을 함께 준다)
                            </Text>
                        </li>
                    </ul>
                </Card>
            </DocSection>
        </div>
    );
}
