import { Nemo } from "@/components/nemo/Nemo";

/**
 * 네모(NEMO) 메인 캐릭터 — 기본 표정의 전신.
 * 그림의 원본은 src/lib/nemo 에 있다. 표정을 고르려면 `Nemo`(src/components/nemo/Nemo.tsx)를 쓴다.
 * 이 이름은 이미 쓰고 있는 화면을 위해 남겨 둔다.
 */
export function NemoFace({ size = 120 }: { size?: number }) {
    return <Nemo size={size} />;
}
