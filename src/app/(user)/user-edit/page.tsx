import EditProfileForm from "./EditProfileForm";

export default async function MyPage() {
    // 여기서 서버에서 유저 정보 fetch 하는 부분 페이지 연결 끝나면 로그인 후 쿠키에 저장해서 가져와야함
<<<<<<< HEAD:src/app/(user)/user-edit/page.tsx
<<<<<<< HEAD:src/app/(user)/user-edit/page.tsx
    const res = await fetch("http://3.38.247.4:8080/api/user/1", {
=======
    const res = await fetch("http://3.38.247.4:8080/api/user/36", {
>>>>>>> a0fda0c (chore: API 엔드포인트 변경):src/app/_(user)/user-edit/page.tsx.dev
=======
    const res = await fetch("http://localhost:8080/api/user/36", {
>>>>>>> 0a15d41 (chore: product 외의 페이지 엔드포인트 원복):src/app/_(user)/user-edit/page.tsx.dev
        cache: "no-store", // 항상 최신 정보 가져오기
    });
    const user = await res.json();

    return <EditProfileForm user={user} />;
}
