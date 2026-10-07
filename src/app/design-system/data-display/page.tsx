import { Badge, Card, IconTile, InfoRow, Price, ProductCard, StatTile, Text, priceSizes } from "@/components/common";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

const PRICE_SIZES = Object.keys(priceSizes) as Array<keyof typeof priceSizes>;

export default function DataDisplayPage() {
    return (
        <div className="space-y-16">
            <PageHeader
                title="Data Display"
                description="금액·수치·제품을 보여주는 컴포넌트. 숫자는 언제나 sans + tabular-nums 입니다."
            />

            <DocSection
                title="Price"
                description="금액 표시의 단일 창구. formatWon 을 내장하고 손글씨 페이스로 빠지지 않도록 강제한다."
            >
                <ExamplePreview className="flex-col items-start gap-4">
                    {PRICE_SIZES.map((size) => (
                        <div key={size} className="flex items-baseline gap-4">
                            <code className="text-ink-soft w-8 shrink-0 font-sans text-[11px]">{size}</code>
                            <Price value={1240000} size={size} />
                        </div>
                    ))}
                </ExamplePreview>
                {/* 먹 채움 위 — inverse 가 없으면 먹 글자가 먹 바탕에 묻힌다 */}
                <div className="sticker rounded-nemo bg-ink p-6">
                    <Price value={102040000} size="xl" inverse />
                </div>
                <Text size="sm" tone="muted">
                    먹 채움(<ClassName>bg-ink</ClassName>) 위에서는 <ClassName>inverse</ClassName> 를 씁니다. Gaegu 는
                    숫자 글리프가 불규칙해 금액에 쓰지 않습니다.
                </Text>
            </DocSection>

            <DocSection
                title="IconTile"
                description="아이콘·이모지를 담는 웰. 그림자가 없는 시스템에서 아이콘을 표면에 고정하는 장치."
            >
                <ExamplePreview className="gap-6" caption="size — sm · md · lg">
                    <IconTile size="sm">📦</IconTile>
                    <IconTile size="md">📦</IconTile>
                    <IconTile size="lg">📦</IconTile>
                </ExamplePreview>
                <ExamplePreview className="gap-6" caption="tone — default · ink · muted · danger · cheek">
                    <IconTile tone="default">📦</IconTile>
                    <IconTile tone="ink">📦</IconTile>
                    <IconTile tone="muted">📦</IconTile>
                    <IconTile tone="danger">⚠️</IconTile>
                    <IconTile tone="cheek">📦</IconTile>
                </ExamplePreview>
                <ExamplePreview className="gap-6" caption="shape — blob(기본) · circle · square">
                    <IconTile shape="blob">📦</IconTile>
                    <IconTile shape="circle">📦</IconTile>
                    <IconTile shape="square">📦</IconTile>
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    <ClassName>raised</ClassName> 는 무시됩니다 — 이 시스템에 그림자는 없습니다.{" "}
                    <ClassName>shape=&quot;blob-sm&quot;</ClassName> 도 <ClassName>blob</ClassName> 과 같습니다. 손그림
                    모서리는 한 종류뿐입니다.
                </Text>
            </DocSection>

            <DocSection title="StatTile" description="수치를 먼저, 라벨을 그 아래에. emphasis 는 한 화면에 하나만.">
                <div className="grid grid-cols-2 gap-4">
                    <StatTile emphasis icon={<i className="xi-box" />} label="총 등록 물품" value="59개" />
                    <StatTile icon={<i className="xi-users" />} label="참여 그룹" value="3개" />
                </div>
                <Text size="sm" tone="muted">
                    강조는 색이 아니라 먹 채움입니다. 두 칸을 다 채우면 위계가 사라집니다.
                </Text>
            </DocSection>

            <DocSection title="InfoRow" description="라벨 ↔ 값 한 줄. 카드 안 목록에 쓴다.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card padding="md" className="space-y-3">
                        <InfoRow label="총 자산 수" value="59개" />
                        <InfoRow label="이번 달 증가" value="+3개" />
                    </Card>
                    {/* 먹 채움 카드 — bg-ink 가 카드 기본 bg-paper 를 덮는다 */}
                    <Card padding="md" className="bg-ink space-y-3">
                        <InfoRow label="총 자산 수" value="59개" inverse />
                        <InfoRow label="이번 달 증가" value="+3개" inverse />
                    </Card>
                </div>
            </DocSection>

            <DocSection
                title="ProductCard"
                description="제품 한 건의 단일 표현. 이전에는 홈 그리드·홈 리스트·제품 목록이 각자 다른 마크업으로 같은 엔티티를 그렸다."
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <ProductCard
                        href="#"
                        name="맥북 프로 16인치"
                        price={3200000}
                        description="2023년형 M3 Max, 스페이스 블랙"
                        badge={<Badge variant="ink">보유 중</Badge>}
                    />
                    <div className="space-y-4">
                        <ProductCard
                            layout="row"
                            href="#"
                            name="라이카 M6"
                            price={4500000}
                            meta={
                                <Badge variant="neutral" size="sm">
                                    본가
                                </Badge>
                            }
                            badge={
                                <Badge variant="ink" size="sm">
                                    보유 중
                                </Badge>
                            }
                        />
                        <ProductCard layout="row" href="#" name="허먼밀러 에어론" price={1800000} fallbackIcon="🪑" />
                    </div>
                </div>
                <Text size="sm" tone="muted">
                    <ClassName>layout=&quot;grid&quot;</ClassName> 는 이미지 중심,{" "}
                    <ClassName>layout=&quot;row&quot;</ClassName> 는 목록용입니다. 이미지 영역에는{" "}
                    <ClassName>obj-stage</ClassName> 콘택트 섀도와 <ClassName>print-grain</ClassName> 인쇄 질감이 이미
                    들어 있습니다.
                </Text>
            </DocSection>

            <DocSection
                title="카드 그리드 — paste-grid"
                description="그리드 컨테이너에 붙이면 자식 카드가 ±0.4~0.7° 로 엇갈립니다. 손으로 붙인 스크랩북의 결."
            >
                <div className="paste-grid grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <ProductCard href="#" name="맥북 프로" price={3200000} fallbackIcon="💻" />
                    <ProductCard href="#" name="라이카 M6" price={4500000} fallbackIcon="📷" />
                    <ProductCard href="#" name="에어론 체어" price={1800000} fallbackIcon="🪑" />
                </div>
                <Text size="sm" tone="muted">
                    기울기는 <ClassName>nth-child(4n)</ClassName> 주기라 카드가 많아도 패턴이 반복될 뿐 어지럽지
                    않습니다. 목록형(row) 카드에는 쓰지 마세요 — 줄이 흔들려 읽기 어려워집니다.
                </Text>
            </DocSection>
        </div>
    );
}
