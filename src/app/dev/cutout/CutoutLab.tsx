"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge, Button, Card, Chip, PageHeader, PageShell, Section, Text } from "@/components/common";
import { useObjectUrl, useProductCovers } from "@/lib/db/hooks";
import {
    ENGINES,
    loadAutoEngine,
    loadStrokeEngine,
    loadTapEngine,
    type AutoEngine,
    type EngineId,
    type Loaded,
    type Stroke,
    type StrokeEngine,
    type TapEngine,
} from "@/lib/cutout/engines";
import { alphaMask, backgroundFill, polygonMask, transparentShare, type Point } from "@/lib/cutout/handmade";
import { componentsAt, coverage, feather, keepSoft, largestComponent, resizeMask, type Mask } from "@/lib/cutout/mask";
import { cutoutCanvas, loadToCanvas, readRgba, stickerCanvas, toPngBlob } from "@/lib/cutout/render";

import { DrawSurface, type DrawnLine, type SurfaceMode } from "./_components/DrawSurface";

type MethodId = "fill" | "lasso" | "png" | EngineId;

interface MethodInfo {
    id: MethodId;
    name: string;
    how: string;
    license: string;
    downloads: { label: string; bytes: number }[];
}

const METHODS: readonly MethodInfo[] = [
    {
        id: "fill",
        name: "바탕색 지우기",
        how: "사진 가장자리에서 비슷한 색을 따라가며 바탕을 지운다. 책상·종이처럼 바탕이 한 가지 색일 때만 맞는다.",
        license: "앱 코드(받을 것 없음)",
        downloads: [],
    },
    {
        id: "lasso",
        name: "손으로 따라 그리기",
        how: "물건 둘레를 손가락으로 한 바퀴 그린다. 무엇이든 되지만 손이 간다.",
        license: "앱 코드(받을 것 없음)",
        downloads: [],
    },
    ...ENGINES,
    {
        id: "png",
        name: "사진 앱에서 오려 온 PNG",
        how: "iOS 사진의 '피사체 들어올리기'나 갤러리의 누끼 기능으로 오린 PNG를 넣으면 그 투명도를 그대로 쓴다.",
        license: "기기 기능(받을 것 없음)",
        downloads: [],
    },
];

interface Source {
    canvas: HTMLCanvasElement;
    name: string;
    /** 투명한 화소의 비율 */
    transparent: number;
}

interface Outcome {
    mask: Mask;
    runMs: number;
    coverage: number;
    cutout: string;
    sticker: string | null;
}

interface Engines {
    "magic-touch-v1"?: Loaded<TapEngine>;
    "magic-touch-v2"?: Loaded<StrokeEngine>;
    u2netp?: Loaded<AutoEngine>;
}

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;
const percent = (value: number) => `${Math.round(value * 100)}%`;
const message = (error: unknown) => (error instanceof Error ? error.message : "알 수 없는 오류예요");

const CHECKER = {
    backgroundColor: "#ffffff",
    backgroundImage: "conic-gradient(#e9e7e2 25%, transparent 0 50%, #e9e7e2 0 75%, transparent 0)",
    backgroundSize: "16px 16px",
} as const;

/**
 * 배경 지우기 실험 화면(#215). 같은 사진으로 여러 방법을 돌려 보고 시간·받는 용량·결과를 견준다.
 * 사진은 기기 밖으로 나가지 않는다. 결과는 저장하지 않는다(화면을 떠나면 사라진다).
 */
