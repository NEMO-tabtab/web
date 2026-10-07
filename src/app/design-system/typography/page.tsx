import { Card, Heading, Text, textSizes, textWeights, toneClasses } from "@/components/common";
import { cn } from "@/lib/cn";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

const FACES = [
    {
        name: "font-display",
        family: "Gaegu (개구체)",
        rule: "제목 전용. 굵기 700 이 기본이고, 손글씨라 크게 키울수록 지저분해져서 h1 도 text-2xl 에서 멈춘다.",
    },
    {
        name: "font-sans",
        family: "Noto Sans KR",
        rule: "본문 · 라벨 · 버튼 · 숫자 전부. 읽는 글자는 모두 이쪽이다.",
    },
];

export default function TypographyPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Typography"
                description="제목은 Gaegu(개구체), 본문은 Noto Sans KR. 그리고 숫자는 언제나 sans 입니다."
            />

            <DocSection title="두 서체" description="서체는 둘뿐입니다. 역할이 겹치지 않게 경계를 분명히 둡니다.">
                <div className="grid gap-4 sm:grid-cols-2">
                    {FACES.map((face) => (
                        <Card key={face.name} padding="md" className="space-y-2">
                            <ClassName>{face.name}</ClassName>
                            <p
                                className={cn(
                                    "text-2xl leading-snug",
                                    face.name === "font-display" ? "font-display" : "font-sans font-bold",
                                )}
                            >
                                네모에 물건을 기록해요
                            </p>
                            <Text size="xs" tone="muted">
                                {face.family}
                            </Text>
                            <Text size="sm" tone="muted">
                                {face.rule}
                            </Text>
                        </Card>
                    ))}
                </div>
            </DocSection>

            <DocSection
                title="Heading"
                description="level 1~3 만 손글씨를 씁니다. 4~6 은 데이터 블록 라벨이라 sans 를 유지합니다."
            >
                <Card padding="lg" className="space-y-6">
                    {LEVELS.map((level) => (
                        <div key={level} className="space-y-1">
                            <p className="text-ink-soft text-[11px]">
                                level={level} · {level <= 3 ? "font-display (Gaegu)" : "font-sans (Noto Sans KR)"}
                            </p>
                            <Heading level={level} as="p">
                                내 물건 <span className="font-sans tabular-nums">59</span>개
                            </Heading>
                        </div>
                    ))}
                </Card>
            </DocSection>

            <DocSection
                title="숫자는 항상 sans"
                description="Gaegu 는 숫자 글리프가 불규칙하고 폭이 들쭉날쭉합니다. 금액·수량은 제목 안에서도 sans 로 빠져나옵니다."
            >
                <ExamplePreview className="flex-col items-start gap-6" caption="font-sans tabular-nums">
                    <div className="space-y-1">
                        <p className="text-ink-soft text-[11px]">Do — 숫자만 sans</p>
                        <p className="font-display text-3xl">
                            총 자산 <span className="font-sans tabular-nums">1,240,000</span>원
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-ink-soft text-[11px]">Don&apos;t — 숫자까지 손글씨</p>
                        <p className="font-display text-ink-soft text-3xl">총 자산 1,240,000원</p>
                    </div>
                </ExamplePreview>
                <Card variant="sunken" padding="sm">
                    <Text size="sm" tone="muted">
                        표·목록처럼 숫자가 세로로 쌓이는 자리에는 <ClassName>tabular-nums</ClassName> 까지 함께 걸어
                        자릿수를 맞춥니다.
                    </Text>
                </Card>
            </DocSection>

            <DocSection
                title=".scribble"
                description="페이지 제목 아래 손그림 밑줄. 제목 요소 자체에 붙여야 밑줄 폭이 글자를 따라갑니다."
            >
                <ExamplePreview
                    className="flex-col items-start gap-6"
                    caption="한 화면에 하나 — 제목이 둘로 보이면 과하다"
                >
                    <h3 className="scribble font-display text-2xl">내 물건</h3>
                    <p className="text-ink-soft max-w-md text-sm">
                        본문·라벨·버튼에는 절대 붙이지 않습니다. 밑줄은 &ldquo;여기가 이 화면의 제목&rdquo;이라는 신호
                        하나만 담당합니다.
                    </p>
                </ExamplePreview>
            </DocSection>

            <DocSection title="Text — size">
                <Card padding="lg" className="space-y-3">
                    {(Object.keys(textSizes) as Array<keyof typeof textSizes>).map((size) => (
                        <div key={size} className="flex items-baseline gap-4">
                            <span className="w-16 shrink-0">
                                <ClassName>{size}</ClassName>
                            </span>
                            <Text size={size}>가치 있는 물건을 기록하세요</Text>
                        </div>
                    ))}
                </Card>
            </DocSection>

            <DocSection
                title="Text — weight"
                description="본문은 normal, 라벨·강조는 bold. 그 사이는 거의 쓰지 않습니다."
            >
                <Card padding="lg" className="space-y-3">
                    {(Object.keys(textWeights) as Array<keyof typeof textWeights>).map((weight) => (
                        <div key={weight} className="flex items-baseline gap-4">
                            <span className="w-20 shrink-0">
                                <ClassName>{weight}</ClassName>
                            </span>
                            <Text weight={weight}>가치 있는 물건을 기록하세요</Text>
                        </div>
                    ))}
                </Card>
            </DocSection>

            <DocSection
                title="Text — tone"
                description="원시 클래스 문자열을 넘기던 color prop 대신 tone 을 씁니다. color 는 deprecated 이지만 계속 동작합니다."
            >
                <Card padding="lg" className="space-y-2">
                    {(Object.keys(toneClasses) as Array<keyof typeof toneClasses>).map((tone) => (
                        <div
                            key={tone}
                            className={cn(
                                "rounded-nemo flex items-baseline gap-4 px-3 py-2",
                                tone === "inverse" && "bg-ink",
                            )}
                        >
                            <span className="w-20 shrink-0">
                                <code
                                    className={cn(
                                        "font-sans text-[12px] font-bold",
                                        tone === "inverse" ? "text-paper" : "text-ink",
                                    )}
                                >
                                    {tone}
                                </code>
                            </span>
                            <Text tone={tone}>가치 있는 물건을 기록하세요</Text>
                        </div>
                    ))}
                </Card>
                <Card variant="sunken" padding="sm">
                    <Text size="sm" tone="muted">
                        <ClassName>cheek</ClassName> 은 애착도처럼 정서적인 표시에만 아주 드물게,{" "}
                        <ClassName>danger</ClassName> 는 삭제·오류 문구에만 씁니다. 나머지 강조는 색이 아니라 굵기와
                        채움으로 만듭니다.
                    </Text>
                </Card>
            </DocSection>
        </div>
    );
}
