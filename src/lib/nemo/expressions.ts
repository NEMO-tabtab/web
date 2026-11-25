import type { CheeksId, EyesId, MouthId } from "./face";
import type { MarkId } from "./marks";
import type { TapeId } from "./tape";

/*
 * 표정 목록 — 이 맵이 원본이다. 문서 화면(/design-system/character/expressions)이 이 맵을 돌며 그린다.
 * 표정은 앱에 실제로 있는 순간에서 뽑았다(docs/decisions/0008-character.md "처음 만드는 그림").
 */

export interface Expression {
    /** 화면과 문서에 쓰는 이름 */
    label: string;
    /** 쓰는 순간 */
    when: string;
    eyes: EyesId;
    mouth: MouthId;
    cheeks: CheeksId;
    tape: TapeId;
    /** 얼굴 밖에 붙는 표시. 작은 크기에서는 그리지 않는다 */
    marks?: readonly MarkId[];
    /** 몸을 기울이는 각도(도). 음수면 왼쪽으로 */
    lean?: number;
}

export const EXPRESSIONS = {
    base: {
        label: "기본",
        when: "홈 인사 카드, 프로필, 심볼",
        eyes: "dot",
        mouth: "omega",
        cheeks: "base",
        tape: "rest",
    },
    expect: {
        label: "기대",
        when: "빈 목록 — 첫 물건을 기다릴 때",
        eyes: "up",
        mouth: "small",
        cheeks: "base",
        tape: "rest",
    },
    happy: {
        label: "기쁨",
        when: "저장·가입·가져오기를 마쳤을 때",
        eyes: "smile",
        mouth: "omega",
        cheeks: "deep",
        tape: "rest",
    },
    excited: {
        label: "신남",
        when: "새 종류, 새 시리즈를 모았을 때",
        eyes: "sparkle",
        mouth: "open",
        cheeks: "deep",
        tape: "perk",
        marks: ["ticks"],
    },
    calm: {
        label: "담담",
        when: "이미 가진 종류가 또 나왔을 때",
        eyes: "closed",
        mouth: "omega",
        cheeks: "base",
        tape: "rest",
    },
    surprised: {
        label: "깜짝",
        when: "바코드를 읽었을 때, 이미 등록한 물건일 때",
        eyes: "big",
        mouth: "round",
        cheeks: "base",
        tape: "perk",
        marks: ["bang"],
    },
    curious: {
        label: "갸웃",
        when: "검색 결과가 없을 때, 바코드 정보를 못 찾았을 때",
        eyes: "uneven",
        mouth: "small",
        cheeks: "base",
        tape: "rest",
        marks: ["question"],
        lean: -7,
    },
    focus: {
        label: "집중",
        when: "스캔하는 중, 찾는 중, 여는 중",
        eyes: "firm",
        mouth: "flat",
        cheeks: "base",
        tape: "rest",
    },
    proud: {
        label: "뿌듯",
        when: "백업을 마쳤을 때, 시리즈를 다 모았을 때",
        eyes: "smile",
        mouth: "omegaBig",
        cheeks: "deep",
        tape: "flutter",
        marks: ["wind", "sparkle"],
    },
    wink: {
        label: "찡긋",
        when: "확인, 고마움을 전할 때",
        eyes: "wink",
        mouth: "omega",
        cheeks: "base",
        tape: "rest",
    },
    oops: {
        label: "머쓱",
        when: "불러오지 못했을 때 — 다시 시도를 권할 때",
        eyes: "dot",
        mouth: "wavy",
        cheeks: "deep",
        tape: "droop",
        marks: ["sweat"],
    },
    sleepy: {
        label: "졸림",
        when: "오프라인, 준비 중, 서버가 깨어나는 중",
        eyes: "asleep",
        mouth: "tiny",
        cheeks: "base",
        tape: "droop",
        marks: ["zzz"],
    },
} satisfies Record<string, Expression>;

export type ExpressionId = keyof typeof EXPRESSIONS;
export const EXPRESSION_IDS = Object.keys(EXPRESSIONS) as ExpressionId[];
