export const DS_NAV = [
    {
        group: "Foundations",
        items: [
            { href: "/design-system", label: "Introduction" },
            { href: "/design-system/tokens", label: "Colors & Tokens" },
            { href: "/design-system/typography", label: "Typography" },
            { href: "/design-system/layout", label: "Page Layout" },
            // 캐릭터·심볼은 토큰과 같은 층의 브랜드 자산이라 Foundations 에 둔다
            { href: "/design-system/character", label: "Character & Logo" },
        ],
    },
    {
        group: "Components",
        items: [
            { href: "/design-system/buttons", label: "Button" },
            { href: "/design-system/cards", label: "Card" },
            { href: "/design-system/inputs", label: "Form Controls" },
            { href: "/design-system/chips", label: "Chip" },
            { href: "/design-system/badges", label: "Badge" },
            { href: "/design-system/tabs", label: "Tabs" },
            { href: "/design-system/data-display", label: "Data Display" },
            { href: "/design-system/feedback", label: "Feedback" },
            { href: "/design-system/modal", label: "Modal" },
            { href: "/design-system/fabs", label: "FAB" },
            { href: "/design-system/navigation", label: "Bottom Navigation" },
        ],
    },
] as const;
