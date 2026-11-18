"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { EmptyState, PageHeader, PageShell, Section } from "@/components/common";
import { Tabs } from "@/components/common/Tabs";
import { cn } from "@/lib/cn";
import { DEFAULT_API_BASE, request } from "@/lib/api/client";

import { ENDPOINT_GROUPS, ENDPOINTS, type EndpointGroup } from "./endpoints";
import { EnvironmentPanel, type ConsoleSession } from "./_components/EnvironmentPanel";
import { MethodBadge } from "./_components/MethodBadge";
import { RequestForm, type SentRequest } from "./_components/RequestForm";
import { TraceView, type TraceEntry } from "./_components/TraceView";

const BASE_URL_KEY = "nemo:api-test:base-url";
const HISTORY_LIMIT = 20;

/** 로그인 응답 data — 명세: { token: JWT, user: UserRead } */
interface LoginData {
    token?: string;
    user?: { userIdx?: number; loginId?: string; name?: string };
}

/**
 * 프론트엔드 쪽 API 호출 테스트 콘솔 (#91).
 *
 * 백엔드 → Swagger(백엔드 검증) → **이 페이지(프론트 검증)** → 화면 연결.
 * Swagger 와 달리 화면이 쓸 `lib/api/client` 를 그대로 통해 부르므로,
 * 폰·PWA 에서만 깨지는 문제(CORS, mixed content, multipart, 콜드 스타트)를 여기서 먼저 잡는다.
 */
export default function ApiConsole() {
    const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);
    const [session, setSession] = useState<ConsoleSession | null>(null);
    const [attachToken, setAttachToken] = useState(true);

    const [group, setGroup] = useState<EndpointGroup>("user");
    const [selectedId, setSelectedId] = useState("user-login");
    const [running, setRunning] = useState(false);

    const [history, setHistory] = useState<TraceEntry[]>([]);
    const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
    const nextId = useRef(1);

    // 다른 백엔드(로컬 서버 등)를 폰에서 시험할 수 있게 주소는 기기에 기억해 둔다
    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(BASE_URL_KEY);
            if (saved) setBaseUrl(saved);
        } catch {
            // 사생활 보호 모드 등 — 기본값으로 계속
        }
    }, []);

    const changeBaseUrl = (value: string) => {
        setBaseUrl(value);
        try {
            if (value === DEFAULT_API_BASE) window.localStorage.removeItem(BASE_URL_KEY);
            else window.localStorage.setItem(BASE_URL_KEY, value);
        } catch {
            // 저장 못 해도 이번 세션 동안은 동작한다
        }
    };

    const endpoints = useMemo(() => ENDPOINTS.filter((e) => e.group === group), [group]);
    const selected = ENDPOINTS.find((e) => e.id === selectedId) ?? ENDPOINTS[0];
    const activeEntry = history.find((h) => h.id === activeEntryId) ?? null;

    const selectGroup = (value: EndpointGroup) => {
        setGroup(value);
        const first = ENDPOINTS.find((e) => e.group === value);
        if (first) setSelectedId(first.id);
    };

    const run = async ({ options, preview }: SentRequest) => {
        setRunning(true);
        const trace = await request({
            ...options,
            baseUrl,
            token: attachToken ? session?.token : undefined,
        });
        setRunning(false);

        if (selected.login && trace.ok) {
            const data = trace.envelope?.data as LoginData | undefined;
            if (data?.token) {
                setSession({
                    token: data.token,
                    userIdx: data.user?.userIdx,
                    loginId: data.user?.loginId,
                    name: data.user?.name,
                });
            }
        }
        if (selected.logout && trace.ok) setSession(null);

        const entry: TraceEntry = { id: nextId.current++, summary: selected.summary, at: new Date(), preview, trace };
        setHistory((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
        setActiveEntryId(entry.id);
    };

    return (
        <PageShell width="wide" className="space-y-6">
            <PageHeader
                title="API 테스트"
                description="화면에 붙이기 전에, 이 기기에서 API 가 실제로 불리는지 확인합니다."
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
                <div className="space-y-6">
                    <Section title="환경" titleAs="h2">
                        <EnvironmentPanel
                            baseUrl={baseUrl}
                            defaultBaseUrl={DEFAULT_API_BASE}
                            onBaseUrlChange={changeBaseUrl}
                            session={session}
                            onClearSession={() => setSession(null)}
                            attachToken={attachToken}
                            onAttachTokenChange={setAttachToken}
                        />
                    </Section>

                    <Section title="엔드포인트" titleAs="h2" className="space-y-3">
                        <Tabs items={ENDPOINT_GROUPS} value={group} onChange={selectGroup} aria-label="리소스" />
                        <ul className="space-y-1.5">
                            {endpoints.map((endpoint) => (
                                <li key={endpoint.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(endpoint.id)}
                                        aria-current={endpoint.id === selected.id}
                                        className={cn(
                                            "flex w-full items-center gap-2.5 rounded-nemo px-3 py-2 text-left",
                                            endpoint.id === selected.id
                                                ? "sticker bg-paper"
                                                : "border border-transparent hover:bg-cream",
                                        )}
                                    >
                                        <MethodBadge method={endpoint.method} />
                                        <span className="min-w-0">
                                            <span className="block text-sm font-bold text-ink">{endpoint.summary}</span>
                                            <span className="block truncate font-mono text-xs text-ink-soft">
                                                {endpoint.path}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Section>
                </div>

                <div className="min-w-0 space-y-6">
                    <Section title="요청" titleAs="h2">
                        <RequestForm
                            // 엔드포인트나 로그인 사용자가 바뀌면 템플릿부터 다시 채운다
                            key={`${selected.id}:${session?.userIdx ?? "-"}`}
                            endpoint={selected}
                            context={{ userIdx: session?.userIdx }}
                            running={running}
                            onRun={run}
                        />
                    </Section>

                    <Section title="응답" titleAs="h2">
                        {activeEntry ? (
                            <TraceView entry={activeEntry} />
                        ) : (
                            <EmptyState
                                title="아직 호출한 적이 없어요"
                                description="엔드포인트를 골라 실행해 보세요."
                            />
                        )}
                    </Section>

                    {history.length > 0 && (
                        <Section
                            title="기록"
                            description={`최근 ${HISTORY_LIMIT}건 · 새로고침하면 사라집니다`}
                            titleAs="h2"
                        >
                            <ul className="space-y-1.5">
                                {history.map((entry) => (
                                    <li key={entry.id}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveEntryId(entry.id)}
                                            aria-current={entry.id === activeEntryId}
                                            className={cn(
                                                "flex w-full items-center gap-2.5 rounded-nemo px-3 py-2 text-left",
                                                entry.id === activeEntryId
                                                    ? "sticker bg-paper"
                                                    : "border border-transparent hover:bg-cream",
                                            )}
                                        >
                                            <MethodBadge method={entry.trace.method} />
                                            <span className="min-w-0 flex-1 truncate text-sm text-ink">
                                                {entry.summary}
                                            </span>
                                            <span
                                                className={cn(
                                                    "shrink-0 font-sans text-xs font-bold tabular-nums",
                                                    entry.trace.ok ? "text-ink" : "text-danger",
                                                )}
                                            >
                                                {entry.trace.status ?? entry.trace.failure?.kind} ·{" "}
                                                {entry.trace.durationMs}ms
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
