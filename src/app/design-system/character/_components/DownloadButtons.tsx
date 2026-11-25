"use client";

import React, { useState } from "react";

import { Button, Icon } from "@/components/common";

/** PNG 는 SVG 의 두 배 크기로 만든다 — 스토어 그림이나 인쇄 시안에도 쓸 수 있게 */
const PNG_SCALE = 2;

const save = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

/** SVG 문자열을 브라우저에서 그려 PNG 로 바꾼다. 필터가 그림 안에 있어 손떨림 선이 그대로 나온다 */
const toPng = async (svg: string): Promise<Blob> => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("SVG 를 그림으로 읽지 못했다"));
            image.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = image.width * PNG_SCALE;
        canvas.height = image.height * PNG_SCALE;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("캔버스를 쓸 수 없다");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG 로 바꾸지 못했다"))), "image/png");
        });
    } finally {
        URL.revokeObjectURL(url);
    }
};

/**
 * 시트의 그림을 내려받는 버튼. 원본은 코드 하나이고(src/lib/nemo), 내보낸 파일을 저장소에 쌓지 않는다.
 * 바탕은 투명하다.
 */
export function DownloadButtons({ name, svg }: { name: string; svg: string }) {
    const [failed, setFailed] = useState(false);

    const savePng = async () => {
        setFailed(false);
        try {
            save(await toPng(svg), `${name}.png`);
        } catch {
            // 브라우저가 SVG 를 그림으로 바꾸지 못한 경우 — SVG 는 그대로 받을 수 있다
            setFailed(true);
        }
    };

    return (
        <div className="space-y-1">
            <div className="flex gap-1.5">
                <Button
                    size="sm"
                    variant="outline"
                    shape="pill"
                    aria-label={`${name} SVG 내려받기`}
                    onClick={() => save(new Blob([svg], { type: "image/svg+xml" }), `${name}.svg`)}
                >
                    <Icon name="download" />
                    SVG
                </Button>
                <Button size="sm" variant="outline" shape="pill" aria-label={`${name} PNG 내려받기`} onClick={savePng}>
                    <Icon name="download" />
                    PNG
                </Button>
            </div>
            {failed && (
                <p role="status" className="text-danger text-[11px]">
                    PNG 를 만들지 못했어요. SVG 로 받아 주세요.
                </p>
            )}
        </div>
    );
}
