import { Card, ICON_NAMES, Icon, Text, categoryIcon } from "@/components/common";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

const CATEGORIES = ["전자기기", "가구", "의류", "도서", "기타"];

const SIZES = [
    { cls: "text-sm", use: "글자 옆 · 링크 화살표" },
    { cls: "text-lg", use: "목록 줄 끝 · 입력 칸" },
    { cls: "text-2xl", use: "떠 있는 버튼 · 사진 칸" },
    { cls: "text-3xl", use: "카테고리 카드" },
];

export default function IconsPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Icons"
                description="앱 전용 손그림 아이콘. 하단 내비 아이콘과 같은 결 — 24칸 SVG, 먹선 2px, 둥근 끝, #rough-line-sm 필터. 컬러 이모지와 아이콘 폰트 대신 이것을 씁니다."
            />

            <DocSection
                title="목록"
                description="이름으로 부릅니다. 없는 아이콘이 필요하면 화면에 따로 그리지 말고 Icon.tsx 에 같은 결로 더합니다."
            >
                <Card padding="md">
                    <ul className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                        {ICON_NAMES.map((name) => (
                            <li key={name} className="flex flex-col items-center gap-2 text-center">
                                <Icon name={name} className="text-2xl" />
                                <span className="break-all font-mono text-[11px] text-ink-soft">{name}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </DocSection>

            <DocSection title="카테고리" description="categoryIcon(카테고리 이름) — 모르는 카테고리는 상자.">
                <ExamplePreview>
                    <div className="flex flex-wrap gap-6">
                        {CATEGORIES.map((name) => (
                            <div key={name} className="flex flex-col items-center gap-1.5">
                                <Icon name={categoryIcon(name)} className="text-3xl" />
                                <Text size="sm" weight="bold">
                                    {name}
                                </Text>
                            </div>
                        ))}
                    </div>
                </ExamplePreview>
            </DocSection>

            <DocSection
                title="크기"
                description="크기는 글자 크기를 따릅니다(기본 1em). 아이콘 폰트처럼 text-* 로 줍니다."
            >
                <Card padding="none" className="overflow-hidden">
                    <ul>
                        {SIZES.map(({ cls, use }, index) => (
                            <li
                                key={cls}
                                className={`flex items-center justify-between gap-4 px-4 py-3 ${index > 0 ? "border-t border-line" : ""}`}
                            >
                                <span className="flex items-center gap-3">
                                    <Icon name="box" className={cls} />
                                    <ClassName>{cls}</ClassName>
                                </span>
                                <Text size="sm" tone="muted">
                                    {use}
                                </Text>
                            </li>
                        ))}
                    </ul>
                </Card>
            </DocSection>

            <DocSection
                title="접근성"
                description="기본은 장식(aria-hidden). 아이콘만 있는 버튼은 버튼에 aria-label 을 달고, 아이콘 자체가 뜻을 전해야 하면 title 을 줍니다."
            >
                <ExamplePreview>
                    <div className="flex items-center gap-4">
                        <Icon name="warning" title="주의" className="text-2xl text-danger" />
                        <Text size="sm" tone="muted">
                            &lt;Icon name=&quot;warning&quot; title=&quot;주의&quot; /&gt;
                        </Text>
                    </div>
                </ExamplePreview>
            </DocSection>
        </div>
    );
}
