import { Card, Text } from "@/components/common";
import { GachaMachine } from "@/components/machine/GachaMachine";
import { FULL_FROM, MID_FROM, composeMachine, sizeAtScale } from "@/lib/machine/compose";
import { MACHINE_MODELS, modelCells, sizeLabel, type MachineModel } from "@/lib/machine/models";
import type { MachineView } from "@/lib/machine/sketch";
import { toSvgString } from "@/lib/nemo/exportSvg";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";
import { DownloadButtons } from "../character/_components/DownloadButtons";
import { PullDemo } from "./_components/PullDemo";

/** 내려받는 그림에서 기계의 키(px). PNG 는 이 두 배로 나온다 */
const EXPORT_SIZE = 512;
/** 종류마다 한 칸씩 보여 줄 때 입체 그림의 키(px). 정면은 같은 축척으로 옆에 세운다 */
const TILE_SIZE = 176;
/** 나란히 세울 때의 축척(px/cm) */
const ROW_SCALE = 1.2;
/** 크기에 따라 덜어 내는 것을 보여 줄 키(px) — 2단 표준형 */
const STEPS = [40, 72, 120, 200];

const VIEW_LABEL: Record<MachineView, string> = { solid: "입체", front: "정면" };

const RULES = [
    "기계 그림은 이 부품으로만 그립니다. 화면에 기계 SVG 를 따로 그리지 않고, 없는 종류는 카탈로그(src/lib/machine)에 더합니다.",
    "보기는 둘입니다. 입체는 가게 장면처럼 여러 대를 세울 때, 정면은 앞면이 크게 보여야 하는 작은 자리와 움직임에 씁니다. 두 보기는 같은 부품을 다른 쪽에서 본 것이라 따로 그리지 않습니다.",
    "크기는 기계의 키입니다. 작게 그리면 캡슐과 동전 넣는 곳 같은 작은 부품부터 빠지고, 덩어리와 손잡이는 끝까지 남습니다.",
    "움직임은 정면 그림에만 있습니다(GachaPull). 가챠를 기록한 순간처럼 뽑았다는 것을 알릴 때 한 번만 돌립니다. 움직임을 줄이도록 설정한 기기에서는 돌지 않고 캡슐이 나와 있는 모습만 보입니다.",
    "색은 먹·종이·cream 에 볼터치 한 점입니다. 볼터치는 손잡이에만 씁니다. 그림자와 그라디언트는 쓰지 않습니다.",
    "실제 기계의 생김새를 줄여 그린 것입니다. 제조사의 상표·글자·캐릭터는 그리지 않습니다.",
    "내부 지도의 기기는 예전 그림 그대로입니다. 매장 구조에 기계 종류를 적는 일은 내부 지도와 함께 미뤘습니다.",
];

const LEFT_OUT = [
    "3단·4단 캡슐 기계 — 제원을 찾지 못했습니다. 조사에서 본 3단 기계는 카드를 파는 기계(카드다스, 24 × 48.1 × 149.1cm)뿐입니다.",
    "카드·트레이딩 카드 판매기 — 캡슐을 파는 기계가 아니라서 뺐습니다.",
    "같은 종류 안의 차이(캡슐 스테이션과 가챠 2 이지의 손잡이 모양 등) — 종류 하나에 그림 하나만 둡니다.",
];

const machineSvg = (model: MachineModel, view: MachineView) =>
    toSvgString(composeMachine(model.id, { size: EXPORT_SIZE, view }), EXPORT_SIZE);

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-ink-soft">{label}</dt>
            <dd className="min-w-0 flex-1">{children}</dd>
        </div>
    );
}

