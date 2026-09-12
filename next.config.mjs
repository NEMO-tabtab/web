/** @type {import('next').NextConfig} */

import withPWA from "next-pwa";

const apiUrl = new URL(process.env.API_URL);

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
            {
                protocol: apiUrl.protocol.replace(":", ""),
                hostname: apiUrl.hostname,
                pathname: "/**",
            },
        ],
    },
};

export default withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
})(nextConfig);
