/*
 * 바코드 스캔의 판단 로직 — 카메라·화면 없이 테스트할 수 있는 것만 둔다.
 */

/** 숫자로만 된 상품 바코드(EAN-8, UPC-A, EAN-13)의 길이 */
const GTIN_LENGTHS = [8, 12, 13];

/**
 * 상품 바코드의 마지막 자리(검증 숫자)가 맞는가.
 * 오른쪽 끝(검증 숫자)에서 왼쪽으로 가며 1, 3, 1, 3… 을 곱해 더한 값이 10 의 배수면 맞다.
 */
export function isValidGtin(code: string): boolean {
    if (!/^\d+$/.test(code) || !GTIN_LENGTHS.includes(code.length)) return false;
    let sum = 0;
    for (let index = 0; index < code.length; index += 1) {
        const digit = code.charCodeAt(code.length - 1 - index) - 48;
        sum += index % 2 === 0 ? digit : digit * 3;
    }
    return sum % 10 === 0;
}

/**
 * 읽은 값을 받아들일 만한가.
 * 숫자뿐이고 상품 바코드 길이면 검증 숫자까지 맞아야 한다 — 흐린 화면에서 한 자리를 틀리게 읽는 일이 잦다.
 * 그 밖(CODE-128 같은 자유 형식)은 주소에 넣을 수 있는 글자인지만 본다.
 */
export function isAcceptableCode(code: string): boolean {
    if (/^\d+$/.test(code) && GTIN_LENGTHS.includes(code.length)) return isValidGtin(code);
    return /^[0-9A-Za-z-]{4,48}$/.test(code);
}

/**
 * 손으로 넣은 번호를 쓸 수 있는가. 스캔과 달리 검증 숫자가 틀려도 막지 않는다 —
 * 검증 숫자가 맞지 않는 번호로 등록된 상품도 있고(서버의 시험용 데이터 등), 사람이 보고 넣은 번호라
 * 틀렸는지는 본인이 확인할 수 있다. 대신 `hasChecksumProblem` 으로 경고한다.
 */
export function isTypedCodeUsable(code: string): boolean {
    return /^[0-9A-Za-z-]{4,48}$/.test(code);
}

/** 상품 바코드 길이의 숫자인데 검증 숫자가 맞지 않는다 — 한 자리를 잘못 넣었을 가능성이 높다 */
export function hasChecksumProblem(code: string): boolean {
    return /^\d+$/.test(code) && GTIN_LENGTHS.includes(code.length) && !isValidGtin(code);
}

/** 같은 값이 연달아 이만큼 읽히면 확정한다 */
export const READS_TO_CONFIRM = 2;
/** 이보다 오래 못 읽으면 앞서 읽은 것은 잊는다 */
const READ_GAP_MS = 1_500;

/**
 * 한 번 읽힌 값을 바로 믿지 않고, 같은 값이 다시 읽히면 확정한다.
 * 못 읽은 프레임이 사이에 끼어도 처음부터 다시 세지 않는다 — 다른 값이 읽히거나 오래 쉬었을 때만 다시 센다.
 */
