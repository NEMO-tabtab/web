"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* 손그림 라인 아이콘 — stroke 기반. 활성 상태는 색이 아니라 획 두께로 표현한다. */
function IconHome({ active }: { active: boolean }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 11 L12 4 L20 11 M6 10 V19 Q6 20 7 20 H17 Q18 20 18 19 V10"
                stroke="currentColor"
                strokeWidth={active ? 2.6 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconProduct({ active }: { active: boolean }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 8.5 L12 4.5 L20 8.5 L20 17 L12 21 L4 17 Z"
                stroke="currentColor"
                strokeWidth={active ? 2.6 : 2}
                strokeLinejoin="round"
            />
            <path d="M4 8.5 L12 12.5 L20 8.5 M12 12.5 V21" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}

function IconAdd({ active }: { active: boolean }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth={active ? 2.6 : 2} />
            <path d="M12 8.5 V15.5 M8.5 12 H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function IconAnalysis({ active }: { active: boolean }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 19 H20" stroke="currentColor" strokeWidth={active ? 2.6 : 2} strokeLinecap="round" />
            <path
                d="M5.5 15 Q9 9.5 12.5 12 T19 5.5"
                stroke="currentColor"
                strokeWidth={active ? 2.6 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconMy({ active }: { active: boolean }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth={active ? 2.6 : 2} />
            <path
                d="M5 20 C5.5 16 8.5 14.5 12 14.5 C15.5 14.5 18.5 16 19 20"
                stroke="currentColor"
                strokeWidth={active ? 2.6 : 2}
                strokeLinecap="round"
            />
        </svg>
    );
}

const TABS = [
    { href: "/", label: "홈", Icon: IconHome },
    { href: "/product", label: "제품", Icon: IconProduct },
    { href: "/product/add", label: "등록", Icon: IconAdd },
    { href: "/analysis", label: "분석", Icon: IconAnalysis },
    { href: "/user-info", label: "마이", Icon: IconMy },
];

/** 몰입 플로우 — 내비를 숨긴다 (등록 저장 바·스캐너와의 충돌 방지) */
const IMMERSIVE = ["/product/add", "/product/edit", "/barcode"];

export interface BottomNavigationProps {
    /** 문서 페이지에서 흐름 안에 전시할 때 — fixed 대신 relative 로 둔다. */
    preview?: boolean;
}

export default function BottomNavigation({ preview = false }: BottomNavigationProps) {
    const pathname = usePathname();

    if (!preview && IMMERSIVE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

    const isActive = (href: string) => {
        if (preview) return href === "/";
        if (href === "/") return pathname === "/";
        if (href === "/product") return pathname === "/product";
        return pathname.startsWith(href);
    };

    /* 좁은 화면 = 화면 최하단 고정 탭 바.
       넓은 화면 = 왼쪽 세로 레일 — 흐름 안에 들어가 본문이 남는 가로 공간을 그대로 쓴다.
       레일 모드는 static이 아니라 relative — 물결 ::before(absolute)가 내비 자신을
       기준으로 잡혀야 오른쪽 -3px이 레일 경계에 붙는다. */
    return (
        <nav
            aria-label="주요 메뉴"
            className={
                preview
                    ? "wavy-edge bg-paper relative w-full"
                    : "wavy-edge pb-safe bg-paper fixed inset-x-0 bottom-0 z-40 sm:relative sm:inset-x-auto sm:w-[92px] sm:shrink-0 sm:pb-0"
            }
        >
            <div
                className={
                    preview
                        ? "flex"
                        : "flex sm:sticky sm:top-0 sm:h-dvh sm:flex-col sm:justify-center sm:gap-2 sm:pr-1.5"
                }
            >
                {TABS.map(({ href, label, Icon }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-current={active ? "page" : undefined}
                            className={`flex flex-1 flex-col items-center gap-0.5 pt-2 pb-2.5 text-[10.5px] sm:flex-none sm:gap-1 sm:py-3 sm:text-[11.5px] ${
                                active ? "text-ink font-bold" : "text-ink-soft"
                            }`}
                        >
                            <Icon active={active} />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
