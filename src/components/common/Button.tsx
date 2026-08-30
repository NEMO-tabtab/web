import React from "react";

import { cn } from "@/lib/cn";

export const buttonVariants = {
    /** 강조 1 — 먹 채움. 화면당 하나가 원칙 */
    primary: "sticker bg-ink text-paper",
    /** 강조 2 — 먹선 아웃라인 스티커 */
    secondary: "sticker bg-paper text-ink hover:bg-cream",
    /** 강조 3 — 옅은 헤어라인. secondary 보다 한 단계 약하다 */
    outline: "border border-line bg-paper text-ink hover:border-ink",
    /** 강조 4 — 테두리 없음. 보조 동작 전용 */
    ghost: "text-ink-soft hover:bg-cream hover:text-ink",
    /** 파괴적 동작 전용 — 강조나 브랜딩에 쓰지 않는다.
     *  `.sticker` 는 레이어 밖 규칙이라 border-color 유틸리티를 이긴다. `!` 로 되돌린다. */
    danger: "sticker !border-danger bg-danger text-paper",
} as const;

export type ButtonVariant = keyof typeof buttonVariants | "gradient";

export const buttonSizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2",
    xl: "h-14 px-8 text-lg gap-2.5",
} as const;

const iconOnlySizes = {
    sm: "h-8 w-8 p-0",
    md: "h-10 w-10 p-0",
    lg: "h-12 w-12 p-0",
    xl: "h-14 w-14 p-0",
} as const;

/** rectangle 은 손그림 사각형(`.sticker` 조합이면 네 귀퉁이가 서로 다른 비대칭 모서리) */
const shapes = {
    rectangle: "rounded-nemo",
    pill: "rounded-full",
    circle: "rounded-full",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** `gradient` 는 @deprecated — `primary` 로 렌더링됩니다. 그라디언트는 이 시스템에 없습니다. */
    variant?: ButtonVariant;
    size?: keyof typeof buttonSizes;
    shape?: keyof typeof shapes;
    fullWidth?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

// TODO(design-system): 페이지 마이그레이션 완료 후 deprecated 별칭 제거
const resolveVariant = (variant: ButtonVariant) => (variant === "gradient" ? "primary" : variant);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = "primary",
            size = "md",
            shape = "rectangle",
            fullWidth = false,
            isLoading = false,
            leftIcon,
            rightIcon,
            className,
            disabled,
            ...props
        },
        ref,
    ) => {
        const isCircle = shape === "circle";

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    // 평면 먹선 — 그림자·ring 없음. 눌림 피드백은 .sticker-press 가 담당한다
                    "sticker-press inline-flex items-center justify-center font-bold",
                    // .field 와 같은 결의 포커스 링 — 3px 먹선 아웃라인
                    "focus-visible:outline-ink focus-visible:outline-3 focus-visible:outline-offset-2",
                    "disabled:pointer-events-none disabled:opacity-40",
                    buttonVariants[resolveVariant(variant)],
                    shapes[shape],
                    isCircle ? iconOnlySizes[size] : buttonSizes[size],
                    fullWidth && !isCircle && "w-full",
                    className,
                )}
                {...props}
            >
                {isLoading && (
                    <svg
                        className="h-4 w-4 animate-spin text-current"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}

                {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}

                {!isCircle && children}

                {!isLoading && rightIcon && !isCircle && <span className="shrink-0">{rightIcon}</span>}
            </button>
        );
    },
);

Button.displayName = "Button";
