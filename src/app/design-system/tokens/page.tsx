import { Card, Divider, Text } from "@/components/common";
import { NemoFace } from "@/components/NemoFace";
import { cn } from "@/lib/cn";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";
import { SwatchGrid, type SwatchItem } from "../_components/Swatch";

// 리터럴 클래스 문자열 — 조합하면 Tailwind 스캐너가 못 보고 규칙을 방출하지 않는다.
const SURFACE: readonly SwatchItem[] = [
    { name: "paper", hex: "#FFFFFF", className: "bg-paper", note: "바탕 · 카드 · 입력창" },
    { name: "cream", hex: "#F7F6F3", className: "bg-cream", note: "이미지 영역 · 옅은 면" },
    { name: "line", hex: "#E9E7E2", className: "bg-line", note: "옅은 구분선 (헤어라인)" },
];

const INK: readonly SwatchItem[] = [
    { name: "ink", hex: "#1C1B19", className: "bg-ink", note: "먹선 · 채움 · 본문 텍스트" },
    { name: "ink-soft", hex: "#8B8680", className: "bg-ink-soft", note: "보조 텍스트 전용 · 본문 금지" },
];

const POINT: readonly SwatchItem[] = [
    { name: "cheek", hex: "#F0C1B2", className: "bg-cheek", note: "볼터치 — 유일한 포인트 컬러" },
    { name: "danger", hex: "#D0554E", className: "bg-danger", note: "삭제 · 오류 전용" },
];

// 견본은 리터럴 클래스가 박힌 JSX 그대로 둔다 — 클래스 이름을 문자열로 조립하지 않는다.
const TEXT_TOKENS = [
    {
        cls: "text-ink",
        label: "본문과 제목 — 기본값",
        sample: <span className="text-ink">가치 있는 물건을 기록하세요</span>,
    },
    {
        cls: "text-ink-soft",
        label: "보조 설명 · 캡션 · 비활성",
        sample: <span className="text-ink-soft">등록한 지 3일 지났어요</span>,
    },
    {
        cls: "text-danger",
        label: "삭제 · 오류 메시지",
        sample: <span className="text-danger">이미 등록된 제품입니다</span>,
    },
    {
        cls: "text-cheek",
        label: "정서적 표시 — 아주 드물게",
        sample: <span className="text-cheek">♥ ♥ ♥ ♥ ♥</span>,
    },
];

const Z_INDEX = [
    { value: "z-40", body: "하단 내비게이션" },
    { value: "z-30", body: "떠 있는 버튼(FAB) · 저장 바" },
    { value: "z-50", body: "모달 백드롭과 본체" },
];

