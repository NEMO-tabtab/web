import { defaultCache } from "@serwist/next/worker";
import {
    CacheFirst,
    CacheableResponsePlugin,
    ExpirationPlugin,
    NetworkFirst,
    Serwist,
    type PrecacheEntry,
    type SerwistGlobalConfig,
} from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        // 빌드 때 @serwist/next 가 미리 받아 둘 파일 목록으로 바꿔 넣는다
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

/** 빌드 때 이 자리 하나에만 목록이 들어간다 — 두 번 참조하면 빌드가 실패하므로 여기서 한 번만 읽는다 */
const precacheEntries = self.__SW_MANIFEST ?? [];

const RSC_CACHE = "pages-rsc-offline";

/** RSC 캐시 키 — 정적 화면의 화면 데이터는 쿼리와 상관없이 같으므로 경로만 쓴다 */
const rscCacheKey = (input: string) => {
    const url = new URL(input, self.location.origin);
    url.search = "";
    return url.href;
};

/** 미리 받아 둘 화면 주소 — 사전 캐시 목록 중 정적 파일(`/_next/…`, 확장자 있는 파일)이 아닌 것 */
const PAGE_URLS = precacheEntries
    .map((entry) => (typeof entry === "string" ? entry : entry.url))
    .filter((url) => !url.startsWith("/_next/") && !/\.[a-z0-9]+$/i.test(url));

const serwist = new Serwist({
    precacheEntries,
    precacheOptions: {
        // `/product/edit?id=…`, `/product/add?barcode=…` 처럼 쿼리가 붙어도 미리 받아 둔 같은 화면(HTML)을 쓴다.
        // 단 `_rsc` 는 남긴다 — Next 의 화면 데이터 요청에는 늘 `_rsc` 가 붙는데, 이것까지 지우면 그 요청이
        // 미리 받아 둔 HTML 경로에 걸려(Vary: RSC 불일치로 캐시는 못 쓰고) 오프라인에서 실패한다.
        ignoreURLParametersMatching: [/^(?!_rsc$)/],
        cleanupOutdatedCaches: true,
    },
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        {
            // next/font 가 내보낸 웹폰트 조각. 파일명에 해시가 있어 내용이 바뀌지 않으니 한 번 받으면 계속 쓴다.
            // 기본 규칙(최대 4개·7일)으로는 한국어 조각이 금방 밀려나 오프라인에서 글꼴이 깨진다.
            matcher: /\/_next\/static\/media\/.+\.woff2?$/i,
            handler: new CacheFirst({
                cacheName: "next-font-assets",
                plugins: [new ExpirationPlugin({ maxEntries: 400, purgeOnQuotaError: true })],
            }),
        },
        {
            // 아이콘 폰트(xi-*). 버전이 박힌 주소라 바뀌지 않는다. 기본 규칙은 1시간·24시간 뒤 만료라
            // 오프라인에서 아이콘이 사라진다. <link> 로 불러오는 CSS 는 불투명 응답(status 0)이라 함께 허용한다.
            matcher: /^https:\/\/cdn\.jsdelivr\.net\/gh\/xpressengine\/XEIcon@/i,
            handler: new CacheFirst({
                cacheName: "xeicon",
                plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
            }),
        },
        {
            // 앱 안에서 화면을 옮길 때 Next 가 받는 화면 데이터(RSC). 오프라인에서 이게 없으면 Next 가 전체 새로고침으로
            // 넘어가 화면이 한 번 깜빡인다. 정적 화면은 미리 가져오기와 실제 이동의 응답이 같고 쿼리(`_rsc`, `?id=`)와도
            // 상관없으므로(서버도 같은 프리렌더 결과를 준다), 경로만으로 저장해 두면 온라인에서 링크를 미리 가져오는
            // 것만으로 채워지고, 오프라인에서 새로 만든 물건의 `/product/edit?id=…` 도 그대로 열린다.
            matcher: ({ request, sameOrigin, url }) =>
                sameOrigin && request.headers.get("RSC") === "1" && !url.pathname.startsWith("/api/"),
            handler: new NetworkFirst({
                cacheName: RSC_CACHE,
                // 저장 키에는 RSC 헤더가 없으니 응답의 Vary 를 따지지 않는다
                matchOptions: { ignoreVary: true },
                plugins: [
                    {
                        cacheKeyWillBeUsed: async ({ request }) => rscCacheKey(request.url),
                    },
                    new ExpirationPlugin({ maxEntries: 50, purgeOnQuotaError: true }),
                ],
            }),
        },
        {
            // next/image 로 줄인 정적 이미지(기본 썸네일 등). 원본 주소에 빌드 해시가 있어 결과가 바뀌지 않는다.
            matcher: /\/_next\/image\?url=/i,
            handler: new CacheFirst({
                cacheName: "next-image-stable",
                plugins: [new ExpirationPlugin({ maxEntries: 100, purgeOnQuotaError: true })],
            }),
        },
        ...defaultCache,
    ],
    fallbacks: {
        entries: [
            {
                url: "/~offline",
                matcher: ({ request }) => request.destination === "document",
            },
        ],
    },
});

/*
 * 설치할 때 화면 데이터(RSC)도 HTML 과 함께 받아 둔다. 그래야 온라인에서 한 번도 열지 않은 화면도
 * 오프라인에서 깜빡임 없이 옮겨 간다. 실패해도 설치는 막지 않는다 — 그때는 전체 새로고침으로 열린다.
 */
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(RSC_CACHE).then((cache) =>
            Promise.all(
                PAGE_URLS.map(async (url) => {
                    try {
                        const response = await fetch(url, { headers: { RSC: "1" } });
                        if (response.ok) await cache.put(rscCacheKey(url), response);
                    } catch {
                        // 무시
                    }
                }),
            ),
        ),
    );
});

serwist.addEventListeners();
