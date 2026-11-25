import { Card, Text } from "@/components/common";
import { NemoCapsule, NemoScene } from "@/components/nemo/NemoCapsule";
import { CAPSULE_EXPRESSIONS, CAPSULE_EXPRESSION_IDS } from "@/lib/nemo/capsule";
import { SCENES, SCENE_IDS } from "@/lib/nemo/scenes";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../../_components/DocSection";
import { SheetTile } from "../_components/SheetTile";

/** 뚜껑 틈 세 가지 — 그 뚜껑을 쓰는 표정으로 보인다 */
const LID_SAMPLES = [
    { id: "base", label: "닫힘", note: "평소" },
    { id: "bounce", label: "들썩", note: "신나면 뚜껑이 들썩인다" },
    { id: "pop", label: "열림", note: "놀라면 뚜껑이 열린다" },
] as const;

const RULES = [
    "동글은 말을 하지 않습니다. 화면의 화자는 네모 하나입니다. 문구에 동글의 목소리를 넣지 않습니다.",
    "혼자 세우기보다 네모 옆이나 기다리는 화면에 씁니다. 네모가 기억을, 동글이 설렘을 맡습니다.",
    "팔다리가 없습니다. 구르고, 튀고, 뚜껑으로 기분을 보입니다.",
    "눈과 볼은 네모와 같은 모양이고 입만 다릅니다. 색은 네모와 같이 먹·종이·볼터치입니다.",
    "장면은 네모와 캡슐을 한 그림 안에 같은 칸 크기로 놓습니다. 두 그림을 따로 놓아 크기를 맞추지 않습니다.",
];

export default function FriendPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Character · Capsule friend"
                description="네모의 짝 동글입니다. 네모가 맨 처음 담은 캡슐이고, 안에 뭐가 들었는지는 자기도 모릅니다. 가만히 있지 못하고, 금방 잊습니다."
            />

            <DocSection
                title="표정"
                description="네모보다 적습니다. 네모 옆에서 거드는 얼굴만 있으면 됩니다. 이 화면은 src/lib/nemo/capsule.ts 의 목록을 그대로 돌며 그립니다."
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {CAPSULE_EXPRESSION_IDS.map((id) => (
                        <SheetTile
                            key={id}
                            id={id}
                            label={CAPSULE_EXPRESSIONS[id].label}
                            when={CAPSULE_EXPRESSIONS[id].when}
                        >
                            <NemoCapsule expression={id} size={104} />
                        </SheetTile>
                    ))}
                </div>
                <Text size="sm" tone="muted">
                    <ClassName>{'<NemoCapsule expression="bounce" size={48} />'}</ClassName> 처럼 씁니다.
                </Text>
            </DocSection>

            <DocSection
                title="뚜껑 틈"
                description="네모의 기분이 테이프에 드러나듯, 캡슐의 기분은 뚜껑에 드러납니다. 실제 가챠 캡슐처럼 아래쪽 그릇과 위쪽 뚜껑 두 쪽입니다."
            >
                <div className="grid grid-cols-3 gap-3">
                    {LID_SAMPLES.map((sample) => (
                        <SheetTile
                            key={sample.id}
                            id={CAPSULE_EXPRESSIONS[sample.id].lid}
                            label={sample.label}
                            when={sample.note}
                        >
                            <NemoCapsule expression={sample.id} size={88} />
                        </SheetTile>
                    ))}
                </div>
            </DocSection>

            <DocSection title="작은 크기에서" description="40px 이하에서는 표시를 빼고 작은 필터를 씁니다.">
                {[48, 32].map((size) => (
                    <ExamplePreview key={size} className="justify-center gap-6 p-5" caption={`${size}px`}>
                        {CAPSULE_EXPRESSION_IDS.map((id) => (
                            <NemoCapsule key={id} expression={id} size={size} />
                        ))}
                    </ExamplePreview>
                ))}
            </DocSection>

            <DocSection
                title="둘이 함께 있는 장면"
                description="온보딩·소개 같은 큰 그림용입니다. 네모는 입체 보기로 그립니다. 이 화면은 src/lib/nemo/scenes.ts 의 목록을 돌며 그립니다."
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {SCENE_IDS.map((id) => (
                        <SheetTile key={id} id={id} label={SCENES[id].label} when={SCENES[id].when}>
                            <NemoScene scene={id} size={160} />
                        </SheetTile>
                    ))}
                </div>
                <Text size="sm" tone="muted">
                    <ClassName>{'<NemoScene scene="together" size={200} />'}</ClassName> 처럼 씁니다.{" "}
                    <ClassName>size</ClassName> 는 네모의 크기이고, 장면은 캡슐 친구의 자리만큼 더 넓거나 높습니다.
                </Text>
            </DocSection>

            <DocSection title="쓸 때" description="까닭은 docs/decisions/0008-character.md 의 '캡슐 친구'에 있습니다.">
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
