"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge, Button, Card, Input, PageHeader, PageShell, Text } from "@/components/common";
import { API_CONFIGURED, API_MOCK_ENABLED, ApiError, DEFAULT_API_BASE } from "@/lib/api/client";
import { describeApiError } from "@/lib/api/errors";

import { LIVE_CHECKS, type LiveCheck } from "./checks";

type Result =
    | { kind: "running" }
    | { kind: "ok"; value: unknown; durationMs: number }
    | { kind: "empty"; durationMs: number }
    | { kind: "failed"; label: string; notice: string; durationMs: number };

async function runCheck(check: LiveCheck, input: string): Promise<Result> {
    const startedAt = performance.now();
    const durationMs = () => Math.round(performance.now() - startedAt);
    try {
        const value = await check.run(input);
        return value === null
            ? { kind: "empty", durationMs: durationMs() }
            : { kind: "ok", value, durationMs: durationMs() };
    } catch (error) {
        if (error instanceof ApiError) {
            return {
                kind: "failed",
                label: error.status === undefined ? error.kind : `${error.kind} ${error.status}`,
                notice: describeApiError(error).message,
                durationMs: durationMs(),
            };
        }
        // 서버를 부르기 전에 걸러진 입력
        return {
            kind: "failed",
            label: "입력",
            notice: error instanceof Error ? error.message : "입력을 확인해 주세요.",
            durationMs: durationMs(),
        };
    }
}

const initialInputs = () => Object.fromEntries(LIVE_CHECKS.map((check) => [check.id, check.input?.initial ?? ""]));

/**
 * 앱이 쓸 조회 함수를 실제 서버에 대고 불러 보는 화면 (#121).
 *
 * `/dev/api-test` 는 주소를 직접 부르고 응답 원문을 보여 준다. 여기는 한 단계 위다 —
 * `src/lib/api` 의 함수를 그대로 불러 **화면이 받게 될 값**과 **실패했을 때 사용자가 볼 문구**를 보여 준다.
 * 실제 화면에 붙이기 전에 여기서 먼저 맞는지 본다.
 */
export default function ApiLive() {
    const [inputs, setInputs] = useState<Record<string, string>>(initialInputs);
    const [results, setResults] = useState<Record<string, Result>>({});
    const [runningAll, setRunningAll] = useState(false);

    const run = async (check: LiveCheck) => {
        setResults((prev) => ({ ...prev, [check.id]: { kind: "running" } }));
        const result = await runCheck(check, inputs[check.id] ?? "");
        setResults((prev) => ({ ...prev, [check.id]: result }));
    };

    // 잠든 서버를 한 번만 깨우도록 차례로 부른다
    const runAll = async () => {
        setRunningAll(true);
        for (const check of LIVE_CHECKS) await run(check);
        setRunningAll(false);
    };

    return (
        <PageShell>
            <PageHeader title="API 연결 확인" description="앱이 쓸 조회 함수를 실제 서버에 대고 불러 봅니다." />

            <Card padding="sm" className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={API_CONFIGURED && !API_MOCK_ENABLED ? "ink" : "danger"}>
                        {API_MOCK_ENABLED ? "모의 서버" : API_CONFIGURED ? "실제 서버" : "주소 없음"}
                    </Badge>
                    <code className="min-w-0 break-all font-mono text-xs text-ink-soft">
                        {DEFAULT_API_BASE || "NEXT_PUBLIC_API_URL 이 비어 있어요"}
                    </code>
                </div>
                {API_MOCK_ENABLED && (
                    <Text size="xs" tone="danger">
                        모의 서버가 켜져 있어 실제 서버를 부르지 않아요. NEXT_PUBLIC_API_MOCK 을 비우고 다시 실행하세요.
                    </Text>
                )}
                {!API_CONFIGURED && (
                    <Text size="xs" tone="danger">
                        .env.local 에 NEXT_PUBLIC_API_URL 을 넣고 다시 실행하세요.
                    </Text>
                )}
                <Text size="xs" tone="muted">
                    읽기만 합니다. 서버가 잠들어 있으면 첫 호출이 1분쯤 걸려요. 응답 원문은{" "}
                    <Link href="/dev/api-test" className="underline">
                        API 테스트 콘솔
                    </Link>
                    에서 볼 수 있어요.
                </Text>
                <Button onClick={() => void runAll()} disabled={runningAll || !API_CONFIGURED} fullWidth>
                    {runningAll ? "확인하는 중…" : "모두 확인"}
                </Button>
            </Card>

            <ul className="mt-4 space-y-3">
                {LIVE_CHECKS.map((check) => {
                    const result = results[check.id];
                    const busy = runningAll || result?.kind === "running";

                    return (
                        <li key={check.id}>
                            <Card padding="sm" className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <Text weight="bold">{check.title}</Text>
                                        <ResultBadge result={result} />
                                    </div>
                                    <code className="block break-all font-mono text-xs text-ink">{check.call}</code>
                                    <code className="block break-all font-mono text-xs text-ink-soft">
                                        {check.endpoint}
                                    </code>
                                </div>

                                <form
                                    className="flex items-end gap-2"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void run(check);
                                    }}
                                >
                                    {check.input && (
                                        <Input
                                            label={check.input.label}
                                            inputMode={check.input.inputMode}
                                            value={inputs[check.id] ?? ""}
                                            onChange={(event) =>
                                                setInputs((prev) => ({ ...prev, [check.id]: event.target.value }))
                                            }
                                        />
                                    )}
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        size="sm"
                                        disabled={busy || !API_CONFIGURED}
                                        className="shrink-0"
                                    >
                                        불러오기
                                    </Button>
                                </form>

                                <ResultView result={result} />
                            </Card>
                        </li>
                    );
                })}
            </ul>
        </PageShell>
    );
}

function ResultBadge({ result }: { result: Result | undefined }) {
    if (!result) return null;
    if (result.kind === "running") return <Badge variant="warning">부르는 중</Badge>;

    const label = result.kind === "ok" ? "성공" : result.kind === "empty" ? "없음" : result.label;
    return (
        <span className="flex shrink-0 items-center gap-2">
            <span className="font-sans text-xs tabular-nums text-ink-soft">{result.durationMs}ms</span>
            <Badge variant={result.kind === "failed" ? "danger" : "ink"}>{label}</Badge>
        </span>
    );
}

function ResultView({ result }: { result: Result | undefined }) {
    if (!result || result.kind === "running") return null;

    if (result.kind === "failed") {
        return (
            <div className="space-y-1 rounded-nemo border border-danger p-3" role="alert">
                <Text size="xs" tone="muted">
                    사용자에게 보일 문구
                </Text>
                <Text size="sm" weight="bold" tone="danger">
                    {result.notice}
                </Text>
            </div>
        );
    }

    if (result.kind === "empty") {
        return (
            <Text size="sm" tone="muted" role="status">
                함수가 null 을 돌려줬어요 — 서버에 없는 것으로 다뤄요.
            </Text>
        );
    }

    return (
        <details open>
            <summary className="cursor-pointer select-none text-[13px] font-bold text-ink">화면이 받는 값</summary>
            {/* 긴 JSON 은 블록 안에서만 가로 스크롤 — 페이지 본문이 옆으로 밀리지 않게 */}
            <pre className="mt-2 max-h-72 overflow-auto rounded-nemo bg-cream p-3 font-mono text-xs leading-relaxed text-ink">
                {typeof result.value === "string" ? result.value : JSON.stringify(result.value, null, 2)}
            </pre>
        </details>
    );
}
