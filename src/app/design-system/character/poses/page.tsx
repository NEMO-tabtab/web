import { Card, Text } from "@/components/common";
import { Nemo } from "@/components/nemo/Nemo";
import { DETAIL_HIDDEN_MAX } from "@/lib/nemo/compose";
import { POSES, POSE_IDS, type Pose, type PoseId } from "@/lib/nemo/poses";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../../_components/DocSection";
import { SheetTile } from "../_components/SheetTile";

const pose = (id: PoseId): Pose => POSES[id];

/** 몸의 상태 세 가지 — 그 몸을 쓰는 자세로 보인다 */
const BODY_SAMPLES = [
    { id: "empty", label: "뚜껑 열림", note: "담거나 속을 보일 때. 테이프는 앞면의 자락만 남는다" },
    { id: "trip", label: "구겨짐", note: "일이 잘못됐을 때. 한쪽 모서리가 눌리고 반창고 테이프를 붙인다" },
    { id: "sleep", label: "잠", note: "쉬는 동안. 팔이 늘어지고 테이프가 처진다" },
] as const;

/** 같은 자세에 표정만 바꾼 예 */
const MIXES = [
    { pose: "wave", expression: "wink" },
    { pose: "empty", expression: "curious" },
    { pose: "cheer", expression: "proud" },
    { pose: "trip", expression: "sleepy" },
] as const;

const RULES = [
    "자세는 이 목록에서 고릅니다. 없는 자세는 src/lib/nemo 에 팔다리·소품·자세를 더합니다.",
    "팔다리는 먹선 한 획입니다. 손은 그리지 않고 소품이 획의 끝에 붙습니다.",
    "소품은 Icon 과 같은 결의 먹선으로 그리고 종이로 채웁니다. 색을 쓰지 않습니다.",
    `${DETAIL_HIDDEN_MAX}px 이하에서는 소품과 표시를 빼고, 소품을 들던 팔은 내립니다. 그 크기에서는 자세보다 표정으로 말합니다.`,
    "size 는 캐릭터의 크기입니다. 소품을 든 자세는 그림이 옆이나 위로 조금 더 자리를 차지합니다.",
];

export default function PosesPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Character · Poses"
                description="네모는 몸이 곧 하는 일입니다. 뚜껑을 열어 담고, 돋보기로 찾고, 끈으로 묶어 백업합니다."
            />

            <DocSection
                title="자세"
                description="앱에서 실제로 하는 일에서 뽑았습니다. 이 화면은 src/lib/nemo/poses.ts 의 목록을 그대로 돌며 그립니다."
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {POSE_IDS.map((id) => (
                        <SheetTile key={id} id={id} label={pose(id).label} when={pose(id).when}>
                            <Nemo pose={id} size={104} />
                        </SheetTile>
                    ))}
                </div>
                <Text size="sm" tone="muted">
                    <ClassName>{'<Nemo pose="search" size={96} />'}</ClassName> 처럼 씁니다. 자세마다 어울리는 표정이
                    딸려 있고, <ClassName>expression</ClassName> 을 주면 그 표정으로 바뀝니다.
                </Text>
            </DocSection>

            <DocSection title="몸의 상태" description="몸은 종이 상자입니다. 열리고, 구겨지고, 쉽니다.">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {BODY_SAMPLES.map((sample) => (
                        <SheetTile key={sample.id} id={sample.id} label={sample.label} when={sample.note}>
                            <Nemo pose={sample.id} size={104} />
                        </SheetTile>
                    ))}
                </div>
            </DocSection>

            <DocSection
                title="자세와 표정"
                description="자세와 표정은 따로 고릅니다. 소품을 든 자세에서는 몸을 기울이지 않고, 표정에 딸린 표시도 소품 자리와 겹치면 뺍니다."
            >
                <ExamplePreview className="justify-center gap-8">
                    {MIXES.map((mix) => (
                        <div key={`${mix.pose}-${mix.expression}`} className="flex flex-col items-center gap-2">
                            <Nemo pose={mix.pose} expression={mix.expression} size={96} />
                            <p className="text-ink-soft font-sans text-[11px]">
                                {mix.pose} + {mix.expression}
                            </p>
                        </div>
                    ))}
                </ExamplePreview>
            </DocSection>

            <DocSection title="작은 크기에서" description="화면에서 실제로 쓰는 작은 크기 — 76px 과 56px.">
                {[76, 56].map((size) => (
                    <ExamplePreview key={size} className="justify-center gap-x-5 gap-y-4 p-5" caption={`${size}px`}>
                        {POSE_IDS.map((id) => (
                            <Nemo key={id} pose={id} size={size} />
                        ))}
                    </ExamplePreview>
                ))}
            </DocSection>

            <DocSection title="쓸 때" description="까닭은 docs/decisions/0008-character.md 의 '그림의 원칙'에 있습니다.">
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
