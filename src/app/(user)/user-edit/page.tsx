"use client";
import Image from "next/image";
import { useState } from "react";

export default function EditProfilePage() {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: "",
        password: "",
        confirmPassword: "",
        address: "",
        gender: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((pre) => ({ ...pre, [name]: value }));
    };

    const toggleModal = () => setShowModal((pre) => !pre);
    return (
        <div className="container-1280 px">
            <section className="flex flex-col items-center mt-6">
                <div className="relative md:w-[200px] md:h-[200px] w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                    <Image
                        src="https://placehold.co/200x200.jpg"
                        width={200}
                        height={200}
                        className="w-full h-full rounded-full"
                        alt="제품 썸네일"
                    />
                    <button className="absolute  bottom-0 right-0 md:w-12 md:h-12 w-6 h-6 bg-white border border-gray-300 rounded-full text-xs">
                        <i className="xi-pen md:text-2xl" />
                    </button>
                </div>
                <div className="mt-2 font-semibold text-lg">닉네임</div>
            </section>

            <form className="px-6 my-12 space-y-4">
                <div>
                    <label className="block font-medium mb-1">
                        이름 (닉네임) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full h-10 bg-gray-200 rounded px-3"
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">
                        비밀번호 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full h-10 bg-gray-200 rounded px-3"
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">
                        비밀번호 재입력 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className="w-full h-10 bg-gray-200 rounded px-3"
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">주소</label>
                    <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        className="w-full h-10 bg-gray-200 rounded px-3"
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">성별</label>
                    <input
                        type="text"
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        className="w-full h-10 bg-gray-200 rounded px-3"
                    />
                </div>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
                <button onClick={toggleModal} className="underline">
                    개인정보처리방침
                </button>
            </div>

            <div className="flex justify-around px-6 mt-4 space-x-4">
                <button className="flex-1 h-12 bg-gray-200 rounded font-semibold">저장</button>
                <button className="flex-1 h-12 bg-gray-200 rounded font-semibold">취소</button>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white w-[90%] max-w-md rounded-lg p-6 relative">
                        <h2 className="text-lg font-bold mb-4">개인정보처리방침</h2>
                        <div className="text-sm h-60 overflow-y-auto">
                            <p className="mb-2">
                                [예시] 본 서비스는 고객의 개인정보를 안전하게 보호하며, 수집 목적과 보유 기간에 대해
                                아래와 같이 안내합니다.
                            </p>
                            <p className="mb-2">- 수집 항목: 이름, 비밀번호, 주소, 성별 등</p>
                            <p className="mb-2">- 보유 기간: 회원 탈퇴 시까지</p>
                            <p className="mb-2">- 이용 목적: 서비스 제공 및 회원 식별</p>
                        </div>
                        <button onClick={toggleModal} className="absolute top-2 right-3 text-gray-500 text-xl">
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
