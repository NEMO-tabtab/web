import { z } from "zod";

/*
 * 서버 응답의 예상 형식 — 명세(https://nemo-api.onrender.com/swagger-ui/index.html) 기준.
 *
 * 서버 DB 가 꺼져 있어 실제 응답으로 확인하지 못한 채 쓴다. 실제 응답이 다르면 이 파일만 고친다.
 * 앱이 쓰는 필드만 적는다 — 적지 않은 필드는 zod 가 버리므로, 기기에 남는 개인정보도 그만큼 줄어든다.
 * 서버가 값을 안 주는 경우(null·누락)를 모두 undefined 로 모은다.
 */

const optionalText = z
    .string()
    .nullish()
    .transform((value) => value ?? undefined);

/** 명세의 UserRead 중 앱이 쓰는 것만 */
export const userSchema = z.object({
    userIdx: z.number().int(),
    loginId: z.string().min(1),
    nickname: optionalText,
    profileImageUrl: optionalText,
});
export type ApiUser = z.infer<typeof userSchema>;

/** `POST /api/user/login` 의 data — 명세 설명: "{ token: JWT, user: UserRead }" (응답 스키마는 명세에 없다) */
export const loginDataSchema = z.object({
    token: z.string().min(1),
    user: userSchema,
});
export type LoginData = z.infer<typeof loginDataSchema>;

/*
 * 아래는 2026-11-19 에 실제 서버가 돌려준 응답을 보고 쓴 형식이다 (그 위는 명세만 보고 쓴 예상 형식).
 * 서버는 값이 없는 필드를 빼지 않고 null 로 보낸다.
 */

const text = z.string().nullish();
const int = z.number().int();

/** `GET /api/user/checkId` — 중복이어도 200 이고, 쓸 수 있는지는 isAvailable 에 담긴다 */
export const loginIdCheckSchema = z.object({
    isAvailable: z.boolean(),
    /** 탈퇴한 아이디를 다시 쓸 수 있는가 (뜻은 백엔드 확인 필요) */
    canRejoin: z.boolean().nullish(),
});

/** 서버의 상품(ProductRead). 앱의 `Product`(src/lib/db)와 필드가 다르다 — 맞추는 일은 #97 */
export const serverProductSchema = z.object({
    productIdx: int,
    userIdx: int.nullish(),
    productNm: z.string(),
    productPrice: int.nullish(),
    productCnt: int.nullish(),
    status: text,
    modelNm: text,
    brandNm: text,
    barcode: text,
    categoryIdx: int.nullish(),
    place: text,
    placeSub: text,
    content: text,
    prchPlace: text,
    prchDate: text,
    /** "2026-07-24 04:26:29" — 시간대 표시가 없다 */
    regDate: text,
    updDate: text,
});

export const serverCategorySchema = z.object({
    categoryIdx: int,
    userIdx: int.nullish(),
    categoryNm: z.string(),
    emoji: text,
    color: text,
});

export const serverAlarmSchema = z.object({
    alarmIdx: int,
    productIdx: int.nullish(),
    title: z.string(),
    content: text,
    regDate: text,
});

/** 목록 응답. page 는 1부터 센다 */
export const pageOf = <T extends z.ZodType>(item: T) =>
    z.object({
        content: z.array(item),
        page: int,
        size: int,
        total: int,
    });

export type ServerProduct = z.infer<typeof serverProductSchema>;
export type ServerCategory = z.infer<typeof serverCategorySchema>;
export type ServerAlarm = z.infer<typeof serverAlarmSchema>;
export interface Page<T> {
    content: T[];
    page: number;
    size: number;
    total: number;
}
