import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
}

export const Button = ({
    children,
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    ...props
}: ButtonProps) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

    const variants = {
        primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-md hover:shadow-lg focus:ring-brand-500",
        secondary: "bg-brand-100 text-brand-900 hover:bg-brand-200 focus:ring-brand-500",
        outline: "border-2 border-brand-500 text-brand-600 hover:bg-brand-50 focus:ring-brand-500",
        ghost: "text-brand-600 hover:bg-brand-50 focus:ring-brand-500",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-base",
        lg: "px-6 py-3.5 text-lg",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
