import { normalizeRange, pickForeground, type Mask } from "./mask";

/*
 * 배경 지우기 실험(#215)의 모델 세 가지. 모두 사진을 기기 밖으로 보내지 않고 브라우저 안에서 돈다.
 *
 * 실험이라 npm 패키지로 더하지 않고, 고정한 버전을 CDN에서 그때그때 불러온다(webpackIgnore).
 * 그래서 앱 번들과 서비스 워커의 미리 받기(precache)에 아무것도 더해지지 않는다. 쓰기로 정하면 패키지로 옮긴다.
 * 받은 모델 파일은 SHA-256 을 맞춰 보고 다르면 쓰지 않는다(값을 아는 것만).
 */

export type EngineId = "magic-touch-v1" | "magic-touch-v2" | "u2netp";

export interface EngineInfo {
    id: EngineId;
    name: string;
    /** 어떻게 고르는지 */
    how: string;
    license: string;
    /** 처음 한 번 받는 파일(브라우저가 캐시한다) */
    downloads: { label: string; bytes: number }[];
    source: string;
}

const MEDIAPIPE_VERSION = "1.2.3";
const MEDIAPIPE_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const ORT_VERSION = "1.31.1";
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

const MODELS = {
    "magic-touch-v1": {
        url: "https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite",
        sha256: null,
    },
    "magic-touch-v2": {
        url: "https://storage.googleapis.com/mediapipe-models/interactive_segmenter_v2/magic_touch/int8/1/interactive_segmentation.task",
        // litert-community/MediaPipe-InteractiveSegmenter-MagicTouch 에 적힌 값
        sha256: "38431bc66b883404e8397f74c3579404315b9b52b04a46c6346fe906a7309b03",
    },
    u2netp: {
        // rembg 의 u2netp.onnx 를 그대로 옮긴 것. 원본(GitHub 릴리스)은 브라우저에서 받을 수 없어(CORS) 이 사본을 쓴다
        url: "https://huggingface.co/edgetools/u2netp/resolve/main/u2netp.onnx",
        sha256: "309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8",
    },
} satisfies Record<EngineId, { url: string; sha256: string | null }>;

/** 2026-11-28에 잰 크기 */
export const ENGINES: readonly EngineInfo[] = [
    {
        id: "magic-touch-v1",
        name: "누르기 (MagicTouch v1)",
        how: "물건을 한 번 누르면 그 물건을 오린다.",
        license: "Apache-2.0 (모델 카드), 런타임 Apache-2.0",
        downloads: [
            { label: "모델", bytes: 6_227_884 },
            { label: "MediaPipe 런타임(wasm)", bytes: 14_665_716 },
        ],
        source: "Google MediaPipe — InteractiveSegmenterLegacy(옮겨 가길 권하는 예전 API)",
    },
    {
        id: "magic-touch-v2",
        name: "문지르기 (MagicTouch v2)",
        how: "물건을 문지르면 넣고, 배경을 문지르면 뺀다. 사진을 한 번 읽은 뒤에는 고칠 때마다 빠르다.",
        license: "Apache-2.0, 런타임 Apache-2.0",
        downloads: [
            { label: "모델", bytes: 30_525_312 },
            { label: "MediaPipe 런타임(wasm)", bytes: 14_665_716 },
        ],
        source: "Google MediaPipe — InteractiveSegmenter",
    },
    {
        id: "u2netp",
        name: "자동 (U²-Netp)",
        how: "누르지 않아도 사진에서 가장 눈에 띄는 것을 오린다. 320×320으로 줄여 보므로 가장자리가 거칠 수 있다.",
        license: "Apache-2.0 (U²-Net), 런타임 MIT (onnxruntime-web)",
        downloads: [
            { label: "모델", bytes: 4_574_861 },
            { label: "ONNX 런타임(wasm)", bytes: 14_848_852 },
        ],
        source: "U²-Net(xuebinqin) 작은 판, rembg 배포본",
    },
];

export interface Loaded<T> {
    engine: T;
    /** 받고 준비하는 데 걸린 시간(ms). 캐시에 있으면 짧다 */
    prepareMs: number;
    /** 실제로 받은 모델 바이트 수 */
    modelBytes: number;
    /** 해시를 맞춰 봤는가. 값을 모르면 null */
    verified: boolean | null;
    /** "GPU" 또는 "CPU", ONNX 는 "wasm" */
    backend: string;
}

/** 이미지 위의 한 획. 좌표는 0~1 */
export interface Stroke {
    mode: "add" | "remove";
    points: { x: number; y: number }[];
}

