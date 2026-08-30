"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

import { Button, Card, IconTile, PageHeader, PageShell, Text } from "@/components/common";
import { cn } from "@/lib/cn";

/** 카메라 뷰 위 코너 장식 — 어두운 면 위라 흰 선으로 긋는다. 라운드 없이 각지게. */
const cornerBase = "absolute h-6 w-6 border-paper";

export default function BarcodeScanner() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);

    const [result, setResult] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState("대기 중");

    // 정확도 검증용
    const lastValueRef = useRef<string | null>(null);
    const confirmCountRef = useRef<number>(0);
    const REQUIRED_CONFIRM_COUNT = 3; // 같은 회수 체크 3번으로

    const startScan = async () => {
        if (!videoRef.current || isScanning) return;

        setResult(null);
        setStatus("스캔 중...");
        console.log("📷 스캔 시작");

        const reader = new BrowserMultiFormatReader(undefined, {
            delayBetweenScanAttempts: 100,
            delayBetweenScanSuccess: 500,
        });

        readerRef.current = reader;

        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (res, err) => {
            if (res) {
                const currentText = res.getText();
                console.log("🔍 감지:", currentText);

                // 🔥 노이즈 제거 로직
                if (lastValueRef.current === currentText) {
                    confirmCountRef.current += 1;
                } else {
                    confirmCountRef.current = 1;
                    lastValueRef.current = currentText;
                }

                console.log("✔ 확인 횟수:", confirmCountRef.current);

                if (confirmCountRef.current >= REQUIRED_CONFIRM_COUNT) {
                    console.log("✅ 최종 확정:", currentText);
                    setResult(currentText);
                    setStatus("인식 성공!");
                    stopScan();
                }
            }

            if (err && err.name !== "NotFoundException") {
                console.log("⚠ 스캔 시도 중...");
            }
        });

        controlsRef.current = controls;
        setIsScanning(true);
    };

    const stopScan = () => {
        console.log("🛑 스캔 중지");

        controlsRef.current?.stop();
        controlsRef.current = null;

        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
        }

        readerRef.current = null;
        setIsScanning(false);

        // 검증 상태 초기화
        lastValueRef.current = null;
        confirmCountRef.current = 0;
    };

    useEffect(() => {
        return () => {
            stopScan();
        };
    }, []);

    return (
        <PageShell className="flex flex-col items-center gap-6">
            <PageHeader
                title="바코드 스캐너"
                description="제품 바코드를 인식해 정보를 자동으로 채웁니다."
                backHref="/product"
                className="w-full"
            />

            {/* 진행 상태 — 색이 아니라 아이콘 타일의 채움(ink)과 옅은 면(muted)으로 구분한다 */}
            <Card padding="sm" className="flex w-full max-w-sm items-center gap-3">
                <IconTile size="sm" tone={isScanning ? "ink" : "muted"}>
                    <i className={cn(isScanning ? "xi-spinner-1 animate-spin" : "xi-barcode")} aria-hidden="true" />
                </IconTile>
                <Text size="sm" weight="bold" aria-live="polite">
                    {status}
                </Text>
            </Card>

            {/* 카메라 뷰 — 유일하게 어두운 표면. 영상 대비를 위해 의도적으로 먹으로 채운다. */}
            <div className="sticker rounded-nemo bg-ink relative h-[360px] w-full max-w-sm overflow-hidden">
                <video ref={videoRef} className="h-full w-full object-cover" />

                {/* 가이드 프레임 — 어두운 면 위이므로 이 안쪽 선만 흰색을 쓴다 */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="rounded-nemo border-paper/40 relative h-[40%] w-[80%] border-2">
                        {isScanning && (
                            <span className="bg-paper absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 animate-pulse" />
                        )}
                        <span aria-hidden="true" className={cn(cornerBase, "-top-1 -left-1 border-t-4 border-l-4")} />
                        <span aria-hidden="true" className={cn(cornerBase, "-top-1 -right-1 border-t-4 border-r-4")} />
                        <span
                            aria-hidden="true"
                            className={cn(cornerBase, "-bottom-1 -left-1 border-b-4 border-l-4")}
                        />
                        <span
                            aria-hidden="true"
                            className={cn(cornerBase, "-right-1 -bottom-1 border-r-4 border-b-4")}
                        />
                    </div>
                    {isScanning && (
                        <p className="text-paper/70 mt-6 text-sm font-bold">바코드를 사각형 안에 맞춰주세요</p>
                    )}
                </div>
            </div>

            {result && (
                <Card padding="md" className="w-full max-w-sm text-center">
                    <Text size="sm" weight="bold" tone="muted">
                        인식된 코드
                    </Text>
                    {/* 바코드는 숫자열이라 손글씨(Gaegu)를 피하고 tabular-nums 로 자릿수를 맞춘다 */}
                    <p className="text-ink mt-1 font-sans text-2xl font-bold tracking-wider tabular-nums">{result}</p>
                </Card>
            )}

            <div className="flex w-full max-w-sm gap-3">
                {!isScanning ? (
                    <Button size="lg" shape="pill" fullWidth onClick={startScan}>
                        스캔 시작
                    </Button>
                ) : (
                    <Button size="lg" shape="pill" fullWidth variant="secondary" onClick={stopScan}>
                        스캔 중지
                    </Button>
                )}
            </div>
        </PageShell>
    );
}
