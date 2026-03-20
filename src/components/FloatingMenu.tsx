"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FloatingMenu() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {open && (
                <>
                    <button
                        onClick={() => router.push("/user-info")}
                        className="rounded-full bg-white px-4 py-2 shadow-lg hover:bg-gray-100"
                    >
                        유저 정보
                    </button>

                    <button
                        onClick={() => router.push("/user-edit")}
                        className="rounded-full bg-white px-4 py-2 shadow-lg hover:bg-gray-100"
                    >
                        정보 수정
                    </button>

                    <button
                        onClick={() => router.push("/login")}
                        className="rounded-full bg-white px-4 py-2 shadow-lg hover:bg-gray-100"
                    >
                        로그인
                    </button>

                    <button
                        onClick={() => router.push("/barcode")}
                        className="rounded-full bg-white px-4 py-2 shadow-lg hover:bg-gray-100"
                    >
                        바코드 스캔
                    </button>
                </>
            )}

            <button
                onClick={() => setOpen(!open)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl text-white shadow-lg hover:bg-gray-800"
            >
                {open ? "×" : "+"}
            </button>
        </div>
    );
}
