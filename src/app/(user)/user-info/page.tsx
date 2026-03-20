import MyPage from "./myPage";

type User = {
    userIdx: number;
    loginId: string;
    name: string;
    nickname: string;
    address: string;
};

export default async function Page() {
    const res = await fetch("http://3.38.247.4:8080/api/user/1", {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("유저 정보를 불러오지 못했습니다.");
    }
    console.log(res);
    const user: User = await res.json();

    return <MyPage user={user} />;
}
