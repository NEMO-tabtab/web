/** 네모(NEMO) 메인 캐릭터 — 손그림 라인아트 박스, 테이프 플랩·점 눈·ω 입·볼터치 */
export function NemoFace({ size = 120 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" className="overflow-visible">
            <g filter="url(#rough-line)">
                {/* 팔 (몸통 뒤) */}
                <path d="M22 66 q-11 3 -4 15" fill="none" stroke="#1c1b19" strokeWidth="5" strokeLinecap="round" />
                <path d="M98 66 q11 3 4 15" fill="none" stroke="#1c1b19" strokeWidth="5" strokeLinecap="round" />
                {/* 발 */}
                <path d="M42 101 q0 10 11 8" fill="none" stroke="#1c1b19" strokeWidth="5" strokeLinecap="round" />
                <path d="M78 101 q0 10 -11 8" fill="none" stroke="#1c1b19" strokeWidth="5" strokeLinecap="round" />
                {/* 몸통 — 살짝 기운 박스 */}
                <path
                    d="M25 34
           Q24 26 32 25 L88 24 Q96 24 96 32 L97 92 Q97 100 89 101 L31 102 Q23 102 23 94 Z"
                    fill="#ffffff"
                    stroke="#1c1b19"
                    strokeWidth="5"
                    strokeLinejoin="round"
                />
                {/* 테이프 — 지그재그 끝단 */}
                <path
                    d="M51 12 L69 12 L69 40 L64.5 44 L60 40 L55.5 44 L51 40 Z"
                    fill="#ffffff"
                    stroke="#1c1b19"
                    strokeWidth="5"
                    strokeLinejoin="round"
                />
                {/* 볼터치 */}
                <circle cx="36" cy="74" r="5.5" fill="#f0c1b2" opacity="0.75" />
                <circle cx="84" cy="74" r="5.5" fill="#f0c1b2" opacity="0.75" />
                {/* 눈 */}
                <circle cx="46" cy="64" r="4.2" fill="#1c1b19" />
                <circle cx="74" cy="64" r="4.2" fill="#1c1b19" />
                {/* ω 입 */}
                <path d="M52 75 q4 6 8 0 q4 6 8 0" fill="none" stroke="#1c1b19" strokeWidth="4" strokeLinecap="round" />
            </g>
        </svg>
    );
}
