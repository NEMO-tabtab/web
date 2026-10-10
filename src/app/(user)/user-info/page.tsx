import MyPage from "./myPage";

/**
 * 로그인 전에는 서버의 사용자 정보가 없다 — 기기에 저장된 내용을 보여주는 게스트 화면을 연다.
 * 정적 화면이라 서비스 워커가 미리 받아 두고 오프라인에서도 열린다.
 */
export default function Page() {
    return <MyPage />;
}
