import type { MultiFormatReader } from "@zxing/library";

/*
 * 영상 한 장에서 바코드를 읽는다.
 *
 * 기기에 내장 인식기(BarcodeDetector — 안드로이드 크롬 등)가 있으면 그것을 쓴다. 빠르고 흐린 영상에도 강하다.
 * 없으면(iOS 사파리 등) zxing 으로 읽는다. zxing 은 무거워서 그때만 내려받는다.
 * 형식은 상품에 붙는 1차원 바코드로 좁힌다 — 형식이 많을수록 느리고 잘못 읽는다.
 */

export interface BarcodeDecoder {
    /** 어느 인식기를 쓰는지 (개발자 확인용) */
    engine: "native" | "zxing";
    /** 못 읽으면 null */
    decode: (canvas: HTMLCanvasElement) => Promise<string | null>;
}

const NATIVE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"];

interface NativeDetector {
    detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}
interface NativeDetectorClass {
    new (options: { formats: string[] }): NativeDetector;
    getSupportedFormats: () => Promise<string[]>;
}

async function createNativeDecoder(): Promise<BarcodeDecoder | null> {
    const Detector = (globalThis as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
    if (!Detector) return null;
    try {
        const supported = await Detector.getSupportedFormats();
        const formats = NATIVE_FORMATS.filter((format) => supported.includes(format));
        // 상품 바코드의 기본인 EAN-13 을 못 읽는 인식기라면 쓰지 않는다
        if (!formats.includes("ean_13")) return null;

        const detector = new Detector({ formats });
        return {
            engine: "native",
            decode: async (canvas) => {
                const found = await detector.detect(canvas);
                return found[0]?.rawValue ?? null;
            },
        };
    } catch {
        return null;
    }
}

/** RGBA 픽셀을 밝기(0~255) 한 줄로 바꾼다 */
export function toLuminance(rgba: Uint8ClampedArray): Uint8ClampedArray {
    const luminance = new Uint8ClampedArray(rgba.length / 4);
    for (let index = 0; index < luminance.length; index += 1) {
        const offset = index * 4;
        // 사람 눈의 밝기 감도에 맞춘 가중치(0.299, 0.587, 0.114)를 정수로 계산
        luminance[index] = (rgba[offset] * 77 + rgba[offset + 1] * 150 + rgba[offset + 2] * 29) >> 8;
    }
    return luminance;
}

type Zxing = typeof import("@zxing/library");

export function createZxingReader(zxing: Zxing): MultiFormatReader {
    const { BarcodeFormat, DecodeHintType, MultiFormatReader: Reader } = zxing;
    const hints = new Map<unknown, unknown>([
        [
            DecodeHintType.POSSIBLE_FORMATS,
            [
                BarcodeFormat.EAN_13,
                BarcodeFormat.EAN_8,
                BarcodeFormat.UPC_A,
                BarcodeFormat.UPC_E,
                BarcodeFormat.CODE_128,
                BarcodeFormat.CODE_39,
                BarcodeFormat.ITF,
            ],
        ],
        // 더 꼼꼼히 훑고, 옆으로 누운 바코드도 읽는다
        [DecodeHintType.TRY_HARDER, true],
    ]);
    const reader = new Reader();
    reader.setHints(hints as never);
    return reader;
}

/** 밝기 배열에서 바코드를 읽는다. 못 읽으면 null */
export function decodeLuminance(
    zxing: Zxing,
    reader: MultiFormatReader,
    luminance: Uint8ClampedArray,
    width: number,
    height: number,
): string | null {
    const { BinaryBitmap, HybridBinarizer, RGBLuminanceSource } = zxing;
    try {
        const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(luminance, width, height)));
        return reader.decodeWithState(bitmap).getText();
    } catch {
        // 못 찾음(NotFoundException)과 깨진 읽기(Checksum·Format)는 모두 "이번 장에서는 못 읽음"이다
        return null;
    } finally {
        reader.reset();
    }
}

async function createZxingDecoder(): Promise<BarcodeDecoder> {
    const zxing = await import("@zxing/library");
    const reader = createZxingReader(zxing);
    return {
        engine: "zxing",
        decode: async (canvas) => {
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context) return null;
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            return decodeLuminance(zxing, reader, toLuminance(image.data), image.width, image.height);
        },
    };
}

export async function createBarcodeDecoder(): Promise<BarcodeDecoder> {
    return (await createNativeDecoder()) ?? createZxingDecoder();
}
