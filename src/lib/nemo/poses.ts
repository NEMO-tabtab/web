import type { BodyId } from "./body";
import type { ExpressionId } from "./expressions";
import { CANVAS } from "./geometry";
import type { ArmId, FeetId } from "./limbs";
import type { MarkId } from "./marks";
import type { PropId } from "./props";
import type { Box } from "./types";

/*
 * 자세 목록 — 이 맵이 원본이다. 문서 화면(/design-system/character/poses)이 이 맵을 돌며 그린다.
 * 자세는 앱에서 실제로 하는 일(등록, 스캔, 검색, 지도, 백업)에서 뽑았다
 * (docs/decisions/0008-character.md "몸이 곧 하는 일이다").
 */

export interface Pose {
    /** 화면과 문서에 쓰는 이름 */
    label: string;
    /** 쓰는 순간 */
    when: string;
    body: BodyId;
    /** 왼팔, 오른팔 */
    arms: readonly [ArmId, ArmId];
    feet: FeetId;
    /** 손에 든 것. 작은 크기에서는 그리지 않는다 */
    props?: readonly PropId[];
    /** 자세에 딸린 표시(손 흔드는 선 등). 작은 크기에서는 그리지 않는다 */
    marks?: readonly MarkId[];
    /** 표정을 따로 주지 않았을 때의 얼굴 */
    expression: ExpressionId;
    /**
     * 표정에 딸린 표시(물음표·반짝 등)를 그리지 않는다.
     * 오른쪽 위 자리를 든 팔이나 소품이 쓰는 자세에 켠다.
     */
    quiet?: boolean;
    /** 몸을 띄우는 높이(칸) — 뛰는 자세 */
    lift?: number;
    /** 소품이 캔버스를 넘을 때의 그림 칸. 없으면 120칸 정사각 */
    box?: Box;
}

/** 기본 그림 칸 */
export const CANVAS_BOX: Box = { x: 0, y: 0, width: CANVAS, height: CANVAS };

export const POSES = {
    stand: {
        label: "서 있기",
        when: "기본",
        body: "box",
        arms: ["rest", "rest"],
        feet: "rest",
        expression: "base",
    },
    wave: {
        label: "인사",
        when: "첫 화면, 로그인·가입",
        body: "box",
        arms: ["rest", "up"],
        feet: "rest",
        marks: ["wave"],
        expression: "happy",
        quiet: true,
        box: { x: 0, y: 0, width: 132, height: 120 },
    },
    empty: {
        label: "텅",
        when: "빈 목록, 빈 분석 — 속을 열어 보인다",
        body: "open",
        arms: ["out", "out"],
        feet: "rest",
        expression: "expect",
    },
    store: {
        label: "담기",
        when: "등록을 마쳤을 때",
        body: "open",
        arms: ["up", "up"],
        feet: "rest",
        props: ["capsule"],
        expression: "happy",
        quiet: true,
        box: { x: 0, y: -40, width: 120, height: 160 },
    },
    search: {
        label: "찾기",
        when: "검색, 결과가 없을 때",
        body: "box",
        arms: ["rest", "grip"],
        feet: "rest",
        props: ["magnifier"],
        expression: "focus",
        quiet: true,
    },
    scan: {
        label: "삑",
        when: "바코드 스캔",
        body: "box",
        arms: ["out", "rest"],
        feet: "rest",
        props: ["barcode"],
        expression: "focus",
        quiet: true,
        box: { x: -36, y: 0, width: 156, height: 120 },
    },
    snap: {
        label: "찰칵",
        when: "사진으로 등록",
        body: "box",
        arms: ["rest", "out"],
        feet: "rest",
        props: ["camera"],
        expression: "wink",
        quiet: true,
        box: { x: 0, y: 0, width: 150, height: 120 },
    },
    map: {
        label: "길 찾기",
        when: "굿즈샵 지도, 내부 지도가 아직 없을 때",
        body: "box",
        arms: ["hold", "hold"],
        feet: "rest",
        props: ["map"],
        expression: "happy",
        quiet: true,
    },
    pack: {
        label: "꼭꼭 싸기",
        when: "백업 내보내기·가져오기",
        body: "box",
        arms: ["out", "hip"],
        feet: "rest",
        props: ["parcel"],
        expression: "proud",
        box: { x: -36, y: 0, width: 156, height: 120 },
    },
    cheer: {
        label: "만세",
        when: "새 시리즈, 시리즈를 다 모았을 때",
        body: "box",
        arms: ["up", "up"],
        feet: "apart",
        marks: ["hop"],
        expression: "excited",
        lift: 5,
    },
    trip: {
        label: "구겨짐",
        when: "오류 — 다시 시도를 권할 때",
        body: "crumpled",
        arms: ["limp", "limp"],
        feet: "rest",
        expression: "oops",
    },
    sleep: {
        label: "잠",
        when: "오프라인, 준비 중",
        body: "box",
        arms: ["limp", "limp"],
        feet: "rest",
        expression: "sleepy",
    },
} satisfies Record<string, Pose>;

export type PoseId = keyof typeof POSES;
export const POSE_IDS = Object.keys(POSES) as PoseId[];
