"use client";

import { useState } from "react";
import Image from "next/image";

type User = {
    userIdx: number;
    name: string;
    nickname: string;
    email: string;
    gender: string;
    zipcode: string;
    address: string;
    addressSub: string;
};

export default function EditProfileForm({ user }: { user: User }) {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        // 유저 인덱스 정보 하드코딩된거 페이지 연결 다 되고나면 처리해줘야함!!
        userIdx: 36,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        gender: user.gender,
        zipcode: user.zipcode,
        address: user.address,
        addressSub: user.addressSub,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const toggleModal = () => setShowModal((prev) => !prev);

    const handleSubmit = async () => {
        const res = await fetch(`http://localhost:8080/api/user/modify`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        if (res.ok) {
            alert("회원 정보가 수정되었습니다!");
        } else {
            alert("수정 실패. 다시 시도해주세요.");
        }
    };

    return (
        <div className="container-1280 px">
            {/* 프로필 이미지 */}
            <section className="flex flex-col items-center mt-6">
                <div className="relative md:w-[200px] md:h-[200px] w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                    <Image
                        src="https://placehold.co/200x200.jpg"
                        width={200}
                        height={200}
                        className="w-full h-full rounded-full"
                        alt="프로필 이미지"
                    />
                    <button className="absolute bottom-0 right-0 md:w-12 md:h-12 w-6 h-6 bg-white border border-gray-300 rounded-full text-xs">
                        <i className="xi-pen md:text-2xl" />
                    </button>
                </div>
                <div className="mt-2 font-semibold text-lg">{form.name}</div>
            </section>

            {/* 수정 폼 */}
            <form className="px-6 my-12 space-y-4">
                <label className="block font-medium mb-1">
                    이름 (닉네임) <span className="text-red-500">*</span>{" "}
                </label>
                <input
                    type="text"
                    name="nickname"
                    value={form.nickname}
                    onChange={handleChange}
                    placeholder="닉네임"
                    className="w-full h-10 bg-gray-200 rounded px-3"
                />
                <label className="block font-medium mb-1">
                    이메일 <span className="text-red-500">*</span>{" "}
                </label>
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="이메일"
                    className="w-full h-10 bg-gray-200 rounded px-3"
                />
                <div>
                    <label className="block font-medium mb-1">성별</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="gender"
                                value="M"
                                checked={form.gender === "M"}
                                onChange={handleChange}
                            />
                            남성
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="gender"
                                value="W"
                                checked={form.gender === "W"}
                                onChange={handleChange}
                            />
                            여성
                        </label>
                    </div>
                </div>

                <input
                    type="text"
                    name="zipcode"
                    value={form.zipcode}
                    onChange={handleChange}
                    placeholder="우편번호"
                    className="w-full h-10 bg-gray-200 rounded px-3"
                />
                <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="주소"
                    className="w-full h-10 bg-gray-200 rounded px-3"
                />
                <input
                    type="text"
                    name="addressSub"
                    value={form.addressSub}
                    onChange={handleChange}
                    placeholder="상세 주소"
                    className="w-full h-10 bg-gray-200 rounded px-3"
                />
            </form>

            {/* 버튼 */}
            <div className="flex justify-around px-6 mt-4 space-x-4">
                <button type="button" onClick={handleSubmit} className="flex-1 h-12 bg-gray-200 rounded font-semibold">
                    저장
                </button>
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="flex-1 h-12 bg-gray-200 rounded font-semibold"
                >
                    취소
                </button>
            </div>

            {/* 개인정보처리방침 모달 */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white w-[90%] max-w-md rounded-lg p-6 relative">
                        <h2 className="text-lg font-bold mb-4">개인정보처리방침</h2>
                        <div className="text-sm h-60 overflow-y-auto">
                            <p>- 수집 항목: 이름, 이메일, 주소 등</p>
                            <p>- 보유 기간: 회원 탈퇴 시까지</p>
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
