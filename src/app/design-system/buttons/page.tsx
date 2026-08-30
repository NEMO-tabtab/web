import { Button, buttonSizes, buttonVariants, Text } from "@/components/common";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

// variant 목록을 컴포넌트에서 직접 가져온다 — 손으로 나열하면 문서가 드리프트한다.
const VARIANTS = Object.keys(buttonVariants) as Array<keyof typeof buttonVariants>;
const SIZES = Object.keys(buttonSizes) as Array<keyof typeof buttonSizes>;

/** 각 variant 가 강조 위계 몇 단계인지 — 색이 아니라 채움과 선의 굵기로 갈린다 */
const VARIANT_NOTES: Record<string, string> = {
    primary: "강조 1 — 먹 채움. 한 화면에 하나가 원칙입니다.",
    secondary: "강조 2 — 먹선 아웃라인 스티커.",
    outline: "강조 3 — 옅은 헤어라인. secondary 보다 한 단계 약합니다.",
    ghost: "강조 4 — 테두리 없음. 보조 동작 전용입니다.",
    danger: "삭제·오류 전용. 눈에 띄게 하려고 쓰지 않습니다.",
};

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
        <line x1="12" x2="12" y1="5" y2="19" />
        <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
);

export default function ButtonsPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Button"
                description="모든 버튼이 2px 먹선 스티커입니다. 그림자는 없고, 누르면 종이가 1px 눌리는 피드백만 돌아옵니다."
            />

            <DocSection title="Variants" description="강조는 색이 아니라 채움과 선으로 만듭니다.">
                <ExamplePreview caption={VARIANTS.map((v) => `variant="${v}"`).join("  ·  ")}>
                    {VARIANTS.map((variant) => (
                        <Button key={variant} variant={variant}>
                            {variant}
                        </Button>
                    ))}
                </ExamplePreview>
                <ul className="space-y-1.5">
                    {VARIANTS.map((variant) => (
                        <li key={variant} className="flex gap-3 text-sm">
                            <span className="w-20 shrink-0">
                                <ClassName>{variant}</ClassName>
                            </span>
                            <span className="text-ink-soft">{VARIANT_NOTES[variant]}</span>
                        </li>
                    ))}
                </ul>
                <Text size="sm" tone="muted">
                    <ClassName>ghost</ClassName> 는 테두리가 없어 위 예시의 cream 무대에서는 경계가 보이지 않습니다 —
                    paper 위에서 쓰는 것을 전제로 한 variant 입니다. <ClassName>gradient</ClassName> 는 deprecated
                    입니다: 그라디언트는 이 시스템에 없으며 <ClassName>primary</ClassName> 로 렌더링됩니다.
                </Text>
            </DocSection>

            <DocSection title="Sizes" description="고정 높이라 한 줄에 나란히 두어도 베이스라인이 맞습니다.">
                <ExamplePreview caption={SIZES.map((s) => `size="${s}"`).join("  ·  ")}>
                    {SIZES.map((size) => (
                        <Button key={size} size={size}>
                            {size}
                        </Button>
                    ))}
                </ExamplePreview>
            </DocSection>

            <DocSection
                title="Shapes"
                description="rectangle 은 .sticker 와 만나 네 귀퉁이가 모두 다른 비대칭 손그림 모서리가 됩니다."
            >
                <ExamplePreview caption='shape="rectangle" · "pill" · "circle"'>
                    <Button shape="rectangle">rectangle</Button>
                    <Button shape="pill">pill</Button>
                    <Button shape="circle" leftIcon={<PlusIcon />} aria-label="제품 추가" />
                    <Button variant="secondary" shape="circle" leftIcon={<PlusIcon />} aria-label="제품 추가" />
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    <ClassName>circle</ClassName> 은 children 을 렌더링하지 않습니다 — 아이콘만 남으므로{" "}
                    <ClassName>aria-label</ClassName> 을 반드시 넘기세요.
                </Text>
            </DocSection>

            <DocSection title="With icons">
                <ExamplePreview caption="leftIcon · rightIcon">
                    <Button leftIcon={<PlusIcon />}>제품 등록</Button>
                    <Button variant="secondary" rightIcon={<PlusIcon />}>
                        더 보기
                    </Button>
                </ExamplePreview>
            </DocSection>

            <DocSection
                title="States"
                description="isLoading 은 자동으로 disabled 가 되고 leftIcon 을 스피너로 바꿉니다."
            >
                <ExamplePreview caption="disabled · isLoading">
                    <Button disabled>disabled</Button>
                    <Button variant="secondary" disabled>
                        disabled
                    </Button>
                    <Button isLoading>저장 중</Button>
                    <Button variant="secondary" isLoading>
                        저장 중
                    </Button>
                </ExamplePreview>
            </DocSection>

            <DocSection title="Full width" description="폼 제출처럼 화면 폭을 다 쓰는 동작에만 씁니다.">
                <ExamplePreview className="flex-col">
                    <Button fullWidth>제품 등록</Button>
                    <Button variant="secondary" fullWidth>
                        취소
                    </Button>
                </ExamplePreview>
            </DocSection>

            <DocSection
                title="삭제 동작"
                description="danger 는 되돌릴 수 없는 동작에만. 확인 단계에서 한 번만 등장합니다."
            >
                <ExamplePreview caption='variant="danger"'>
                    <Button variant="danger">삭제</Button>
                    <Button variant="secondary">취소</Button>
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    삭제 확인처럼 danger 와 나란히 둘 때 취소는 <ClassName>secondary</ClassName> 입니다. 두 버튼을 모두
                    채우면 어느 쪽이 위험한지 읽히지 않습니다.
                </Text>
            </DocSection>
        </div>
    );
}
