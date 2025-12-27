import EditProfileForm from "./EditProfileForm";

export default async function MyPage() {
    // 여기서 서버에서 유저 정보 fetch 하는 부분 페이지 연결 끝나면 로그인 후 쿠키에 저장해서 가져와야함
    const res = await fetch("http://localhost:8080/api/user/36", {
        cache: "no-store", // 항상 최신 정보 가져오기
    });
    const user = await res.json();

    return <EditProfileForm user={user} />;
}
