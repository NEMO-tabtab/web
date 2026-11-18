import { Badge, Card, Text } from "@/components/common";
import type { ApiFailureKind, RequestTrace } from "@/lib/api/client";

import { MethodBadge } from "./MethodBadge";

/** 실패 종류별로 "모바일에서 흔한 원인" 을 같이 보여준다 — Swagger 에서 되는데 여기서 안 될 때의 단서 */
const FAILURE_HINTS: Record<ApiFailureKind, string> = {
    network:
        "응답을 받지 못했습니다. 오프라인, CORS 차단, https 페이지의 http 호출(mixed content), 잘못된 API 주소 중 하나입니다. 브라우저는 이들을 구분해 주지 않습니다.",
    timeout: "제한 시간 안에 응답이 없습니다. 서버 콜드 스타트라면 헬스체크로 깨운 뒤 다시 시도하세요.",
    parse: "서버가 JSON 이 아닌 응답을 돌려줬습니다. 프록시·에러 페이지·잘못된 경로일 수 있습니다.",
    http: "서버가 오류 상태 코드로 응답했습니다. 봉투의 message · error 를 확인하세요.",
    envelope: "HTTP 는 성공인데 봉투가 success: false 입니다. 화면 코드는 이 경우도 실패로 다뤄야 합니다.",
    shape: "성공 응답인데 data 가 예상한 형식(src/lib/api/schemas.ts)과 다릅니다. 서버와 앱 중 어느 쪽이 바뀌었는지 확인하세요.",
};

export interface TraceEntry {
    id: number;
    summary: string;
    at: Date;
    preview?: string;
    trace: RequestTrace;
}

export function TraceView({ entry }: { entry: TraceEntry }) {
    const { trace } = entry;

    return (
        <Card padding="sm" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant={trace.ok ? "ink" : "danger"}>{trace.ok ? "성공" : trace.failure?.kind}</Badge>
                <span className="font-sans text-sm font-bold tabular-nums text-ink">
                    {trace.status ?? "응답 없음"} · {trace.durationMs}ms
                </span>
                <span className="font-sans text-xs tabular-nums text-ink-soft">
                    {entry.at.toLocaleTimeString("ko-KR")}
                </span>
            </div>

            <div className="flex items-start gap-2">
                <MethodBadge method={trace.method} />
                <code className="min-w-0 break-all font-mono text-xs text-ink-soft">{trace.url}</code>
            </div>

            {trace.failure && (
                <div className="space-y-1 rounded-nemo border border-danger p-3">
                    <Text size="sm" weight="bold" tone="danger">
                        {trace.failure.message}
                    </Text>
                    <Text size="xs" tone="muted">
                        {FAILURE_HINTS[trace.failure.kind]}
                    </Text>
                </div>
            )}

            {entry.preview && <CodeBlock label="보낸 본문" text={entry.preview} />}

            {trace.envelope !== undefined && <CodeBlock label="응답" text={JSON.stringify(trace.envelope, null, 2)} />}
            {trace.rawText !== undefined && <CodeBlock label="응답 (원문)" text={trace.rawText || "(빈 응답)"} />}
        </Card>
    );
}

function CodeBlock({ label, text }: { label: string; text: string }) {
    return (
        <details open className="group">
            <summary className="cursor-pointer select-none text-[13px] font-bold text-ink">{label}</summary>
            {/* 긴 JSON 은 블록 안에서만 가로 스크롤 — 페이지 본문이 옆으로 밀리지 않게 */}
            <pre className="mt-2 max-h-96 overflow-auto rounded-nemo bg-cream p-3 font-mono text-xs leading-relaxed text-ink">
                {text}
            </pre>
        </details>
    );
}
