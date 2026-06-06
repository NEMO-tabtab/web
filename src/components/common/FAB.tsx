import React from "react";
import Link from "next/link";

export interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    variant?: "solid" | "gradient";
    href?: string;
}

export function FAB({ icon, variant = "solid", href, className = "", ...props }: FABProps) {
    const baseClasses = "group flex items-center justify-center rounded-2xl transition-all duration-300 hover:scale-110 flex-shrink-0";
    
    const variantClasses = {
        solid: "h-14 w-14 border border-brand-100 bg-white text-brand-600 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,118,255,0.2)]",
        gradient: "h-14 w-14 bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_8px_30px_rgb(0,118,255,0.24)] hover:from-brand-400 hover:to-brand-500 hover:shadow-[0_12px_40px_rgb(0,118,255,0.36)]",
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

    if (href) {
        return (
            <Link href={href} className={combinedClasses}>
                {icon}
            </Link>
        );
    }

    return (
        <button className={combinedClasses} {...props}>
            {icon}
        </button>
    );
}
