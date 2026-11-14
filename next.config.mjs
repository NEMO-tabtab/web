/** @type {import('next').NextConfig} */

import withPWA from "next-pwa";

// Vercel Preview 처럼 API 주소가 없는 환경에서도 빌드가 깨지지 않게, 있을 때만 이미지 도메인에 넣는다
const apiUrl = process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL) : null;

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "placehold.co",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            ...(apiUrl
                ? [
                      {
                          protocol: apiUrl.protocol.replace(":", ""),
                          hostname: apiUrl.hostname,
                          pathname: "/**",
                      },
                  ]
                : []),
        ],
    },
};

export default withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
})(nextConfig);
