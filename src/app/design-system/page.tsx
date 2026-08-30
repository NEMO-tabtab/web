import { Badge, Button, Card, Heading, Text } from "@/components/common";
import { NemoFace } from "@/components/NemoFace";
import { cn } from "@/lib/cn";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "./_components/DocSection";

const PRINCIPLES = [
    {
        title: "손그림 흑백 라인아트",
        body: "화이트 종이 위에 2px 먹선. 면이 아니라 선으로 구조를 잘라 만든다. 러프한 손맛이 기본값이다.",
    },
    {
        title: "색은 절제, 선이 주인공",
        body: "팔레트는 종이(paper)·옅은 면(cream)·먹(ink)·헤어라인(line) 뿐. 유채색으로 위계를 만들지 않는다.",
    },
    {
        title: "강조는 먹 채움",
        body: "중요한 것은 밝아지는 대신 먹으로 채워진다. sticker bg-ink text-paper 가 최상위 강조다.",
    },
    {
        title: "볼터치는 유일한 포인트 컬러",
        body: "cheek 은 정서적 강조에만 아주 드물게. danger 는 삭제·오류 전용이라 강조에 빌려 쓰지 않는다.",
    },
];

/**
 * 강조 위계 4단계 — 색이 아니라 채움과 선의 굵기로 만든다.
 * cls 는 리터럴 문자열이어야 Tailwind 스캐너가 규칙을 방출한다.
 */
const LADDER = [
    { step: "1 · 최강", name: "먹 채움", cls: "sticker bg-ink text-paper", use: "화면당 하나 — 주 동작" },
    { step: "2 · 중간", name: "먹선 아웃라인", cls: "sticker bg-paper", use: "카드 · 보조 버튼 · 칩" },
    { step: "3 · 약함", name: "옅은 헤어라인", cls: "border border-line bg-paper", use: "목록 구분 · 정보 행" },
    { step: "4 · 면", name: "cream 면", cls: "bg-cream", use: "이미지 영역 · 비활성 면" },
];

const DEVICES = [
    { name: ".sticker", body: "2px 먹선 테두리, 평면. 그림자를 절대 얹지 않는다." },
    { name: ".sticker.rounded-nemo", body: "네 귀퉁이가 모두 다른 비대칭 모서리. 카드·패널의 기본 조합." },
    { name: ".sticker-press", body: "누르면 1px 내려앉고 옅어진다. 누를 수 있는 요소 전부에 붙인다." },
    { name: ".field", body: "입력 공통 — 먹선 + 비대칭 모서리 + 3px 포커스 아웃라인." },
    { name: ".paste-grid", body: "그리드 컨테이너에 붙이면 자식이 ±0.4~0.7° 로 엇갈려 붙는다." },
    { name: ".scribble", body: "제목 아래 손그림 낙서 밑줄. inline-block 이라 제목 요소 자체에 붙인다." },
    { name: ".print-grain", body: "이미지 위 5% 인쇄 질감. absolute 라 부모가 relative 여야 한다." },
    { name: ".obj-stage", body: "오브제 아래 타원형 콘택트 섀도. 이미지 컨테이너에 붙인다." },
    { name: ".checker", body: "투명 배경 체커보드. 사진 업로드 미리보기에 쓴다." },
    { name: ".wavy-edge", body: "내비 경계의 손그림 물결선. 직선 보더를 대신한다." },
];

const NEVER = [
    "그림자 — 블러 그림자도, 하드 오프셋도 쓰지 않는다. 층위는 선과 채움이 만든다.",
    "그라디언트 · 글래스모피즘 · 배경 블러",
    "액센트/브랜드 컬러 램프 — 무채색은 ink 와 ink-soft 두 단계면 충분하다",
    "호버 리프트 — 들어올리지 않고 누른다(translateY(1px))",
    "제목 밖의 손글씨 — Gaegu 는 제목 전용, 숫자는 어디서나 sans",
];

