"use client";

import { useState } from "react";

import { Card, Text } from "@/components/common";
import { Tabs } from "@/components/common/Tabs";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

const VIEW_TABS = [
    { value: "category", label: "카테고리별" },
    { value: "space", label: "공간별" },
] as const;

const MY_TABS = [
    { value: "category", label: "카테고리" },
    { value: "group", label: "참여 그룹" },
] as const;

export default function TabsPage() {
    const [pill, setPill] = useState<(typeof VIEW_TABS)[number]["value"]>("category");
    const [underline, setUnderline] = useState<(typeof MY_TABS)[number]["value"]>("category");

    return (
        <div className="space-y-16">
            <PageHeader
                title="Tabs"
                description="선택 상태를 먹 채움(pill) 또는 먹선 밑줄(underline)로 표현합니다. 색은 쓰지 않고, 좌우 방향키로 이동할 수 있습니다."
            />

            <DocSection title="Pill" description="화면 상단에서 보기 방식을 전환할 때. 낱개 스티커를 나란히 붙인 결.">
                <ExamplePreview caption='variant="pill" (기본)'>
                    <Tabs items={VIEW_TABS} value={pill} onChange={setPill} aria-label="보기 방식" />
                </ExamplePreview>
                <Card variant="sunken" padding="md">
                    <Text size="sm" tone="muted">
                        선택됨: <span className="text-ink font-bold">{pill}</span>
                    </Text>
                </Card>
                <Text size="sm" tone="muted">
                    선택된 칩은 <ClassName>sticker bg-ink text-paper</ClassName>, 나머지는{" "}
                    <ClassName>sticker bg-paper</ClassName> 입니다. 칩 묶음을 다시 테두리로 감싸지 마세요 — 먹선이 두
                    겹으로 겹칩니다.
                </Text>
            </DocSection>

            <DocSection title="Underline" description="콘텐츠 영역을 나누는 페이지 내 내비게이션.">
                <Card padding="md">
                    <Tabs
                        items={MY_TABS}
                        value={underline}
                        onChange={setUnderline}
                        variant="underline"
                        aria-label="마이 페이지"
                    />
                    <div className="pt-4">
                        <Text size="sm" tone="muted">
                            선택됨: <span className="text-ink font-bold">{underline}</span>
                        </Text>
                    </div>
                </Card>
                <Text size="sm" tone="muted">
                    바닥선은 옅은 헤어라인(<ClassName>border-line</ClassName>)이고 활성 탭만 먹선(
                    <ClassName>border-ink</ClassName>)으로 굵어집니다.
                </Text>
            </DocSection>

            <DocSection title="고르는 법">
                <Card variant="sunken" padding="md">
                    <ul className="space-y-2.5">
                        <li>
                            <Text size="sm" tone="muted">
                                같은 목록을 다른 기준으로 다시 그린다 → <ClassName>pill</ClassName>
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                아예 다른 내용 묶음으로 넘어간다 → <ClassName>underline</ClassName>
                            </Text>
                        </li>
                    </ul>
                </Card>
            </DocSection>

            <DocSection title="접근성">
                <ul className="text-ink list-disc space-y-2 pl-5 text-sm">
                    <li>
                        컨테이너에 <ClassName>role=&quot;tablist&quot;</ClassName>, 각 버튼에{" "}
                        <ClassName>role=&quot;tab&quot;</ClassName> + <ClassName>aria-selected</ClassName>
                    </li>
                    <li>roving tabindex — 활성 탭만 Tab 키 순서에 들어가고, 좌우 방향키로 탭 사이를 이동합니다</li>
                    <li>포커스는 오프셋 2px 먹선 아웃라인이라 선택 표시(먹 채움)와 겹쳐도 구분됩니다</li>
                    <li>
                        <ClassName>aria-label</ClassName> 로 무엇을 고르는 탭인지 알려주세요
                    </li>
                </ul>
            </DocSection>
        </div>
    );
}
