export type SaveResult = "shared" | "downloaded" | "cancelled";

/**
 * 만든 파일을 사용자에게 넘긴다. 반드시 버튼을 누른 직후에 부를 것 —
 * 누른 뒤 시간이 지나면(파일을 만드느라 기다린 뒤 등) iOS 가 공유 창과 다운로드를 막는다.
 *
 * 휴대폰에서는 공유 창(파일에 저장·드라이브·메신저)을 띄운다. 홈 화면에 설치한 앱은
 * 다운로드 폴더로 받는 길이 없거나 찾기 어렵기 때문이다. 그 밖에는 다운로드로 받는다.
 */
export async function saveFile(blob: Blob, fileName: string): Promise<SaveResult> {
    const file = new File([blob], fileName, { type: blob.type });
    const touch = window.matchMedia?.("(pointer: coarse)").matches ?? false;

    if (touch && navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: fileName });
            return "shared";
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
            // 공유가 막힌 환경 — 다운로드로 넘어간다
        }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // 바로 해제하면 일부 브라우저에서 다운로드가 시작되기 전에 끊긴다
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return "downloaded";
}

/** 1536 → "1.5KB", 3_500_000 → "3.3MB" */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
