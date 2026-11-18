"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { NemoLogo } from "@/components/NemoLogo";
import { Button, Card, Heading, Input, Text } from "@/components/common";
import { login } from "@/lib/api/auth";
import { API_MOCK_ENABLED } from "@/lib/api/client";
import { describeApiError } from "@/lib/api/errors";
import { saveSession } from "@/lib/auth/session";

const WRONG_CREDENTIALS = "아이디 또는 비밀번호가 맞지 않아요.";
/** 잠든 서버가 깨는 데 1분쯤 걸린다 — 그동안 멈춘 것처럼 보이지 않게 알린다 */
const SLOW_AFTER_MS = 5_000;

export default function Login() {
    const router = useRouter();

    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSlow, setIsSlow] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!loginId.trim() || !password) {
            setError("아이디와 비밀번호를 입력해 주세요.");
            return;
        }

        setError(null);
        setIsSubmitting(true);
        const slowTimer = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);

        try {
            const data = await login(loginId.trim(), password);
            // 저장하지 못해도(사생활 보호 모드 등) 로그인은 된 것이다 — 다음에 다시 로그인하면 된다
            saveSession(data);
            router.replace("/");
        } catch (err) {
            // 서버가 꺼진 것과 비밀번호가 틀린 것을 다른 문구로 알린다
            const { message } = describeApiError(err, {
                400: WRONG_CREDENTIALS,
                401: WRONG_CREDENTIALS,
                envelope: WRONG_CREDENTIALS,
            });
            setError(message);
        } finally {
            clearTimeout(slowTimer);
            setIsSlow(false);
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

                    {isSlow && (
                        <Text size="xs" tone="muted" role="status">
                            서버가 깨어나는 중이에요. 길면 1분쯤 걸려요.
                        </Text>
                    )}

                    <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
                        {isSubmitting ? "들어가는 중…" : "로그인"}
                    </Button>

                    {API_MOCK_ENABLED && (
                        <Text size="xs" tone="muted">
                            모의 서버 모드예요. 실제 서버를 부르지 않아요.
                        </Text>
                    )}
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
