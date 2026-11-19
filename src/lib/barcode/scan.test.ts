import * as zxing from "@zxing/library";
import { describe, expect, it } from "vitest";

import { createZxingReader, decodeLuminance, toLuminance } from "./decoder";
import {
    cameraProblem,
    createScanConfirmer,
    guideSourceRect,
    hasChecksumProblem,
    isAcceptableCode,
    isTypedCodeUsable,
    isValidGtin,
    scanAction,
} from "./scan";

describe("검증 숫자", () => {
    it("맞는 상품 바코드를 받아들인다 (EAN-13, UPC-A, EAN-8)", () => {
        expect(isValidGtin("8801043014830")).toBe(true);
        expect(isValidGtin("4901234567894")).toBe(true);
        expect(isValidGtin("036000291452")).toBe(true);
        expect(isValidGtin("96385074")).toBe(true);
    });

    it("한 자리만 틀려도 거른다", () => {
        expect(isValidGtin("8801043014831")).toBe(false);
        expect(isValidGtin("8801043015830")).toBe(false);
    });

    it("길이가 다르거나 숫자가 아니면 상품 바코드가 아니다", () => {
        expect(isValidGtin("12345")).toBe(false);
        expect(isValidGtin("88010430148a0")).toBe(false);
    });

    it("자유 형식(CODE-128 등)은 주소에 넣을 수 있는 글자면 받는다", () => {
        expect(isAcceptableCode("NM-001-A")).toBe(true);
        expect(isAcceptableCode("https://example.com")).toBe(false);
        expect(isAcceptableCode("12")).toBe(false);
        // 상품 바코드 길이인데 검증 숫자가 틀리면 자유 형식으로도 받지 않는다
        expect(isAcceptableCode("8801043014831")).toBe(false);
    });
});

describe("손으로 넣은 번호", () => {
    it("검증 숫자가 틀려도 쓸 수 있다 — 대신 경고한다", () => {
        // 서버의 시험용 데이터에 있는 번호. 검증 숫자가 맞지 않는다
        expect(isAcceptableCode("8801234567890")).toBe(false);
        expect(isTypedCodeUsable("8801234567890")).toBe(true);
        expect(hasChecksumProblem("8801234567890")).toBe(true);
    });

    it("검증 숫자가 맞으면 경고하지 않는다", () => {
        expect(isTypedCodeUsable("8801043014830")).toBe(true);
        expect(hasChecksumProblem("8801043014830")).toBe(false);
    });

    it("상품 바코드 길이가 아니면 경고하지 않는다 (넣는 중이거나 자유 형식)", () => {
        expect(hasChecksumProblem("88012345")).toBe(true);
        expect(hasChecksumProblem("880123456")).toBe(false);
        expect(hasChecksumProblem("NM-001-A")).toBe(false);
    });

    it("너무 짧거나 주소에 넣을 수 없는 글자는 쓸 수 없다", () => {
        expect(isTypedCodeUsable("880")).toBe(false);
        expect(isTypedCodeUsable("8801 2345")).toBe(false);
        expect(isTypedCodeUsable("https://a.b")).toBe(false);
    });
});

describe("읽은 값 확정", () => {
    const code = "8801043014830";

    it("같은 값이 두 번 읽히면 확정한다", () => {
        const read = createScanConfirmer();
        expect(read(code, 0)).toBeNull();
        expect(read(code, 100)).toBe(code);
    });

    it("다른 값이 끼면 다시 센다", () => {
        const read = createScanConfirmer();
        read(code, 0);
        expect(read("4901234567894", 100)).toBeNull();
        expect(read(code, 200)).toBeNull();
        expect(read(code, 300)).toBe(code);
    });

    it("검증 숫자가 틀린 읽기는 무시하고, 앞서 읽은 것도 지우지 않는다", () => {
        const read = createScanConfirmer();
        read(code, 0);
        expect(read("8801043014831", 100)).toBeNull();
        expect(read(code, 200)).toBe(code);
    });

    it("오래 쉬었다 읽으면 처음부터 다시 센다", () => {
        const read = createScanConfirmer();
        read(code, 0);
        expect(read(code, 5_000)).toBeNull();
        expect(read(code, 5_100)).toBe(code);
    });

    it("확정한 뒤에는 다시 두 번을 읽어야 한다", () => {
        const read = createScanConfirmer();
        read(code, 0);
        read(code, 100);
        expect(read(code, 200)).toBeNull();
    });
});

describe("안내 사각형이 원본 영상에서 차지하는 자리", () => {
    it("가로로 긴 영상을 세로로 긴 상자에 채우면 좌우가 잘린다", () => {
        // 1920×1080 영상을 360×360 상자에 채우면 3배 줄어 가운데 1080×1080 만 보인다
        const rect = guideSourceRect(
            { width: 1920, height: 1080 },
            { width: 360, height: 360 },
            { width: 0.8, height: 0.4 },
        );
        expect(rect).toEqual({ x: 528, y: 324, width: 864, height: 432 });
    });

    it("세로로 긴 영상(휴대폰을 세워 든 경우)은 위아래가 잘린다", () => {
        const rect = guideSourceRect(
            { width: 1080, height: 1920 },
            { width: 360, height: 360 },
            { width: 1, height: 0.5 },
        );
        expect(rect).toEqual({ x: 0, y: 690, width: 1080, height: 540 });
    });

    it("영상보다 큰 영역을 요구해도 영상 밖으로 나가지 않는다", () => {
        const rect = guideSourceRect({ width: 640, height: 480 }, { width: 320, height: 240 }, { width: 2, height: 2 });
        expect(rect).toEqual({ x: 0, y: 0, width: 640, height: 480 });
    });
});

