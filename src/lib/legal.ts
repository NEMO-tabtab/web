/**
 * 약관·정책 문서의 주소. 내용은 Notion 에서 고치고 앱은 주소만 안다 — 문서를 고쳐도 배포할 필요가 없다.
 * Notion 이 복사할 때 붙이는 `?source=copy_link` 는 추적용 꼬리라 뺐다.
 */
export const LEGAL_DOCS = [
    {
        key: "terms",
        label: "서비스 이용약관",
        href: "https://grizzled-shadow-704.notion.site/2880ff6f71de80089009d396ef8e1e54",
    },
    {
        key: "privacy",
        label: "개인정보처리방침",
        href: "https://grizzled-shadow-704.notion.site/2880ff6f71de80568e03d69f2648a77a",
    },
] as const;

/**
 * 문서는 새 탭으로 연다. 가입 화면에서 같은 탭으로 넘어가면 적던 내용이 사라진다.
 * noopener — 열린 쪽이 window.opener 로 이 앱을 건드리지 못하게 한다.
 */
export const EXTERNAL_LINK_PROPS = { target: "_blank", rel: "noopener noreferrer" } as const;
