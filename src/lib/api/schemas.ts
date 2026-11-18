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
