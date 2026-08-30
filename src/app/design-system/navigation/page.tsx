import BottomNavigation from "@/components/common/BottomNavigation";
import { Card, Text } from "@/components/common";
import { cn } from "@/lib/cn";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

/** 다섯 갈래 — 이 앱의 주요 메뉴는 여기서 늘어나지 않는다 */
const TABS = [
    { label: "홈", href: "/" },
    { label: "제품", href: "/product" },
    { label: "등록", href: "/product/add" },
    { label: "분석", href: "/analysis" },
    { label: "마이", href: "/user-info" },
];

/** 좁은 화면 / 넓은 화면 — 같은 컴포넌트가 CSS 만으로 두 모습이 된다 */
const MODES = [
    {
        title: "좁은 화면 — 하단 탭 바",
        cls: "fixed inset-x-0 bottom-0 z-40",
        body: "화면 최하단에 고정. 물결 경계(.wavy-edge)가 위쪽 가로선으로 그려지고, pb-safe 가 홈 인디케이터 여백을 확보한다.",
    },
    {
        title: "넓은 화면(sm~) — 세로 레일",
        cls: "sm:relative sm:w-[92px] sm:h-dvh",
        body: "흐름 안으로 들어가 왼쪽 92px 레일이 된다. 본문이 남는 가로 공간을 그대로 쓰고, 물결은 오른쪽 세로선으로 바뀐다.",
    },
];

export default function NavigationPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Bottom Navigation"
                description="앱의 주요 메뉴. 좁은 화면에서는 하단 탭 바, 넓은 화면에서는 왼쪽 세로 레일이 됩니다. 활성 상태는 색이 아니라 획 두께로 표시합니다."
            />

            <DocSection
                title="Preview"
                description="실제로는 fixed 로 화면에 붙습니다. preview 를 주면 흐름 안에 놓여 문서에서 볼 수 있습니다."
            >
                <ExamplePreview className="justify-center" caption="<BottomNavigation preview /> — 390px 폭 기준">
                    <div className="bg-paper w-[390px] max-w-full">
                        <BottomNavigation preview />
                    </div>
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    <ClassName>preview</ClassName> 는 두 가지를 바꿉니다 — fixed 를 벗고 항상 가로 탭 바로 렌더하며,
                    활성 항목을 실제 경로 대신 <ClassName>홈</ClassName> 으로 고정합니다. 문서 라우트에서도 채워진
                    모습을 보여주기 위해서입니다.
                </Text>
                <Text size="sm" tone="muted">
                    물결 경계는 뷰포트 폭을 따르므로 640px 이상에서 이 미리보기를 보면 물결이 위가 아니라 오른쪽에
                    세로로 그려집니다 — 레일 모드의 경계선입니다.
                </Text>
            </DocSection>

            <DocSection title="두 모드" description="분기는 JS 가 아니라 CSS 라 뷰포트를 늘이면 즉시 따라옵니다.">
                <div className="grid gap-4 sm:grid-cols-2">
                    {MODES.map((mode) => (
                        <Card key={mode.title} padding="md" className="space-y-2">
                            <p className="font-display text-lg leading-snug">{mode.title}</p>
                            <ClassName>{mode.cls}</ClassName>
                            <Text size="sm" tone="muted">
                                {mode.body}
                            </Text>
                        </Card>
                    ))}
                </div>
            </DocSection>

            <DocSection
                title="갈래"
                description="다섯 개 고정. 여섯 번째가 필요해지면 메뉴가 아니라 정보 구조를 고칩니다."
            >
                <Card padding="none" className="overflow-hidden">
                    <ul>
                        {TABS.map((tab, index) => (
                            <li
                                key={tab.href}
                                className={cn(
                                    "flex items-baseline justify-between gap-4 px-4 py-2.5",
                                    index > 0 && "border-line border-t",
                                )}
                            >
                                <span className="text-sm font-bold">{tab.label}</span>
                                <ClassName>{tab.href}</ClassName>
                            </li>
                        ))}
                    </ul>
                </Card>
            </DocSection>

            <DocSection title="아이콘" description="색을 쓰지 않으므로 활성 여부는 획 두께가 말합니다.">
                <Card variant="sunken" padding="md">
                    <ul className="space-y-2.5">
                        <li>
                            <Text size="sm" tone="muted">
                                전부 stroke 기반 라인아트입니다. 활성이면 strokeWidth 가 2 → 2.6 으로 굵어지고 글자가{" "}
                                <ClassName>font-bold text-ink</ClassName>, 아니면 <ClassName>text-ink-soft</ClassName>{" "}
                                입니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                globals.css 의 <ClassName>nav[aria-label=&quot;주요 메뉴&quot;] svg</ClassName> 규칙이
                                내비 안의 모든 SVG 에 <ClassName>#rough-line-sm</ClassName> 을 걸어 줍니다 — 아이콘마다
                                filter 를 붙이지 않습니다.
                            </Text>
                        </li>
                    </ul>
                </Card>
            </DocSection>

            <DocSection title="구현 노트">
                <Card variant="sunken" padding="md">
                    <ul className="space-y-2.5">
                        <li>
                            <Text size="sm" tone="muted">
                                고정 모드는 <ClassName>z-40</ClassName> — 떠 있는 버튼(z-30) 위, 모달(z-50) 아래입니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                경계는 직선 보더가 아니라 <ClassName>.wavy-edge</ClassName> 물결선입니다. 물결이 내비
                                바깥 3px 에 얹히므로 내비는 static 이 아니라 relative 여야 합니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                활성 링크에 <ClassName>aria-current=&quot;page&quot;</ClassName> 가 붙고, 내비 자체는{" "}
                                <ClassName>aria-label=&quot;주요 메뉴&quot;</ClassName> 로 이름을 가집니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                몰입 플로우(<ClassName>/product/add</ClassName> · <ClassName>/product/edit</ClassName> ·{" "}
                                <ClassName>/barcode</ClassName>)에서는 저장 바·스캐너와 부딪히지 않도록 내비가 스스로
                                사라집니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                <ClassName>/design-system</ClassName> 전체는 AppChrome 이 루트 크롬을 꺼 둡니다 — 문서가
                                화면을 온전히 쓰기 위해서입니다.
                            </Text>
                        </li>
                    </ul>
                </Card>
            </DocSection>
        </div>
    );
}
