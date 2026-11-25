import { Card, Text } from "@/components/common";
import { Nemo, NemoSymbol } from "@/components/nemo/Nemo";
import { MARKS_HIDDEN_MAX, SMALL_FILTER_MAX } from "@/lib/nemo/compose";
import { EXPRESSIONS, EXPRESSION_IDS } from "@/lib/nemo/expressions";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../../_components/DocSection";
import { SheetTile } from "../_components/SheetTile";

/** 테이프 네 가지 — 그 테이프를 쓰는 표정으로 보인다 */
const TAPE_SAMPLES = [
    { id: "base", label: "기본", note: "평소" },
    { id: "surprised", label: "쫑긋", note: "놀라거나 신나면 통째로 솟는다" },
    { id: "oops", label: "축", note: "풀이 죽으면 자락이 길게 늘어진다" },
    { id: "proud", label: "펄럭", note: "뿌듯하면 꼭지가 바람에 눕는다" },
] as const;

/** 화면에서 실제로 쓰는 작은 크기 — 등록 반응 카드(56), 프로필(60), 홈 인사 카드(76) */
const SMALL_SIZES = [76, 56, 40];

const SYMBOL_SIZES = [24, 28, 36, 42, 56, 72];

const RULES = [
    "표정은 이 목록에서 고릅니다. 화면에 캐릭터 SVG를 따로 그리지 않고, 없는 표정은 src/lib/nemo 에 더합니다.",
    "네모는 한 화면에 한 번, 정서가 있는 순간에만 세웁니다 — 비었을 때, 기쁠 때, 기다릴 때, 가볍게 실패했을 때.",
    "삭제 확인, 권한 요청, 개인정보 안내에는 세우지 않습니다.",
    "캐릭터는 화면 낭독기가 읽지 않습니다. 상황은 옆의 문장이 전해야 합니다.",
    "색은 먹·종이·볼터치뿐입니다. 표정을 색으로 구분하지 않습니다.",
];

export default function ExpressionsPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Character · Expressions"
                description="네모의 얼굴은 덤덤합니다. 눈과 입을 조금 바꾸고 테이프를 움직여 표정을 만듭니다."
            />

            <DocSection
                title="표정"
                description="앱에 실제로 있는 순간에서 뽑았습니다. 이 화면은 src/lib/nemo/expressions.ts 의 목록을 그대로 돌며 그립니다."
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {EXPRESSION_IDS.map((id) => (
                        <SheetTile key={id} id={id} label={EXPRESSIONS[id].label} when={EXPRESSIONS[id].when}>
                            <Nemo expression={id} size={112} />
                        </SheetTile>
                    ))}
                </div>
                <Text size="sm" tone="muted">
                    <ClassName>{'<Nemo expression="happy" size={96} />'}</ClassName> 처럼 씁니다. 표정을 주지 않으면 기본
                    얼굴입니다.
                </Text>
            </DocSection>

            <DocSection
                title="테이프"
                description="네모의 기분은 머리 위 테이프에 먼저 드러납니다. 테이프는 표정에 딸려 있어 따로 고르지 않습니다."
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {TAPE_SAMPLES.map((sample) => (
                        <SheetTile key={sample.id} id={EXPRESSIONS[sample.id].tape} label={sample.label} when={sample.note}>
                            <Nemo expression={sample.id} size={88} />
                        </SheetTile>
                    ))}
                </div>
            </DocSection>

            <DocSection
                title="작은 크기에서"
                description={`${MARKS_HIDDEN_MAX}px 이하에서는 표시(땀방울·물음표 등)를 빼고, ${SMALL_FILTER_MAX}px 이하에서는 작은 필터를 씁니다. 표정은 눈·입·테이프만으로 읽혀야 합니다.`}
            >
                {SMALL_SIZES.map((size) => (
                    <ExamplePreview key={size} className="justify-center gap-x-5 gap-y-4 p-5" caption={`${size}px`}>
                        {EXPRESSION_IDS.map((id) => (
                            <Nemo key={id} expression={id} size={size} />
                        ))}
                    </ExamplePreview>
                ))}
            </DocSection>

            <DocSection
                title="심볼"
                description="팔다리를 덜어 낸 얼굴입니다. 24~32px 자리에 씁니다. 전신과 같은 얼굴 부품을 쓰므로 표정도 그대로 따라옵니다."
            >
                <ExamplePreview className="items-end justify-center gap-6" caption="NemoSymbol — 몸·테이프·얼굴은 전신 그대로, 선만 한 단계 굵다">
                    {SYMBOL_SIZES.map((size) => (
                        <div key={size} className="flex flex-col items-center gap-2">
                            <NemoSymbol size={size} />
                            <p className="text-ink-soft font-sans text-[11px] tabular-nums">{size}px</p>
                        </div>
                    ))}
                </ExamplePreview>
                <ExamplePreview className="justify-center gap-5" caption="심볼의 표정 — 36px">
                    {EXPRESSION_IDS.map((id) => (
                        <NemoSymbol key={id} expression={id} size={36} />
                    ))}
                </ExamplePreview>
            </DocSection>

            <DocSection title="쓸 때" description="까닭은 docs/decisions/0008-character.md, 규칙은 docs/design-system.md 의 U8 에 있습니다.">
                <Card variant="sunken" padding="md">
                    <ul className="space-y-2.5">
                        {RULES.map((rule) => (
                            <li key={rule}>
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
