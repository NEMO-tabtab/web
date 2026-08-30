import React from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";

export const fabVariants = {
    /** 강조 단계 2 — 먹선 아웃라인 */
    solid: "sticker bg-paper text-ink",
    /** 강조 단계 1 — 먹 채움 */
    ink: "sticker bg-ink text-paper",
} as const;

export type FabVariant = keyof typeof fabVariants | "gradient";

export const fabSizes = {
    md: "h-12 w-12 text-lg",
    lg: "h-14 w-14 text-xl",
} as const;

interface FABBaseProps {
    icon: React.ReactNode;
    /** `gradient` 는 @deprecated — `ink` 로 렌더링됩니다. */
    variant?: FabVariant;
    size?: keyof typeof fabSizes;
    className?: string;
    "aria-label"?: string;
    title?: string;
}

export type FABProps = FABBaseProps &
    (
        | ({ href: string } & Omit<React.ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">)
        | ({ href?: undefined } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">)
    );

// TODO(design-system): 페이지 마이그레이션 완료 후 deprecated 별칭 제거
const resolveVariant = (variant: FabVariant) => (variant === "gradient" ? "ink" : variant);

/** 떠 있는 동그란 먹선 버튼. 그림자 대신 눌림(sticker-press)으로 반응을 준다. */
export function FAB({ icon, variant = "solid", size = "lg", href, className, ...props }: FABProps) {
    const classes = cn(
        "sticker-press inline-flex shrink-0 items-center justify-center rounded-full",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        fabSizes[size],
        fabVariants[resolveVariant(variant)],
        className,
    );

    if (href) {
        return (
            <Link
                {...(props as Omit<React.ComponentPropsWithoutRef<typeof Link>, "href">)}
                href={href}
                className={classes}
            >
                {icon}
            </Link>
        );
    }

    return (
        <button type="button" className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
            {icon}
        </button>
    );
}
