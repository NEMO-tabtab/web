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
        userIdx: 1,
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
            <section className="mt-6 flex flex-col items-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-600 md:h-[200px] md:w-[200px]">
                    <Image
                        src="https://placehold.co/200x200.jpg"
                        width={200}
                        height={200}
                        className="h-full w-full rounded-full"
                        alt="프로필 이미지"
                    />
                    <button className="absolute bottom-0 right-0 h-6 w-6 rounded-full border border-gray-300 bg-white text-xs md:h-12 md:w-12">
                        <i className="xi-pen md:text-2xl" />
                    </button>
                </div>
                <div className="mt-2 text-lg font-semibold">{form.name}</div>
            </section>

            {/* 수정 폼 */}
            <form className="my-12 space-y-4 px-6">
                <label className="mb-1 block font-medium">
                    이름 (닉네임) <span className="text-red-500">*</span>{" "}
                </label>
                <input
                    type="text"
                    name="nickname"
                    value={form.nickname}
                    onChange={handleChange}
                    placeholder="닉네임"
                    className="h-10 w-full rounded bg-gray-200 px-3"
                />
                <label className="mb-1 block font-medium">
                    이메일 <span className="text-red-500">*</span>{" "}
                </label>
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="이메일"
                    className="h-10 w-full rounded bg-gray-200 px-3"
                />
                <div>
                    <label className="mb-1 block font-medium">성별</label>
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
                    className="h-10 w-full rounded bg-gray-200 px-3"
                />
                <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="주소"
                    className="h-10 w-full rounded bg-gray-200 px-3"
                />
                <input
                    type="text"
                    name="addressSub"
                    value={form.addressSub}
                    onChange={handleChange}
                    placeholder="상세 주소"
                    className="h-10 w-full rounded bg-gray-200 px-3"
                />
            </form>

            {/* 버튼 */}
            <div className="mt-4 flex justify-around space-x-4 px-6">
                <button type="button" onClick={handleSubmit} className="h-12 flex-1 rounded bg-gray-200 font-semibold">
                    저장
                </button>
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="h-12 flex-1 rounded bg-gray-200 font-semibold"
                >
                    취소
                </button>
            </div>

            {/* 개인정보처리방침 모달 */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="relative w-[90%] max-w-md rounded-lg bg-white p-6">
                        <h2 className="mb-4 text-lg font-bold">개인정보처리방침</h2>
                        <div className="h-60 overflow-y-auto text-sm">
                            <p>- 수집 항목: 이름, 이메일, 주소 등</p>
                            <p>- 보유 기간: 회원 탈퇴 시까지</p>
                        </div>
                        <button onClick={toggleModal} className="absolute right-3 top-2 text-xl text-gray-500">
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
