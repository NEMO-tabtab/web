"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DS_NAV } from "../nav";
import { cn } from "@/lib/cn";

export default function SidebarNav() {
    const pathname = usePathname();

    const isActive = (href: string) => (href === "/design-system" ? pathname === href : pathname?.startsWith(href));

    return (
        <nav className="space-y-6">
            {DS_NAV.map((section) => (
                <div key={section.group}>
                    <h2 className="text-ink-soft mb-2 px-3 text-[11px] font-bold tracking-wider uppercase">
                        {section.group}
                    </h2>
                    <ul className="space-y-1">
                        {section.items.map((item) => {
                            const active = isActive(item.href);

                            return (
                                <li key={item.href}>
                                    {/* 활성 표시는 색이 아니라 먹 채움 — 내비 전반과 같은 규칙 */}
                                    <Link
                                        href={item.href}
                                        aria-current={active ? "page" : undefined}
                                        className={cn(
                                            "sticker-press block rounded-full px-3 py-1.5 text-[13px] font-bold",
                                            active ? "sticker bg-ink text-paper" : "text-ink-soft hover:text-ink",
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );
}
