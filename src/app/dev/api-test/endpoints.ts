import type { HttpMethod } from "@/lib/api/client";

/**
 * 콘솔에서 호출해 볼 엔드포인트 목록.
 *
 * 출처는 Swagger(https://nemo-api.onrender.com/swagger-ui/index.html) 이지만 전부 옮기지 않는다.
 * 앱 화면이 실제로 붙을 리소스(유저·상품·카테고리·바코드)만 둔다 — 관리자·알람·로그는 제외.
 * 명세가 바뀌면 여기를 손으로 맞춘다.
 */

export type EndpointGroup = "system" | "user" | "product" | "category" | "barcode";

export const ENDPOINT_GROUPS: readonly { value: EndpointGroup; label: string }[] = [
    { value: "system", label: "헬스" },
    { value: "user", label: "유저" },
    { value: "product", label: "상품" },
    { value: "category", label: "카테고리" },
    { value: "barcode", label: "바코드" },
];

export interface ParamDef {
    name: string;
    in: "path" | "query";
    required?: boolean;
    placeholder?: string;
    /** 값이 정해져 있으면 select 로 보여준다 */
    options?: readonly string[];
}

/** 템플릿이 참조하는 현재 세션 값 */
export interface TemplateContext {
    userIdx?: number;
}

export type BodyDef =
    | { type: "json"; template: (ctx: TemplateContext) => unknown }
    | {
          type: "multipart";
          /** `dto` 파트(application/json)의 초기값 */
          template: (ctx: TemplateContext) => unknown;
          /** 파일 파트의 이름 — 명세상 상품은 files[], 유저는 profileImage */
          fileField: string;
          multiple: boolean;
      };

export interface EndpointDef {
    id: string;
    group: EndpointGroup;
    method: HttpMethod;
    /** `{name}` 자리는 path 파라미터로 치환된다 */
    path: string;
    summary: string;
    note?: string;
    params?: readonly ParamDef[];
    body?: BodyDef;
    /** 되돌릴 수 없는 호출 — 실행 버튼을 두 번 눌러야 한다 */
    destructive?: boolean;
    /** 성공 응답의 `data.token` · `data.user` 를 세션으로 잡는다 */
    login?: boolean;
    /** 성공하면 세션을 비운다 */
    logout?: boolean;
}

const PAGING: readonly ParamDef[] = [
    { name: "keyword", in: "query", placeholder: "검색어" },
    { name: "searchType", in: "query", placeholder: "검색 조건" },
    { name: "page", in: "query", placeholder: "1" },
    { name: "size", in: "query", placeholder: "10" },
];

const today = () => new Date().toISOString().slice(0, 10);

