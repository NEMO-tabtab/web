/** 저장할 사진의 긴 변 최대 길이(px) */
const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.8;

/**
 * 휴대폰 사진(수 MB)을 그대로 IndexedDB 에 넣으면 금방 저장 공간이 찬다.
 * 긴 변을 1280px 로 줄여 JPEG 로 다시 굽는다. 실패하면(디코딩 불가 형식 등) 원본을 그대로 쓴다.
 *
 * createImageBitmap·OffscreenCanvas 대신 <img> + <canvas> 를 쓰는 이유: iOS Safari 구버전까지
 * 가장 넓게 동작하고, 최신 브라우저는 <img> 를 그릴 때 EXIF 회전을 알아서 반영한다.
 */
export async function compressImage(file: Blob): Promise<Blob> {
    const url = URL.createObjectURL(file);
    try {
        const image = await loadImage(url);
        const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.round(image.naturalWidth * scale);
        const height = Math.round(image.naturalHeight * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return file;

        // 투명 PNG 가 JPEG 로 바뀌며 검게 칠해지지 않도록 바탕을 먼저 깐다
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
        // 이미 작은 사진은 다시 구워도 커질 수 있다 — 작은 쪽을 남긴다
        return blob && blob.size < file.size ? blob : file;
    } catch {
        return file;
    } finally {
        URL.revokeObjectURL(url);
    }
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("이미지를 읽지 못했습니다"));
        image.src = src;
    });
}
