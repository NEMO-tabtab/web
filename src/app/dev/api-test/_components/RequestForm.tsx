"use client";

import { useState } from "react";

import { Button, Card, Input, Text, Textarea } from "@/components/common";
import { jsonPart, type RequestOptions } from "@/lib/api/client";

import type { EndpointDef, TemplateContext } from "../endpoints";
import { MethodBadge } from "./MethodBadge";

/** 실행 직전 요청 — 기록에 남겨 "무엇을 보냈는지" 를 응답 옆에 같이 보여준다 */
export interface SentRequest {
    options: Omit<RequestOptions, "baseUrl" | "token">;
    /** 사람이 읽을 본문 요약 (multipart 는 dto + 파일 목록) */
    preview?: string;
}

interface RequestFormProps {
    endpoint: EndpointDef;
    context: TemplateContext;
    running: boolean;
    onRun: (request: SentRequest) => void;
}

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

/**
 * 엔드포인트 하나의 입력 폼. 상위에서 `key={endpoint.id}` 로 끼워
 * 엔드포인트를 바꾸면 입력값이 템플릿으로 초기화되게 한다.
 */
export function RequestForm({ endpoint, context, running, onRun }: RequestFormProps) {
    const [params, setParams] = useState<Record<string, string>>({});
    const [bodyText, setBodyText] = useState(() => (endpoint.body ? pretty(endpoint.body.template(context)) : ""));
    const [files, setFiles] = useState<File[]>([]);
    const [bodyError, setBodyError] = useState<string | null>(null);
    // 위험한 호출은 첫 클릭에 무장만 하고, 두 번째 클릭에 실행한다
    const [armed, setArmed] = useState(false);

    const missing = (endpoint.params ?? []).filter((p) => p.required && !params[p.name]?.trim());

    const submit = () => {
        if (endpoint.destructive && !armed) {
            setArmed(true);
            return;
        }
        setArmed(false);

        let body: unknown;
        if (endpoint.body) {
            try {
                body = JSON.parse(bodyText || "{}");
                setBodyError(null);
            } catch (error) {
                setBodyError(`JSON 형식이 아닙니다: ${error instanceof Error ? error.message : String(error)}`);
                return;
            }
        }

        const path = endpoint.path.replace(/\{(\w+)\}/g, (_, name: string) =>
            encodeURIComponent(params[name]?.trim() ?? ""),
        );
        const query = Object.fromEntries(
            (endpoint.params ?? []).filter((p) => p.in === "query").map((p) => [p.name, params[p.name]?.trim()]),
        );

        const options: SentRequest["options"] = { method: endpoint.method, path, query };
        let preview: string | undefined;

        if (endpoint.body?.type === "json") {
            options.json = body;
            preview = pretty(body);
        } else if (endpoint.body?.type === "multipart") {
            const { fileField } = endpoint.body;
            const form = new FormData();
            form.append("dto", jsonPart(body));
            for (const file of files) form.append(fileField, file);
            options.form = form;
            preview = [
                `dto (application/json)\n${pretty(body)}`,
                ...files.map((f) => `${fileField}: ${f.name} (${f.type || "?"}, ${Math.round(f.size / 1024)}KB)`),
            ].join("\n");
        }

        onRun({ options, preview });
    };

    const resetBody = () => {
        if (!endpoint.body) return;
        setBodyText(pretty(endpoint.body.template(context)));
        setBodyError(null);
    };

    return (
        <Card padding="sm" className="space-y-4">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <MethodBadge method={endpoint.method} />
                    <code className="min-w-0 break-all font-mono text-sm text-ink">{endpoint.path}</code>
                </div>
                <Text size="sm" weight="bold">
                    {endpoint.summary}
                </Text>
                {endpoint.note && (
                    <Text size="xs" tone="muted">
                        {endpoint.note}
                    </Text>
                )}
            </div>

            {endpoint.params && endpoint.params.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                    {endpoint.params.map((param) => (
                        <Input
                            key={param.name}
                            label={`${param.name} (${param.in})`}
                            required={param.required}
                            placeholder={param.placeholder}
                            value={params[param.name] ?? ""}
                            onChange={(e) => setParams((prev) => ({ ...prev, [param.name]: e.target.value }))}
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                        />
                    ))}
                </div>
            )}

            {endpoint.body && (
                <div className="space-y-2">
                    <Textarea
                        label={
                            endpoint.body.type === "multipart" ? "dto (multipart · application/json)" : "본문 (JSON)"
                        }
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        rows={Math.min(14, Math.max(4, bodyText.split("\n").length + 1))}
                        error={bodyError ?? undefined}
                        className="font-mono text-[13px]"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                    />
                    <Button variant="ghost" size="sm" onClick={resetBody}>
                        템플릿으로 되돌리기
                    </Button>
                </div>
            )}

            {endpoint.body?.type === "multipart" && (
                <label className="block space-y-1.5">
                    <span className="block text-[13px] font-bold text-ink">
                        {endpoint.body.fileField} {endpoint.body.multiple ? "(여러 장)" : "(한 장)"} · 선택
                    </span>
                    {/* 모바일에선 카메라 촬영·앨범 선택이 함께 뜬다 — 기기 파일 경로를 그대로 시험한다 */}
                    <input
                        type="file"
                        accept="image/*"
                        multiple={endpoint.body.multiple}
                        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                        className="file:sticker block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:bg-paper file:px-4 file:py-1.5 file:text-ink"
                    />
                </label>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant={endpoint.destructive ? "danger" : "primary"}
                    onClick={submit}
                    isLoading={running}
                    disabled={running || missing.length > 0}
                >
                    {armed ? "한 번 더 누르면 실행" : "실행"}
                </Button>
                {armed && (
                    <Button variant="ghost" onClick={() => setArmed(false)}>
                        취소
                    </Button>
                )}
                {missing.length > 0 && (
                    <Text size="xs" tone="muted">
                        필수 입력: {missing.map((p) => p.name).join(", ")}
                    </Text>
                )}
            </div>
        </Card>
    );
}
