"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { NemoLogo } from "@/components/NemoLogo";
import { Button, Card, Divider, Heading, Input, RadioGroup } from "@/components/common";

const GENDER_OPTIONS = [
    { value: "M", label: "남자" },
    { value: "F", label: "여자" },
] as const;

export default function SignupPage() {
    const router = useRouter();

    const [dataForm, setForm] = useState({
        loginId: "",
        password: "",
        name: "",
        nickname: "",
        email: "",
        gender: "",
        zipcode: "",
        address: "",
        addressSub: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...dataForm,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const formData = new FormData();

            Object.entries(dataForm).forEach(([key, value]) => {
                formData.append(key, value as string);
            });

            const res = await fetch("http://localhost:8080/api/user/insert", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("회원가입 실패");
            }

            router.push("/login");
        } catch (err) {
            console.log(err);
            setError("회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
            <Card padding="md" className="w-full max-w-md space-y-6">
                {/* 로그인 화면과 같은 표지 — 심볼 로고 + 낙서 밑줄 제목 */}
                <div className="flex flex-col items-center gap-3">
                    <NemoLogo size={72} />
                    <Heading level={1} className="scribble">
                        회원가입
                    </Heading>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 계정 정보 */}
                    <div className="space-y-4">
                        <Input
                            id="signup-id"
                            name="loginId"
                            label="아이디"
                            onChange={handleChange}
                            autoComplete="username"
                        />
                        <Input
                            id="signup-password"
                            type="password"
                            name="password"
                            label="비밀번호"
                            onChange={handleChange}
                            autoComplete="new-password"
                        />

                        {/* 짧은 칸 둘은 한 줄로 묶는다 — 좁은 화면에서는 그대로 세로로 쌓인다 */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                id="signup-name"
                                name="name"
                                label="이름"
                                onChange={handleChange}
                                autoComplete="name"
                            />
                            <Input
                                id="signup-nickname"
                                name="nickname"
                                label="닉네임"
                                onChange={handleChange}
                                autoComplete="nickname"
                            />
                        </div>

                        <Input
                            id="signup-email"
                            type="email"
                            name="email"
                            label="이메일"
                            placeholder="nemo@example.com"
                            onChange={handleChange}
                            autoComplete="email"
                        />

                        <RadioGroup
                            name="gender"
                            label="성별"
                            options={GENDER_OPTIONS}
                            value={dataForm.gender}
                            onChange={handleChange}
                        />
                    </div>

                    {/* 주소 묶음 — 옅은 구분선에 라벨을 걸어 구역만 나눈다 */}
                    <Divider label="주소" />

                    <div className="space-y-4">
                        <Input
                            id="signup-zipcode"
                            name="zipcode"
                            label="우편번호"
                            placeholder="12345"
                            inputMode="numeric"
                            onChange={handleChange}
                            autoComplete="postal-code"
                        />
                        <Input
                            id="signup-address"
                            name="address"
                            label="주소"
                            onChange={handleChange}
                            autoComplete="address-line1"
                        />
                        <Input
                            id="signup-address-sub"
                            name="addressSub"
                            label="상세주소"
                            placeholder="동·호수"
                            onChange={handleChange}
                            autoComplete="address-line2"
                        />
                    </div>

                    {/* 가입 실패는 폼 전체의 문제라 마지막 칸이 아니라 제출 버튼 바로 위에서 알린다 */}
                    {error && (
                        <p id="signup-error" role="alert" className="text-danger text-[13px] font-bold">
                            {error}
                        </p>
                    )}

                    <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
                        {isSubmitting ? "만드는 중…" : "회원가입"}
                    </Button>
                </form>

                {/* 로그인으로 돌아가기는 보조 동작 — 텍스트 링크로 둔다 */}
                <p className="text-ink-soft text-center text-[13px]">
                    이미 계정이 있나요?{" "}
                    <Link href="/login" className="text-ink font-bold underline underline-offset-4">
                        로그인
                    </Link>
                </p>
            </Card>
        </main>
    );
}
