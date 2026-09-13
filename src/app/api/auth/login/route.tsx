import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const res = await fetch(`${process.env.API_URL}/api/user/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            return NextResponse.json(data, {
                status: res.status,
            });
        }

        const token = data.data.token;
        const user = data.data.user;

        const loginUser = {
            userIdx: user.userIdx,
            loginId: user.loginId,
            name: user.name,
            nickname: user.nickname,
            email: user.email,
        };

        const response = NextResponse.json({
            success: true,
            message: data.message,
            data: {
                user: loginUser,
            },
        });

        response.cookies.set("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        response.cookies.set("userIdx", String(user.userIdx), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        return response;
    } catch (error) {
        console.error("로그인 API 오류:", error);

        return NextResponse.json(
            {
                success: false,
                message: "로그인 처리 중 오류가 발생했습니다.",
            },
            {
                status: 500,
            },
        );
    }
}
