import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge 는 기본 설정에 없는 커스텀 스케일 키를 "미지의 클래스"로 취급해
 * 충돌 병합에서 제외한다. `--radius-nemo` 처럼 @theme 로 만든 이름을 등록해야
 * `cn("rounded-nemo", "rounded-full")` 같은 오버라이드가 실제로 동작한다.
 */
const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            rounded: [{ rounded: ["nemo"] }],
        },
    },
});

/**
 * 조건부 클래스 결합 + Tailwind 충돌 해소.
 * 컴포넌트 베이스 클래스와 호출부 `className` 이 충돌하면 항상 **나중 것(호출부)** 이 이긴다.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
