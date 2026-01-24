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
                    strokeWidth={isActive ? "0" : "2"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
        },
        {
            label: "등록",
            href: "/add-product",
            icon: (isActive: boolean) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={isActive ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={isActive ? "0" : "2"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <line x1="12" x2="12" y1="8" y2="16" strokeWidth="2" />
                    <line x1="8" x2="16" y1="12" y2="12" strokeWidth="2" />
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
                    strokeWidth={isActive ? "0" : "2"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe-area-inset-bottom">
            <div className="flex justify-around items-center h-16 max-w-7xl mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-brand-600" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {item.icon(isActive)}
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