export interface TapEngine {
    segment(image: HTMLCanvasElement, point: { x: number; y: number }): Mask;
    close(): void;
}

export interface StrokeEngine {
    setImage(image: HTMLCanvasElement): void;
    segment(strokes: Stroke[]): Mask;
    close(): void;
}

export interface AutoEngine {
    segment(image: HTMLCanvasElement): Promise<Mask>;
    close(): void;
}

// CDN 모듈의 모양 중 여기서 쓰는 부분만 적는다
interface MPMask {
    width: number;
    height: number;
    getAsFloat32Array(): Float32Array;
    close(): void;
}
interface VisionModule {
    FilesetResolver: { forVisionTasks(basePath: string): Promise<unknown> };
    InteractiveSegmenterLegacy: {
        createFromOptions(
            fileset: unknown,
            options: unknown,
        ): Promise<{
            segment(
                image: unknown,
                roi: { keypoint: { x: number; y: number } },
            ): {
                confidenceMasks?: MPMask[];
                close(): void;
            };
            close(): void;
        }>;
    };
    InteractiveSegmenter: {
        createFromOptions(
            fileset: unknown,
            options: unknown,
        ): Promise<{
            setImage(image: unknown): void;
            segment(strokes: { brushMode: number; point: { x: number; y: number }[]; isCompleted: boolean }[]): MPMask;
            close(): void;
        }>;
    };
}
interface OrtModule {
    env: { wasm: { wasmPaths: string; numThreads: number } };
    Tensor: new (type: "float32", data: Float32Array, dims: number[]) => unknown;
    InferenceSession: {
        create(
            model: Uint8Array,
            options: unknown,
        ): Promise<{
            inputNames: string[];
            outputNames: string[];
            run(feeds: Record<string, unknown>): Promise<Record<string, { data: Float32Array }>>;
            release(): Promise<void>;
        }>;
    };
}

/** 주소에서 모듈을 그대로 불러온다. 번들러가 손대지 않게 webpackIgnore 를 단다 */
function importUrl<T>(url: string): Promise<T> {
    return import(/* webpackIgnore: true */ url) as Promise<T>;
}

