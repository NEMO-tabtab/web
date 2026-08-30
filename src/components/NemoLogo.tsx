/** 네모 심볼 로고 — 앱 아이콘형(둥근 사각 안의 박스 얼굴) 약식 */
export function NemoLogo({ size = 40 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="overflow-visible">
            <g filter="url(#rough-line-sm)">
                <rect x="10" y="16" width="80" height="74" rx="16" fill="#ffffff" stroke="#1c1b19" strokeWidth="6" />
                <path
                    d="M41 6 L59 6 L59 30 L54.5 34 L50 30 L45.5 34 L41 30 Z"
                    fill="#ffffff"
                    stroke="#1c1b19"
                    strokeWidth="6"
                    strokeLinejoin="round"
                />
                <circle cx="30" cy="62" r="5" fill="#f0c1b2" opacity="0.75" />
                <circle cx="70" cy="62" r="5" fill="#f0c1b2" opacity="0.75" />
                <circle cx="40" cy="55" r="4" fill="#1c1b19" />
                <circle cx="60" cy="55" r="4" fill="#1c1b19" />
                <path d="M44 66 q3 5 6 0 q3 5 6 0" fill="none" stroke="#1c1b19" strokeWidth="4" strokeLinecap="round" />
            </g>
        </svg>
    );
}
