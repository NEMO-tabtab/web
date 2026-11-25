import { Card, Text } from "@/components/common";
import { Nemo } from "@/components/nemo/Nemo";
import { EXPRESSIONS, EXPRESSION_IDS } from "@/lib/nemo/expressions";
import { POSES, POSE_IDS, type Pose, type PoseId } from "@/lib/nemo/poses";
import { DEPTH, SOLID_MIN } from "@/lib/nemo/solid";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../../_components/DocSection";

const pose = (id: PoseId): Pose => POSES[id];

const RULES = [
    "화면과 앱 아이콘에는 정면을 씁니다. 입체는 온보딩·소개 그림처럼 네모가 주인공인 큰 그림에만 씁니다.",
    `입체는 ${SOLID_MIN}px 이상에서만 그려집니다. 그보다 작게 주면 정면으로 그립니다 — 안쪽 선이 뭉개지기 때문입니다.`,
    "얼굴이 놓인 앞면은 정면 보기와 같습니다. 표정·팔다리·소품을 따로 그리지 않습니다.",
    "옆면과 열린 상자의 안쪽처럼 물러난 면만 cream 으로 칠합니다. 그림자와 그라디언트는 쓰지 않습니다.",
    "표정에 딸린 표시(반짝·물음표 등)는 옆면 너머로 옮겨 그립니다. 그만큼 그림이 오른쪽 위로 자리를 더 차지합니다.",
];

export default function SolidPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Character · Solid view"
                description="정면 그림을 그대로 두고 윗면과 옆면을 뒤로 덧붙인 보기입니다. 큰 그림에서 네모가 상자라는 것이 또렷해집니다."
            />

            <DocSection
                title="정면과 입체"
                description={`뒤로 물러나는 만큼은 오른쪽으로 ${DEPTH.x}칸, 위로 ${-DEPTH.y}칸입니다. 위로 물러나는 높이는 정면 보기에서 테이프가 몸 위로 솟은 높이와 같습니다 — 정면의 꼭지는 윗면에 붙은 테이프를 눌러 그린 것입니다.`}
            >
                <ExamplePreview className="items-end justify-center gap-16" caption="같은 크기(200px) — 왼쪽 정면, 오른쪽 입체">
                    <Nemo size={200} />
                    <Nemo view="solid" size={200} />
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    <ClassName>{'<Nemo view="solid" size={200} />'}</ClassName> 처럼 씁니다.
                </Text>
            </DocSection>

            <DocSection title="표정" description="앞면이 같아서 표정 12개가 그대로 나옵니다. 테이프의 기분은 앞으로 내려온 자락에 드러납니다.">
                <ExamplePreview className="justify-center gap-x-6 gap-y-8">
                    {EXPRESSION_IDS.map((id) => (
                        <div key={id} className="flex flex-col items-center gap-1">
                            <Nemo view="solid" expression={id} size={SOLID_MIN} />
                            <p className="font-display text-base">{EXPRESSIONS[id].label}</p>
                        </div>
                    ))}
                </ExamplePreview>
            </DocSection>

            <DocSection title="자세" description="팔다리와 소품도 정면과 같은 획입니다. 오른팔만 옆면 앞으로 나옵니다. 뚜껑이 열리면 윗면 자리가 안쪽이 됩니다.">
                <ExamplePreview className="items-end justify-center gap-x-6 gap-y-8">
                    {POSE_IDS.map((id) => (
                        <div key={id} className="flex flex-col items-center gap-1">
                            <Nemo view="solid" pose={id} size={SOLID_MIN} />
                            <p className="font-display text-base">{pose(id).label}</p>
                        </div>
                    ))}
                </ExamplePreview>
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