export default function CutoutLab() {
    const [source, setSource] = useState<Source | null>(null);
    const [method, setMethod] = useState<MethodId>("fill");
    const [tolerance, setTolerance] = useState(32);
    const [lines, setLines] = useState<DrawnLine[]>([]);
    const [brush, setBrush] = useState<Stroke["mode"]>("add");
    const [engines, setEngines] = useState<Engines>({});
    const [loading, setLoading] = useState<EngineId | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outcomes, setOutcomes] = useState<Partial<Record<MethodId, Outcome>>>({});
    /** 문지르기 모델의 setImage 시간. 실제로 사진을 읽는 무거운 일은 첫 획에서 일어난다(그래서 첫 획만 느리다) */
    const [encodeMs, setEncodeMs] = useState<number | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    const info = METHODS.find((each) => each.id === method)!;
    const outcome = outcomes[method];
    const engineId = method === "magic-touch-v1" || method === "magic-touch-v2" || method === "u2netp" ? method : null;
    const engine = engineId ? engines[engineId] : undefined;

    const pick = async (blob: Blob, name: string) => {
        setError(null);
        try {
            const canvas = await loadToCanvas(blob);
            setSource({ canvas, name, transparent: transparentShare(readRgba(canvas)) });
            setOutcomes({});
            setLines([]);
            setEncodeMs(null);
        } catch (failure) {
            setError(message(failure));
        }
    };

    /** 결과를 사진 크기로 맞추고 오린 것·스티커를 그려 둔다 */
    const record = (id: MethodId, raw: Mask, runMs: number) => {
        if (!source) return;
        const mask = resizeMask(raw, source.canvas.width, source.canvas.height);
        const sticker = stickerCanvas(source.canvas, mask);
        setOutcomes((prev) => ({
            ...prev,
            [id]: {
                mask,
                runMs,
                coverage: coverage(mask),
                cutout: cutoutCanvas(source.canvas, mask).toDataURL("image/png"),
                sticker: sticker?.toDataURL("image/png") ?? null,
            },
        }));
    };

    /** 시간을 재며 돌리고, 실패하면 화면에 알린다 */
    const run = async (id: MethodId, work: () => Mask | Promise<Mask>) => {
        setBusy(true);
        setError(null);
        // 바쁨 표시가 먼저 그려지게 한 박자 쉰다
        await new Promise((resolve) => setTimeout(resolve, 0));
        try {
            const startedAt = performance.now();
            const mask = await work();
            record(id, mask, Math.round(performance.now() - startedAt));
        } catch (failure) {
            setError(message(failure));
        } finally {
            setBusy(false);
        }
    };

    const loadEngine = async (id: EngineId) => {
        setLoading(id);
        setError(null);
        try {
            const loaded =
                id === "magic-touch-v1"
                    ? await loadTapEngine()
                    : id === "magic-touch-v2"
                      ? await loadStrokeEngine()
                      : await loadAutoEngine();
            setEngines((prev) => ({ ...prev, [id]: loaded }));
        } catch (failure) {
            setError(message(failure));
        } finally {
            setLoading(null);
        }
    };

    // 문지르기 모델은 사진을 한 번 읽어 두고(무거움), 획마다 그 위에서 가볍게 다시 오린다
    const strokeEngine = engines["magic-touch-v2"]?.engine;
    useEffect(() => {
        if (!strokeEngine || !source) return;
        try {
            const startedAt = performance.now();
            strokeEngine.setImage(source.canvas);
            setEncodeMs(Math.round(performance.now() - startedAt));
        } catch (failure) {
            setError(message(failure));
        }
    }, [strokeEngine, source]);

    // 화면을 떠나면 모델을 닫는다
    const enginesRef = useRef(engines);
    enginesRef.current = engines;
    useEffect(
        () => () => {
            for (const loaded of Object.values(enginesRef.current)) loaded?.engine.close();
        },
        [],
    );

    const chooseMethod = (id: MethodId) => {
        setMethod(id);
        setLines([]);
        setError(null);
    };

    const runFill = () =>
        run("fill", () => {
            const { canvas } = source!;
            const mask = backgroundFill(readRgba(canvas), canvas.width, canvas.height, tolerance);
            return feather(largestComponent(mask), 1);
        });

    const onLasso = (points: Point[]) => {
        setLines([{ points, tone: "lasso" }]);
        void run("lasso", () => feather(polygonMask(points, source!.canvas.width, source!.canvas.height), 1));
    };

    /**
     * 모델의 결과를 사진 크기로 늘리고, 누르거나 문지른 점이 닿은 덩어리만 남긴다(점이 없으면 가장 큰 덩어리).
     * 세 모델에 같은 정리를 해야 견줄 수 있다. 가장자리의 부드러움은 그대로 둔다.
     */
    const tidy = (raw: Mask, points: Point[]): Mask => {
        const soft = resizeMask(raw, source!.canvas.width, source!.canvas.height);
        return keepSoft(soft, componentsAt(soft, points));
    };

    const onTap = (point: Point) => {
        const tap = engines["magic-touch-v1"]?.engine;
        if (!tap) return;
        setLines([{ points: [point], tone: "add" }]);
        void run("magic-touch-v1", () => tidy(tap.segment(source!.canvas, point), [point]));
    };

    const onStroke = (points: Point[]) => {
        if (!strokeEngine) return;
        const next = [...lines, { points, tone: brush }];
        setLines(next);
        const strokes = next.map(
            (line) => ({ mode: line.tone === "remove" ? "remove" : "add", points: line.points }) as Stroke,
        );
        const added = strokes.filter((stroke) => stroke.mode === "add").flatMap((stroke) => stroke.points);
        void run("magic-touch-v2", () => tidy(strokeEngine.segment(strokes), added));
    };

    const runAuto = () => {
        const auto = engines.u2netp?.engine;
        if (!auto) return;
        void run("u2netp", async () => tidy(await auto.segment(source!.canvas), []));
    };

    const runPng = () =>
        run("png", () => alphaMask(readRgba(source!.canvas), source!.canvas.width, source!.canvas.height));

    const surfaceMode: SurfaceMode = useMemo(() => {
        if (!source || busy) return "none";
        if (method === "lasso" || (method === "magic-touch-v2" && engine)) return "draw";
        if (method === "magic-touch-v1" && engine) return "tap";
        return "none";
    }, [source, busy, method, engine]);

    const download = async () => {
        if (!outcome?.sticker || !source) return;
        const sticker = stickerCanvas(source.canvas, outcome.mask);
        if (!sticker) return;
        const url = URL.createObjectURL(await toPngBlob(sticker));
        const link = document.createElement("a");
        link.href = url;
        link.download = `cutout-${method}.png`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <PageShell className="space-y-6">
            <PageHeader
                title="배경 지우기 실험"
                description="같은 사진으로 여러 방법을 돌려 보고 결과·시간·받는 용량을 견줍니다. 사진은 기기 밖으로 나가지 않아요."
            />

            <Card padding="sm" className="space-y-2">
                <Text size="xs" tone="muted">
                    결과는 저장하지 않아요. 이 화면을 떠나면 사라집니다. 견줄 때는 스티커를 내려받아 #215에 붙여 주세요.{" "}
                    <Link href="/dev/api-live" className="underline">
                        개발자 메뉴로
                    </Link>
                </Text>
            </Card>

            <Section title="1. 사진">
                <SourcePicker
                    onFile={() => fileInput.current?.click()}
                    onPick={(blob, name) => void pick(blob, name)}
                />
                <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void pick(file, file.name);
                        event.target.value = "";
                    }}
                />
                {source && (
                    <Text size="xs" tone="muted" className="mt-2 font-sans tabular-nums">
                        {source.name} · {source.canvas.width}×{source.canvas.height}
                        {source.transparent > 0.01 &&
                            ` · 투명한 곳 ${percent(source.transparent)} — 이미 오려진 사진이에요`}
                    </Text>
                )}
            </Section>

            <Section title="2. 방법">
                <div className="flex flex-wrap gap-2">
                    {METHODS.map((each) => (
                        <Chip key={each.id} selected={each.id === method} onClick={() => chooseMethod(each.id)}>
                            {each.name}
                            {outcomes[each.id] && " ✓"}
                        </Chip>
                    ))}
                </div>

                <Card padding="sm" className="mt-3 space-y-2">
                    <Text size="sm">{info.how}</Text>
                    <Text size="xs" tone="muted">
                        라이선스: {info.license}
                        {info.downloads.length > 0 &&
                            ` · 처음 한 번 받기: ${info.downloads.map((d) => `${d.label} ${megabytes(d.bytes)}`).join(" + ")}`}
                    </Text>

                    {engineId && !engine && (
                        <Button onClick={() => void loadEngine(engineId)} disabled={loading !== null} fullWidth>
                            {loading === engineId ? "받고 준비하는 중…" : "모델 받기"}
                        </Button>
                    )}
                    {engine && (
                        <Text size="xs" tone="muted" className="font-sans tabular-nums">
                            준비 {engine.prepareMs}ms · 모델 {megabytes(engine.modelBytes)} · {engine.backend}
                            {engine.verified === true && " · 파일 확인함"}
                            {engine.verified === null && " · 파일 해시를 맞춰 보지 못함"}
                            {method === "magic-touch-v2" &&
                                encodeMs !== null &&
                                ` · setImage ${encodeMs}ms (첫 획이 느리고 그 뒤는 빨라요)`}
                        </Text>
                    )}

                    {method === "fill" && (
                        <div className="space-y-2">
                            <label className="flex items-center gap-3">
                                <Text as="span" size="xs" className="shrink-0">
                                    비슷한 색 범위 {tolerance}
                                </Text>
                                <input
                                    type="range"
                                    min={8}
                                    max={80}
                                    value={tolerance}
                                    onChange={(event) => setTolerance(Number(event.target.value))}
                                    className="w-full accent-ink"
                                />
                            </label>
                            <Button onClick={() => void runFill()} disabled={!source || busy} fullWidth>
                                바탕 지우기
                            </Button>
                        </div>
                    )}
                    {method === "lasso" && <Text size="xs">사진 위에서 물건 둘레를 한 바퀴 그리세요.</Text>}
                    {method === "magic-touch-v1" && engine && <Text size="xs">사진에서 물건을 한 번 누르세요.</Text>}
                    {method === "magic-touch-v2" && engine && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Chip selected={brush === "add"} onClick={() => setBrush("add")}>
                                넣기(먹색)
                            </Chip>
                            <Chip selected={brush === "remove"} onClick={() => setBrush("remove")}>
                                빼기(빨강)
                            </Chip>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLines([])}
                                disabled={lines.length === 0}
                            >
                                획 지우기
                            </Button>
                        </div>
                    )}
                    {method === "u2netp" && engine && (
                        <Button onClick={runAuto} disabled={!source || busy} fullWidth>
                            자동으로 오리기
                        </Button>
                    )}
                    {method === "png" && (
                        <Button
                            onClick={() => void runPng()}
                            disabled={!source || busy || source.transparent <= 0.01}
                            fullWidth
                        >
                            {source && source.transparent <= 0.01
                                ? "투명한 곳이 없는 사진이에요"
                                : "투명도 그대로 쓰기"}
                        </Button>
                    )}
                    {error && (
                        <Text size="xs" tone="danger" role="alert">
                            {error}
                        </Text>
                    )}
                </Card>

                {source && (
                    <div className="mt-3">
                        <DrawSurface
                            source={source.canvas}
                            mask={outcome?.mask ?? null}
                            lines={lines}
                            mode={surfaceMode}
                            tone={method === "lasso" ? "lasso" : brush}
                            onTap={onTap}
                            onLine={method === "lasso" ? onLasso : onStroke}
                            label="고른 사진. 물건으로 본 곳은 먹색으로 덮여요."
                        />
                        {busy && (
                            <Text size="xs" tone="muted" className="mt-1" role="status">
                                오리는 중…
                            </Text>
                        )}
                    </div>
                )}
            </Section>

            {outcome && (
                <Section title="3. 결과">
                    <div className="grid grid-cols-2 gap-3">
                        <figure className="space-y-1">
                            {/* eslint-disable-next-line @next/next/no-img-element -- 기기에서 만든 data URL 이라 next/image 로 줄일 것이 없다 */}
                            <img
                                src={outcome.cutout}
                                alt="오린 것"
                                className="w-full rounded-nemo border border-line"
                                style={CHECKER}
                            />
                            <figcaption className="text-xs text-ink-soft">오린 것</figcaption>
                        </figure>
                        <figure className="space-y-1">
                            {outcome.sticker ? (
                                // eslint-disable-next-line @next/next/no-img-element -- 위와 같다
                                <img src={outcome.sticker} alt="스티커" className="w-full rounded-nemo bg-cream p-3" />
                            ) : (
                                <Text size="xs">물건을 찾지 못했어요</Text>
                            )}
                            <figcaption className="text-xs text-ink-soft">스티커(흰 테두리·먹선)</figcaption>
                        </figure>
                    </div>
                    <Text size="xs" tone="muted" className="mt-2 font-sans tabular-nums">
                        오리기 {outcome.runMs}ms · 물건 {percent(outcome.coverage)}
                    </Text>
                    <Button
                        variant="secondary"
                        onClick={() => void download()}
                        disabled={!outcome.sticker}
                        fullWidth
                        className="mt-2"
                    >
                        스티커 PNG 내려받기
                    </Button>
                </Section>
            )}

            {Object.keys(outcomes).length > 1 && (
                <Section title="이 사진에서 견주기">
                    <div className="grid grid-cols-3 gap-2">
                        {METHODS.filter((each) => outcomes[each.id]).map((each) => (
                            <button
                                key={each.id}
                                type="button"
                                onClick={() => chooseMethod(each.id)}
                                className="space-y-1 text-left"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element -- 위와 같다 */}
                                <img
                                    src={outcomes[each.id]!.sticker ?? outcomes[each.id]!.cutout}
                                    alt={each.name}
                                    className="w-full rounded-nemo bg-cream p-1"
                                />
                                <Badge size="sm" variant={each.id === method ? "ink" : "neutral"}>
                                    {each.name}
                                </Badge>
                                <Text size="xs" tone="muted" className="font-sans tabular-nums">
                                    {outcomes[each.id]!.runMs}ms
                                </Text>
                            </button>
                        ))}
                    </div>
                </Section>
            )}
        </PageShell>
    );
}