async function fetchModel(id: EngineId): Promise<{ bytes: Uint8Array; verified: boolean | null }> {
    const { url, sha256 } = MODELS[id];
    const response = await fetch(url);
    if (!response.ok) throw new Error(`모델을 받지 못했어요 (${response.status})`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    // crypto.subtle 은 보안 컨텍스트(HTTPS·localhost)에만 있다. 휴대폰으로 http 개발 서버에 붙으면 맞춰 보지 못한다
    if (!sha256 || !globalThis.crypto?.subtle) return { bytes, verified: null };
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    if (hex !== sha256) throw new Error("받은 모델 파일이 알려진 것과 달라요 — 쓰지 않았어요");
    return { bytes, verified: true };
}

/** MediaPipe 는 GPU 로 먼저 해 보고, 안 되면 CPU 로 */
async function withDelegate<T>(create: (delegate: "GPU" | "CPU") => Promise<T>): Promise<{ task: T; backend: string }> {
    try {
        return { task: await create("GPU"), backend: "GPU" };
    } catch {
        return { task: await create("CPU"), backend: "CPU" };
    }
}

const toMask = (mask: MPMask): Mask => ({
    width: mask.width,
    height: mask.height,
    data: mask.getAsFloat32Array().slice(),
});

export async function loadTapEngine(): Promise<Loaded<TapEngine>> {
    const startedAt = performance.now();
    const [vision, model] = await Promise.all([
        importUrl<VisionModule>(`${MEDIAPIPE_BASE}/vision_bundle.mjs`),
        fetchModel("magic-touch-v1"),
    ]);
    const fileset = await vision.FilesetResolver.forVisionTasks(`${MEDIAPIPE_BASE}/wasm`);
    const { task, backend } = await withDelegate((delegate) =>
        vision.InteractiveSegmenterLegacy.createFromOptions(fileset, {
            baseOptions: { modelAssetBuffer: model.bytes, delegate },
            outputConfidenceMasks: true,
            outputCategoryMask: false,
        }),
    );

    return {
        engine: {
            segment(image, point) {
                const result = task.segment(image, { keypoint: point });
                try {
                    const mask = pickForeground((result.confidenceMasks ?? []).map(toMask), point);
                    if (!mask) throw new Error("모델이 마스크를 돌려주지 않았어요");
                    return mask;
                } finally {
                    result.close();
                }
            },
            close: () => task.close(),
        },
        prepareMs: Math.round(performance.now() - startedAt),
        modelBytes: model.bytes.byteLength,
        verified: model.verified,
        backend,
    };
}

export async function loadStrokeEngine(): Promise<Loaded<StrokeEngine>> {
    const startedAt = performance.now();
    const [vision, model] = await Promise.all([
        importUrl<VisionModule>(`${MEDIAPIPE_BASE}/vision_bundle.mjs`),
        fetchModel("magic-touch-v2"),
    ]);
    const fileset = await vision.FilesetResolver.forVisionTasks(`${MEDIAPIPE_BASE}/wasm`);
    const { task, backend } = await withDelegate((delegate) =>
        vision.InteractiveSegmenter.createFromOptions(fileset, {
            baseOptions: { modelAssetBuffer: model.bytes, delegate },
        }),
    );

    return {
        engine: {
            setImage: (image) => task.setImage(image),
            segment(strokes) {
                const result = task.segment(strokes.map(toMediaPipeStroke));
                try {
                    const mask = toMask(result);
                    // 물건으로 문지른 첫 점이 배경으로 나오면 앞뒤가 바뀐 것으로 본다
                    const first = strokes.find((stroke) => stroke.mode === "add")?.points[0];
                    return first ? (pickForeground([mask], first) ?? mask) : mask;
                } finally {
                    result.close();
                }
            },
            close: () => task.close(),
        },
        prepareMs: Math.round(performance.now() - startedAt),
        modelBytes: model.bytes.byteLength,
        verified: model.verified,
        backend,
    };
}

/** MediaPipe 의 BrushMode: 1 = 넣기, 2 = 빼기. 점 하나짜리 획은 거의 같은 점 둘로 보낸다(공식 예제의 방식) */
export function toMediaPipeStroke(stroke: Stroke) {
    const points =
        stroke.points.length === 1
            ? [stroke.points[0], { x: Math.min(1, stroke.points[0].x + 0.001), y: stroke.points[0].y }]
            : stroke.points;
    return { brushMode: stroke.mode === "add" ? 1 : 2, point: points, isCompleted: true };
}

const U2NET_SIZE = 320;
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

/** RGBA(320×320) → U²-Net 입력(1×3×320×320, 채널별 정규화). rembg 와 같은 전처리 */
export function toU2netInput(rgba: Uint8ClampedArray, size = U2NET_SIZE): Float32Array {
    const plane = size * size;
    const input = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i++) {
        for (let c = 0; c < 3; c++) input[c * plane + i] = (rgba[i * 4 + c] / 255 - IMAGENET_MEAN[c]) / IMAGENET_STD[c];
    }
    return input;
}

export async function loadAutoEngine(): Promise<Loaded<AutoEngine>> {
    const startedAt = performance.now();
    const [ort, model] = await Promise.all([importUrl<OrtModule>(`${ORT_BASE}ort.wasm.min.mjs`), fetchModel("u2netp")]);
    ort.env.wasm.wasmPaths = ORT_BASE;
    // 여러 스레드는 cross-origin isolation 이 있어야 한다. 이 앱은 그 헤더를 두지 않으니 하나로 돈다
    ort.env.wasm.numThreads = 1;
    const session = await ort.InferenceSession.create(model.bytes, { executionProviders: ["wasm"] });

    return {
        engine: {
            async segment(image) {
                const canvas = document.createElement("canvas");
                canvas.width = U2NET_SIZE;
                canvas.height = U2NET_SIZE;
                const context = canvas.getContext("2d", { willReadFrequently: true });
                if (!context) throw new Error("캔버스를 쓸 수 없어요");
                context.drawImage(image, 0, 0, U2NET_SIZE, U2NET_SIZE);
                const { data } = context.getImageData(0, 0, U2NET_SIZE, U2NET_SIZE);
                const tensor = new ort.Tensor("float32", toU2netInput(data), [1, 3, U2NET_SIZE, U2NET_SIZE]);
                const outputs = await session.run({ [session.inputNames[0]]: tensor });
                // 여러 출력 중 첫째가 합친(fused) 결과다
                return normalizeRange(outputs[session.outputNames[0]].data, U2NET_SIZE, U2NET_SIZE);
            },
            close: () => void session.release(),
        },
        prepareMs: Math.round(performance.now() - startedAt),
        modelBytes: model.bytes.byteLength,
        verified: model.verified,
        backend: "wasm",
    };
}
