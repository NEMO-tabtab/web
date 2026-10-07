"use client";

import Script from "next/script";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { NemoLogo } from "@/components/NemoLogo";
import { Button, Card, Divider, Heading, Input, RadioGroup } from "@/components/common";

const GENDER_OPTIONS = [
    { value: "M", label: "남자" },
    { value: "F", label: "여자" },
] as const;

type FormType = {
    loginId: string;
    password: string;
    passwordConfirm: string;
    name: string;
    nickname: string;
    email: string;
    gender: string;
    zipcode: string;
    address: string;
    addressSub: string;
};

interface DaumPostcodeData {
    userSelectedType: "R" | "J";
    roadAddress: string;
    jibunAddress: string;
    zonecode: string;
}

interface DaumPostcodeOptions {
    oncomplete: (data: DaumPostcodeData) => void;
}

declare global {
    interface Window {
        daum?: {
            Postcode: new (options: DaumPostcodeOptions) => {
                open: () => void;
            };
        };
    }
}
type ErrorType = Partial<Record<keyof FormType, string>>;

export default function SignupPage() {
    const router = useRouter();

    const [dataForm, setForm] = useState<FormType>({
        loginId: "",
        password: "",
        passwordConfirm: "",
        name: "",
        nickname: "",
        email: "",
        gender: "",
        zipcode: "",
        address: "",
        addressSub: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<ErrorType>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        const errorMessage = validateField(name as keyof FormType, value);

        setErrors((prev) => ({
            ...prev,
            [name]: errorMessage,

            ...(name === "password" && dataForm.passwordConfirm
                ? {
                      passwordConfirm: value === dataForm.passwordConfirm ? "" : "비밀번호가 일치하지 않습니다.",
                  }
                : {}),
        }));
    };

    const validateField = (name: keyof FormType, value: string) => {
        let message = "";

        switch (name) {
            case "loginId":
                if (!value.trim()) {
                    message = "아이디를 입력해주세요.";
                } else if (value.length < 4) {
                    message = "아이디는 4자 이상 입력해주세요.";
                } else if (value.length > 20) {
                    message = "아이디는 20자 이하로 입력해주세요.";
                } else if (!/^[a-zA-Z0-9]+$/.test(value)) {
                    message = "아이디는 영문과 숫자만 사용할 수 있습니다.";
                }
                break;

            case "password":
                if (!value) {
                    message = "비밀번호를 입력해주세요.";
                } else if (value.length < 8) {
                    message = "비밀번호는 8자 이상 입력해주세요.";
                } else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value)) {
                    message = "비밀번호는 영문과 숫자를 포함해야 합니다.";
                }
                break;

            case "passwordConfirm":
                if (!value) {
                    message = "비밀번호 확인을 입력해주세요.";
                } else if (value !== dataForm.password) {
                    message = "비밀번호가 일치하지 않습니다.";
                }
                break;

            case "name":
                if (!value.trim()) {
                    message = "이름을 입력해주세요.";
                }
                break;

            case "nickname":
                if (!value.trim()) {
                    message = "닉네임을 입력해주세요.";
                } else if (value.length < 2) {
                    message = "닉네임은 2자 이상 입력해주세요.";
                } else if (value.length > 12) {
                    message = "닉네임은 12자 이하로 입력해주세요.";
                }
                break;

            case "email":
                if (!value.trim()) {
                    message = "이메일을 입력해주세요.";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    message = "올바른 이메일 형식이 아닙니다.";
                }
                break;

            case "addressSub":
                if (!value.trim()) {
                    message = "상세주소를 입력해주세요.";
                }
                break;
        }

        return message;
    };

    const validate = () => {
        const newErrors: ErrorType = {};

        // 아이디
        if (!dataForm.loginId.trim()) {
            newErrors.loginId = "아이디를 입력해주세요.";
        } else if (dataForm.loginId.length < 4) {
            newErrors.loginId = "아이디는 4자 이상 입력해주세요.";
        } else if (dataForm.loginId.length > 20) {
            newErrors.loginId = "아이디는 20자 이하로 입력해주세요.";
        } else if (!/^[a-zA-Z0-9]+$/.test(dataForm.loginId)) {
            newErrors.loginId = "아이디는 영문과 숫자만 사용할 수 있습니다.";
        }

        // 비밀번호
        if (!dataForm.password) {
            newErrors.password = "비밀번호를 입력해주세요.";
        } else if (dataForm.password.length < 8) {
            newErrors.password = "비밀번호는 8자 이상 입력해주세요.";
        } else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(dataForm.password)) {
            newErrors.password = "비밀번호는 영문과 숫자를 포함해야 합니다.";
        }

        // 비밀번호 확인
        if (!dataForm.passwordConfirm) {
            newErrors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
        } else if (dataForm.password !== dataForm.passwordConfirm) {
            newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
        }

        // 이름
        if (!dataForm.name.trim()) {
            newErrors.name = "이름을 입력해주세요.";
        }

        // 닉네임
        if (!dataForm.nickname.trim()) {
            newErrors.nickname = "닉네임을 입력해주세요.";
        } else if (dataForm.nickname.length < 2) {
            newErrors.nickname = "닉네임은 2자 이상 입력해주세요.";
        } else if (dataForm.nickname.length > 12) {
            newErrors.nickname = "닉네임은 12자 이하로 입력해주세요.";
        }

        // 이메일
        if (!dataForm.email.trim()) {
            newErrors.email = "이메일을 입력해주세요.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dataForm.email)) {
            newErrors.email = "올바른 이메일 형식이 아닙니다.";
        }

        // 성별
        if (!dataForm.gender) {
            newErrors.gender = "성별을 선택해주세요.";
        }

        // 주소
        if (!dataForm.zipcode) {
            newErrors.zipcode = "주소를 검색해주세요.";
        }

        if (!dataForm.address) {
            newErrors.address = "주소를 검색해주세요.";
        }

        if (!dataForm.addressSub.trim()) {
            newErrors.addressSub = "상세주소를 입력해주세요.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleAddressSearch = () => {
        if (!window.daum) {
            alert("주소 검색 서비스를 불러오는 중입니다.");
            return;
        }

        new window.daum.Postcode({
            oncomplete: function (data: DaumPostcodeData) {
                let address = "";

                if (data.userSelectedType === "R") {
                    address = data.roadAddress;
                } else {
                    address = data.jibunAddress;
                }

                setForm((prev) => ({
                    ...prev,
                    zipcode: data.zonecode,
                    address,
                }));

                setErrors((prev) => ({
                    ...prev,
                    zipcode: "",
                    address: "",
                }));
            },
        }).open();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 전체 유효성 검사 — 통과하기 전에 제출 상태로 올리면
        // 여기서 빠져나갈 때 버튼이 로딩인 채로 영영 잠긴다.
        if (!validate()) {
            alert("입력 내용을 확인해주세요.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { ...dto } = dataForm;
            const formData = new FormData();

            formData.append(
                "dto",
                new Blob([JSON.stringify(dto)], {
                    type: "application/json",
                }),
            );

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/insert`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorText = await res.text();

                console.error("회원가입 서버 오류:", errorText);

                alert(`회원가입 실패 (${res.status})`);

                return;
            }

            alert("회원가입이 완료되었습니다.");

            router.push("/login");
        } catch (err) {
            console.error("회원가입 요청 오류:", err);

            alert("회원가입 중 오류가 발생했습니다.");
        } finally {
            // !res.ok 로 빠지는 길도 여기를 지난다 — 버튼을 반드시 되돌린다.
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* handleAddressSearch 가 window.daum 을 찾는다 — 이 스크립트가 빠지면 주소 검색이 통째로 죽는다 */}
            <Script
                src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="afterInteractive"
            />

            <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
                <Card padding="md" className="w-full max-w-md space-y-6">
                    {/* 로그인 화면과 같은 표지 — 심볼 로고 + 낙서 밑줄 제목 */}
                    <div className="flex flex-col items-center gap-3">
                        <NemoLogo size={72} />
                        <Heading level={1} className="scribble">
                            회원가입
                        </Heading>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* 계정 정보 */}
                        <div className="space-y-4">
                            <Input
                                id="signup-id"
                                name="loginId"
                                label="아이디"
                                placeholder="영문·숫자 4~20자"
                                value={dataForm.loginId}
                                onChange={handleChange}
                                error={errors.loginId}
                                autoComplete="username"
                            />
                            <Input
                                id="signup-password"
                                type="password"
                                name="password"
                                label="비밀번호"
                                value={dataForm.password}
                                onChange={handleChange}
                                error={errors.password}
                                hint="영문과 숫자를 섞어 8자 이상"
                                autoComplete="new-password"
                            />
                            <Input
                                id="signup-password-confirm"
                                type="password"
                                name="passwordConfirm"
                                label="비밀번호 확인"
                                value={dataForm.passwordConfirm}
                                onChange={handleChange}
                                error={errors.passwordConfirm}
                                /* 일치 신호는 초록이 아니라 먹 — 이 시스템의 유일한 포인트 컬러는 볼터치다 */
                                hint={
                                    dataForm.passwordConfirm && dataForm.password === dataForm.passwordConfirm
                                        ? "비밀번호가 일치합니다."
                                        : undefined
                                }
                                autoComplete="new-password"
                            />

                            {/* 짧은 칸 둘은 한 줄로 묶는다 — 좁은 화면에서는 그대로 세로로 쌓인다 */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    id="signup-name"
                                    name="name"
                                    label="이름"
                                    value={dataForm.name}
                                    onChange={handleChange}
                                    error={errors.name}
                                    autoComplete="name"
                                />
                                <Input
                                    id="signup-nickname"
                                    name="nickname"
                                    label="닉네임"
                                    value={dataForm.nickname}
                                    onChange={handleChange}
                                    error={errors.nickname}
                                    autoComplete="nickname"
                                />
                            </div>

                            <Input
                                id="signup-email"
                                type="email"
                                name="email"
                                label="이메일"
                                placeholder="nemo@example.com"
                                value={dataForm.email}
                                onChange={handleChange}
                                error={errors.email}
                                autoComplete="email"
                            />

                            <RadioGroup
                                name="gender"
                                label="성별"
                                options={GENDER_OPTIONS}
                                value={dataForm.gender}
                                onChange={handleChange}
                                error={errors.gender}
                            />
                        </div>

                        {/* 주소 묶음 — 옅은 구분선에 라벨을 걸어 구역만 나눈다 */}
                        <Divider label="주소" />

                        <div className="space-y-4">
                            <div className="flex items-end gap-2">
                                <div className="min-w-0 flex-1">
                                    <Input
                                        id="signup-zipcode"
                                        name="zipcode"
                                        label="우편번호"
                                        placeholder="검색으로 채워집니다"
                                        value={dataForm.zipcode}
                                        onClick={handleAddressSearch}
                                        readOnly
                                        className="cursor-pointer"
                                        autoComplete="postal-code"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleAddressSearch}
                                    className="shrink-0"
                                >
                                    주소검색
                                </Button>
                            </div>

                            <Input
                                id="signup-address"
                                name="address"
                                label="주소"
                                placeholder="검색으로 채워집니다"
                                value={dataForm.address}
                                onClick={handleAddressSearch}
                                readOnly
                                className="cursor-pointer"
                                autoComplete="address-line1"
                            />

                            {/* 우편번호와 주소는 검색 한 번에 같이 채워진다 —
                                오류도 칸마다가 아니라 묶음 하나로 알린다.
                                (검색 버튼이 낀 줄에서는 칸 안의 오류 문구가 버튼 정렬을 밀어낸다) */}
                            {(errors.zipcode || errors.address) && (
                                <p className="text-danger text-xs">{errors.zipcode || errors.address}</p>
                            )}

                            <Input
                                id="signup-address-sub"
                                name="addressSub"
                                label="상세주소"
                                placeholder="동·호수"
                                value={dataForm.addressSub}
                                onChange={handleChange}
                                error={errors.addressSub}
                                autoComplete="address-line2"
                            />
                        </div>

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
        </>
    );
}
