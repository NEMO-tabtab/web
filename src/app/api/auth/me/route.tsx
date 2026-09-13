import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cookieStore = await cookies();

        const token = cookieStore.get("accessToken")?.value;
        const userIdx = cookieStore.get("userIdx")?.value;

        if (!token || !userIdx) {
            return NextResponse.json(
                {
                    success: false,
                    message: "로그인이 필요합니다.",
                },
                {
                    status: 401,
                },
            );
        }

        const res = await fetch(`${process.env.API_URL}/api/user/${userIdx}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, {
                status: res.status,
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("회원 정보 조회 오류:", error);

        return NextResponse.json(
            {
                success: false,
                message: "회원 정보 조회에 실패했습니다.",
            },
            {
                status: 500,
            },
        );
    }
}
