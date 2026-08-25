/** @type {import('next').NextConfig} */

import withPWA from "next-pwa";

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
                protocol: 'https',
                hostname: 'nemo-api.onrender.com',
                pathname: '/**',
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
