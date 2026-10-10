/** @type {import('next').NextConfig} */

import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import withSerwistInit from "@serwist/next";

/**
 * 오프라인에서도 바로 열려야 하는 화면. 서비스 워커가 설치될 때 HTML 을 미리 받아 둔다.
 * 제품 수정은 `/product/edit?id=…` 하나의 정적 화면이라 id 와 상관없이 같은 HTML 로 열린다.
 * 서버에서 그리는 화면(`/user-edit`)과 개발용 문서(`/design-system`)는 넣지 않는다.
 */
const OFFLINE_PAGES = [
    "/",
    "/product",
    "/product/add",
    "/product/edit",
    "/barcode",
    "/analysis",
    "/user-info",
    "/login",
    "/signup",
    "/~offline",
];

/** HTML 은 해시가 박힌 청크를 가리키므로 빌드마다 새로 받아야 한다 */
const buildRevision = randomUUID();

/**
 * `additionalPrecacheEntries` 를 직접 주면 Serwist 가 public/ 을 훑지 않는다. 그래서 같은 일을 여기서 한다.
 * 외장 드라이브에서 생기는 `._*`, 서비스 워커 산출물, `.well-known` 은 뺀다.
 */
function publicEntries(dir = "public", base = "") {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        if (entry.name.startsWith(".")) return [];
        if (/^(sw\.js|swe-worker-.*|workbox-.*)$/.test(entry.name)) return [];
        const full = path.join(dir, entry.name);
        const url = `${base}/${entry.name}`;
        if (entry.isDirectory()) return publicEntries(full, url);
        return [{ url, revision: createHash("md5").update(readFileSync(full)).digest("hex") }];
    });
}

const withSerwist = withSerwistInit({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    // 개발 서버에서는 캐시가 코드 수정을 가리지 않도록 끈다
    disable: process.env.NODE_ENV === "development",
    // 오프라인 → 온라인 전환 때 화면을 새로고침하지 않는다. 데이터는 기기에 있으니 그대로 쓰면 된다
    reloadOnOnline: false,
    // 앞 두 개는 Serwist 기본값. 웹폰트는 한국어 유니코드 조각이 300개(약 38MB)라 설치 때 전부 받지 않고,
    // 화면에서 실제로 쓴 조각만 sw.ts 의 런타임 캐시가 담는다
    exclude: [/\.map$/, /^manifest.*\.js$/, /\.woff2?$/],
    additionalPrecacheEntries: [
        ...OFFLINE_PAGES.map((url) => ({ url, revision: buildRevision })),
        ...publicEntries(),
    ],
});

// 로컬 모드는 API 주소 없이도 빌드돼야 한다 — 값이 있을 때만 이미지 호스트를 허용한다
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

export default withSerwist(nextConfig);
