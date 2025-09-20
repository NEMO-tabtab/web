import MyPage from "./myPage";

type User = {
    userIdx: number;
    loginId: string;
    name: string;
    nickname: string;
    address: string;
};

export default async function UserInfoPage({ params }: { params: { userIdx: string } }) {
    // 현재 하드코딩 유저정보 받아옴 => 추후 서버로 api 요청하도록 localhost 부분도 수정 해야함
    const res = await fetch(`http://localhost:8080/api/user/36`, {
        cache: "no-store",
    });
    const user: User = await res.json();
    return <MyPage user={user} />;
}
