import MyPage from "./myPage";

type User = {
    userIdx: number;
    loginId: string;
    name: string;
    nickname: string;
    address: string;
};

export default async function UserInfoPage({ params }: { params: { userIdx: string } }) {
    const res = await fetch(`http://localhost:8080/api/user/35`, {
        cache: "no-store",
    });
    const user: User = await res.json();
    console.log(user);
    return <MyPage user={user} />;
}
