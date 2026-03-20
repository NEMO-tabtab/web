"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
    const router = useRouter();

    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch("http://3.38.247.4:8080/api/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    loginId,
                    password,
                }),
            });

            if (!res.ok) {
                throw new Error("로그인 실패");
            }

            const data = await res.json();
            console.log(data);

            alert("로그인 성공!");
            router.push("/");
        } catch (error) {
            console.log(error);
            alert("아이디 또는 비밀번호가 틀렸습니다.");
        }
    };

    // const handleKakaoLogin = async () => {
    //     const res = await fetch("http://3.38.247.4:8080/api/user/kakao/login");
    //     const kakaoUrl = await res.text();
    //     console.log(kakaoUrl);
    // };

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

                    <button type="submit" className="rounded-lg bg-black py-3 font-bold text-white hover:bg-gray-800">
                        로그인
                    </button>
                </form>

                {/* 
                <button
                    onClick={handleKakaoLogin}
                    className="w-full rounded-lg bg-yellow-400 py-3 font-bold hover:bg-yellow-300"
                >
                    카카오 로그인
                </button>
                */}

                <button onClick={() => router.push("/signup")} className="text-sm text-gray-500 hover:underline">
                    회원가입
                </button>
            </article>
        </main>
    );
}