describe("카메라를 열지 못한 이유", () => {
    const named = (name: string) => Object.assign(new Error(name), { name });

    it("이유별로 가른다", () => {
        expect(cameraProblem(named("NotAllowedError"))).toBe("denied");
        expect(cameraProblem(named("NotFoundError"))).toBe("missing");
        expect(cameraProblem(named("NotReadableError"))).toBe("busy");
        expect(cameraProblem(named("CameraUnsupportedError"))).toBe("unsupported");
        expect(cameraProblem("이상한 값")).toBe("unknown");
    });
});

describe("번호 카드에 보여 줄 것", () => {
    it("찾았으면 상품 정보와 버튼을 따로 준다 — 버튼 글자에 이름을 넣지 않는다", () => {
        expect(scanAction({ status: "found", name: "새우깡", brandName: "농심" })).toEqual({
            product: { name: "새우깡", brandName: "농심" },
            note: null,
            button: "이 물건 등록하기",
        });
    });

    it("이름이 아무리 길어도 버튼 글자는 그대로다", () => {
        const action = scanAction({ status: "found", name: "가".repeat(80) });
        expect(action.button).toBe("이 물건 등록하기");
        expect(action.product?.name).toHaveLength(80);
    });

    it("브랜드만 왔으면 브랜드를 이름 자리에 쓴다", () => {
        expect(scanAction({ status: "found", brandName: "농심" }).product).toEqual({
            name: "농심",
            brandName: undefined,
        });
    });

    it("찾는 중에는 버튼을 내지 않다가, 오래 걸리면 넘어갈 길을 연다", () => {
        expect(scanAction({ status: "waiting" })).toMatchObject({ button: null, note: "상품 정보를 찾는 중…" });
        expect(scanAction({ status: "slow" }).button).toBe("기다리지 않고 등록하기");
    });

    it("못 찾았거나 못 불러왔으면 이유를 따로 적고 직접 적으라고 한다", () => {
        expect(scanAction({ status: "missing" })).toEqual({
            product: null,
            note: "등록된 상품 정보가 없어요.",
            button: "직접 적어 등록하기",
        });
        expect(scanAction({ status: "failed" }).note).toBe("상품 정보를 불러오지 못했어요.");
        expect(scanAction({ status: "skipped" })).toEqual({
            product: null,
            note: null,
            button: "이 바코드로 물건 등록하기",
        });
    });
});

/* ── 바코드 그림을 만들어 실제로 해독해 본다 ─────────────────────────── */

const L = [
    "0001101",
    "0011001",
    "0010011",
    "0111101",
    "0100011",
    "0110001",
    "0101111",
    "0111011",
    "0110111",
    "0001011",
];
const flip = (bits: string) => [...bits].map((bit) => (bit === "0" ? "1" : "0")).join("");
const R = L.map(flip);
const G = R.map((bits) => [...bits].reverse().join(""));
/** 첫 자리가 왼쪽 여섯 자리의 무늬(L/G) 조합을 정한다 */
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

function ean13Modules(code: string): string {
    const digits = [...code].map(Number);
    const left = digits
        .slice(1, 7)
        .map((digit, index) => (PARITY[digits[0]][index] === "L" ? L : G)[digit])
        .join("");
    const right = digits
        .slice(7)
        .map((digit) => R[digit])
        .join("");
    return `101${left}01010${right}101`;
}

/** 흰 바탕에 검은 막대를 그린 RGBA 그림. `contrast` 를 낮추면 흐릿한 회색 막대가 된다 */
function drawBarcode(code: string, { moduleWidth = 3, height = 80, quiet = 12, dark = 0, light = 255 } = {}) {
    const modules = "0".repeat(quiet) + ean13Modules(code) + "0".repeat(quiet);
    const width = modules.length * moduleWidth;
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const value = modules[Math.floor(x / moduleWidth)] === "1" ? dark : light;
            rgba.set([value, value, value, 255], (y * width + x) * 4);
        }
    }
    return { rgba, width, height };
}

describe("zxing 해독 (내장 인식기가 없는 기기의 경로)", () => {
    const reader = createZxingReader(zxing);
    const decode = (image: ReturnType<typeof drawBarcode>) =>
        decodeLuminance(zxing, reader, toLuminance(image.rgba), image.width, image.height);

    it("EAN-13 그림을 읽는다", () => {
        expect(decode(drawBarcode("8801043014830"))).toBe("8801043014830");
        expect(decode(drawBarcode("4901234567894"))).toBe("4901234567894");
    });

    it("막대가 가늘고 대비가 낮아도 읽는다", () => {
        expect(decode(drawBarcode("8801043014830", { moduleWidth: 2, dark: 70, light: 190 }))).toBe("8801043014830");
    });

    it("바코드가 없는 그림은 null", () => {
        const blank = { rgba: new Uint8ClampedArray(200 * 60 * 4).fill(255), width: 200, height: 60 };
        expect(decode(blank)).toBeNull();
    });

    it("이어서 읽어도 앞 결과가 남지 않는다", () => {
        const blank = { rgba: new Uint8ClampedArray(200 * 60 * 4).fill(255), width: 200, height: 60 };
        decode(drawBarcode("8801043014830"));
        expect(decode(blank)).toBeNull();
    });
});
