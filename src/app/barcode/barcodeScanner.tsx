"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Button, Card, PageHeader, PageShell, Text } from "@/components/common";
import { productEditHref } from "@/components/product/StoredProductCard";
import { lookupBarcode } from "@/lib/api/barcode";
import { API_CONFIGURED } from "@/lib/api/client";
import { openCamera, type Camera } from "@/lib/barcode/camera";
import { createBarcodeDecoder, type BarcodeDecoder } from "@/lib/barcode/decoder";
import {
    CAMERA_PROBLEM_MESSAGES,
    cameraProblem,
    createScanConfirmer,
    guideSourceRect,
    hasChecksumProblem,
    isTypedCodeUsable,
    scanAction,
    type ScanAction,
    type ScanLookup,
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

/** 손으로 넣는 번호는 입력이 이만큼 멈춘 뒤에 서버에 묻는다 — 글자마다 부르지 않게 */
const TYPING_PAUSE_MS = 600;
/** 서버 조회가 이보다 길어지면 기다리지 않고 넘어갈 버튼을 띄운다 (잠든 서버는 수십 초가 걸린다) */
const SLOW_LOOKUP_MS = 4_000;

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
    /** 바코드 번호 — 스캔하면 채워지고, 손으로 고칠 수도 있다 */
    const [code, setCode] = useState("");
    /** 지금 번호가 방금 스캔해서 얻은 것인가 (손으로 고치면 false) */
    const [scanned, setScanned] = useState(false);
    /** 이 번호로 이미 등록한 물건. undefined = 찾는 중, null = 없음 */
    const [match, setMatch] = useState<Product | null | undefined>(undefined);
    const [controls, setControls] = useState<{ canTorch: boolean; zoomLevels: number[] }>({
        canTorch: false,
        zoomLevels: [1],
    });
    /** 이 번호의 상품 정보를 서버에서 찾는 중인지, 찾았는지 */
    const [lookup, setLookup] = useState<ScanLookup>({ status: "waiting" });
    const [torch, setTorch] = useState(false);
    const [zoom, setZoom] = useState(1);

    const stopScan = useCallback(() => {
        runRef.current += 1;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        cameraRef.current?.stop();
        cameraRef.current = null;
        setTorch(false);
        setPhase("idle");
    }, []);

    const cleanCode = code.replace(/\s/g, "");
    // 스캔한 번호는 확정할 때 이미 검증 숫자까지 확인했다. 손으로 넣은 번호는 검증 숫자가 틀려도 막지 않고 경고만 한다
    const isUsable = isTypedCodeUsable(cleanCode);
    const checksumWarning = !scanned && hasChecksumProblem(cleanCode);

    // 번호가 쓸 만해지면(스캔이든 직접 입력이든) 기기에 저장된 물건에서 같은 바코드를 찾는다. 서버는 부르지 않는다
    useEffect(() => {
        setMatch(undefined);
        if (!isUsable) return;

        let cancelled = false;
        findProductByBarcode(cleanCode).then(
            (product) => !cancelled && setMatch(product ?? null),
            () => !cancelled && setMatch(null),
        );
        return () => {
            cancelled = true;
        };
    }, [cleanCode, isUsable]);

    const startScan = async () => {
        const video = videoRef.current;
        if (!video || phase !== "idle") return;

        const run = (runRef.current += 1);
        setCode("");
        setScanned(false);
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
                    setCode(confirmed);
                    setScanned(true);
                    return;
                }
            }

            timerRef.current = setTimeout(() => void tick(), DECODE_INTERVAL_MS);
        };
        void tick();
    };

    // 아래 effect 가 늘 최신 startScan 을 부르도록 담아 둔다
    const startScanRef = useRef(startScan);
    startScanRef.current = startScan;

    // 화면에 들어오면 바로 스캔을 켠다 — 이 화면에 온 이유가 스캔이라, 버튼을 한 번 더 누르게 하지 않는다.
    // 화면을 떠나거나 앱을 내리면 카메라를 끈다 — 켜 둔 채로 두면 배터리를 쓰고 카메라 표시등이 남는다.
    // 돌아왔을 때 다시 켜는 것은 버튼으로 한다.
    useEffect(() => {
        void startScanRef.current();

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

    // 번호가 정해지면 등록 화면으로 넘어가기 전에 서버에서 상품 정보를 찾아, 무엇을 찍었는지 여기서 보여 준다.
    // 결과는 lookupBarcode 가 기억해 두므로 등록 화면은 서버를 다시 부르지 않고 바로 채운다.
    useEffect(() => {
        setLookup({ status: "waiting" });
        if (!isUsable) return;
        if (!API_CONFIGURED || navigator.onLine === false) {
            setLookup({ status: "skipped" });
            return;
        }

        let cancelled = false;
        let slowTimer: ReturnType<typeof setTimeout> | undefined;

        const startTimer = setTimeout(
            () => {
                slowTimer = setTimeout(() => !cancelled && setLookup({ status: "slow" }), SLOW_LOOKUP_MS);
                lookupBarcode(cleanCode)
                    .then(
                        (info): ScanLookup =>
                            info
                                ? { status: "found", name: info.name, brandName: info.brandName }
                                : { status: "missing" },
                        (): ScanLookup => ({ status: "failed" }),
                    )
                    .then((next) => {
                        clearTimeout(slowTimer);
                        if (!cancelled) setLookup(next);
                    });
            },
            scanned ? 0 : TYPING_PAUSE_MS,
        );

        return () => {
            cancelled = true;
            clearTimeout(startTimer);
            clearTimeout(slowTimer);
        };
    }, [cleanCode, isUsable, scanned]);

    // 이미 등록한 물건이면 서버를 기다리지 않는다
    const action: ScanAction = match
        ? {
              product: { name: match.name, brandName: match.brandName || undefined },
              note: null,
              button: "등록한 물건 보기",
          }
        : scanAction(lookup);
    const isReady = isUsable && match !== undefined;

    const editCode = (value: string) => {
        // 손으로 넣기 시작했으면 카메라는 끈다 — 스캔 결과가 입력을 덮어쓰지 않게
        if (phase !== "idle") stopScan();
        setScanned(false);
        setCode(value);
    };

    const isScanning = phase === "scanning";
    const isBusy = phase !== "idle";

    return (
        // 한 화면에 다 들어오게 높이를 화면에 맞춘다 — 카메라를 대고 있는데 화면이 위아래로 움직이면 쓰기 어렵다.
        // 빼는 값은 루트 레이아웃이 하단 탭 바 자리로 비워 둔 4rem(좁은 화면)과 홈 표시줄 영역이다.
        <PageShell className="flex h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] flex-col items-center gap-4 pb-4 sm:h-dvh">
            <PageHeader
                title="바코드 스캐너"
                description="제품 바코드를 인식해 정보를 자동으로 채웁니다."
                backHref="/product"
                className="w-full shrink-0"
            />

            {/* 카메라 뷰 — 유일하게 어두운 표면. 영상 대비를 위해 의도적으로 먹으로 채운다.
                높이는 정하지 않고 남는 공간을 쓴다. 화면이 작으면 여기가 줄어든다. */}
            <div className="sticker rounded-nemo bg-ink relative min-h-36 w-full max-w-sm flex-1 overflow-hidden">
                <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />

                {/* 진행 상태 — 카드를 따로 두지 않고 영상 위에 얹는다 */}
                <p
                    aria-live="polite"
                    className="bg-paper text-ink absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                >
                    <i className={cn(isBusy ? "xi-spinner-1 animate-spin" : "xi-barcode")} aria-hidden="true" />
                    {scanned && !isBusy ? "인식 성공!" : STATUS[phase]}
                </p>

                {/* 가이드 프레임 — 어두운 면 위이므로 이 안쪽 선만 흰색을 쓴다 */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    {problem ? (
                        <p role="alert" className="text-paper px-6 text-center text-sm font-bold">
                            {problem}
                            <span className="mt-1 block text-xs font-normal">
                                아래에 바코드 숫자를 직접 넣어도 돼요.
                            </span>
                        </p>
                    ) : (
                        <div className="rounded-nemo border-paper/40 relative h-[40%] w-[80%] border-2">
                            {isScanning && (
                                <span className="bg-paper absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 animate-pulse" />
                            )}
                            <span
                                aria-hidden="true"
                                className={cn(cornerBase, "-top-1 -left-1 border-t-4 border-l-4")}
                            />
                            <span
                                aria-hidden="true"
                                className={cn(cornerBase, "-top-1 -right-1 border-t-4 border-r-4")}
                            />
                            <span
                                aria-hidden="true"
                                className={cn(cornerBase, "-bottom-1 -left-1 border-b-4 border-l-4")}
                            />
                            <span
                                aria-hidden="true"
                                className={cn(cornerBase, "-right-1 -bottom-1 border-r-4 border-b-4")}
                            />
                        </div>
                    )}
                    {isScanning && (
                        <p className="text-paper/70 mt-3 px-4 text-center text-xs font-bold">
                            바코드를 사각형 안에 맞춰주세요. 흐리면 휴대폰을 조금 떼어 보세요
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

            {/* 바코드 번호 — 스캔하면 채워지고, 카메라로 안 읽히면 바코드 아래 숫자를 여기에 직접 넣는다.
                버튼 글자가 두 줄이 되면 카드가 조금 커지고, 그만큼 위의 카메라 뷰가 줄어든다(화면은 스크롤되지 않는다). */}
            <Card padding="md" className="w-full max-w-sm shrink-0 space-y-3 text-center">
                <label className="block">
                    <Text as="span" size="sm" weight="bold" tone={checksumWarning ? "danger" : "muted"} className="block">
                        {checksumWarning
                            ? "숫자가 맞는지 한 번 더 확인해 주세요"
                            : scanned
                              ? "인식된 코드"
                              : "바코드 번호"}
                    </Text>
                    {/* 바코드는 숫자열이라 손글씨(Gaegu)를 피하고 tabular-nums 로 자릿수를 맞춘다 */}
                    <input
                        inputMode="numeric"
                        autoComplete="off"
                        enterKeyHint="done"
                        placeholder="스캔하거나 직접 입력"
                        value={code}
                        onChange={(event) => editCode(event.target.value)}
                        className="text-ink placeholder:text-ink-soft mt-1 w-full bg-transparent text-center font-sans text-2xl font-bold tracking-wider tabular-nums placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
                    />
                </label>

                {/* 상품 정보와 할 일(버튼)을 나눈다 — 이름이 길어도 버튼 글자가 꺾이지 않는다 */}
                <div className="flex min-h-11 flex-col justify-center gap-2">
                    {!isReady ? (
                        <Text size="xs" tone="muted" aria-live="polite">
                            {isUsable
                                ? "상품 정보를 찾는 중…"
                                : cleanCode === ""
                                  ? "카메라로 안 읽히면 바코드 아래 숫자를 넣어 주세요."
                                  : "숫자를 4자리 이상 넣으면 다음으로 갈 수 있어요."}
                        </Text>
                    ) : (
                        <>
                            {action.product && (
                                <div className="rounded-nemo bg-cream px-3 py-2 text-left">
                                    <Text as="span" size="xs" tone="muted" className="block">
                                        {match ? "이미 등록한 물건" : "상품 정보"}
                                    </Text>
                                    <p className="text-ink truncate text-sm font-bold">{action.product.name}</p>
                                    {action.product.brandName && (
                                        <p className="text-ink-soft truncate text-xs">{action.product.brandName}</p>
                                    )}
                                </div>
                            )}
                            {action.note && (
                                <Text size="xs" tone="muted" aria-live="polite">
                                    {action.note}
                                </Text>
                            )}
                            {action.button && (
                                // 번호가 정해지면 다음 할 일이 이 화면의 먹 채움 버튼을 가져간다
                                <Link
                                    href={
                                        match
                                            ? productEditHref(match.id)
                                            : `/product/add?barcode=${encodeURIComponent(cleanCode)}`
                                    }
                                    className="sticker sticker-press bg-ink font-display text-paper block w-full rounded-full px-5 py-2.5 whitespace-nowrap"
                                >
                                    {action.button}
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </Card>

            <div className="flex w-full max-w-sm shrink-0 gap-3">
                {!isBusy ? (
                    <Button
                        size="lg"
                        shape="pill"
                        fullWidth
                        variant={isUsable ? "secondary" : "primary"}
                        onClick={() => void startScan()}
                    >
                        {scanned ? "다시 스캔" : "스캔 시작"}
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
