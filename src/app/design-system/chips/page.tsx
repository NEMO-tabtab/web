"use client";

import { useState } from "react";

import { Chip, Text } from "@/components/common";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

const CATEGORIES = ["카메라", "시계", "가방", "신발", "가전"];

export default function ChipsPage() {
    const [selected, setSelected] = useState("카메라");
    const [tags, setTags] = useState(["카메라", "필름", "빈티지"]);

    return (
        <div className="space-y-16">
            <PageHeader
                title="Chip"
                description="선택은 색이 아니라 먹 채움으로 표현합니다 — 이 시스템의 핵심 원칙을 가장 짧게 보여주는 컴포넌트."
            />

            <DocSection title="Selection" description="눌러보세요. 선택 상태는 aria-pressed 로도 노출됩니다.">
                <ExamplePreview caption="selected → bg-ink text-paper  ·  기본 → bg-paper text-ink">
                    {CATEGORIES.map((category) => (
                        <Chip key={category} selected={selected === category} onClick={() => setSelected(category)}>
                            {category}
                        </Chip>
                    ))}
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    선택 여부와 무관하게 테두리는 항상 <ClassName>.sticker</ClassName> 2px 먹선입니다. 바뀌는 것은 안쪽
                    채움뿐이라 필터 줄의 높이와 폭이 흔들리지 않습니다.
                </Text>
            </DocSection>

            <DocSection title="Removable" description="onRemove 를 넘기면 오른쪽에 제거 버튼이 붙습니다.">
                <ExamplePreview caption="onRemove">
                    {tags.length === 0 ? (
                        <Text size="sm" tone="muted">
                            태그를 모두 제거했습니다.
                        </Text>
                    ) : (
                        tags.map((tag) => (
                            <Chip key={tag} selected onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                                {tag}
                            </Chip>
                        ))
                    )}
                </ExamplePreview>
                <Text size="sm" tone="muted">
                    제거 버튼은 칩 본체 안의 별도 클릭 영역이라 <ClassName>onClick</ClassName> 으로 전파되지 않습니다.
                </Text>
            </DocSection>

            <DocSection title="Static" description='상호작용이 없는 태그로 쓸 때는 as="span".'>
                <ExamplePreview caption='as="span" — 눌림 피드백과 aria-pressed 가 붙지 않습니다'>
                    <Chip as="span">읽기 전용</Chip>
                    <Chip as="span" selected>
                        읽기 전용 · 선택됨
                    </Chip>
                </ExamplePreview>
            </DocSection>

            <DocSection title="Disabled">
                <ExamplePreview caption="disabled — 40% 투명도, 포인터 이벤트 차단">
                    <Chip disabled>비활성</Chip>
                    <Chip disabled selected>
                        비활성 · 선택됨
                    </Chip>
                </ExamplePreview>
            </DocSection>

            <DocSection
                title="Chip 과 Button"
                description="둘 다 알약이 될 수 있어 헷갈립니다. 기준은 '무엇을 남기는가'."
            >
                <ul className="space-y-1.5 text-sm">
                    <li className="flex gap-3">
                        <span className="w-16 shrink-0">
                            <ClassName>Chip</ClassName>
                        </span>
                        <span className="text-ink-soft">
                            상태를 켜고 끕니다. 목록 필터·태그처럼 화면에 계속 남아 현재 조건을 보여줍니다.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-16 shrink-0">
                            <ClassName>Button</ClassName>
                        </span>
                        <span className="text-ink-soft">
                            동작을 실행합니다. 누르면 저장·이동이 일어나고 자신은 상태를 갖지 않습니다.
                        </span>
                    </li>
                </ul>
            </DocSection>
        </div>
    );
}
