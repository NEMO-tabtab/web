import { Card, cardPaddings, cardVariants, Heading, Text } from "@/components/common";
import { NemoLogo } from "@/components/NemoLogo";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

const VARIANTS = Object.keys(cardVariants) as Array<keyof typeof cardVariants>;
const PADDINGS = Object.keys(cardPaddings) as Array<keyof typeof cardPaddings>;

/** 손그림 시스템에는 표면이 둘뿐이다 — 먹선 스티커와 가라앉은 cream 면 */
const VARIANT_NOTES: Record<string, string> = {
    default: "2px 먹선 + 네 귀퉁이가 모두 다른 비대칭 모서리. 기본 표면.",
    outline: "deprecated — default 와 동일. 먹선 아웃라인이 이미 기본입니다.",
    sticker: "deprecated — default 와 동일. 스티커가 곧 기본 표면입니다.",
    sunken: "옅은 헤어라인 + cream. 카드 안에 카드를 중첩할 때.",
};

const GRID_ITEMS = ["카메라", "시계", "가방", "신발", "자전거", "키보드"];

export default function CardsPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Card"
                description="종이에 붙인 스티커 한 장이 카드입니다. 그림자·블러·글래스모피즘은 이 시스템에 없습니다."
            />

            <DocSection
                title="Variants"
                description="먹선 스티커(default)와 가라앉은 면(sunken), 둘뿐입니다. 나머지는 마이그레이션용 별칭입니다."
            >
                <div className="grid gap-6 sm:grid-cols-2">
                    {VARIANTS.map((variant) => (
                        <Card key={variant} variant={variant} padding="md" className="space-y-2">
                            <Heading level={6} as="p">
                                {variant}
                            </Heading>
                            <Text size="sm" tone="muted">
                                {VARIANT_NOTES[variant]}
                            </Text>
                        </Card>
                    ))}
                </div>
                <Text size="sm" tone="muted">
                    <ClassName>outline</ClassName> 과 <ClassName>sticker</ClassName> 는 <ClassName>default</ClassName>{" "}
                    와 똑같이 렌더링됩니다 — 예전 3단계 표면 구분이 사라진 자리입니다. 새 코드는{" "}
                    <ClassName>default</ClassName> 를 쓰세요. <ClassName>glass</ClassName> 도 deprecated 이며{" "}
                    <ClassName>default</ClassName> 로 렌더링됩니다.
                </Text>
            </DocSection>

            <DocSection
                title="중첩 규칙"
                description="그림자가 없으므로 카드는 오직 선에만 의존합니다. 같은 굵기의 먹선을 겹치면 경계가 뭉갭니다."
            >
                <div className="grid gap-6 sm:grid-cols-2">
                    <Card variant="default" padding="md" className="space-y-3">
                        <Text size="sm" weight="bold">
                            Do — 안쪽은 sunken
                        </Text>
                        <Card variant="sunken" padding="sm">
                            <Text size="sm" tone="muted">
                                옅은 헤어라인 + cream 이라 바깥 먹선과 구분됩니다.
                            </Text>
                        </Card>
                    </Card>
                    <Card variant="default" padding="md" className="space-y-3">
                        <Text size="sm" weight="bold">
                            Don&apos;t — default 중첩
                        </Text>
                        <Card variant="default" padding="sm">
                            <Text size="sm" tone="muted">
                                2px 먹선이 2px 먹선을 감싸 어느 쪽이 바깥인지 읽히지 않습니다.
                            </Text>
                        </Card>
                    </Card>
                </div>
            </DocSection>

            <DocSection
                title="카드 해부"
                description="이미지 영역은 cream 면 + 콘택트 섀도, 내부 구분은 카드 테두리와 같은 굵기의 먹선입니다."
            >
                <div className="max-w-[220px]">
                    <Card variant="default" padding="none" className="overflow-hidden">
                        {/* .obj-stage 는 오브제 아래 타원 그림자, .print-grain 은 5% 노이즈 — 부모가 relative 여야 한다 */}
                        <div className="obj-stage bg-cream relative flex aspect-square items-center justify-center overflow-hidden">
                            <NemoLogo size={72} />
                            <span aria-hidden="true" className="print-grain" />
                        </div>
                        {/* 카드 내부 구분선은 border-t-2 border-ink — 카드 테두리와 같은 굵기로 끊는다 */}
                        <div className="border-ink border-t-2 px-2.5 py-1.5">
                            <p className="text-ink truncate text-[13px] font-bold">라이카 M6</p>
                            {/* 금액은 반드시 font-sans + tabular-nums — Gaegu 숫자 글리프는 폭이 불규칙하다 */}
                            <p className="text-ink-soft font-sans text-[11px] tabular-nums">1,850,000원</p>
                        </div>
                    </Card>
                </div>
                <Text size="sm" tone="muted">
                    이미지 영역에는 <ClassName>bg-cream</ClassName> · <ClassName>obj-stage</ClassName> ·{" "}
                    <ClassName>print-grain</ClassName> 을 함께 씁니다. 카드에{" "}
                    <ClassName>padding=&quot;none&quot;</ClassName> 과 <ClassName>overflow-hidden</ClassName> 을 주어야
                    이미지가 비대칭 모서리에 맞게 잘립니다.
                </Text>
            </DocSection>

            <DocSection
                title="Interactive"
                description="누를 수 있는 카드는 뜨지 않습니다 — 종이가 1px 눌리는 피드백만 줍니다."
            >
                <div className="grid gap-6 sm:grid-cols-2">
                    <Card variant="default" padding="md" interactive>
                        <Text size="sm">눌러보세요 — translateY(1px)</Text>
                    </Card>
                    <Card variant="sunken" padding="md" interactive>
                        <Text size="sm">sunken 도 같은 피드백입니다</Text>
                    </Card>
                </div>
                <Text size="sm" tone="muted">
                    실제 이동이 있는 카드는 <ClassName>div</ClassName> 가 아니라 <ClassName>Link</ClassName> 여야
                    합니다. 그럴 때는 Card 대신 <ClassName>sticker sticker-press rounded-nemo</ClassName> 를 Link 에
                    직접 얹으세요.
                </Text>
            </DocSection>

            <DocSection
                title="카드 그리드"
                description=".paste-grid 를 그리드 컨테이너에 붙이면 자식들이 교차로 기웁니다."
            >
                <div className="paste-grid grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {GRID_ITEMS.map((item) => (
                        <Card key={item} variant="default" padding="sm">
                            <Text size="sm" weight="bold">
                                {item}
                            </Text>
                        </Card>
                    ))}
                </div>
                <Text size="sm" tone="muted">
                    회전은 ±0.4~0.7° 로 아주 얕습니다 — 손으로 붙인 티만 나고 읽기는 방해하지 않는 각도입니다. 자식이
                    아니라 <ClassName>그리드 컨테이너</ClassName> 에 붙여야 동작합니다.
                </Text>
            </DocSection>

            <DocSection title="Padding">
                <ExamplePreview className="flex-col items-stretch">
                    {PADDINGS.map((padding) => (
                        <Card key={padding} variant="default" padding={padding}>
                            <Text size="sm">padding=&quot;{padding}&quot;</Text>
                        </Card>
                    ))}
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    <ClassName>none</ClassName> 은 이미지처럼 모서리까지 꽉 차는 내용을 넣을 때만 씁니다. 텍스트를 바로
                    넣으면 먹선에 글자가 붙습니다.
                </Text>
            </DocSection>
        </div>
    );
}
