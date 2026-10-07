import React from "react";

import SidebarNav from "./_components/SidebarNav";
import { NemoLogo } from "@/components/NemoLogo";

/**
 * 문서 셸. `/design-system` 은 루트 크롬(하단 내비)이 꺼져 있어 화면 전체를 쓴다.
 *
 * 넓은 화면 = 왼쪽 세로 레일, 좁은 화면 = 상단 스트립.
 * 레일 경계는 직선 보더 대신 `.wavy-edge` — 640px 이상에서 오른쪽 세로 물결이 그려진다.
 * 물결(::before)이 레일 바깥 -3px 에 얹히므로 스크롤(overflow)은 안쪽 div 가 맡는다.
 */
export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-paper text-ink flex min-h-dvh w-full">
            <aside className="wavy-edge bg-paper hidden w-64 shrink-0 lg:block">
                <div className="sticky top-0 max-h-dvh overflow-y-auto p-6">
                    <div className="mb-8 flex items-center gap-2.5">
                        <NemoLogo size={36} />
                        <div>
                            <p className="font-display text-2xl leading-tight">NEMO</p>
                            <p className="text-ink-soft text-[11px]">Design System</p>
                        </div>
                    </div>
                    <SidebarNav />
                </div>
            </aside>

            {/* 좁은 화면: 레일 대신 상단 스트립 — 먹선으로 본문과 끊는다 */}
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="border-ink bg-paper border-b-2 p-4 lg:hidden">
                    <div className="flex items-center gap-2">
                        <NemoLogo size={28} />
                        <p className="font-display text-xl leading-tight">NEMO Design System</p>
                    </div>
                    <div className="mt-3 overflow-x-auto">
                        <SidebarNav />
                    </div>
                </div>

                <main className="flex-1 px-4 py-8 lg:px-12 lg:py-12">
                    <div className="mx-auto max-w-4xl">{children}</div>
                </main>
            </div>
        </div>
    );
}