export default function DesignSystemIntroPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="NEMO 디자인 시스템"
                description="손그림 흑백 라인아트. 색을 쓰지 않고도 위계가 서도록 선과 채움으로 설계했습니다."
            />

            <DocSection title="4대 원칙">
                <div className="grid gap-4 sm:grid-cols-2">
                    {PRINCIPLES.map((principle, index) => (
                        <Card key={principle.title} padding="md" className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="ink" size="sm">
                                    {String(index + 1).padStart(2, "0")}
                                </Badge>
                                <Heading level={5} as="p">
                                    {principle.title}
                                </Heading>
                            </div>
                            <Text size="sm" tone="muted">
                                {principle.body}
                            </Text>
                        </Card>
                    ))}
                </div>
            </DocSection>

            <DocSection
                title="강조 위계"
                description="색이 없으므로 위계는 채움과 선으로만 만듭니다. 한 화면에 1단계는 하나만 두세요."
            >
                <div className="space-y-2">
                    {LADDER.map((level) => (
                        <div key={level.step} className="flex items-center gap-4">
                            <span className="text-ink-soft w-16 shrink-0 font-sans text-xs font-bold tabular-nums">
                                {level.step}
                            </span>
                            <div className={cn("rounded-nemo flex h-14 flex-1 items-center px-4", level.cls)}>
                                <span className="text-sm font-bold">{level.name}</span>
                            </div>
                            <span className="text-ink-soft hidden w-52 shrink-0 text-[11px] sm:block">{level.use}</span>
                        </div>
                    ))}
                </div>
                <Card variant="sunken" padding="sm">
                    <Text size="sm" tone="muted">
                        클래스 그대로 쓰면 <ClassName>sticker bg-ink text-paper</ClassName> ·{" "}
                        <ClassName>sticker bg-paper</ClassName> · <ClassName>border border-line bg-paper</ClassName> ·{" "}
                        <ClassName>bg-cream</ClassName> 입니다.
                    </Text>
                </Card>
            </DocSection>

            <DocSection
                title="손그림 장치"
                description="globals.css 에 정의된 공통 클래스입니다. 실제 렌더링은 Colors & Tokens 페이지에서 볼 수 있습니다."
            >
                <Card padding="none" className="overflow-hidden">
                    <ul>
                        {DEVICES.map((device, index) => (
                            <li
                                key={device.name}
                                className={cn(
                                    "flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:gap-4",
                                    index > 0 && "border-line border-t",
                                )}
                            >
                                <span className="w-52 shrink-0">
                                    <ClassName>{device.name}</ClassName>
                                </span>
                                <Text size="sm" tone="muted">
                                    {device.body}
                                </Text>
                            </li>
                        ))}
                    </ul>
                </Card>
            </DocSection>

            <DocSection title="볼터치 (cheek)" description="시스템에 남은 단 하나의 포인트 컬러입니다.">
                <ExamplePreview caption="네모의 볼 두 점 — 이 시스템에서 유채색이 정당한 거의 유일한 자리">
                    <div className="flex items-center gap-6">
                        <NemoFace size={104} />
                        <div className="max-w-sm space-y-2">
                            <Text size="sm">
                                cheek 은 캐릭터의 볼, 애착도처럼 <span className="font-bold">정서적인 표시</span>에만
                                아주 드물게 씁니다.
                            </Text>
                            <Text size="sm" tone="muted">
                                버튼·배지·강조에는 쓰지 않습니다. 여기저기 번지는 순간 포인트가 아니라 배경색이 됩니다.
                            </Text>
                        </div>
                    </div>
                </ExamplePreview>
            </DocSection>

            <DocSection title="Do / Don't">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                        <Badge variant="ink">Do</Badge>
                        <ExamplePreview caption="강조 = 먹 채움">
                            <Button variant="primary">저장하기</Button>
                            <Button variant="secondary">취소</Button>
                        </ExamplePreview>
                        <Text size="sm" tone="muted">
                            주 동작은 먹으로 채우고, 보조 동작은 먹선 아웃라인으로 둡니다.
                        </Text>
                    </div>
                    <div className="space-y-3">
                        <Badge variant="danger">Don&apos;t</Badge>
                        <ExamplePreview caption="색으로 위계를 만들지 않는다">
                            <Button variant="danger">저장하기</Button>
                            <Button variant="danger">삭제</Button>
                        </ExamplePreview>
                        <Text size="sm" tone="muted">
                            danger 는 삭제·오류 전용입니다. 눈에 띄게 하려고 빌려 쓰면 신호가 죽습니다.
                        </Text>
                    </div>
                </div>
            </DocSection>

            <DocSection title="쓰지 않는 것" description="이전 시스템의 습관이 남기 쉬운 자리들입니다.">
                <Card variant="sunken" padding="md">
                    <ul className="space-y-2">
                        {NEVER.map((rule) => (
                            <li key={rule} className="flex gap-2">
                                <span aria-hidden="true" className="text-ink-soft">
                                    ✕
                                </span>
                                <Text size="sm" tone="muted">
                                    {rule}
                                </Text>
                            </li>
                        ))}
                    </ul>
                </Card>
            </DocSection>
        </div>
    );
}
