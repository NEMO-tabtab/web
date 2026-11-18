import { ApiError, type ApiFailureKind } from "./client";

/*
 * 서버 호출 실패를 사용자에게 보일 문구로 바꾼다.
 *
 * 서버가 보낸 `error` 필드는 절대 화면에 내지 않는다 — SQL 경로나 예외 이름 같은 내부 정보가 들어 있다.
 * `message` 는 4xx 일 때만 쓴다(서버가 사용자에게 하려는 말). 5xx 의 message 는 쓰지 않는다.
 */

export interface ApiErrorNotice {
    message: string;
    /** 같은 요청을 그대로 다시 보내 볼 만한가 */
    retryable: boolean;
}

/** HTTP 상태 코드나 실패 종류별로 문구를 바꿔 끼운다. 예: 로그인의 401 → "아이디 또는 비밀번호가…" */
export type NoticeOverrides = Partial<Record<number | ApiFailureKind, string>>;

const MAX_SERVER_MESSAGE = 80;

function isOffline(): boolean {
    return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function describeApiError(error: unknown, overrides: NoticeOverrides = {}): ApiErrorNotice {
    if (!(error instanceof ApiError)) {
        return { message: "문제가 생겼어요. 다시 시도해 주세요.", retryable: true };
    }

    const override = (error.status !== undefined ? overrides[error.status] : undefined) ?? overrides[error.kind];

    switch (error.kind) {
        case "network":
            return {
                message:
                    override ??
                    (isOffline()
                        ? "인터넷에 연결돼 있지 않아요. 연결한 뒤 다시 시도해 주세요."
                        : "서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요."),
                retryable: true,
            };
        case "timeout":
            return {
                message: override ?? "서버가 깨어나는 중이에요. 1~2분 뒤 다시 시도해 주세요.",
                retryable: true,
            };
        case "parse":
        case "shape":
            return {
                message: override ?? "서버 응답을 읽지 못했어요. 앱을 최신으로 올린 뒤 다시 시도해 주세요.",
                retryable: false,
            };
        case "envelope":
            return { message: override ?? serverMessage(error) ?? "요청을 처리하지 못했어요.", retryable: false };
        case "http": {
            const status = error.status ?? 0;
            if (status >= 500) {
                return {
                    message: override ?? "서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
                    retryable: true,
                };
            }
            if (status === 401 || status === 403) {
                return { message: override ?? "로그인이 필요해요. 다시 로그인해 주세요.", retryable: false };
            }
            if (status === 429) {
                return { message: override ?? "요청이 너무 많아요. 잠시 뒤 다시 시도해 주세요.", retryable: true };
            }
            return {
                message: override ?? serverMessage(error) ?? "요청을 처리하지 못했어요. 입력한 내용을 확인해 주세요.",
                retryable: false,
            };
        }
    }
}

/** 서버가 사용자에게 하려는 말. 너무 길거나 비어 있으면 쓰지 않는다 */
function serverMessage(error: ApiError): string | undefined {
    const message = error.envelope?.message?.trim();
    if (!message || message.length > MAX_SERVER_MESSAGE) return undefined;
    return message;
}

/** 기록은 기기에 있으므로, 서버 실패가 기록에 영향이 없다는 것을 덧붙일 때 쓴다 */
export const LOCAL_DATA_SAFE = "기록한 물건은 이 기기에 그대로 있어요.";
