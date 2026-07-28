import React from "react";
import { Text } from "./Typography";

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ 
    icon = "📦", 
    title, 
    description, 
    action, 
    className = "" 
}: EmptyStateProps) {
    return (
        <div className={`flex h-96 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 ${className}`}>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 text-3xl">
                {icon}
            </div>
            <Text size="lg" weight="medium" color="text-neutral-500" className="text-center">
                {title}
            </Text>
            {description && (
                <Text size="sm" color="text-neutral-400" className="mt-2 text-center max-w-sm">
                    {description}
                </Text>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
