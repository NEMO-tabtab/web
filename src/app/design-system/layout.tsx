import Link from "next/link";
import React from "react";

export default function DesignSystemLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-50 text-gray-900">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white p-6">
                <div className="mb-8">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">
                        Design System
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Component Library</p>
                </div>
                
                <nav className="space-y-1">
                    <div className="pb-4">
                        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Overview
                        </h2>
                        <Link 
                            href="/design-system"
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            Introduction
                        </Link>
                    </div>

                    <div className="pb-4">
                        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Components
                        </h2>
                        <Link 
                            href="/design-system/badges"
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            Badges
                        </Link>
                        <Link 
                            href="/design-system/buttons"
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            Buttons
                        </Link>
                        <Link 
                            href="/design-system/cards"
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            Cards
                        </Link>
                        <Link 
                            href="/design-system/empty-states"
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            Empty States
                        </Link>
                        <Link 
                            href="/design-system/fabs"
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            Floating Action Buttons (FABs)
                        </Link>
                        <Link 
                            href="/design-system/inputs"
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                            Inputs
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto p-12">
                <div className="mx-auto max-w-4xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
