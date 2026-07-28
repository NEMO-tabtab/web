import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "gradient" | "danger";
    size?: "sm" | "md" | "lg" | "xl";
    shape?: "rectangle" | "pill" | "circle";
    fullWidth?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    variant = "primary",
    size = "md",
    shape = "rectangle",
    fullWidth = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    className = "",
    disabled,
    ...props
}, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

    const variants = {
        primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-[0_4px_14px_0_rgb(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:-translate-y-0.5 focus:ring-brand-500",
        secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100 focus:ring-brand-500",
        outline: "border-2 border-brand-500 text-brand-600 hover:bg-brand-50 focus:ring-brand-500",
        ghost: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-500",
        gradient: "bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-[0_4px_14px_0_rgb(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:-translate-y-0.5 focus:ring-brand-500",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-[0_4px_14px_0_rgb(239,68,68,0.39)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.23)] focus:ring-red-500",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs gap-1.5",
        md: "px-4 py-2 text-sm gap-2",
        lg: "px-6 py-3 text-base gap-2.5",
        xl: "px-8 py-4 text-lg gap-3",
    };

    const iconOnlySizes = {
        sm: "p-1.5 text-xs",
        md: "p-2.5 text-sm",
        lg: "p-3.5 text-base",
        xl: "p-4 text-lg",
    };

    const shapes = {
        rectangle: "rounded-xl",
        pill: "rounded-full",
        circle: "rounded-full",
    };

    // If shape is circle, we ignore text and only show icon padding
    const isCircle = shape === "circle";
    const paddingStyles = isCircle ? iconOnlySizes[size] : sizes[size];

    return (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={`${baseStyles} ${variants[variant]} ${shapes[shape]} ${paddingStyles} ${fullWidth && !isCircle ? "w-full" : ""} ${className}`}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            
            {!isLoading && leftIcon && (
                <span className="flex-shrink-0">{leftIcon}</span>
            )}
            
            {!isCircle && children}
            
            {!isLoading && rightIcon && !isCircle && (
                <span className="flex-shrink-0">{rightIcon}</span>
            )}
        </button>
    );
});

Button.displayName = "Button";
