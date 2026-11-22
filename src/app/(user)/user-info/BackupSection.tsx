"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Icon, InfoRow, Section, Text } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import { cn } from "@/lib/cn";
import {
    BackupError,
    applyImport,
    buildBackup,
    planImport,
    readBackup,
    type BuiltBackup,
    type ImportPlan,
    type ParsedBackup,
} from "@/lib/db/backup";
import { formatBytes, saveFile } from "@/lib/file";

const LAST_BACKUP_KEY = "nemo:last-backup-at";

type Step =
    | { kind: "idle" }
    | { kind: "working"; title: string; message: string }
    | { kind: "export-ready"; built: BuiltBackup }
    | { kind: "import-preview"; backup: ParsedBackup; plan: ImportPlan }
    | { kind: "done"; title: string; message: string }
    | { kind: "error"; title: string; message: string };

const rowClassName = (index: number) =>
    cn(
        "sticker-press flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
        index > 0 && "border-ink border-t-2",
    );

const formatDate = (at: number) =>
    new Date(at).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

function describeLastBackup(at: number | null): string {
    if (at === null) return "아직 백업한 적이 없어요.";
    const days = Math.floor((Date.now() - at) / 86_400_000);
    return `마지막 백업: ${days <= 0 ? "오늘" : `${days}일 전`}`;
}

function describePlan(plan: ImportPlan): string {
    const parts = [
        plan.added > 0 && `${plan.added}개 추가`,
        plan.updated > 0 && `${plan.updated}개 최신 내용으로 바꿈`,
        plan.removed > 0 && `${plan.removed}개 삭제`,
    ].filter(Boolean);
    return parts.length > 0 ? `${parts.join(", ")}했어요.` : "이미 모두 이 기기에 있어서 달라진 것이 없어요.";
}

const errorMessage = (error: unknown, fallback: string) => (error instanceof BackupError ? error.message : fallback);

/**
 * 마이 화면의 백업 내보내기·가져오기.
 * 로그인 전에는 이 기기가 기록의 유일한 원본이라, 이 파일이 유일한 안전망이다.
 */
