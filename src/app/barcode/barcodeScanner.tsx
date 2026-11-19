"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Button, Card, IconTile, Input, PageHeader, PageShell, Text } from "@/components/common";
import { productEditHref } from "@/components/product/StoredProductCard";
import { openCamera, type Camera } from "@/lib/barcode/camera";
import { createBarcodeDecoder, type BarcodeDecoder } from "@/lib/barcode/decoder";
import {
    CAMERA_PROBLEM_MESSAGES,
    cameraProblem,
    createScanConfirmer,
    guideSourceRect,
    isAcceptableCode,
} from "@/lib/barcode/scan";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/db";
import { findProductByBarcode } from "@/lib/db/products";

/** 카메라 뷰 위 코너 장식 — 어두운 면 위라 흰 선으로 긋는다. 라운드 없이 각지게. */
const cornerBase = "absolute h-6 w-6 border-paper";

/** 카메라 뷰 위에 얹는 작은 버튼 — 어두운 면 위라 종이색으로 채운다 */
const overlayButton = "rounded-full bg-paper px-3 py-1.5 font-sans text-xs font-bold text-ink";

/** 해독할 영역(카메라 뷰 대비). 화면의 안내 사각형(80%×40%)보다 조금 넉넉하게 잡는다 */
const DECODE_AREA = { width: 0.9, height: 0.5 };
/** 해독할 그림의 최대 가로 픽셀. 이보다 크면 느려지기만 한다 */
const MAX_DECODE_WIDTH = 1280;
const DECODE_INTERVAL_MS = 80;

type Phase = "idle" | "starting" | "scanning";

const STATUS: Record<Phase, string> = {
    idle: "대기 중",
    starting: "카메라를 켜는 중…",
    scanning: "스캔 중…",
};

