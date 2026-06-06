import React from "react";

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: "none" | "sm" | "md" | "lg";
    variant?: "default" | "glass";
    interactive?: boolean;
}

export const Card = ({ children, className = "", padding = "md", variant = "default", interactive = false }: CardProps) => {
    const paddings = {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
    };

    const variants = {
        default: "bg-white border-gray-100 shadow-sm rounded-2xl",
        glass: "bg-white/70 backdrop-blur-xl border-neutral-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-[1.5rem]",
    };

    const interactiveClasses = interactive 
        ? "transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.1)] hover:border-brand-200 cursor-pointer" 
        : "transition-shadow duration-300";

    return (
        <div className={`border ${variants[variant]} ${interactiveClasses} ${paddings[padding]} ${className}`}>
            {children}
        </div>
    );
};
