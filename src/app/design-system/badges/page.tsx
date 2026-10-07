import { Badge, badgeSizes, badgeVariants, Text } from "@/components/common";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

const VARIANTS = Object.keys(badgeVariants) as Array<keyof typeof badgeVariants>;
const SIZES = Object.keys(badgeSizes) as Array<keyof typeof badgeSizes>;

const LABELS: Record<string, string> = {
    neutral: "미분류",
    ink: "NEW",
    warning: "확인 필요",
    success: "정상",
    danger: "분실",
};

const VARIANT_NOTES: Record<string, string> = {
    neutral: "cream 면 + 옅은 헤어라인. 분류·수량 같은 평상시 라벨.",
    ink: "먹 채움. 배지에서 낼 수 있는 가장 강한 강조.",
    warning: "색 없이 먹선 아웃라인. 주의는 색이 아니라 문구가 전합니다.",
    success: "색 없이 먹선 아웃라인. warning 과 같은 스킨입니다.",
    danger: "danger 먹선 + danger 글자. 분실·오류 상태 전용.",
};

export default function BadgesPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Badge"
                description="상태를 한 단어로 얹는 알약. 색을 쓰는 것은 danger 하나뿐이고, 나머지는 채움과 선으로 갈립니다."
            />

            <DocSection title="Variants">
                <ExamplePreview caption={VARIANTS.map((v) => `variant="${v}"`).join("  ·  ")}>
                    {VARIANTS.map((variant) => (
                        <Badge key={variant} variant={variant}>
                            {LABELS[variant] ?? variant}
                        </Badge>
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
                    <ClassName>warning</ClassName> 과 <ClassName>success</ClassName> 는 지금 똑같이 렌더링됩니다 — 색을
                    걷어내고 나면 남는 것이 같은 먹선 아웃라인이기 때문입니다. 두 상태를 구분하는 것은 배지 색이 아니라
                    배지 안의 문구입니다. <ClassName>brand</ClassName> 는 deprecated 이며 <ClassName>ink</ClassName> 로
                    렌더링됩니다.
                </Text>
            </DocSection>

            <DocSection title="Sizes" description="본문에 섞여 붙는 라벨이라 두 단계면 충분합니다.">
                <ExamplePreview caption={SIZES.map((s) => `size="${s}"`).join("  ·  ")}>
                    {SIZES.map((size) => (
                        <Badge key={size} variant="ink" size={size}>
                            {size}
                        </Badge>
                    ))}
                </ExamplePreview>
            </DocSection>

            <DocSection
                title="숫자 배지"
                description="Badge 는 내부에서 font-sans tabular-nums 를 강제합니다 — 개수가 바뀌어도 폭이 흔들리지 않습니다."
            >
                <ExamplePreview caption="수량·개수는 손글씨가 아니라 본문 서체로">
                    <Badge variant="neutral">12</Badge>
                    <Badge variant="neutral">128</Badge>
                    <Badge variant="ink">3</Badge>
                    <Badge variant="ink">99+</Badge>
                </ExamplePreview>
            </DocSection>

            <DocSection title="사용 규칙">
                <ul className="space-y-3 text-sm">
                    <li className="flex gap-3">
                        <span className="text-ink w-12 shrink-0 font-bold">Do</span>
                        <span className="text-ink-soft">
                            보관 중·분실처럼 실제로 바뀌는 상태에만 붙입니다. 배지는 값이지 장식이 아닙니다.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-ink w-12 shrink-0 font-bold">Do</span>
                        <span className="text-ink-soft">
                            강조가 필요하면 <ClassName>ink</ClassName> 입니다. 먹 채움이 이 시스템의 최상위 강조입니다.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-ink w-12 shrink-0 font-bold">Don&apos;t</span>
                        <span className="text-ink-soft">
                            눈에 띄게 하려고 <ClassName>danger</ClassName> 를 쓰지 마세요. danger 가 흔해지면 진짜
                            오류가 안 읽힙니다.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-ink w-12 shrink-0 font-bold">Don&apos;t</span>
                        <span className="text-ink-soft">
                            한 줄에 배지를 셋 이상 늘어놓지 마세요. 강조가 셋이면 강조가 없는 것과 같습니다.
                        </span>
                    </li>
                </ul>
            </DocSection>
        </div>
    );
}
