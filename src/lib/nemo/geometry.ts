/*
 * 네모의 기준 치수. 캐릭터 그림에 들어가는 숫자와 색은 여기 한 곳에서만 정한다
 * (docs/decisions/0008-character.md "원본은 한 곳이다").
 *
 * 단위는 "칸"이다. 120칸짜리 정사각 캔버스에 몸이 너비 74칸쯤으로 놓인다.
 * 그림을 크게 쓰든 작게 쓰든 칸은 그대로 둔다 — 손떨림 필터의 변위(scale)가 칸 단위라,
 * 칸을 바꾸면 같은 캐릭터인데 선의 떨림이 달라진다.
 */

export const CANVAS = 120;

/** 색은 토큰이 아니라 리터럴이다(docs/design-system.md U1 의 예외). 토큰 값을 바꾸면 여기도 함께 고친다 */
export const COLORS = {
    ink: "#1c1b19",
    paper: "#ffffff",
    cheek: "#f0c1b2",
    cream: "#f7f6f3",
} as const;

/** 선 굵기(칸) */
export const LINE = {
    /** 몸·테이프·팔다리 */
    body: 5,
    /** 입, 선으로 그리는 눈 */
    face: 4,
    /** 땀방울·물음표 같은 표시 */
    mark: 3.5,
} as const;

/** 몸 — 살짝 기운 상자. 네 모서리는 반지름 8칸쯤의 곡선이다 */
export const BODY = {
    left: 23,
    right: 97,
    top: 24,
    bottom: 102,
    /** 가운데 세로선. 테이프와 입이 여기에 놓인다 */
    cx: 60,
    path: "M25 34 Q24 26 32 25 L88 24 Q96 24 96 32 L97 92 Q97 100 89 101 L31 102 Q23 102 23 94 Z",
} as const;

/** 얼굴 — 눈은 몸의 세로 가운데, 볼은 눈 바깥 아래 */
export const FACE = {
    eyeY: 64,
    eyeLeftX: 46,
    eyeRightX: 74,
    eyeR: 4.2,
    cheekY: 74,
    cheekLeftX: 36,
    cheekRightX: 84,
    cheekR: 5.5,
    cheekOpacity: 0.75,
    mouthY: 75,
} as const;

/**
 * 심볼 — 팔다리를 덜어 낸 얼굴. 몸·테이프·얼굴은 전신 그대로이고, 캔버스만 몸에 붙여 자른다
 * (2026-11-25 에 정함: 로고도 전신과 같은 몸으로 그린다). 전신과 다른 것은 선 굵기 하나다.
 */
export const SYMBOL = {
    /** 잘라 낸 캔버스의 한 변(칸) */
    canvas: 100,
    /** 잘라 낸 캔버스의 왼쪽 위 — 몸과 테이프 꼭지가 가운데에 온다 */
    x: 10,
    y: 7,
    /** 24px 까지 내려가므로 선을 한 단계 굵게 긋는다 */
    lineScale: 1.2,
} as const;

/** 테이프 — 몸 위로 12칸 솟고, 얼굴 쪽으로 내려와 지그재그로 끝난다 */
export const TAPE = {
    left: 51,
    right: 69,
    /** 몸 위로 솟은 꼭지의 윗변. 입체 보기의 윗면 높이가 이 꼭지 높이(몸 윗변 − top)와 같다 */
    top: 12,
    /** 지그재그의 골 */
    notch: 40,
    /** 지그재그의 끝 */
    tip: 44,
} as const;
