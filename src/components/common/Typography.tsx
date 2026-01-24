import React from "react";

interface HeadingProps {
    children: React.ReactNode;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
}

export const Heading = ({ children, level = 1, className = "" }: HeadingProps) => {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    const styles = {
        1: "text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight",
        2: "text-3xl md:text-4xl font-bold text-gray-900 tracking-tight",
        3: "text-2xl md:text-3xl font-bold text-gray-900",
        4: "text-xl md:text-2xl font-semibold text-gray-900",
        5: "text-lg md:text-xl font-semibold text-gray-900",
        6: "text-base md:text-lg font-semibold text-gray-900",
    };

    return <Tag className={`${styles[level]} ${className}`}>{children}</Tag>;
};

interface TextProps {
    children: React.ReactNode;
    size?: "sm" | "base" | "lg" | "xl";
    className?: string;
    color?: string;
    weight?: "normal" | "medium" | "semibold" | "bold";
}

export const Text = ({ children, size = "base", className = "", color = "text-gray-600", weight = "normal" }: TextProps) => {
    const sizes = {
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
    };

    const weights = {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
    };

    return <p className={`${sizes[size]} ${weights[weight]} ${color} ${className}`}>{children}</p>;
};
