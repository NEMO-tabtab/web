"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function BottomNavigation() {
    const pathname = usePathname();

    const navItems = [
        {
            label: "홈",
            href: "/",
            icon: (isActive: boolean) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={isActive ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" stroke={isActive ? "white" : "currentColor"} />
                </svg>
            ),
        },
        {
            label: "등록",
            href: "/product/add",
            icon: (isActive: boolean) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={isActive ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <line x1="12" x2="12" y1="8" y2="16" strokeWidth="2" stroke={isActive ? "white" : "currentColor"} />
                    <line x1="8" x2="16" y1="12" y2="12" strokeWidth="2" stroke={isActive ? "white" : "currentColor"} />
                </svg>
            ),
        },
        {
            label: "마이",
            href: "/user-info",
            icon: (isActive: boolean) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={isActive ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
    ];

    return (
        <nav className="fixed bottom-4 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-2xl border border-white/20 bg-white/80 pb-safe-area-inset-bottom shadow-xl backdrop-blur-xl md:hidden">
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative flex h-full flex-1 flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                                isActive ? "text-brand-600 scale-105" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            {isActive && (
                                <div className="absolute -top-1 h-1 w-8 rounded-full bg-brand-500 transition-all" />
                            )}
                            <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                                {item.icon(isActive)}
                            </div>
                            <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