export function createScanConfirmer(needed: number = READS_TO_CONFIRM, gapMs: number = READ_GAP_MS) {
    let last: string | null = null;
    let count = 0;
    let lastAt = -Infinity;

    return function read(code: string, now: number = Date.now()): string | null {
        const value = code.trim();
        if (!isAcceptableCode(value)) return null;

        count = value === last && now - lastAt <= gapMs ? count + 1 : 1;
        last = value;
        lastAt = now;
        if (count < needed) return null;

        last = null;
        count = 0;
        return value;
    };
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * 화면의 안내 사각형이 카메라 원본 영상의 어디에 해당하는지.
 * 영상은 상자를 꽉 채우도록(object-cover) 가운데를 맞춰 잘려 보인다.
 * `fraction` 은 상자 대비 안내 사각형의 크기(가로·세로 비율). 결과는 원본 영상의 픽셀이다.
 */
export function guideSourceRect(
    video: { width: number; height: number },
    box: { width: number; height: number },
    fraction: { width: number; height: number },
): Rect {
    // 상자를 꽉 채우려면 영상을 이만큼 키워야 한다
    const scale = Math.max(box.width / video.width, box.height / video.height);
    const width = Math.min(video.width, Math.round((box.width * fraction.width) / scale));
    const height = Math.min(video.height, Math.round((box.height * fraction.height) / scale));
    return {
        x: Math.round((video.width - width) / 2),
        y: Math.round((video.height - height) / 2),
        width,
        height,
    };
}

export type CameraProblem = "denied" | "missing" | "busy" | "unsupported" | "unknown";

/** 카메라를 열지 못한 이유를 가른다 (getUserMedia 가 던지는 DOMException 의 name) */
export function cameraProblem(error: unknown): CameraProblem {
    const name = error instanceof Error ? error.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") return "denied";
    if (name === "NotFoundError" || name === "OverconstrainedError") return "missing";
    if (name === "NotReadableError" || name === "AbortError") return "busy";
    if (name === "CameraUnsupportedError") return "unsupported";
    return "unknown";
}

export const CAMERA_PROBLEM_MESSAGES: Record<CameraProblem, string> = {
    denied: "카메라 권한이 꺼져 있어요. 브라우저 설정에서 이 사이트의 카메라를 허용한 뒤 다시 눌러 주세요.",
    missing: "쓸 수 있는 카메라를 찾지 못했어요.",
    busy: "카메라를 열지 못했어요. 다른 앱이 카메라를 쓰고 있다면 닫고 다시 눌러 주세요.",
    unsupported: "이 브라우저에서는 카메라를 쓸 수 없어요.",
    unknown: "카메라를 열지 못했어요. 다시 눌러 주세요.",
};

/**
 * 스캐너 화면에서 서버 조회가 어디까지 왔는지.
 * - waiting : 찾는 중 (아직 기다릴 만하다)
 * - slow    : 찾는 중인데 오래 걸린다 — 기다리지 않고 넘어갈 길을 연다
 * - found   : 찾았다
 * - missing : 서버에 없다
 * - failed  : 서버에 닿지 못했다
 * - skipped : 조회하지 않았다 (오프라인, 서버 주소 없음)
 */
export type ScanLookup =
    | { status: "waiting" | "slow" | "missing" | "failed" | "skipped" }
    | { status: "found"; name?: string; brandName?: string };

/** 번호 카드에 보여 줄 것 — 상품 정보와 할 일(버튼)을 나눠 담는다 */
export interface ScanAction {
    /** 찾은 상품. 버튼과 따로 보여 준다 — 이름이 길어도 버튼 글자가 꺾이지 않게 */
    product: { name: string; brandName?: string } | null;
    /** 상품이 없을 때 그 자리에 보여 줄 한 줄 */
    note: string | null;
    /** 등록 화면으로 가는 버튼의 글자. null 이면 버튼을 내지 않는다 */
    button: string | null;
}

export function scanAction(lookup: ScanLookup): ScanAction {
    switch (lookup.status) {
        case "waiting":
            return { product: null, note: "상품 정보를 찾는 중…", button: null };
        case "slow":
            return {
                product: null,
                note: "상품 정보를 찾는 중… 오래 걸리고 있어요.",
                button: "기다리지 않고 등록하기",
            };
        case "found": {
            // 브랜드만 온 경우에는 브랜드를 이름 자리에 쓴다
            const name = lookup.name ?? lookup.brandName;
            return name
                ? {
                      product: { name, brandName: lookup.name ? lookup.brandName : undefined },
                      note: null,
                      button: "이 물건 등록하기",
                  }
                : { product: null, note: null, button: "이 바코드로 물건 등록하기" };
        }
        case "missing":
            return { product: null, note: "등록된 상품 정보가 없어요.", button: "직접 적어 등록하기" };
        case "failed":
            return { product: null, note: "상품 정보를 불러오지 못했어요.", button: "직접 적어 등록하기" };
        case "skipped":
            return { product: null, note: null, button: "이 바코드로 물건 등록하기" };
    }
}