export default function TokensPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Colors & Tokens"
                description="종이 · 먹 · 옅은 선. 여기에 볼터치와 danger 를 더한 일곱 개가 팔레트 전부입니다."
            />

            <DocSection title="면 — paper · cream · line" description="바탕과 옅은 면. 세 값 모두 거의 무채색입니다.">
                <SwatchGrid items={SURFACE} />
            </DocSection>

            <DocSection title="먹 — ink · ink-soft" description="구조 · 텍스트 · 채움을 전부 담당하는 두 단계.">
                <SwatchGrid items={INK} />
            </DocSection>

            <DocSection
                title="포인트 — cheek · danger"
                description="시스템에 남은 두 유채색. cheek 은 정서적 강조, danger 는 삭제·오류 전용이며 어느 쪽도 위계를 만드는 데 쓰지 않습니다."
            >
                <SwatchGrid items={POINT} />
            </DocSection>

            <DocSection title="텍스트 색">
                <Card padding="none" className="overflow-hidden">
                    {TEXT_TOKENS.map((token, index) => (
                        <div
                            key={token.cls}
                            className={cn(
                                "flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4",
                                index > 0 && "border-line border-t",
                            )}
                        >
                            <span className="w-32 shrink-0">
                                <ClassName>{token.cls}</ClassName>
                            </span>
                            <span className="flex-1 text-sm">{token.sample}</span>
                            <span className="text-ink-soft w-56 shrink-0 text-[11px]">{token.label}</span>
                        </div>
                    ))}
                </Card>
            </DocSection>

            <Divider tone="ink" />

            <DocSection
                title="모서리 — rounded-nemo"
                description="1.25rem 이 기본값이지만, .sticker 와 함께 쓰면 네 귀퉁이가 모두 다른 손그림 모서리로 바뀝니다."
            >
                <ExamplePreview className="gap-8">
                    <div className="space-y-2 text-center">
                        <div className="rounded-nemo bg-paper h-24 w-24" />
                        <p className="text-ink-soft text-[11px]">rounded-nemo</p>
                        <p className="text-ink-soft text-[11px]">1.25rem 대칭</p>
                    </div>
                    <div className="space-y-2 text-center">
                        <div className="sticker rounded-nemo bg-paper h-24 w-24" />
                        <p className="text-ink-soft text-[11px]">sticker rounded-nemo</p>
                        <p className="text-ink-soft text-[11px]">비대칭 손그림</p>
                    </div>
                    <div className="space-y-2 text-center">
                        <div className="sticker bg-paper h-24 w-24 rounded-full" />
                        <p className="text-ink-soft text-[11px]">rounded-full</p>
                        <p className="text-ink-soft text-[11px]">버튼 · 칩</p>
                    </div>
                    <div className="w-24 space-y-2 text-center">
                        {/* .field 는 width:100% 를 강제하므로 폭은 감싼 요소가 정한다 */}
                        <div className="field h-24" />
                        <p className="text-ink-soft text-[11px]">.field</p>
                        <p className="text-ink-soft text-[11px]">입력 전용 모서리</p>
                    </div>
                </ExamplePreview>
            </DocSection>

            <DocSection title=".sticker" description="2px 먹선 테두리, 평면. 그림자를 얹지 않습니다.">
                <ExamplePreview className="gap-6" caption="sticker rounded-nemo bg-paper / bg-ink text-paper">
                    <div className="sticker rounded-nemo bg-paper px-5 py-4 text-sm font-bold">먹선 아웃라인</div>
                    <div className="sticker rounded-nemo bg-ink text-paper px-5 py-4 text-sm font-bold">먹 채움</div>
                    <div className="rounded-nemo border-line bg-paper border px-5 py-4 text-sm font-bold">
                        옅은 헤어라인
                    </div>
                </ExamplePreview>
            </DocSection>

            <DocSection
                title=".sticker-press"
                description="누르면 1px 내려앉고 살짝 옅어집니다. 누를 수 있는 요소에는 예외 없이 붙입니다."
            >
                <ExamplePreview caption="직접 눌러보세요 — 들어올리지 않고 눌립니다">
                    <button
                        type="button"
                        className="sticker sticker-press bg-ink text-paper rounded-full px-4 py-1.5 text-[13px] font-bold"
                    >
                        먹 채움 알약
                    </button>
                    <button
                        type="button"
                        className="sticker sticker-press bg-paper rounded-full px-3.5 py-1.5 text-[13px] font-bold"
                    >
                        아웃라인 칩
                    </button>
                </ExamplePreview>
            </DocSection>

            <DocSection
                title=".paste-grid"
                description="그리드 컨테이너에 붙이면 자식들이 ±0.4~0.7° 로 엇갈려, 손으로 붙인 스크랩북처럼 보입니다."
            >
                <ExamplePreview className="flex-col items-stretch">
                    <div className="paste-grid grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                        {["첫째", "둘째", "셋째", "넷째"].map((label) => (
                            <div key={label} className="sticker rounded-nemo bg-paper px-3 py-5 text-center text-sm">
                                {label}
                            </div>
                        ))}
                    </div>
                </ExamplePreview>
            </DocSection>

            <DocSection
                title=".scribble"
                description="제목 아래 손그림 낙서 밑줄. inline-block 이라 제목 요소 자체에 붙여야 밑줄 폭이 글자를 따라갑니다."
            >
                <ExamplePreview className="flex-col items-start gap-6" caption="페이지 제목에만 — 한 화면에 하나">
                    <p className="scribble font-display text-2xl">내 물건</p>
                    <p className="scribble font-display text-xl">이번 달 등록</p>
                </ExamplePreview>
            </DocSection>

            <DocSection
                title=".obj-stage · .print-grain"
                description="오브제 아래 타원형 콘택트 섀도와 5% 인쇄 질감. 둘 다 부모가 relative 인 이미지 영역에 얹습니다."
            >
                <ExamplePreview className="gap-6">
                    <div className="sticker rounded-nemo bg-paper w-40 overflow-hidden">
                        <div className="obj-stage bg-cream relative flex aspect-square items-center justify-center overflow-hidden">
                            <NemoFace size={104} />
                            <span aria-hidden="true" className="print-grain" />
                        </div>
                        <div className="border-ink border-t-2 px-2.5 py-1.5">
                            <p className="truncate text-[13px] font-bold">네모 인형</p>
                            <p className="text-ink-soft font-sans text-[11px] tabular-nums">32,000원</p>
                        </div>
                    </div>
                    <Text size="sm" tone="muted" className="max-w-xs">
                        이미지 영역은 언제나 <ClassName>bg-cream</ClassName> 입니다. 사진이 없을 때도 면이 비지 않고,
                        질감이 종이 톤과 붙어 있습니다.
                    </Text>
                </ExamplePreview>
            </DocSection>

            <DocSection title=".checker" description="투명 배경을 드러내는 체커보드. 사진 업로드 미리보기에 씁니다.">
                <ExamplePreview className="gap-6">
                    <div className="checker sticker rounded-nemo flex h-32 w-32 items-center justify-center">
                        <NemoFace size={88} />
                    </div>
                    <Text size="sm" tone="muted" className="max-w-xs">
                        배경을 지운 이미지가 흰 면 위에 놓이면 잘렸는지 알 수 없습니다. 체커보드는 그 판단만을 위해
                        존재합니다.
                    </Text>
                </ExamplePreview>
            </DocSection>

            <DocSection
                title=".wavy-edge"
                description="내비 경계선. 좁은 화면에서는 위쪽 가로 물결, 640px 이상에서는 오른쪽 세로 물결로 바뀝니다."
            >
                <ExamplePreview className="flex-col items-stretch">
                    <div className="wavy-edge bg-paper text-ink-soft px-4 py-6 text-center text-[13px]">
                        직선 보더 대신 손으로 그은 물결선
                    </div>
                </ExamplePreview>
            </DocSection>

            <Divider tone="ink" />

            <DocSection title="Divider" description="그림자가 없는 시스템에서 선이 유일한 구조 장치입니다.">
                <Card padding="md" className="space-y-6">
                    <Divider tone="subtle" />
                    <Divider tone="ink" />
                    <Divider label="또는" />
                    <div className="flex h-12 items-center gap-4">
                        <Text size="sm">왼쪽</Text>
                        <Divider orientation="vertical" />
                        <Text size="sm">오른쪽</Text>
                    </div>
                </Card>
            </DocSection>

            <DocSection
                title="z-index"
                description="이름 붙인 z 토큰은 없습니다. 층이 세 개뿐이라 숫자를 그대로 씁니다."
            >
                <Card variant="sunken" padding="md">
                    <ul className="space-y-1.5">
                        {Z_INDEX.map((layer) => (
                            <li key={layer.value} className="flex items-baseline gap-3">
                                <span className="w-14 shrink-0">
                                    <ClassName>{layer.value}</ClassName>
                                </span>
                                <Text size="sm" tone="muted">
                                    {layer.body}
                                </Text>
                            </li>
                        ))}
                    </ul>
                </Card>
            </DocSection>
        </div>
    );
}
