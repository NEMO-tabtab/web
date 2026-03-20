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
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 p-6 overscroll-none pb-24">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-900/20 to-neutral-900 pointer-events-none" />
            
            <div className="relative z-10 w-full max-w-xl rounded-3xl bg-neutral-800/40 p-6 text-center shadow-2xl backdrop-blur-xl border border-white/10">
                <h1 className="mb-2 text-2xl font-black text-white tracking-tight">바코드 스캐너</h1>
                <p className="font-medium text-brand-400">{status}</p>
            </div>

            <div className="relative z-10 mt-8 h-[360px] w-full max-w-sm overflow-hidden rounded-[2.5rem] border-[6px] border-neutral-800 shadow-[0_0_50px_rgba(0,118,255,0.15)] bg-black">
                <video ref={videoRef} className="h-full w-full object-cover opacity-90" />

                {/* 가이드라인 UI */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-[80%] h-[40%] border-2 border-white/20 rounded-2xl relative">
                        {isScanning && (
                            <div className="absolute top-0 left-0 right-0 h-1 rounded-full bg-brand-500 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(0,118,255,0.8)]" />
                        )}
                        {/* 코너 장식 */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand-500 rounded-tl-xl" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand-500 rounded-tr-xl" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand-500 rounded-bl-xl" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand-500 rounded-br-xl" />
                    </div>
                    {isScanning && (
                        <p className="mt-6 text-sm font-bold text-white/70 animate-pulse">바코드를 사각형 안에 맞춰주세요</p>
                    )}
                </div>
            </div>

            {result && (
                <div className="relative z-10 mt-8 w-full max-w-sm rounded-[2rem] bg-gradient-to-r from-emerald-500 to-emerald-400 p-6 text-center shadow-[0_10px_30px_rgba(16,185,129,0.3)] animate-slide-up">
                    <p className="text-sm font-bold text-emerald-900/70">인식된 코드</p>
                    <p className="mt-1 font-mono text-3xl font-black text-white tracking-wider">{result}</p>
                </div>
            )}

            <div className="relative z-10 mt-10 w-full max-w-sm flex gap-4">
                {!isScanning ? (
                    <button
                        onClick={startScan}
                        className="flex-1 rounded-2xl bg-brand-600 px-6 py-4 font-bold text-white shadow-[0_8px_30px_rgb(0,118,255,0.3)] transition-all hover:-translate-y-1 hover:bg-brand-500 active:scale-95"
                    >
                        스캔 시작
                    </button>
                ) : (
                    <button
                        onClick={stopScan}
                        className="flex-1 rounded-2xl bg-neutral-800 px-6 py-4 font-bold text-white shadow-lg transition-all border border-neutral-700 hover:-translate-y-1 hover:bg-neutral-700 active:scale-95"
                    >
                        스캔 중지
                    </button>
                )}
            </div>
        </div>
    );
}
