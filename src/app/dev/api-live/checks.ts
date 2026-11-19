import { checkLoginId } from "@/lib/api/auth";
import { lookupBarcode } from "@/lib/api/barcode";
import {
    checkHealth,
    getServerAlarm,
    getServerCategory,
    getServerProduct,
    listServerAlarms,
    listServerCategories,
} from "@/lib/api/read";

/**
 * 연결을 확인할 조회 함수 목록. 읽기(GET)만 넣는다 —
 * 로그인·가입·수정·삭제와, 개인정보가 나오는 사용자·관리자 조회는 넣지 않는다.
 */
export interface LiveCheck {
    id: string;
    title: string;
    /** 화면이 부를 함수 */
    call: string;
    endpoint: string;
    input?: { label: string; initial: string; inputMode?: "numeric" | "text" };
    /** 돌려준 값이 null 이면 "없음"으로 보여 준다 */
    run: (input: string) => Promise<unknown>;
}

const toId = (input: string) => {
    const id = Number(input);
    if (!Number.isInteger(id) || id < 1) throw new Error("1 이상의 숫자를 넣어 주세요.");
    return id;
};

export const LIVE_CHECKS: LiveCheck[] = [
    {
        id: "health",
        title: "서버 상태",
        call: "checkHealth()",
        endpoint: "GET /api/health",
        run: async () => {
            await checkHealth();
            return "서버가 깨어 있어요.";
        },
    },
    {
        id: "barcode",
        title: "바코드로 상품 정보 찾기",
        call: "lookupBarcode(barcode)",
        endpoint: "GET /api/barcode/{barcode}",
        input: { label: "바코드", initial: "8801234567890", inputMode: "numeric" },
        run: (input) => lookupBarcode(input),
    },
    {
        id: "check-id",
        title: "아이디 중복 확인",
        call: "checkLoginId(loginId)",
        endpoint: "GET /api/user/checkId",
        input: { label: "아이디", initial: "nemo01" },
        run: (input) => checkLoginId(input.trim()),
    },
    {
        id: "product",
        title: "상품 한 건",
        call: "getServerProduct(productIdx)",
        endpoint: "GET /api/product/{productIdx}",
        input: { label: "상품 번호", initial: "1", inputMode: "numeric" },
        run: (input) => getServerProduct(toId(input)),
    },
    {
        id: "categories",
        title: "카테고리 목록",
        call: "listServerCategories()",
        endpoint: "GET /api/category/list",
        run: () => listServerCategories(),
    },
    {
        id: "category",
        title: "카테고리 한 건",
        call: "getServerCategory(categoryIdx)",
        endpoint: "GET /api/category/{categoryIdx}",
        input: { label: "카테고리 번호", initial: "1", inputMode: "numeric" },
        run: (input) => getServerCategory(toId(input)),
    },
    {
        id: "alarms",
        title: "알람 목록",
        call: "listServerAlarms()",
        endpoint: "GET /api/alarm/list",
        run: () => listServerAlarms(),
    },
    {
        id: "alarm",
        title: "알람 한 건",
        call: "getServerAlarm(alarmIdx)",
        endpoint: "GET /api/alarm/{alarmIdx}",
        input: { label: "알람 번호", initial: "1", inputMode: "numeric" },
        run: (input) => getServerAlarm(toId(input)),
    },
];
