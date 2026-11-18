"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge, Button, Section, Text } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import { NemoFace } from "@/components/NemoFace";
import { cn } from "@/lib/cn";
import { clearSession } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";

const rowClassName = (index: number) =>
    cn(
        "sticker-press flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
        index > 0 && "border-ink border-t-2",
    );

/** 프로필 — 네모가 곧 프로필 그림. 사진 없이도 카드가 비어 보이지 않는다 */
export function ProfileCard() {
    const session = useSession();

    return (
        <section className="sticker flex items-center gap-3 rounded-nemo bg-paper px-4 py-4">
            <div className="shrink-0">
                <NemoFace size={60} />
            </div>

            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <p className="truncate font-display text-lg leading-tight">
                        {session ? session.user.nickname || session.user.loginId : "게스트"}
                    </p>
                    <Badge size="sm">{session ? "로그인됨" : "로그인 전"}</Badge>
                </div>
                {/* 동기화가 생기기 전까지는 로그인해도 기록이 서버로 가지 않는다 — 그렇게 보이지 않게 적는다 */}
                <p className="mt-0.5 text-[12px] text-ink-soft">
                    {session
                        ? "기록한 물건은 아직 이 기기에만 저장돼요. 계정에 올리는 기능은 준비 중이에요."
                        : "기록한 물건은 이 기기에만 저장돼요."}
                </p>
            </div>
        </section>
    );
}

export interface AccountSectionProps {
    /** 로그인 전에 보이는 진입점 */
    guestLinks: readonly { href: string; label: string; hint: string }[];
}

/** 계정 — 로그인 전에는 로그인·회원가입으로 가는 길, 로그인한 뒤에는 아이디와 로그아웃 */
export function AccountSection({ guestLinks }: AccountSectionProps) {
    const session = useSession();
    const [isConfirming, setIsConfirming] = useState(false);

    if (!session) {
        return (
            <Section title="계정" titleClassName="scribble">
                <div className="sticker overflow-hidden rounded-nemo bg-paper">
                    {guestLinks.map((link, index) => (
                        <Link key={link.href} href={link.href} className={rowClassName(index)}>
                            <span className="min-w-0">
                                <span className="block text-sm font-bold">{link.label}</span>
                                <span className="block text-xs text-ink-soft">{link.hint}</span>
                            </span>
                            <i className="xi-angle-right-min text-lg text-ink-soft" aria-hidden="true" />
                        </Link>
                    ))}
                </div>
            </Section>
        );
    }

    return (
        <Section title="계정" titleClassName="scribble">
            <div className="sticker overflow-hidden rounded-nemo bg-paper">
                <div className="px-4 py-3">
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{session.user.loginId}</span>
                        <span className="block text-xs text-ink-soft">로그인한 아이디</span>
                    </span>
                </div>
                <button type="button" onClick={() => setIsConfirming(true)} className={rowClassName(1)}>
                    <span className="min-w-0">
                        <span className="block text-sm font-bold">로그아웃</span>
                        <span className="block text-xs text-ink-soft">기록한 물건은 이 기기에 그대로 남아요</span>
                    </span>
                    <i className="xi-angle-right-min text-lg text-ink-soft" aria-hidden="true" />
                </button>
            </div>

            <Modal
                open={isConfirming}
                onClose={() => setIsConfirming(false)}
                title="로그아웃할까요?"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsConfirming(false)}>
                            취소
                        </Button>
                        <Button
                            onClick={() => {
                                clearSession();
                                setIsConfirming(false);
                            }}
                        >
                            로그아웃
                        </Button>
                    </>
                }
            >
                <Text size="sm">기록한 물건과 사진은 지워지지 않고 이 기기에 그대로 남아요.</Text>
            </Modal>
        </Section>
    );
}
