import { NemoSymbol } from "@/components/nemo/Nemo";

/**
 * 네모 심볼 로고 — 팔다리를 덜어 낸 얼굴. 몸·테이프·얼굴은 전신(NemoFace)과 같은 원본(src/lib/nemo)에서 나온다.
 * 표정을 고르려면 `NemoSymbol`(src/components/nemo/Nemo.tsx)을 쓴다. 이 이름은 이미 쓰고 있는 화면을 위해 남겨 둔다.
 */
export function NemoLogo({ size = 40 }: { size?: number }) {
    return <NemoSymbol size={size} />;
}
