"use client";

import { useId, useState } from "react";

import { Button, InfoRow, Input, Text } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import {
    CONTRIBUTE_TEXT_LIMIT,
    contributeBarcode,
    contributionPayload,
    tidyContributionText,
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
        title: "공유했어요",
        message: "고마워요! 다음부터 이 바코드를 찍는 사람에게는 제품명이 자동으로 채워져요.",
    },
    exists: {
        title: "이미 공유된 바코드예요",
        message: "그사이 다른 분이 먼저 공유했어요. 먼저 공유된 내용은 바꾸지 않았어요.",
    },
};

interface BarcodeShareDialogProps {
    /** 물건을 저장한 뒤의 바코드·제품명·브랜드. 서버에서 못 찾은 바코드일 때만 넘긴다. 제품명·브랜드는 창에서 고칠 수 있다 */
    contribution: BarcodeContribution;
    /** 공유했든 안 했든 창을 닫고 다음 화면으로 갈 때 */
    onFinish: () => void;
}

/**
 * 서버에서 못 찾은 바코드의 정보를 다른 사용자도 쓰게 공유할지 묻는다(#128).
 * 묻지 않고 올리지 않는다 — "공유하기"를 누를 때만 서버로 나간다. 물건은 이미 기기에 저장된 뒤라
 * 공유에 실패해도 기록은 그대로다.
 *
 * 기록에 적은 이름은 "언니가 준 하치와레"처럼 자기만 아는 이름일 수 있어서, 공유할 이름은 여기서 따로 고친다.
 * 고쳐도 기기에 저장한 기록은 바뀌지 않는다.
 */
export function BarcodeShareDialog({ contribution, onFinish }: BarcodeShareDialogProps) {
    const [step, setStep] = useState<Step>({ kind: "ask" });
    const [name, setName] = useState(() => tidyContributionText(contribution.name));
    const [brandName, setBrandName] = useState(() => tidyContributionText(contribution.brandName ?? ""));
    const nameId = useId();
    const brandId = useId();

    // 화면에 보여 주는 값과 실제로 보내는 값이 같도록 같은 함수로 다듬는다
    const payload = contributionPayload({ barcode: contribution.barcode, name, brandName });

    const send = async () => {
        if (!payload) return;
        setStep({ kind: "sending" });
        try {
            setStep({ kind: "done", result: await contributeBarcode(payload) });
        } catch (error) {
            setStep({ kind: "failed", notice: describeApiError(error) });
        }
    };

    // 보내는 중에는 닫지 않는다 — 닫아도 요청은 이미 나갔다
    const close = () => {
        if (step.kind !== "sending") onFinish();
    };

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
                title="공유하지 못했어요"
                footer={
                    <>
                        <Button variant="ghost" onClick={onFinish}>
                            닫기
                        </Button>
                        {step.notice.retryable && <Button onClick={() => void send()}>다시 공유하기</Button>}
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
            title="바코드 정보를 공유할까요?"
            footer={
                <>
                    <Button variant="ghost" onClick={onFinish} disabled={sending}>
                        공유하지 않기
                    </Button>
                    <Button onClick={() => void send()} isLoading={sending} disabled={!payload}>
                        {sending ? "공유하는 중…" : "공유하기"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Text size="sm">
                    물건은 저장했어요. 이 바코드는 아직 앱에 제품 정보가 없어요. 공유하면 다른 사용자가 이 바코드를 찍을
                    때 제품명이 자동으로 채워져요.
                </Text>
                <div className="space-y-3 rounded-nemo border border-line px-3 py-3">
                    <InfoRow label="바코드" value={contribution.barcode.trim()} />
                    <Input
                        id={nameId}
                        label="제품명"
                        required
                        value={name}
                        maxLength={CONTRIBUTE_TEXT_LIMIT}
                        disabled={sending}
                        onChange={(event) => setName(event.target.value)}
                        onBlur={() => setName(tidyContributionText(name))}
                        error={name.trim() ? undefined : "공유할 제품명을 적어 주세요"}
                        hint={`고쳐도 내 기록의 이름은 그대로예요 · ${name.length}/${CONTRIBUTE_TEXT_LIMIT}`}
                    />
                    <Input
                        id={brandId}
                        label="브랜드"
                        value={brandName}
                        maxLength={CONTRIBUTE_TEXT_LIMIT}
                        disabled={sending}
                        placeholder="모르면 비워 두세요"
                        onChange={(event) => setBrandName(event.target.value)}
                        onBlur={() => setBrandName(tidyContributionText(brandName))}
                        hint={`${brandName.length}/${CONTRIBUTE_TEXT_LIMIT}`}
                    />
                </div>
                <Text size="xs" tone="muted">
                    공유되는 것은 위 바코드·제품명·브랜드뿐이에요. 가격·메모·사진·보관 위치는 공유하지 않아요. 공유한
                    정보는 이 바코드를 찍는 누구나 볼 수 있고, 앱에서 고치거나 지울 수 없어요.
                </Text>
            </div>
        </Modal>
    );
}
