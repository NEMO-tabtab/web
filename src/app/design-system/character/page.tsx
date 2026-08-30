import { Card, Text } from "@/components/common";
import { NemoFace } from "@/components/NemoFace";
import { NemoLogo } from "@/components/NemoLogo";
import { cn } from "@/lib/cn";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

/** 캐릭터는 시안 크기 그대로 놓았을 때 가장 손맛이 산다 — 표에 실제로 쓰는 치수만 남긴다 */
const FACE_SIZES = [
    { size: 64, use: "인라인 · 목록 옆" },
    { size: 96, use: "EmptyState 기본값" },
    { size: 120, use: "컴포넌트 기본값" },
    { size: 160, use: "온보딩 · 큰 안내" },
];

const LOGO_SIZES = [
    { size: 24, use: "좁은 화면 헤더" },
    { size: 28, use: "문서 상단 스트립" },
    { size: 36, use: "문서 사이드바" },
    { size: 56, use: "로그인 · 스플래시" },
];

/** 두 필터의 실제 파라미터. layout.tsx 의 정의와 값을 맞춰 적는다. */
const FILTERS = [
    {
        id: "#rough-line",
        params: "baseFrequency 0.045 · seed 7 · scale 2.8",
        body: "굵은 획(4~5px)용. 변위가 커서 60px 이상에서 손맛이 제대로 산다. NemoFace 가 쓴다.",
    },
    {
        id: "#rough-line-sm",
        params: "baseFrequency 0.09 · seed 3 · scale 1.3",
        body: "작은 도형용. 변위를 절반 이하로 줄여 획이 끊기지 않는다. NemoLogo 와 하단 내비 아이콘이 쓴다.",
    },
];

/** 필터 유무를 나란히 보여주기 위한 최소 도형 — 캐릭터의 몸통·테이프만 추린 것 */
function StrokeSample({ filter }: { filter?: string }) {
    return (
        <svg width="88" height="88" viewBox="0 0 100 100" aria-hidden="true" className="overflow-visible">
            <g filter={filter}>
                <rect x="14" y="20" width="72" height="66" rx="10" fill="#ffffff" stroke="#1c1b19" strokeWidth="5" />
                <path
                    d="M40 8 L60 8 L60 30 L55 34 L50 30 L45 34 L40 30 Z"
                    fill="#ffffff"
                    stroke="#1c1b19"
                    strokeWidth="5"
                    strokeLinejoin="round"
                />
                <path d="M32 62 h36" stroke="#1c1b19" strokeWidth="5" strokeLinecap="round" />
            </g>
        </svg>
    );
}