export const ENDPOINTS: readonly EndpointDef[] = [
    {
        id: "health",
        group: "system",
        method: "GET",
        path: "/api/health",
        summary: "헬스체크",
        note: "서버가 잠들어 있으면 첫 응답까지 수십 초가 걸린다 (Render 무료 플랜 콜드 스타트).",
    },

    // ── 유저 ──────────────────────────────────────────────
    {
        id: "user-check-id",
        group: "user",
        method: "GET",
        path: "/api/user/checkId",
        summary: "아이디 중복 체크",
        params: [{ name: "loginId", in: "query", required: true, placeholder: "user123" }],
    },
    {
        id: "user-insert",
        group: "user",
        method: "POST",
        path: "/api/user/insert",
        summary: "회원가입",
        note: "필수: loginId · password · name · email. 프로필 이미지는 선택.",
        body: {
            type: "multipart",
            fileField: "profileImage",
            multiple: false,
            template: () => ({
                loginId: "",
                password: "",
                name: "",
                nickname: "",
                email: "",
                gender: "M",
            }),
        },
    },
    {
        id: "user-login",
        group: "user",
        method: "POST",
        path: "/api/user/login",
        summary: "로그인",
        note: "성공하면 data.token 을 이 페이지 메모리에만 잡아 두고 이후 호출에 Bearer 로 붙인다. 새로고침하면 사라진다.",
        login: true,
        body: { type: "json", template: () => ({ loginId: "", password: "" }) },
    },
    {
        id: "user-logout",
        group: "user",
        method: "POST",
        path: "/api/user/logout",
        summary: "로그아웃",
        logout: true,
    },
    {
        id: "user-detail",
        group: "user",
        method: "GET",
        path: "/api/user/{userIdx}",
        summary: "회원 상세",
        params: [{ name: "userIdx", in: "path", required: true, placeholder: "1" }],
    },
    {
        id: "user-list",
        group: "user",
        method: "GET",
        path: "/api/user/list",
        summary: "회원 목록",
        params: PAGING,
    },
    {
        id: "user-modify",
        group: "user",
        method: "PUT",
        path: "/api/user/modify",
        summary: "회원 수정",
        note: "multipart 다 — JSON 으로 보내면 실패한다.",
        body: {
            type: "multipart",
            fileField: "profileImage",
            multiple: false,
            template: ({ userIdx }) => ({ userIdx: userIdx ?? 0, nickname: "" }),
        },
    },
    {
        id: "user-exit",
        group: "user",
        method: "POST",
        path: "/api/user/exit",
        summary: "회원 탈퇴",
        note: "exitReason — 0001 이용 종료 / 0002 개인정보 / 0003 빈도 낮음 / 0004 불만족 / 0005 기타",
        destructive: true,
        body: { type: "json", template: ({ userIdx }) => ({ userIdx: userIdx ?? 0, exitReason: "0005" }) },
    },

    // ── 상품 ──────────────────────────────────────────────
    {
        id: "product-list",
        group: "product",
        method: "POST",
        path: "/api/product/list",
        summary: "상품 목록",
        note: "응답 data = { content, page, size, total }. 검색 조건은 본문에 담는다 (searchType: PRODUCT_NM · MODEL_NM · BRAND_NM).",
        body: { type: "json", template: () => ({ page: 1, size: 10, keyword: "", searchType: "PRODUCT_NM" }) },
    },
    {
        id: "product-detail",
        group: "product",
        method: "GET",
        path: "/api/product/{productIdx}",
        summary: "상품 상세",
        params: [{ name: "productIdx", in: "path", required: true, placeholder: "1" }],
    },
    {
        id: "product-insert",
        group: "product",
        method: "POST",
        path: "/api/product",
        summary: "상품 등록",
        note: "필수: productNm · userIdx. 현재 dev 서버(Postgres)에선 가격·가치·상태 등이 'MySQL 전용' 필드라 명세상 없다 — 넣어서 어떻게 되는지 확인해 볼 것. 응답에 productIdx 가 오지 않는다.",
        body: {
            type: "multipart",
            fileField: "files",
            multiple: true,
            template: ({ userIdx }) => ({
                userIdx: userIdx ?? 0,
                productNm: "",
                content: "",
                prchDate: today(),
                categoryIdx: null,
                barcode: "",
                place: "",
                placeSub: "",
            }),
        },
    },
    {
        id: "product-modify",
        group: "product",
        method: "PUT",
        path: "/api/product",
        summary: "상품 수정",
        note: "productIdx 로 대상을 고른다. 새 파일이 기존 이미지를 대체하는지 추가되는지는 명세에 없다.",
        body: {
            type: "multipart",
            fileField: "files",
            multiple: true,
            template: ({ userIdx }) => ({ productIdx: 0, userIdx: userIdx ?? 0, productNm: "" }),
        },
    },
    {
        id: "product-delete",
        group: "product",
        method: "DELETE",
        path: "/api/product/{productIdx}",
        summary: "상품 삭제",
        note: "연관 이미지도 함께 지운다.",
        destructive: true,
        params: [{ name: "productIdx", in: "path", required: true, placeholder: "1" }],
    },
    {
        id: "product-history",
        group: "product",
        method: "GET",
        path: "/api/product/{productIdx}/history",
        summary: "상품 변경 이력",
        params: [{ name: "productIdx", in: "path", required: true, placeholder: "1" }],
    },

    // ── 카테고리 ───────────────────────────────────────────
    {
        id: "category-list",
        group: "category",
        method: "GET",
        path: "/api/category/list",
        summary: "카테고리 목록",
        params: PAGING,
    },
    {
        id: "category-detail",
        group: "category",
        method: "GET",
        path: "/api/category/{categoryIdx}",
        summary: "카테고리 상세",
        params: [{ name: "categoryIdx", in: "path", required: true, placeholder: "1" }],
    },
    {
        id: "category-insert",
        group: "category",
        method: "POST",
        path: "/api/category/insert",
        summary: "카테고리 등록",
        body: {
            type: "json",
            template: ({ userIdx }) => ({ userIdx: userIdx ?? 0, categoryNm: "", emoji: "", color: "" }),
        },
    },
    {
        id: "category-modify",
        group: "category",
        method: "PUT",
        path: "/api/category/modify",
        summary: "카테고리 수정",
        body: {
            type: "json",
            template: ({ userIdx }) => ({ categoryIdx: 0, userIdx: userIdx ?? 0, categoryNm: "" }),
        },
    },
    {
        id: "category-delete",
        group: "category",
        method: "DELETE",
        path: "/api/category/{categoryIdx}",
        summary: "카테고리 삭제",
        destructive: true,
        params: [{ name: "categoryIdx", in: "path", required: true, placeholder: "1" }],
    },

    // ── 바코드 ─────────────────────────────────────────────
    {
        id: "barcode",
        group: "barcode",
        method: "GET",
        path: "/api/barcode/{barcode}",
        summary: "바코드로 상품정보 조회",
        note: "자체 DB → 외부(UPCitemdb) 순으로 찾는다. 어디에도 없으면 404 가 아니라 500 이 온다.",
        params: [{ name: "barcode", in: "path", required: true, placeholder: "8801234567890" }],
    },
    {
        id: "barcode-insert",
        group: "barcode",
        method: "POST",
        path: "/api/barcode/insert",
        summary: "바코드 정보 등록",
        note: "못 찾은 바코드를 사용자가 등록한다. 이미 있으면 덮어쓰지 않고 409. 한 번 올리면 지울 수 없다 — 시험용 바코드를 쓸 것.",
        destructive: true,
        body: {
            type: "json",
            template: () => ({ barcode: "", productNm: "", brandNm: "" }),
        },
    },
];
