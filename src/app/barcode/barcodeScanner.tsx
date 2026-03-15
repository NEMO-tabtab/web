"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

export default function BarcodePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);

    const [result, setResult] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState("대기 중");

    // 정확도 검증용
    const lastValueRef = useRef<string | null>(null);
    const confirmCountRef = useRef<number>(0);
    const REQUIRED_CONFIRM_COUNT = 3; // 같은 회수 체크 3번으로

    const startScan = async () => {
        if (!videoRef.current || isScanning) return;

        setResult(null);
        setStatus("스캔 중...");
        console.log("📷 스캔 시작");

        const reader = new BrowserMultiFormatReader(undefined, {
            delayBetweenScanAttempts: 100,
            delayBetweenScanSuccess: 500,
        });

        readerRef.current = reader;

        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (res, err) => {
            if (res) {
                const currentText = res.getText();
                console.log("🔍 감지:", currentText);

                // 🔥 노이즈 제거 로직
                if (lastValueRef.current === currentText) {
                    confirmCountRef.current += 1;
                } else {
                    confirmCountRef.current = 1;
                    lastValueRef.current = currentText;
                }

                console.log("✔ 확인 횟수:", confirmCountRef.current);

                if (confirmCountRef.current >= REQUIRED_CONFIRM_COUNT) {
                    console.log("✅ 최종 확정:", currentText);
                    setResult(currentText);
                    setStatus("인식 성공 🎉");
                    stopScan();
                }
            }

            if (err && err.name !== "NotFoundException") {
                console.log("⚠ 스캔 시도 중...");
            }
        });

        controlsRef.current = controls;
        setIsScanning(true);
    };

    const stopScan = () => {
        console.log("🛑 스캔 중지");

        controlsRef.current?.stop();
        controlsRef.current = null;

        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
        }

        readerRef.current = null;
        setIsScanning(false);

        // 검증 상태 초기화
        lastValueRef.current = null;
        confirmCountRef.current = 0;
    };

    useEffect(() => {
        return () => {
            stopScan();
        };
    }, []);

    return (
        <div className="flex flex-col items-center bg-yellow-200 p-6">
            <div className="w-full max-w-xl rounded-3xl bg-white/20 p-6 text-center shadow-xl backdrop-blur-md">
                <h1 className="mb-2 text-2xl font-bold">바코드 스캐너</h1>
                <p className="text-sm">{status}</p>
            </div>

            <div className="relative mt-8 h-[320px] w-[320px] overflow-hidden rounded-3xl border-4 border-white shadow-2xl">
                <video ref={videoRef} className="h-full w-full object-cover" />

                {isScanning && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-40 w-60 animate-pulse rounded-xl border-4 border-white" />
                    </div>
                )}
            </div>

            {result && (
                <div className="mt-6 w-full max-w-xl rounded-2xl bg-white p-4 text-center shadow-lg">
                    <p className="text-sm text-gray-500">인식된 코드</p>
                    <p className="font-mono text-xl font-bold text-orange-600">{result}</p>
                </div>
            )}

            <div className="mt-6 flex gap-4">
                {!isScanning ? (
                    <button
                        onClick={startScan}
                        className="rounded-full bg-white px-6 py-3 font-semibold text-orange-500 shadow-lg transition hover:scale-105"
                    >
                        스캔 시작
                    </button>
                ) : (
                    <button
                        onClick={stopScan}
                        className="rounded-full bg-red-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105"
                    >
                        스캔 중지
                    </button>
                )}
            </div>
        </div>
    );
}
