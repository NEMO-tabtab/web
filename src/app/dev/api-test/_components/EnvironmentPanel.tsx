"use client";

import { useEffect, useState } from "react";

import { Badge, Button, Card, Checkbox, InfoRow, Input, Text } from "@/components/common";
import { request, type RequestTrace } from "@/lib/api/client";

export interface ConsoleSession {
    token: string;
    userIdx?: number;
    loginId?: string;
    name?: string;
}

interface DeviceInfo {
    origin: string;
    online: boolean;
    /** 홈 화면에 설치된 PWA 로 떠 있는지. manifest 가 fullscreen 이라 standalone 만 보면 놓친다 */
    installed: boolean;
    userAgent: string;
}

function readDevice(): DeviceInfo {
    const displayModes = ["fullscreen", "standalone", "minimal-ui"];
    const installed =
        displayModes.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches) ||
        // iOS Safari 는 display-mode 대신 비표준 플래그를 쓴다
        (navigator as Navigator & { standalone?: boolean }).standalone === true;

    return {
        origin: window.location.origin,
        online: navigator.onLine,
        installed,
        userAgent: navigator.userAgent,
    };
}

interface EnvironmentPanelProps {
    baseUrl: string;
    defaultBaseUrl: string;
    onBaseUrlChange: (value: string) => void;
    session: ConsoleSession | null;
    onClearSession: () => void;
    attachToken: boolean;
    onAttachTokenChange: (value: boolean) => void;
}

/**
 * Swagger 로는 보이지 않는 "이 기기에서" 의 조건들.
 * 백엔드는 멀쩡한데 폰에서만 깨지는 원인 — 오프라인, mixed content, 잘못된 API 주소,
 * 콜드 스타트 — 을 호출 전에 먼저 드러낸다.
 */
export function EnvironmentPanel({
    baseUrl,
    defaultBaseUrl,
    onBaseUrlChange,
    session,
    onClearSession,
    attachToken,
    onAttachTokenChange,
}: EnvironmentPanelProps) {
    // 서버 렌더 결과와 어긋나지 않도록 브라우저 값은 마운트 뒤에 읽는다
    const [device, setDevice] = useState<DeviceInfo | null>(null);
    const [health, setHealth] = useState<RequestTrace | null>(null);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        const update = () => setDevice(readDevice());
        update();
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);

    const checkHealth = async () => {
        setChecking(true);
        setHealth(await request({ method: "GET", path: "/api/health", baseUrl }));
        setChecking(false);
    };

    // https 페이지에서 http API 를 부르면 브라우저가 요청 자체를 막는다 — 응답 없이 network 오류로만 보인다
    const mixedContent = device?.origin.startsWith("https:") && baseUrl.startsWith("http:");

    return (
        <Card padding="sm" className="space-y-4">
            <div className="space-y-2">
                <Input
                    label="API 주소"
                    value={baseUrl}
                    onChange={(e) => onBaseUrlChange(e.target.value)}
                    inputMode="url"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    hint={baseUrl === defaultBaseUrl ? "NEXT_PUBLIC_API_URL 값" : "이 기기에만 저장된 값"}
                />
                {baseUrl !== defaultBaseUrl && (
                    <Button variant="ghost" size="sm" onClick={() => onBaseUrlChange(defaultBaseUrl)}>
                        기본값으로 되돌리기
                    </Button>
                )}
                {mixedContent && (
                    <Text size="sm" tone="danger">
                        https 페이지에서 http API 를 부르고 있습니다. 브라우저가 요청을 막습니다(mixed content).
                    </Text>
                )}
            </div>

            <div className="space-y-2">
                <InfoRow label="페이지" value={device?.origin ?? "…"} />
                <InfoRow
                    label="네트워크"
                    value={device ? device.online ? "온라인" : <span className="text-danger">오프라인</span> : "…"}
                />
                <InfoRow label="실행 방식" value={device ? (device.installed ? "설치된 PWA" : "브라우저") : "…"} />
                {device && (
                    <Text size="xs" tone="muted" className="break-all">
                        {device.userAgent}
                    </Text>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={checkHealth} isLoading={checking}>
                    헬스체크
                </Button>
                {checking && (
                    <Text size="xs" tone="muted">
                        서버가 자고 있으면 깨우는 데 수십 초 걸립니다
                    </Text>
                )}
                {!checking && health && (
                    <>
                        <Badge variant={health.ok ? "ink" : "danger"}>
                            {health.ok ? "정상" : (health.failure?.kind ?? "실패")}
                        </Badge>
                        <span className="font-sans text-xs tabular-nums text-ink-soft">
                            {health.status ?? "-"} · {health.durationMs}ms
                        </span>
                    </>
                )}
            </div>

            <div className="space-y-2 border-t border-line pt-4">
                <InfoRow
                    label="세션"
                    value={
                        session
                            ? `${session.name ?? session.loginId ?? "?"} (userIdx ${session.userIdx ?? "?"})`
                            : "로그인 안 됨"
                    }
                />
                {session && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Checkbox
                            label="요청에 Bearer 토큰 붙이기"
                            checked={attachToken}
                            onChange={(e) => onAttachTokenChange(e.target.checked)}
                        />
                        <Button variant="ghost" size="sm" onClick={onClearSession}>
                            세션 비우기
                        </Button>
                    </div>
                )}
                <Text size="xs" tone="muted">
                    토큰은 이 페이지 메모리에만 둡니다. 실제 앱은 httpOnly 쿠키를 씁니다.
                </Text>
            </div>
        </Card>
    );
}