export default function CharacterPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Character & Logo"
                description="네모는 종이 상자에 테이프를 붙인 얼굴입니다. 두 개의 SVG 변위 필터가 모든 획에 손떨림을 얹습니다."
            />

            <DocSection
                title="NemoFace"
                description="풀 캐릭터 — 몸통·테이프·팔다리까지. 비어 있는 화면과 안내 문구의 화자입니다."
            >
                <ExamplePreview className="justify-center gap-10" caption="size 는 px 단위 정사각. 기본값 120">
                    {FACE_SIZES.map((item) => (
                        <div key={item.size} className="flex flex-col items-center gap-3">
                            <NemoFace size={item.size} />
                            <div className="text-center">
                                <p className="font-sans text-[11px] font-bold tabular-nums">{item.size}px</p>
                                <p className="text-ink-soft text-[11px]">{item.use}</p>
                            </div>
                        </div>
                    ))}
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    <ClassName>aria-hidden</ClassName> 이 박혀 있어 스크린 리더는 캐릭터를 읽지 않습니다. 뜻은 언제나 옆
                    문장이 전달해야 합니다.
                </Text>
            </DocSection>

            <DocSection
                title="NemoLogo"
                description="심볼 약식 — 팔다리를 덜어낸 앱 아이콘형. 헤더·스플래시처럼 좁은 자리에 씁니다."
            >
                <ExamplePreview className="justify-center gap-10" caption="size 는 px 단위 정사각. 기본값 40">
                    {LOGO_SIZES.map((item) => (
                        <div key={item.size} className="flex flex-col items-center gap-3">
                            <NemoLogo size={item.size} />
                            <div className="text-center">
                                <p className="font-sans text-[11px] font-bold tabular-nums">{item.size}px</p>
                                <p className="text-ink-soft text-[11px]">{item.use}</p>
                            </div>
                        </div>
                    ))}
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    24px 밑으로는 눈·입이 뭉개집니다. 더 작은 자리에는 심볼 대신 글자 로고를 쓰세요.
                </Text>
            </DocSection>

            <DocSection
                title="러프 라인 필터"
                description="손그림 느낌은 손으로 그린 패스가 아니라 feTurbulence + feDisplacementMap 으로 만듭니다. 곧은 패스를 그린 뒤 필터가 획을 밀어 흔듭니다."
            >
                <ExamplePreview
                    className="justify-center gap-12"
                    caption="같은 도형 — 왼쪽 필터 없음, 오른쪽 #rough-line"
                >
                    {[
                        { label: "필터 없음", filter: undefined },
                        { label: "#rough-line", filter: "url(#rough-line)" },
                    ].map((sample) => (
                        <div key={sample.label} className="flex flex-col items-center gap-3">
                            <StrokeSample filter={sample.filter} />
                            <p className="text-ink-soft font-sans text-[11px]">{sample.label}</p>
                        </div>
                    ))}
                </ExamplePreview>

                <Card padding="none" className="overflow-hidden">
                    <ul>
                        {FILTERS.map((filter, index) => (
                            <li
                                key={filter.id}
                                className={cn("space-y-1 px-4 py-3", index > 0 && "border-line border-t")}
                            >
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                                    <ClassName>{filter.id}</ClassName>
                                    <span className="text-ink-soft font-sans text-[11px] tabular-nums">
                                        {filter.params}
                                    </span>
                                </div>
                                <Text size="sm" tone="muted">
                                    {filter.body}
                                </Text>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Text size="sm" tone="muted">
                    두 필터는 <ClassName>src/app/layout.tsx</ClassName> 의 <ClassName>width=0</ClassName> SVG 안에 한
                    번만 정의됩니다. 전역이라 어느 페이지에서든{" "}
                    <ClassName>filter=&quot;url(#rough-line)&quot;</ClassName> 로 참조할 수 있습니다.
                </Text>
            </DocSection>

            <DocSection title="직접 쓸 때" description="캐릭터가 아닌 도형에 필터를 얹을 때 지켜야 할 것들.">
                <Card variant="sunken" padding="md">
                    <ul className="space-y-2.5">
                        <li>
                            <Text size="sm" tone="muted">
                                변위가 획을 viewBox 밖으로 밀어냅니다. SVG 에 <ClassName>overflow-visible</ClassName> 이
                                없으면 테두리가 잘립니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                작은 도형에 <ClassName>#rough-line</ClassName> 을 쓰면 scale 2.8 이 획을 무너뜨립니다.
                                40px 이하는 <ClassName>#rough-line-sm</ClassName> 을 쓰세요.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                하단 내비 아이콘은 globals.css 의{" "}
                                <ClassName>nav[aria-label=&quot;주요 메뉴&quot;] svg</ClassName> 규칙으로 필터가 자동
                                적용됩니다 — 아이콘마다 filter 속성을 붙이지 마세요.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                캐릭터 SVG 의 색은 토큰이 아니라 리터럴(#1c1b19 먹 · #f0c1b2 볼터치 · #ffffff 종이)로
                                박혀 있습니다. 토큰 값을 바꾸면 두 컴포넌트도 함께 고쳐야 합니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                볼터치는 캐릭터의 볼 두 점이 정당한 거의 유일한 자리입니다. 캐릭터를 색으로 강조하려고
                                다시 칠하지 마세요.
                            </Text>
                        </li>
                    </ul>
                </Card>
            </DocSection>
        </div>
    );
}
