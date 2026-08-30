"use client";

import { useState } from "react";

import { Button, Card, Text } from "@/components/common";
import { Modal } from "@/components/common/Modal";

import { ClassName, DocSection, ExamplePreview, PageHeader } from "../_components/DocSection";

export default function ModalPage() {
    const [open, setOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    return (
        <div className="space-y-16">
            <PageHeader
                title="Modal"
                description="종이 한 장을 화면 위에 얹은 모양. 평면 먹선 스티커 패널이고, 백드롭은 먹 반투명입니다 — 블러도 그림자도 쓰지 않습니다."
            />

            <DocSection title="기본" description="제목 · 본문만 있는 읽기용 모달.">
                <ExamplePreview>
                    <Button onClick={() => setOpen(true)}>모달 열기</Button>
                </ExamplePreview>
                <Modal open={open} onClose={() => setOpen(false)} title="개인정보처리방침">
                    <div className="text-ink space-y-2 text-sm">
                        <p>- 수집 항목: 이름, 이메일, 주소 등</p>
                        <p>- 보유 기간: 회원 탈퇴 시까지</p>
                    </div>
                </Modal>
                <Text size="sm" tone="muted">
                    제목은 손글씨(<ClassName>font-display</ClassName>), 본문은 sans 입니다. 머리·바닥은 헤어라인이
                    아니라 2px 먹선(<ClassName>border-ink</ClassName>)으로 끊습니다.
                </Text>
            </DocSection>

            <DocSection title="footer 슬롯" description="확인/취소 같은 결정을 요구할 때.">
                <ExamplePreview>
                    <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
                        삭제 확인 모달
                    </Button>
                </ExamplePreview>
                <Modal
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    title="정말 삭제할까요?"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                                취소
                            </Button>
                            <Button variant="danger" onClick={() => setConfirmOpen(false)}>
                                삭제
                            </Button>
                        </>
                    }
                >
                    <Text size="sm" tone="muted">
                        삭제한 제품은 되돌릴 수 없습니다.
                    </Text>
                </Modal>
                <Text size="sm" tone="muted">
                    파괴적 동작에만 <ClassName>variant=&quot;danger&quot;</ClassName> 를 씁니다. 취소는 먹선
                    아웃라인으로 두어 손이 먼저 danger 로 가지 않게 합니다.
                </Text>
            </DocSection>

            <DocSection title="동작">
                <Card variant="sunken" padding="md">
                    <ul className="space-y-2.5">
                        <li>
                            <Text size="sm" tone="muted">
                                Escape 키 또는 백드롭 클릭으로 닫힙니다. 패널 클릭은 전파를 멈춥니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                열려 있는 동안 <ClassName>body</ClassName> 스크롤을 잠그고, 닫을 때 원래 값으로
                                되돌립니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                <ClassName>role=&quot;dialog&quot;</ClassName> + <ClassName>aria-modal</ClassName> +{" "}
                                <ClassName>aria-labelledby</ClassName>(제목). 열릴 때 포커스를 패널로 옮깁니다 — 다만
                                포커스 트랩은 없으므로 긴 폼을 모달에 담지 마세요.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                백드롭과 패널은 하나의 <ClassName>z-50</ClassName> 컨테이너입니다. 하단 내비(z-40)·떠
                                있는 버튼(z-30) 위에 확실히 얹힙니다.
                            </Text>
                        </li>
                        <li>
                            <Text size="sm" tone="muted">
                                본문은 <ClassName>max-h-[60vh]</ClassName> 안에서만 스크롤됩니다 — 머리와 바닥은 늘
                                보입니다.
                            </Text>
                        </li>
                    </ul>
                </Card>
            </DocSection>
        </div>
    );
}
