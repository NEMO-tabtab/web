"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
    const router = useRouter();

    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!loginId.trim()) {
            alert("아이디를 입력해주세요.");
            return;
        }

        if (!password.trim()) {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    loginId,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || "로그인 실패");
            }

            console.log("로그인 사용자:", data.data.user);

            router.push("/");
            router.refresh();
        } catch (error) {
            console.error(error);

            alert("아이디 또는 비밀번호가 틀렸습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="bg-brand-3 flex h-screen flex-col items-center justify-center">
            <article className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-lg">
                <Image src="/logo.png" width={120} height={120} alt="logo" />

                <form onSubmit={handleLogin} className="flex w-full flex-col gap-4">
                    <input
                        type="text"
                        placeholder="아이디"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                    />

                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-black py-3 font-bold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {loading ? "로그인 중..." : "로그인"}
                    </button>
                </form>

                <button onClick={() => router.push("/signup")} className="text-sm text-gray-500 hover:underline">
                    회원가입
                </button>
            </article>
        </main>
    );
}
