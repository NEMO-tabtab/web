import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "success" | "warning" | "neutral" | "brand";
    children: React.ReactNode;
}

export function Badge({ variant = "neutral", className = "", children, ...props }: BadgeProps) {
    const variantClasses = {
        success: "bg-emerald-50 text-emerald-600",
        warning: "bg-amber-50 text-amber-600",
        neutral: "bg-neutral-100 text-neutral-600",
        brand: "bg-brand-50 text-brand-600",
    };

    return (
        <span 
            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1 ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
}
