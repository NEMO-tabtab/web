/*
 * 포인트 규칙표(결정 기록 0006, #181). 점수를 정하는 곳은 여기 한 곳이다 — 화면과 서버는 따로 세지 않는다.
 * 숫자, 레벨 구간, 업적 이름은 0006의 초안이다. 팀이 정하면 이 파일의 표만 고친다.
 */

/**
 * 포인트를 셈하는 사실. 잔액을 저장하지 않고 이 값들로 그때그때 셈한다.
 * 서버만 아는 개수(바코드·초대)는 로그인 전이거나 받지 못했으면 null — "0개"와 "모름"을 가른다.
 */
export interface PointFacts {
    /** 살아 있는 물건 기록 수(`deletedAt` 없음). 수량이 아니라 기록 한 건이 하나다 */
    items: number;
    /** 사진이 한 장이라도 있는 물건 수 */
    withPhoto: number;
    /** 뽑은 곳(가챠샵)을 적은 물건 수 */
    withOrigin: number;
    /** 기록에 적힌 가챠샵 수(`origin.shopId` 고유) */
    shops: number;
    /** 출석한 날 수. 출석 기록(#182)이 생기기 전에는 0 */
    attendanceDays: number;
    /** 내가 올린 바코드 수(서버, #185). 모르면 null */
    barcodes: number | null;
    /** 내가 초대해 가입한 사람 수(서버, #185). 모르면 null */
    invites: number | null;
}

export type ActivityId = "item" | "photo" | "origin" | "shop" | "attendance" | "barcode" | "invite";

export interface ActivityRule {
    id: ActivityId;
    /** 내역에 보일 이름 */
    label: string;
    /** 하나마다 주는 포인트 */
    points: number;
    /** 개수 뒤에 붙일 말 */
    unit: string;
    /** 이 개수를 세는 사실 */
    fact: keyof PointFacts;
}

/** 활동마다의 포인트. 도감 시리즈 완성(0006 표의 50점)은 도감(#170)이 생긴 뒤에 더한다 */
export const ACTIVITY_RULES: readonly ActivityRule[] = [
    { id: "item", label: "기록한 물건", points: 10, unit: "개", fact: "items" },
    { id: "photo", label: "사진이 있는 물건", points: 5, unit: "개", fact: "withPhoto" },
    { id: "origin", label: "뽑은 곳을 적은 물건", points: 5, unit: "개", fact: "withOrigin" },
    { id: "shop", label: "기록한 가챠샵", points: 20, unit: "곳", fact: "shops" },
    { id: "attendance", label: "출석", points: 5, unit: "일", fact: "attendanceDays" },
    { id: "barcode", label: "올린 바코드", points: 30, unit: "개", fact: "barcodes" },
    { id: "invite", label: "초대해 가입한 사람", points: 50, unit: "명", fact: "invites" },
];

export interface Achievement {
    /**
     * 기기에 달성을 적을 때 `achv:<id>`로 쓰는 이름(#182). 한 번 배포하면 바꾸지 않는다 —
     * 바꾸면 이미 얻은 업적이 사라진 것처럼 보인다. 이름(title)은 언제든 고쳐도 된다.
     */
    id: string;
    title: string;
    /** 무엇을 하면 얻는지 */
    description: string;
    points: number;
    /** 어느 사실이 몇에 이르면 얻는지 */
    fact: keyof PointFacts;
    goal: number;
}

/** 업적 초안. 화면에는 이 순서대로 보인다. 시리즈 완성 업적은 도감(#170) 뒤에 더한다 */
export const ACHIEVEMENTS: readonly Achievement[] = [
    { id: "first-item", title: "첫 기록", description: "물건을 처음 기록해요", points: 10, fact: "items", goal: 1 },
    { id: "items-10", title: "물건 10개", description: "물건 10개를 기록해요", points: 30, fact: "items", goal: 10 },
    { id: "items-50", title: "물건 50개", description: "물건 50개를 기록해요", points: 100, fact: "items", goal: 50 },
    {
        id: "items-100",
        title: "물건 100개",
        description: "물건 100개를 기록해요",
        points: 200,
        fact: "items",
        goal: 100,
    },
    {
        id: "first-shop",
        title: "첫 가챠샵",
        description: "뽑은 가챠샵을 처음 적어요",
        points: 10,
        fact: "shops",
        goal: 1,
    },
    {
        id: "shops-5",
        title: "가챠샵 5곳",
        description: "가챠샵 5곳에서 뽑은 것을 적어요",
        points: 50,
        fact: "shops",
        goal: 5,
    },
    {
        id: "attendance-7",
        title: "출석 7일",
        description: "7일 동안 앱을 열어요",
        points: 30,
        fact: "attendanceDays",
        goal: 7,
    },
    {
        id: "attendance-30",
        title: "출석 30일",
        description: "30일 동안 앱을 열어요",
        points: 100,
        fact: "attendanceDays",
        goal: 30,
    },
    {
        id: "first-barcode",
        title: "첫 바코드 기여",
        description: "못 찾은 바코드를 처음 올려요(로그인)",
        points: 30,
        fact: "barcodes",
        goal: 1,
    },
];

/**
 * 레벨 n(1부터)이 되는 데 필요한 총 포인트. 0부터 오름차순.
 * 마지막 구간을 넘으면 마지막 레벨에 머문다.
 */
export const LEVEL_THRESHOLDS: readonly number[] = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000];
