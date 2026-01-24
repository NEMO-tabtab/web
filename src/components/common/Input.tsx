import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, fullWidth = true, className = "", icon, ...props }, ref) => {
        return (
            <div className={`${fullWidth ? "w-full" : ""} space-y-1.5`}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700">
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 
              focus:border-brand-500 focus:bg-white focus:ring-brand-500 
              disabled:opacity-50 disabled:bg-gray-100
              transition-colors duration-200
              ${icon ? "pl-10" : "pl-4"} pr-4 py-3
              ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";
