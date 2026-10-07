import { Button, Card, PageHeader as AppPageHeader, Section, Text } from "@/components/common";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

const WIDTHS = [
    { key: "narrow", value: "max-w-3xl", use: "폼 · 상세 · 분석 — 한 줄이 길어지면 읽기 힘든 화면" },
    { key: "wide", value: "max-w-7xl", use: "홈 · 목록 그리드 — 카드가 여러 열로 깔리는 화면" },
    { key: "full", value: "제한 없음", use: "스캐너처럼 화면을 꽉 채워야 하는 화면" },
];

export default function LayoutPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Page Layout"
                description="모든 페이지가 같은 폭·같은 여백·같은 제목 구조를 쓰도록 강제하는 세 컴포넌트."
            />

            <DocSection title="PageShell" description="페이지의 main 컨테이너. 여백을 여기서 한 번에 관리한다.">
                <Card padding="none" className="overflow-hidden">
                    {WIDTHS.map((w, i) => (
                        <div
                            key={w.key}
                            className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4 ${
                                i > 0 ? "border-ink border-t-2" : ""
                            }`}
                        >
                            <span className="w-36 shrink-0">
                                <ClassName>width=&quot;{w.key}&quot;</ClassName>
                            </span>
                            <span className="text-ink-soft w-28 shrink-0 font-sans text-[12px]">{w.value}</span>
                            <Text size="sm" tone="muted">
                                {w.use}
                            </Text>
                        </div>
                    ))}
                </Card>
                <Text size="sm" tone="muted">
                    루트 레이아웃이 이미 <ClassName>pb-16 sm:pb-0</ClassName> 으로 하단 탭 바 자리를 확보하므로
                    PageShell 은 <ClassName>pb-8</ClassName> 만 더한다. 페이지마다 손으로 붙이던 pb-20 / pb-24 / pb-32
                    를 대체한다.
                </Text>
            </DocSection>

            <DocSection title="PageHeader" description="제목 + 설명 + (선택) 뒤로가기 + (선택) 우측 액션.">
                <ExamplePreview className="block" caption="title · description · action">
                    <AppPageHeader
                        title="자산 분석"
                        description="나의 자산 가치 변동을 확인하세요."
                        action={
                            <Button variant="secondary" size="sm">
                                내보내기
                            </Button>
                        }
                    />
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    제목에는 낙서 밑줄(<ClassName>.scribble</ClassName>)이 기본으로 붙는다. 밑줄은 inline-block 이라
                    제목 요소 자체에 붙어야 글자 폭을 따라간다.
                </Text>
                <Text size="sm" tone="muted">
                    <ClassName>onBack</ClassName> 은 함수 prop 이라 호출부가 클라이언트 컴포넌트여야 한다. 서버
                    컴포넌트에서는 <ClassName>backHref</ClassName> 를 쓴다.
                </Text>
            </DocSection>

            <DocSection title="Section" description="제목 + 설명 + 우측 액션 + 본문. 페이지 안 블록 단위.">
                <Card padding="md">
                    <Section
                        title="내 보유 목록"
                        titleClassName="scribble"
                        description="최근 등록한 물건들입니다."
                        action={
                            <Button variant="ghost" size="sm">
                                전체보기
                            </Button>
                        }
                    >
                        <Card variant="sunken" padding="md">
                            <Text size="sm" tone="muted">
                                본문 슬롯
                            </Text>
                        </Card>
                    </Section>
                </Card>
                <Text size="sm" tone="muted">
                    섹션 제목에 밑줄을 넣고 싶으면 <ClassName>titleClassName=&quot;scribble&quot;</ClassName> 로 붙인다.
                    한 화면에 밑줄이 여럿이면 산만해지니 페이지 제목과 주요 섹션 하나 정도로 아낀다.
                </Text>
            </DocSection>
        </div>
    );
}
