import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: "none" | "sm" | "md" | "lg";
}

export const Card = ({ children, className = "", padding = "md" }: CardProps) => {
    const paddings = {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
    };

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${paddings[padding]} ${className}`}>
            {children}
        </div>
    );
};
