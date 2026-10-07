import type { Config } from "tailwindcss";

/* 네모(NEMO) 브랜드 토큰 — 손그림 흑백 라인아트.
 *
 * 값의 출처는 두 군데다:
 *   - 이 파일       → 유틸리티 이름을 만든다 (bg-paper, text-ink-soft, rounded-nemo …)
 *   - globals.css 의 :root → raw CSS 규칙(.sticker · .field · body)이 참조할 변수
 * v4 의 @theme 는 이 둘을 한 번에 했지만 v3 에는 그런 장치가 없다.
 * 색을 고칠 때는 반드시 양쪽을 같이 고칠 것. */
const config: Config = {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            colors: {
                /** 바탕·카드 — 순백 */
                paper: "#ffffff",
                /** 패널 — 이미지 영역·옅은 면 */
                cream: "#f7f6f3",
                ink: {
                    /** 먹선·채움 버튼 */
                    DEFAULT: "#1c1b19",
                    /** 보조 텍스트 */
                    soft: "#8b8680",
                },
                /** 옅은 구분선 */
                line: "#e9e7e2",
                /** 볼터치 — 유일한 포인트 컬러 */
                cheek: "#f0c1b2",
                /** 삭제·오류 */
                danger: "#d0554e",
            },
            fontFamily: {
                /** 손글씨(개구체) — 제목 전용 */
                display: ["var(--font-hand)", '"Apple SD Gothic Neo"', '"Malgun Gothic"', "sans-serif"],
                sans: ["var(--font-noto)", '"Apple SD Gothic Neo"', '"Malgun Gothic"', "sans-serif"],
            },
            borderRadius: {
                /** 손으로 그린 사각형. 비대칭 모서리는 globals.css 의 `.sticker.rounded-nemo` 가 덮어쓴다. */
                nemo: "1.25rem",
            },
            /* v3 기본 outline 폭은 0·1·2·4·8 뿐이라 `outline-3` 이 없다.
             * 시스템 포커스 링은 3px 이고(globals.css 의 `.field:focus-visible` 과 같은 값)
             * Button · Chip · ProductForm 이 이미 그 이름을 쓰므로 토큰으로 추가한다. */
            outlineWidth: {
                3: "3px",
            },
        },
    },
    plugins: [],
};

export default config;