export default function BarcodeScanner() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const cameraRef = useRef<Camera | null>(null);
    const decoderRef = useRef<BarcodeDecoder | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** 시작·중지가 겹칠 때 늦게 끝난 쪽을 버리려고 센다 */
    const runRef = useRef(0);

    const [phase, setPhase] = useState<Phase>("idle");
    const [problem, setProblem] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    /** 인식한 바코드로 이미 등록한 물건. undefined = 찾는 중, null = 없음 */
    const [match, setMatch] = useState<Product | null | undefined>(undefined);
    const [controls, setControls] = useState<{ canTorch: boolean; zoomLevels: number[] }>({
        canTorch: false,
        zoomLevels: [1],
    });
    const [torch, setTorch] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [manual, setManual] = useState("");
    const [manualError, setManualError] = useState<string | undefined>(undefined);

    const stopScan = useCallback(() => {
        runRef.current += 1;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        cameraRef.current?.stop();
        cameraRef.current = null;
        setTorch(false);
        setPhase("idle");
    }, []);

    /** 스캔이든 직접 입력이든 바코드가 정해지면 여기로 온다 */
    const accept = useCallback((code: string) => {
        setResult(code);
        setMatch(undefined);
        // 서버 조회 없이 기기에 저장된 물건에서 같은 바코드를 찾는다
        findProductByBarcode(code).then(
            (product) => setMatch(product ?? null),
            () => setMatch(null),
        );
    }, []);

    const startScan = async () => {
        const video = videoRef.current;
        if (!video || phase !== "idle") return;

        const run = (runRef.current += 1);
        setResult(null);
        setMatch(undefined);
        setProblem(null);
        setPhase("starting");

        let camera: Camera;
        try {
            // 카메라와 해독기를 함께 준비한다. 해독기는 한 번 만들면 계속 쓴다
            const [opened, decoder] = await Promise.all([
                openCamera(video),
                decoderRef.current ?? createBarcodeDecoder(),
            ]);
            camera = opened;
            decoderRef.current = decoder;
        } catch (error) {
            if (run !== runRef.current) return;
            setProblem(CAMERA_PROBLEM_MESSAGES[cameraProblem(error)]);
            setPhase("idle");
            return;
        }

        // 켜는 사이에 중지했거나 화면을 떠났다
        if (run !== runRef.current) {
            camera.stop();
            return;
        }

        cameraRef.current = camera;
        setControls({ canTorch: camera.canTorch, zoomLevels: camera.zoomLevels });
        setZoom(camera.zoom);
        setPhase("scanning");

        const decoder = decoderRef.current;
        const canvas = (canvasRef.current ??= document.createElement("canvas"));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        const confirm = createScanConfirmer();

        const tick = async () => {
            if (run !== runRef.current) return;

            if (context && decoder && video.readyState >= 2 && video.videoWidth > 0) {
                const area = guideSourceRect(
                    { width: video.videoWidth, height: video.videoHeight },
                    { width: video.clientWidth, height: video.clientHeight },
                    DECODE_AREA,
                );
                const scale = Math.min(1, MAX_DECODE_WIDTH / area.width);
                canvas.width = Math.round(area.width * scale);
                canvas.height = Math.round(area.height * scale);
                context.drawImage(video, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);

                let text: string | null = null;
                try {
                    text = await decoder.decode(canvas);
                } catch {
                    // 이번 장은 건너뛴다
                }
                if (run !== runRef.current) return;

                const confirmed = text ? confirm(text) : null;
                if (confirmed) {
                    navigator.vibrate?.(60);
                    stopScan();
                    accept(confirmed);
                    return;
                }
            }

            timerRef.current = setTimeout(() => void tick(), DECODE_INTERVAL_MS);
        };
        void tick();
    };

    // 화면을 떠나거나 앱을 내리면 카메라를 끈다 — 켜 둔 채로 두면 배터리를 쓰고 카메라 표시등이 남는다
    useEffect(() => {
        const onHide = () => {
            if (document.hidden) stopScan();
        };
        document.addEventListener("visibilitychange", onHide);
        return () => {
            document.removeEventListener("visibilitychange", onHide);
            stopScan();
        };
    }, [stopScan]);

    const toggleTorch = async () => {
        const next = !torch;
        if (await cameraRef.current?.setTorch(next)) setTorch(next);
    };

    const cycleZoom = async () => {
        const levels = controls.zoomLevels;
        const next = levels[(levels.indexOf(zoom) + 1) % levels.length];
        if (await cameraRef.current?.setZoom(next)) setZoom(next);
    };

    const submitManual = (event: React.FormEvent) => {
        event.preventDefault();
        const code = manual.replace(/\s/g, "");
        if (!isAcceptableCode(code)) {
            setManualError("바코드 숫자를 다시 확인해 주세요.");
            return;
        }
        setManualError(undefined);
        setManual("");
        stopScan();
        accept(code);
    };

    const isScanning = phase === "scanning";
    const isBusy = phase !== "idle";

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
                <IconTile size="sm" tone={isBusy ? "ink" : "muted"}>
                    <i className={cn(isBusy ? "xi-spinner-1 animate-spin" : "xi-barcode")} aria-hidden="true" />
                </IconTile>
                <Text size="sm" weight="bold" aria-live="polite">
                    {result && !isBusy ? "인식 성공!" : STATUS[phase]}
                </Text>
            </Card>

            {/* 카메라 뷰 — 유일하게 어두운 표면. 영상 대비를 위해 의도적으로 먹으로 채운다. */}
            <div className="sticker rounded-nemo bg-ink relative h-[360px] w-full max-w-sm overflow-hidden">
                <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />

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
                        <p className="text-paper/70 mt-4 px-4 text-center text-sm font-bold">
                            바코드를 사각형 안에 맞춰주세요
                            <span className="mt-1 block text-xs font-normal">
                                흐리게 보이면 휴대폰을 조금 떼어 보세요
                            </span>
                        </p>
                    )}
                </div>

                {isScanning && (controls.canTorch || controls.zoomLevels.length > 1) && (
                    <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                        {controls.zoomLevels.length > 1 && (
                            <button type="button" onClick={() => void cycleZoom()} className={overlayButton}>
                                확대 {zoom}배
                            </button>
                        )}
                        {controls.canTorch && (
                            <button
                                type="button"
                                onClick={() => void toggleTorch()}
                                aria-pressed={torch}
                                className={overlayButton}
                            >
                                손전등 {torch ? "끄기" : "켜기"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {problem && (
                <Text size="sm" tone="danger" role="alert" className="w-full max-w-sm">
                    {problem} 아래에 바코드 숫자를 직접 넣어도 돼요.
                </Text>
            )}

            {result && (
                <Card padding="md" className="w-full max-w-sm space-y-3 text-center">
                    <div>
                        <Text size="sm" weight="bold" tone="muted">
                            인식된 코드
                        </Text>
                        {/* 바코드는 숫자열이라 손글씨(Gaegu)를 피하고 tabular-nums 로 자릿수를 맞춘다 */}
                        <p className="text-ink mt-1 font-sans text-2xl font-bold tracking-wider tabular-nums">
                            {result}
                        </p>
                    </div>
                    {match !== undefined && (
                        // 결과가 나오면 다음 할 일이 이 화면의 먹 채움 버튼을 가져간다
                        <Link
                            href={
                                match ? productEditHref(match.id) : `/product/add?barcode=${encodeURIComponent(result)}`
                            }
                            className="sticker sticker-press bg-ink font-display text-paper block rounded-full px-5 py-2.5"
                        >
                            {match ? `이미 등록한 물건 — ${match.name} 보기` : "이 바코드로 물건 등록하기"}
                        </Link>
                    )}
                </Card>
            )}

            <div className="flex w-full max-w-sm gap-3">
                {!isBusy ? (
                    <Button
                        size="lg"
                        shape="pill"
                        fullWidth
                        variant={result ? "secondary" : "primary"}
                        onClick={() => void startScan()}
                    >
                        {result ? "다시 스캔" : "스캔 시작"}
                    </Button>
                ) : (
                    <Button size="lg" shape="pill" fullWidth variant="secondary" onClick={stopScan}>
                        스캔 중지
                    </Button>
                )}
            </div>

            {/* 카메라로 안 읽힐 때의 길 — 바코드 아래 적힌 숫자를 그대로 넣는다 */}
            <form onSubmit={submitManual} className="flex w-full max-w-sm items-end gap-2">
                <Input
                    label="숫자로 직접 입력"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="바코드 아래 숫자"
                    value={manual}
                    error={manualError}
                    onChange={(event) => {
                        setManual(event.target.value);
                        setManualError(undefined);
                    }}
                />
                <Button type="submit" variant="secondary" className="shrink-0" disabled={manual.trim() === ""}>
                    확인
                </Button>
            </form>
        </PageShell>
    );
}