export function BackupSection() {
    const [step, setStep] = useState<Step>({ kind: "idle" });
    const [lastBackupAt, setLastBackupAt] = useState<number | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const saved = Number(window.localStorage.getItem(LAST_BACKUP_KEY));
            if (saved > 0) setLastBackupAt(saved);
        } catch {
            // 사생활 보호 모드 등 — 표시만 건너뛴다
        }
    }, []);

    const close = () => setStep({ kind: "idle" });

    const startExport = async () => {
        setStep({ kind: "working", title: "백업 내보내기", message: "기록과 사진을 파일로 묶고 있어요…" });
        try {
            const built = await buildBackup();
            if (built.productCount === 0) {
                setStep({ kind: "done", title: "백업 내보내기", message: "아직 기록한 물건이 없어요." });
                return;
            }
            setStep({ kind: "export-ready", built });
        } catch {
            setStep({
                kind: "error",
                title: "백업을 만들지 못했어요",
                message: "잠시 뒤 다시 시도해 주세요. 기록은 그대로예요.",
            });
        }
    };

    // 파일을 만든 뒤 따로 누르게 하는 이유: 누른 직후가 아니면 iOS 가 공유 창을 막는다
    const save = async (built: BuiltBackup) => {
        try {
            const result = await saveFile(built.blob, built.fileName);
            if (result === "cancelled") return;

            const now = Date.now();
            setLastBackupAt(now);
            try {
                window.localStorage.setItem(LAST_BACKUP_KEY, String(now));
            } catch {
                // 저장 못 해도 백업 자체는 끝났다
            }
            setStep({
                kind: "done",
                title: "백업 내보내기",
                message:
                    result === "shared"
                        ? "백업 파일을 넘겼어요. 저장한 곳을 기억해 두세요."
                        : `${built.fileName} 파일을 내려받았어요. 이 기기 밖(클라우드, 다른 기기)에도 옮겨 두면 더 안전해요.`,
            });
        } catch {
            setStep({
                kind: "error",
                title: "파일을 저장하지 못했어요",
                message: "다시 시도해 주세요. 기록은 그대로예요.",
            });
        }
    };

    const pickFile = async (file: File | undefined) => {
        if (!file) return;
        setStep({ kind: "working", title: "백업 가져오기", message: "파일을 확인하고 있어요…" });
        try {
            const backup = await readBackup(file);
            setStep({ kind: "import-preview", backup, plan: await planImport(backup) });
        } catch (error) {
            setStep({
                kind: "error",
                title: "가져올 수 없는 파일이에요",
                message: `${errorMessage(error, "파일을 읽지 못했어요.")} 기록은 그대로예요.`,
            });
        }
    };

    const runImport = async (backup: ParsedBackup) => {
        setStep({ kind: "working", title: "백업 가져오기", message: "기록을 합치고 있어요…" });
        try {
            const plan = await applyImport(backup);
            setStep({ kind: "done", title: "백업 가져오기", message: describePlan(plan) });
        } catch {
            setStep({
                kind: "error",
                title: "가져오지 못했어요",
                message: "저장 공간이 모자라거나 저장소를 쓸 수 없어요. 아무것도 바뀌지 않았어요.",
            });
        }
    };

    const actions = [
        { label: "백업 내보내기", hint: "기록한 물건과 사진을 파일로 저장", icon: "download" as const, onClick: startExport },
        {
            label: "백업 가져오기",
            hint: "저장해 둔 파일에서 되살리기",
            icon: "upload" as const,
            onClick: () => fileInput.current?.click(),
        },
    ];

    return (
        <Section
            title="데이터"
            titleClassName="scribble"
            description={`앱을 지우거나 브라우저 데이터를 지우면 기록도 함께 사라져요. ${describeLastBackup(lastBackupAt)}`}
        >
            <div className="sticker overflow-hidden rounded-nemo bg-paper">
                {actions.map((action, index) => (
                    <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        disabled={step.kind === "working"}
                        className={rowClassName(index)}
                    >
                        <span className="flex min-w-0 items-center gap-3">
                            <Icon name={action.icon} className="text-lg" />
                            <span className="min-w-0">
                                <span className="block text-sm font-bold">{action.label}</span>
                                <span className="block text-xs text-ink-soft">{action.hint}</span>
                            </span>
                        </span>
                        <Icon name="chevron-right" className="text-lg text-ink-soft" />
                    </button>
                ))}
            </div>

            {/* 같은 파일을 다시 골라도 change 가 나도록 값을 비운다 */}
            <input
                ref={fileInput}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(event) => {
                    void pickFile(event.target.files?.[0]);
                    event.target.value = "";
                }}
            />

            {step.kind === "working" && (
                // 작업 중에는 닫아도 멈추지 않는다 — 닫기를 막아 결과를 놓치지 않게 한다
                <Modal open onClose={() => {}} title={step.title}>
                    <Text size="sm" role="status">
                        {step.message}
                    </Text>
                </Modal>
            )}

            {step.kind === "export-ready" && (
                <Modal
                    open
                    onClose={close}
                    title="백업 파일이 준비됐어요"
                    footer={
                        <>
                            <Button variant="ghost" onClick={close}>
                                닫기
                            </Button>
                            <Button onClick={() => void save(step.built)}>저장하기</Button>
                        </>
                    }
                >
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <InfoRow label="물건" value={`${step.built.productCount}개`} />
                            <InfoRow label="사진" value={`${step.built.imageCount}장`} />
                            <InfoRow label="파일 크기" value={formatBytes(step.built.blob.size)} />
                        </div>
                        <Text size="xs" tone="muted">
                            이 파일은 암호로 잠겨 있지 않아요. 파일을 가진 사람은 기록을 볼 수 있으니 믿을 수 있는 곳에
                            보관하세요.
                        </Text>
                    </div>
                </Modal>
            )}

            {step.kind === "import-preview" && (
                <Modal
                    open
                    onClose={close}
                    title="이 백업을 가져올까요?"
                    footer={
                        <>
                            <Button variant="ghost" onClick={close}>
                                취소
                            </Button>
                            <Button onClick={() => void runImport(step.backup)}>가져오기</Button>
                        </>
                    }
                >
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <InfoRow label="내보낸 날" value={formatDate(step.backup.exportedAt)} />
                            <InfoRow label="새로 추가" value={`${step.plan.added}개`} />
                            <InfoRow label="최신 내용으로 바꿈" value={`${step.plan.updated}개`} />
                            <InfoRow label="삭제" value={`${step.plan.removed}개`} />
                            <InfoRow label="그대로 둠" value={`${step.plan.kept}개`} />
                        </div>
                        <Text size="xs" tone="muted">
                            지금 기록에 합쳐요. 같은 물건은 더 나중에 고친 쪽이 남고, 이 기기에만 있는 물건은
                            그대로예요.
                        </Text>
                    </div>
                </Modal>
            )}

            {(step.kind === "done" || step.kind === "error") && (
                <Modal open onClose={close} title={step.title} footer={<Button onClick={close}>확인</Button>}>
                    <Text
                        size="sm"
                        tone={step.kind === "error" ? "danger" : "default"}
                        role={step.kind === "error" ? "alert" : "status"}
                    >
                        {step.message}
                    </Text>
                </Modal>
            )}
        </Section>
    );
}
