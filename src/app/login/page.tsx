"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { NemoLogo } from "@/components/NemoLogo";
import { Button, Card, Heading, Input, Text } from "@/components/common";

export default function Login() {
    const router = useRouter();

    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

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

            await res.json();
            router.push("/");
        } catch (err) {
            console.log(err);
            setError("아이디 또는 비밀번호가 틀렸습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
            <Card padding="md" className="w-full max-w-sm space-y-6">
                {/* 표지 — 심볼 로고 아래 낙서 밑줄 제목. .scribble 은 제목 요소 자체에 붙어야 밑줄 폭이 글자를 따라간다 */}
                <div className="flex flex-col items-center gap-3">
                    <NemoLogo size={72} />
                    <Heading level={1} className="scribble">
                        로그인
                    </Heading>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        id="login-id"
                        label="아이디"
                        placeholder="아이디를 입력하세요"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        autoComplete="username"
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? "login-error" : undefined}
                    />

                    <Input
                        id="login-password"
                        type="password"
                        label="비밀번호"
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? "login-error" : undefined}
                    />

                    {/* 로그인 실패는 특정 칸이 아니라 폼 전체의 문제라 한 번만 알린다.
                        danger 는 오류·삭제 전용 색이라 이런 자리에만 쓴다. */}
                    {error && (
                        <p id="login-error" role="alert" className="text-danger text-[13px] font-bold">
                            {error}
                        </p>
                    )}

                    <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
                        {isSubmitting ? "들어가는 중…" : "로그인"}
                    </Button>
                </form>

                {/* 회원가입은 보조 동작 — 먹 채움 버튼과 겨루지 않게 텍스트 링크로 둔다 */}
                <p className="text-ink-soft text-center text-[13px]">
                    아직 계정이 없나요?{" "}
                    <Link href="/signup" className="text-ink font-bold underline underline-offset-4">
                        회원가입
                    </Link>
                </p>
            </Card>

            <Text size="sm" tone="muted" className="mt-6">
                NEMO — 당신의 가치를 찾아보세요
            </Text>
        </main>
    );
}
