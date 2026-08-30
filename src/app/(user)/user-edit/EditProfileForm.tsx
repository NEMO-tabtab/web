"use client";

import Image from "next/image";
import { useState } from "react";

import { Button, Card, Input, PageHeader, PageShell, RadioGroup, Section } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import { cn } from "@/lib/cn";

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

const GENDER_OPTIONS = [
    { value: "M", label: "남성" },
    { value: "W", label: "여성" },
] as const;

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
    const [status, setStatus] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setStatus(null);
        setIsSubmitting(true);

        try {
            const res = await fetch(`http://3.38.247.4:8080/api/user/modify`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            setStatus(
                res.ok
                    ? { tone: "success", message: "회원 정보가 수정되었습니다." }
                    : { tone: "danger", message: "수정에 실패했습니다. 다시 시도해주세요." },
            );
        } catch {
            setStatus({ tone: "danger", message: "수정에 실패했습니다. 다시 시도해주세요." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageShell className="space-y-6">
            <PageHeader title="프로필 수정" description="내 정보를 최신 상태로 유지하세요." backHref="/user-info" />

            {/* 프로필 사진 — 옅은 면 위에 얹은 오브제. 인쇄 질감으로 종이 톤을 맞춘다 */}
            <section className="flex flex-col items-center gap-2.5">
                <div className="relative">
                    <div className="sticker bg-cream relative size-28 overflow-hidden rounded-full md:size-32">
                        <Image
                            src="https://placehold.co/200x200.jpg"
                            width={200}
                            height={200}
                            className="h-full w-full object-cover"
                            alt="프로필 이미지"
                        />
                        <span aria-hidden="true" className="print-grain" />
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        shape="circle"
                        size="sm"
                        aria-label="프로필 이미지 변경"
                        className="absolute right-0 bottom-0"
                        leftIcon={<i className="xi-pen" aria-hidden="true" />}
                    />
                </div>
                {/* 이름만 손글씨 — 아래 입력값은 전부 본문 서체를 유지한다 */}
                <p className="font-display text-lg leading-tight">{form.name}</p>
            </section>

            <Section title="기본 정보" titleClassName="scribble">
                <Card padding="sm" className="space-y-4">
                    <Input
                        id="profile-nickname"
                        name="nickname"
                        label="이름 (닉네임)"
                        required
                        value={form.nickname}
                        onChange={handleChange}
                        placeholder="닉네임"
                    />
                    <Input
                        id="profile-email"
                        type="email"
                        name="email"
                        label="이메일"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="이메일"
                    />
                    <RadioGroup
                        name="gender"
                        label="성별"
                        options={GENDER_OPTIONS}
                        value={form.gender}
                        onChange={handleChange}
                    />
                </Card>
            </Section>

            <Section title="주소" titleClassName="scribble">
                <Card padding="sm" className="space-y-4">
                    <Input
                        id="profile-zipcode"
                        name="zipcode"
                        label="우편번호"
                        inputMode="numeric"
                        value={form.zipcode}
                        onChange={handleChange}
                        placeholder="우편번호"
                    />
                    <Input
                        id="profile-address"
                        name="address"
                        label="주소"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="주소"
                    />
                    <Input
                        id="profile-address-sub"
                        name="addressSub"
                        label="상세 주소"
                        value={form.addressSub}
                        onChange={handleChange}
                        placeholder="상세 주소"
                    />
                </Card>
            </Section>

            {/* 결과 알림 — 성공은 색 없이 먹선 스티커, 실패만 danger 를 쓴다.
                `.sticker` 는 레이어 밖 규칙이라 border-color 유틸리티를 이긴다. `!` 로 되돌린다. */}
            {status && (
                <p
                    role="status"
                    className={cn(
                        "sticker rounded-nemo bg-paper px-4 py-3 text-sm font-bold",
                        status.tone === "danger" && "!border-danger text-danger",
                    )}
                >
                    {status.message}
                </p>
            )}

            <div className="flex gap-3">
                <Button type="button" variant="secondary" size="lg" fullWidth onClick={() => window.history.back()}>
                    취소
                </Button>
                <Button type="button" size="lg" fullWidth onClick={handleSubmit} isLoading={isSubmitting}>
                    저장
                </Button>
            </div>

            <div className="text-center">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowModal(true)}>
                    개인정보처리방침
                </Button>
            </div>

            <Modal open={showModal} onClose={() => setShowModal(false)} title="개인정보처리방침">
                <div className="text-ink space-y-2 text-sm">
                    <p>- 수집 항목: 이름, 이메일, 주소 등</p>
                    <p>- 보유 기간: 회원 탈퇴 시까지</p>
                </div>
            </Modal>
        </PageShell>
    );
}
