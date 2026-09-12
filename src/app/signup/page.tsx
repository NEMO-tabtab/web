"use client";

import Script from "next/script";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

        // 전체 유효성 검사
        if (!validate()) {
            alert("입력 내용을 확인해주세요.");
            return;
        }

        try {
            const { ...dto } = dataForm;

            console.log("회원가입 요청 DTO:", dto);

            const formData = new FormData();

            formData.append(
                "dto",
                new Blob([JSON.stringify(dto)], {
                    type: "application/json",
                }),
            );

            const res = await fetch("https://nemo-api.onrender.com/api/user/insert", {
                method: "POST",
                body: formData,
            });

            console.log("회원가입 응답 status:", res.status);

            if (!res.ok) {
                const errorText = await res.text();

                console.error("회원가입 서버 오류:", errorText);

                alert(`회원가입 실패 (${res.status})`);

                return;
            }

            alert("회원가입이 완료되었습니다.");

            router.push("/login");
        } catch (error) {
            console.error("회원가입 요청 오류:", error);

            alert("회원가입 중 오류가 발생했습니다.");
        }
    };

    const inputClass = (error?: string) =>
        `w-full rounded-lg border p-3 outline-none transition ${
            error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-black"
        }`;

    return (
        <>
            <Script
                src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="afterInteractive"
            />

            <div className="flex min-h-screen items-center justify-center bg-gray-100 py-10">
                <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
                    <h1 className="mb-6 text-center text-2xl font-bold">회원가입</h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* 아이디 */}
                        <div>
                            <input
                                name="loginId"
                                value={dataForm.loginId}
                                placeholder="아이디"
                                onChange={handleChange}
                                className={inputClass(errors.loginId)}
                            />

                            {errors.loginId && <p className="mt-1 text-sm text-red-500">{errors.loginId}</p>}
                        </div>

                        {/* 비밀번호 */}
                        <div>
                            <input
                                type="password"
                                name="password"
                                value={dataForm.password}
                                placeholder="비밀번호"
                                onChange={handleChange}
                                className={inputClass(errors.password)}
                            />

                            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                        </div>

                        {/* 비밀번호 확인 */}
                        <div>
                            <input
                                type="password"
                                name="passwordConfirm"
                                value={dataForm.passwordConfirm}
                                placeholder="비밀번호 확인"
                                onChange={handleChange}
                                className={inputClass(errors.passwordConfirm)}
                            />

                            {errors.passwordConfirm ? (
                                <p className="mt-1 text-sm text-red-500">{errors.passwordConfirm}</p>
                            ) : (
                                dataForm.passwordConfirm &&
                                dataForm.password === dataForm.passwordConfirm && (
                                    <p className="mt-1 text-sm text-green-600">✓ 비밀번호가 일치합니다.</p>
                                )
                            )}
                        </div>

                        {/* 이름 */}
                        <div>
                            <input
                                name="name"
                                value={dataForm.name}
                                placeholder="이름"
                                onChange={handleChange}
                                className={inputClass(errors.name)}
                            />

                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                        </div>

                        {/* 닉네임 */}
                        <div>
                            <input
                                name="nickname"
                                value={dataForm.nickname}
                                placeholder="닉네임"
                                onChange={handleChange}
                                className={inputClass(errors.nickname)}
                            />

                            {errors.nickname && <p className="mt-1 text-sm text-red-500">{errors.nickname}</p>}
                        </div>

                        {/* 이메일 */}
                        <div>
                            <input
                                type="email"
                                name="email"
                                value={dataForm.email}
                                placeholder="이메일"
                                onChange={handleChange}
                                className={inputClass(errors.email)}
                            />

                            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                        </div>

                        {/* 성별 */}
                        <div>
                            <p className="mb-2 font-medium">성별</p>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="M"
                                        checked={dataForm.gender === "M"}
                                        onChange={handleChange}
                                    />
                                    남자
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="F"
                                        checked={dataForm.gender === "F"}
                                        onChange={handleChange}
                                    />
                                    여자
                                </label>
                            </div>

                            {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender}</p>}
                        </div>

                        {/* 우편번호 */}
                        <div>
                            <div className="flex gap-2">
                                <input
                                    name="zipcode"
                                    value={dataForm.zipcode}
                                    placeholder="우편번호"
                                    readOnly
                                    className={`w-full rounded-lg border bg-gray-50 p-3 ${
                                        errors.zipcode ? "border-red-500" : "border-gray-300"
                                    }`}
                                />

                                <button
                                    type="button"
                                    onClick={handleAddressSearch}
                                    className="whitespace-nowrap rounded-lg bg-gray-800 px-4 font-medium text-white hover:bg-gray-700"
                                >
                                    주소검색
                                </button>
                            </div>

                            {errors.zipcode && <p className="mt-1 text-sm text-red-500">{errors.zipcode}</p>}
                        </div>

                        {/* 주소 */}
                        <div>
                            <input
                                name="address"
                                value={dataForm.address}
                                placeholder="주소"
                                readOnly
                                onClick={handleAddressSearch}
                                className={`w-full cursor-pointer rounded-lg border bg-gray-50 p-3 ${
                                    errors.address ? "border-red-500" : "border-gray-300"
                                }`}
                            />

                            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                        </div>

                        {/* 상세주소 */}
                        <div>
                            <input
                                name="addressSub"
                                value={dataForm.addressSub}
                                placeholder="상세주소"
                                onChange={handleChange}
                                className={inputClass(errors.addressSub)}
                            />

                            {errors.addressSub && <p className="mt-1 text-sm text-red-500">{errors.addressSub}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-black py-3 font-bold text-white transition hover:bg-gray-800"
                        >
                            회원가입
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