/** 파일을 고르거나, 이 기기에 저장된 물건 사진 중에서 고른다(읽기만 한다) */
function SourcePicker({ onFile, onPick }: { onFile: () => void; onPick: (blob: Blob, name: string) => void }) {
    const covers = useProductCovers();
    const withPhoto = (covers ?? []).filter((each) => each.cover).slice(0, 24);

    return (
        <div className="space-y-3">
            <Button variant="secondary" onClick={onFile} fullWidth>
                사진 고르기
            </Button>
            {withPhoto.length > 0 && (
                <>
                    <Text size="xs" tone="muted">
                        또는 내 물건 사진(최근 {withPhoto.length}개). 저장할 때 JPEG로 바뀌어 투명도는 없어요.
                    </Text>
                    <div className="grid grid-cols-6 gap-2">
                        {withPhoto.map(({ product, cover }) => (
                            <Thumb
                                key={product.id}
                                blob={cover!.blob}
                                name={product.name}
                                onClick={() => onPick(cover!.blob, product.name)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function Thumb({ blob, name, onClick }: { blob: Blob; name: string; onClick: () => void }) {
    const url = useObjectUrl(blob);
    return (
        <button type="button" onClick={onClick} aria-label={`${name} 사진으로 해 보기`} className="aspect-square">
            {url && (
                // eslint-disable-next-line @next/next/no-img-element -- 기기 Blob URL
                <img src={url} alt="" className="h-full w-full rounded-nemo border border-line object-cover" />
            )}
        </button>
    );
}
