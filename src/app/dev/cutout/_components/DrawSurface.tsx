"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import type { Point } from "@/lib/cutout/handmade";
import type { Mask } from "@/lib/cutout/mask";
import { overlayCanvas } from "@/lib/cutout/render";

export type SurfaceMode = "none" | "tap" | "draw";

export interface DrawnLine {
    points: Point[];
    tone: "add" | "remove" | "lasso";
}

const TONE_COLOR: Record<DrawnLine["tone"], string> = {
    add: "#1c1b19",
    remove: "#d0554e",
    lasso: "#1c1b19",
};

interface DrawSurfaceProps {
    source: HTMLCanvasElement;
    /** 물건으로 본 곳을 먹색으로 덮어 보여 준다. 사진과 크기가 같아야 한다 */
    mask: Mask | null;
    lines: DrawnLine[];
    mode: SurfaceMode;
    /** 지금 그리는 선의 색 */
    tone?: DrawnLine["tone"];
    onTap?: (point: Point) => void;
    onLine?: (points: Point[]) => void;
    label: string;
}

/**
 * 사진을 보여 주고 누르기·그리기를 받는 면. 좌표는 0~1로 넘긴다.
 * 그리는 동안 화면이 스크롤되지 않게, 받는 동안만 touch-action 을 끈다.
 */
export function DrawSurface({ source, mask, lines, mode, tone = "add", onTap, onLine, label }: DrawSurfaceProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef<Point[] | null>(null);
    const overlay = useMemo(() => (mask ? overlayCanvas(mask) : null), [mask]);

    const paint = useCallback(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(source, 0, 0);
        if (overlay) context.drawImage(overlay, 0, 0);

        const width = Math.max(3, Math.round(canvas.width * 0.012));
        const stroke = (points: Point[], lineTone: DrawnLine["tone"]) => {
            if (points.length === 0) return;
            context.strokeStyle = TONE_COLOR[lineTone];
            context.fillStyle = TONE_COLOR[lineTone];
            context.lineWidth = width;
            context.lineCap = "round";
            context.lineJoin = "round";
            context.setLineDash(lineTone === "lasso" ? [width * 2, width * 1.5] : []);
            if (points.length === 1) {
                context.beginPath();
                context.arc(points[0].x * canvas.width, points[0].y * canvas.height, width, 0, Math.PI * 2);
                context.fill();
                return;
            }
            context.beginPath();
            points.forEach((point, index) => {
                const x = point.x * canvas.width;
                const y = point.y * canvas.height;
                if (index === 0) context.moveTo(x, y);
                else context.lineTo(x, y);
            });
            if (lineTone === "lasso") context.closePath();
            context.stroke();
        };
        for (const line of lines) stroke(line.points, line.tone);
        if (drawing.current) stroke(drawing.current, tone);
    }, [source, overlay, lines, tone]);

    useEffect(paint, [paint]);

    const pointOf = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
        const rect = event.currentTarget.getBoundingClientRect();
        return {
            x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
            y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
        };
    };

    const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (mode === "none") return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drawing.current = [pointOf(event)];
        paint();
    };

    const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const points = drawing.current;
        if (mode !== "draw" || !points) return;
        const next = pointOf(event);
        const last = points[points.length - 1];
        // 너무 촘촘한 점은 버린다 — 모델에 보내는 획이 가벼워진다
        if (Math.hypot(next.x - last.x, next.y - last.y) < 0.004) return;
        points.push(next);
        paint();
    };

    const onPointerUp = () => {
        const points = drawing.current;
        drawing.current = null;
        if (!points) return;
        if (mode === "tap") onTap?.(points[0]);
        if (mode === "draw") onLine?.(points);
        paint();
    };

    return (
        <canvas
            ref={canvasRef}
            width={source.width}
            height={source.height}
            role="img"
            aria-label={label}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="block h-auto w-full rounded-nemo border border-line bg-cream"
            style={{ touchAction: mode === "none" ? "auto" : "none" }}
        />
    );
}
