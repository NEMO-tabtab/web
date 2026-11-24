"use client";

import { useState } from "react";

import { Button, InfoRow, Text } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import {
    contributeBarcode,
    contributionPayload,
    type BarcodeContribution,
    type ContributeResult,
} from "@/lib/api/barcode";
import { LOCAL_DATA_SAFE, describeApiError, type ApiErrorNotice } from "@/lib/api/errors";

type Step =
    | { kind: "ask" }
    | { kind: "sending" }
    | { kind: "done"; result: ContributeResult }
    | { kind: "failed"; notice: ApiErrorNotice };

const DONE_MESSAGES: Record<ContributeResult, { title: string; message: string }> = {
    saved: {
        title: "올렸어요",
        message: "고마워요! 다음부터 이 바코드를 찍는 사람에게는 제품명이 채워져요.",
    },
    exists: {
        title: "이미 올라간 바코드예요",
        message: "그사이 다른 분이 먼저 올렸어요. 올라가 있던 내용은 바꾸지 않았어요.",
    },
};

interface BarcodeShareDialogProps {
    /** 물건을 저장한 뒤의 바코드·제품명·브랜드. 서버에서 못 찾은 바코드일 때만 넘긴다 */
    contribution: BarcodeContribution;
    /** 올렸든 안 올렸든 창을 닫고 다음 화면으로 갈 때 */
    onFinish: () => void;
}

/**
 * 서버에서 못 찾은 바코드의 정보를 다른 사람도 쓰게 올릴지 묻는다(#128).
 * 묻지 않고 올리지 않는다 — "올리기"를 누를 때만 서버로 나간다. 물건은 이미 기기에 저장된 뒤라
 * 올리기에 실패해도 기록은 그대로다.
 */
export function BarcodeShareDialog({ contribution, onFinish }: BarcodeShareDialogProps) {
    const [step, setStep] = useState<Step>({ kind: "ask" });
    // 화면에 보여 주는 값과 실제로 보내는 값이 같도록 같은 함수로 다듬는다
    const payload = contributionPayload(contribution);

    const send = async () => {
        setStep({ kind: "sending" });
        try {
            setStep({ kind: "done", result: await contributeBarcode(contribution) });
        } catch (error) {
            setStep({ kind: "failed", notice: describeApiError(error) });
        }
    };

    // 보내는 중에는 닫지 않는다 — 닫아도 요청은 이미 나갔다
    const close = () => {
        if (step.kind !== "sending") onFinish();
    };

    if (!payload) return null;

    if (step.kind === "done") {
        const done = DONE_MESSAGES[step.result];
        return (
            <Modal open onClose={close} title={done.title} footer={<Button onClick={onFinish}>확인</Button>}>
                <Text size="sm" role="status">
                    {done.message}
                </Text>
            </Modal>
        );
    }

    if (step.kind === "failed") {
        return (
            <Modal
                open
                onClose={close}
                title="올리지 못했어요"
                footer={
                    <>
                        <Button variant="ghost" onClick={onFinish}>
                            닫기
                        </Button>
                        {step.notice.retryable && <Button onClick={() => void send()}>다시 올리기</Button>}
                    </>
                }
            >
                <div className="space-y-2" role="alert">
                    <Text size="sm">{step.notice.message}</Text>
                    <Text size="sm" tone="muted">
                        {LOCAL_DATA_SAFE}
                    </Text>
                </div>
            </Modal>
        );
    }

    const sending = step.kind === "sending";
    return (
        <Modal
            open
            onClose={close}
            title="이 바코드 정보를 나눌까요?"
            footer={
                <>
                    <Button variant="ghost" onClick={onFinish} disabled={sending}>
                        올리지 않기
                    </Button>
                    <Button onClick={() => void send()} isLoading={sending}>
                        {sending ? "올리는 중…" : "올리기"}
                    </Button>
                </>
            }
        >
            <div className="space-y-3">
                <Text size="sm">
                    물건은 저장했어요. 서버에서 찾지 못한 바코드라, 올려 주면 다음에 이 바코드를 찍는 사람에게 제품명이
                    채워져요.
                </Text>
                <div className="space-y-1.5 rounded-nemo border border-line px-3 py-2.5">
                    <InfoRow label="바코드" value={payload.barcode} />
                    <InfoRow label="제품명" value={payload.name} className="[&>span:last-child]:text-right" />
                    {payload.brandName && (
                        <InfoRow label="브랜드" value={payload.brandName} className="[&>span:last-child]:text-right" />
                    )}
                </div>
                <Text size="xs" tone="muted">
                    올라가는 것은 위 내용뿐이에요. 가격·메모·사진·보관 위치는 올리지 않아요. 올린 정보는 누구나 볼 수
                    있고, 앱에서 고치거나 지울 수 없어요.
                </Text>
            </div>
        </Modal>
    );
}
