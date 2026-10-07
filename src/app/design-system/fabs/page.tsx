import { Card, FAB, fabSizes, fabVariants, Text } from "@/components/common";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

const VARIANTS = Object.keys(fabVariants) as Array<keyof typeof fabVariants>;
const SIZES = Object.keys(fabSizes) as Array<keyof typeof fabSizes>;

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
        <line x1="12" x2="12" y1="5" y2="19" />
        <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
);

export default function FabsPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="FAB"
                description="떠 있는 동그란 먹선 버튼. 그림자로 띄우지 않고, 눌리는 반응(sticker-press)으로만 살아 있음을 알립니다."
            />

            <DocSection
                title="Variants"
                description="강조 단계는 색이 아니라 채움입니다 — 아웃라인이거나 먹 채움이거나."
            >
                <ExamplePreview className="gap-8" caption={VARIANTS.map((v) => `variant="${v}"`).join("  ·  ")}>
                    {VARIANTS.map((variant) => (
                        <FAB key={variant} variant={variant} icon={<PlusIcon />} aria-label={`추가 (${variant})`} />
                    ))}
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    <ClassName>solid</ClassName> 은 먹선 아웃라인(강조 2단계), <ClassName>ink</ClassName> 는 먹
                    채움(강조 1단계)입니다. <ClassName>gradient</ClassName> 는 deprecated 이며{" "}
                    <ClassName>ink</ClassName> 로 렌더링됩니다.
                </Text>
            </DocSection>

            <DocSection title="Sizes" description="화면 위에 떠 있는 버튼은 md·lg 두 치수면 충분합니다.">
                <ExamplePreview className="gap-8" caption={SIZES.map((s) => `size="${s}"`).join("  ·  ")}>
                    {SIZES.map((size) => (
                        <FAB key={size} size={size} icon={<PlusIcon />} aria-label={`추가 (${size})`} />
                    ))}
                </ExamplePreview>
            </DocSection>

            <DocSection
                title="링크로"
                description="href 를 넘기면 next/link 로 렌더링되며 aria-label 도 그대로 전달됩니다."
            >
                <ExamplePreview className="gap-8">
                    <FAB href="/product/add" variant="ink" icon={<PlusIcon />} aria-label="물건 등록" />
                </ExamplePreview>
            </DocSection>

            <DocSection title="쓰는 규칙">
                <Card variant="sunken" padding="md">
                    <ul className="space-y-2.5">
                        <li>
                            <Text size="sm" tone="muted">
                                아이콘만 남으므로 <ClassName>aria-label</ClassName> 은 선택이 아니라 필수입니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                떠 있는 버튼은 <ClassName>z-30</ClassName> — 하단 내비(z-40) 아래, 본문 위입니다. 내비와
                                겹치지 않도록 <ClassName>bottom</ClassName> 값을 내비 높이만큼 띄우세요.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                한 화면에 하나만. 두 개가 떠 있으면 어느 쪽이 주 동작인지 사라집니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                아이콘은 stroke 기반 라인아트를 쓰세요. 면으로 채운 아이콘은 먹선 테두리와 붙어
                                뭉갭니다.
                            </Text>
                        </li>
                    </ul>
                </Card>
            </DocSection>
        </div>
    );
}