function ModelTile({ model }: { model: MachineModel }) {
    const cells = modelCells(model);
    // 입체가 TILE_SIZE 로 그려지는 축척으로 정면도 그린다 — 두 그림의 크기가 서로 맞는다
    const scale = TILE_SIZE / sizeAtScale(model.id, 1, "solid");
    return (
        <figure className="sticker flex flex-col overflow-hidden rounded-nemo bg-paper">
            <div className="flex h-64 items-end justify-center gap-6 bg-cream px-3 pb-4 pt-6">
                {(["solid", "front"] as const).map((view) => (
                    <div key={view} className="flex flex-col items-center gap-1.5">
                        <GachaMachine
                            model={model.id}
                            view={view}
                            size={sizeAtScale(model.id, scale, view)}
                            title={`${model.name} ${VIEW_LABEL[view]} 그림`}
                        />
                        <p className="text-[11px] font-bold text-ink-soft">{VIEW_LABEL[view]}</p>
                    </div>
                ))}
            </div>
            <figcaption className="flex flex-1 flex-col gap-3 border-t-2 border-ink px-4 py-3">
                <div className="space-y-1">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-display text-xl leading-tight">{model.name}</span>
                        <ClassName>{model.id}</ClassName>
                    </p>
                    <p className="break-keep text-xs leading-snug text-ink-soft">{model.summary}</p>
                </div>
                <dl className="space-y-1 text-xs">
                    <Spec label="실제 크기">
                        <span className="font-sans font-bold">{sizeLabel(model.size)}</span>
                        <span className="text-ink-soft"> (폭 × 깊이 × 높이)</span>
                    </Spec>
                    <Spec label="단">{model.tiers}단</Spec>
                    <Spec label="캡슐">
                        지름 {model.capsule[0]}~{model.capsule[1]}mm
                    </Spec>
                    <Spec label="격자">
                        {cells.w} × {cells.d}칸, 높이 {cells.h}칸 <span className="text-ink-soft">(1칸 25cm)</span>
                    </Spec>
                </dl>
                <div className="flex-1 text-xs">
                    <p className="text-ink-soft">기준으로 삼은 기계</p>
                    <ul className="mt-1 space-y-1">
                        {model.references.map((reference) => (
                            <li key={reference.url} className="break-keep leading-snug">
                                <a
                                    href={reference.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold underline decoration-ink-soft underline-offset-2"
                                >
                                    {reference.name}
                                </a>
                                {reference.maker && <span> · {reference.maker}</span>}
                                <span className="text-ink-soft"> · {sizeLabel(reference.size)}</span>
                                {reference.note && <span className="text-ink-soft"> · {reference.note}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="space-y-1.5">
                    {(["solid", "front"] as const).map((view) => (
                        <div key={view} className="flex items-center gap-2">
                            <span className="w-7 shrink-0 text-[11px] font-bold text-ink-soft">{VIEW_LABEL[view]}</span>
                            <DownloadButtons
                                name={
                                    view === "solid" ? `gacha-machine-${model.id}` : `gacha-machine-${model.id}-front`
                                }
                                svg={machineSvg(model, view)}
                            />
                        </div>
                    ))}
                </div>
            </figcaption>
        </figure>
    );
}

/** 모든 종류를 한 보기로, 같은 축척으로 세운다 */
function Lineup({ view }: { view: MachineView }) {
    return (
        <ExamplePreview
            className="items-end justify-center gap-x-8 gap-y-6"
            caption={`${VIEW_LABEL[view]} — 1cm 를 ${ROW_SCALE}px 로 · sizeAtScale(id, ${ROW_SCALE}, "${view}")`}
        >
            {MACHINE_MODELS.map((model) => (
                <div key={model.id} className="flex flex-col items-center gap-2">
                    <GachaMachine model={model.id} view={view} size={sizeAtScale(model.id, ROW_SCALE, view)} />
                    <p className="text-center text-[11px] leading-tight">
                        <span className="font-bold">{model.name}</span>
                        <br />
                        <span className="text-ink-soft">높이 {model.size.height / 10}cm</span>
                    </p>
                </div>
            ))}
        </ExamplePreview>
    );
}

export default function MachinesPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Gacha machines"
                description="가챠 기계의 종류와 손그림 그림입니다. 실제 기계의 제원을 기준으로 삼았고, 종류마다 입체와 정면 두 가지 보기가 있습니다. 업적에 쓸 가챠 기계 디자인은 이 종류들을 바탕으로 만듭니다."
            />

            <DocSection
                title="기계 종류"
                description="원본은 src/lib/machine 한 곳입니다. 치수는 가챠 본체를 파는 곳에 적힌 제원이고(2026-11-26 확인), 제조사의 공식 문서에서 본 값은 아닙니다."
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {MACHINE_MODELS.map((model) => (
                        <ModelTile key={model.id} model={model} />
                    ))}
                </div>
                <Text size="sm" tone="muted">
                    <ClassName>{'<GachaMachine model="standard-2" size={160} />'}</ClassName> 처럼 씁니다. 정면은{" "}
                    <ClassName>{'view="front"'}</ClassName> 를 줍니다.
                </Text>
            </DocSection>

            <DocSection
                title="같은 축척으로 나란히"
                description="종류마다 실제 크기가 다릅니다. 한 장면에 함께 세울 때는 같은 축척으로 그립니다. 정면은 깊이가 보이지 않아 같은 축척에서 그림이 더 작습니다."
            >
                <Lineup view="solid" />
                <Lineup view="front" />
            </DocSection>

            <DocSection
                title="크기에 따라"
                description={`화면에서 1cm 가 ${FULL_FROM}px 이상이면 모든 부품을, ${MID_FROM}px 이상이면 캡슐과 상품 카드까지 그립니다. 그보다 작으면 덩어리와 손잡이만 남깁니다. 정면은 같은 키에서 앞면이 더 크게 보여서 더 작은 크기부터 자세히 그려집니다.`}
            >
                {(["solid", "front"] as const).map((view) => (
                    <ExamplePreview
                        key={view}
                        className="items-end justify-center gap-10"
                        caption={`2단 표준형 ${VIEW_LABEL[view]} — 키 ${STEPS.join(" · ")}px`}
                    >
                        {STEPS.map((size) => (
                            <div key={size} className="flex flex-col items-center gap-2">
                                <GachaMachine model="standard-2" view={view} size={size} />
                                <p className="font-sans text-[11px] font-bold">{size}px</p>
                            </div>
                        ))}
                    </ExamplePreview>
                ))}
            </DocSection>

            <DocSection
                title="돌아가는 모습"
                description="손잡이가 네 번 딸깍 돌고, 캡슐이 나오는 곳에서 캡슐이 떨어져 한 번 튀고 굴러갑니다. 1.7초쯤 걸리고 한 번만 돕니다. 단이 여럿이면 맨 위 단이 돕니다."
            >
                <ExamplePreview
                    className="items-end justify-center gap-x-8 gap-y-6"
                    caption={`정면 — 1cm 를 ${ROW_SCALE}px 로. 화면에 올라올 때 한 번 돈다`}
                >
                    {MACHINE_MODELS.map((model) => (
                        <PullDemo
                            key={model.id}
                            model={model.id}
                            size={sizeAtScale(model.id, ROW_SCALE, "front")}
                            label={model.name}
                        />
                    ))}
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    <ClassName>{'<GachaPull model="half-1" size={96} />'}</ClassName> 처럼 씁니다. 다시 돌리려면{" "}
                    <ClassName>key</ClassName> 를 바꿔 다시 올립니다.
                </Text>
            </DocSection>

            <DocSection title="쓸 때" description="까닭은 docs/decisions/0009-indoor-map-on-hold.md 에 있습니다.">
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

            <DocSection title="넣지 않은 것" description="실제 제원을 확인한 종류만 넣었습니다.">
                <Card variant="sunken" padding="md">
                    <ul className="space-y-2.5">
                        {LEFT_OUT.map((item) => (
                            <li key={item}>
                                <Text size="sm" tone="muted">
                                    {item}
                                </Text>
                            </li>
                        ))}
                    </ul>
                </Card>
            </DocSection>
        </div>
    );
}
