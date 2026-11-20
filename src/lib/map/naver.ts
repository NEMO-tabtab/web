/*
 * 네이버 지도(네이버 클라우드 플랫폼 Maps, Web Dynamic Map)를 부르는 곳은 이 파일 하나다
 * (docs/decisions/0004-map-and-indoor-map.md). 지도 서비스를 바꿀 때는 여기만 바꾼다.
 *
 * 키는 브라우저에 드러나는 Client ID(`ncpKeyId`)뿐이다. 콘솔에 등록한 서비스 URL 에서만 동작한다.
 * Client Secret 이 필요한 API(Geocoding 등)는 여기서 부르지 않는다.
 */

const KEY_ID = process.env.NEXT_PUBLIC_NAVER_MAP_KEY_ID ?? "";
/** Style Editor 에서 발행한 흑백 스타일. 없으면 기본 지도로 그린다 */
const STYLE_ID = process.env.NEXT_PUBLIC_NAVER_MAP_STYLE_ID ?? "";

/** 처음 보여 줄 곳 — 굿즈샵이 하나도 없을 때 서울시청 */
const FALLBACK_CENTER = { lat: 37.5666, lng: 126.9784 };
const SHOP_ZOOM = 16;

/**
 * - no-key  : 키가 설정되지 않았다
 * - offline : 인터넷에 연결되어 있지 않다
 * - auth    : 키가 틀렸거나 이 주소가 콘솔에 등록되지 않았다
 * - load    : 그 밖의 이유로 지도 스크립트를 받지 못했다
 */
export type MapProblem = "no-key" | "offline" | "auth" | "load";

export class MapUnavailableError extends Error {
    constructor(readonly problem: MapProblem) {
        super(`네이버 지도를 쓸 수 없다: ${problem}`);
        this.name = "MapUnavailableError";
    }
}

export interface MapShop {
    id: string;
    name: string;
    lat: number;
    lng: number;
}

/* 이 파일에서 쓰는 만큼만 적은 네이버 지도 API 의 모양 */
type LatLng = object;
interface NaverMap {
    fitBounds(bounds: LatLngBounds, margin?: { top: number; right: number; bottom: number; left: number }): void;
    destroy(): void;
}
interface LatLngBounds {
    extend(point: LatLng): void;
}
interface Marker {
    setMap(map: NaverMap | null): void;
}
interface NaverMaps {
    /** 지도 라이브러리를 모두 받아 쓸 수 있게 되면 true */
    jsContentLoaded?: boolean;
    Map: new (element: HTMLElement, options: Record<string, unknown>) => NaverMap;
    LatLng: new (lat: number, lng: number) => LatLng;
    LatLngBounds: new (southWest: LatLng, northEast: LatLng) => LatLngBounds;
    Marker: new (options: Record<string, unknown>) => Marker;
    Point: new (x: number, y: number) => object;
    Event: { addListener(target: object, name: string, listener: () => void): unknown };
}

declare global {
    interface Window {
        naver?: { maps?: NaverMaps };
        /** 네이버 지도가 인증에 실패하면 부르는 함수 (이름은 네이버가 정했다) */
        navermap_authFailure?: () => void;
        /** 스크립트를 다 받으면 네이버가 부르는 함수 (주소의 callback 으로 이름을 넘긴다) */
        __nemoNaverMapReady?: () => void;
    }
}

export const isMapConfigured = () => KEY_ID !== "";

/** 지도 스크립트 주소. 흑백 스타일을 쓰려면 GL 서브 모듈이 필요하다 */
export function naverScriptUrl(keyId: string, styleId: string): string {
    const params = new URLSearchParams({ ncpKeyId: keyId, callback: "__nemoNaverMapReady" });
    if (styleId) params.set("submodules", "gl");
    return `https://oapi.map.naver.com/openapi/v3/maps.js?${params}`;
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/**
 * 굿즈샵 마커 — 지도 위에 붙인 이름표 스티커. 공통 부품과 같은 토큰을 쓴다.
 * 마커는 지도 라이브러리가 DOM 으로 그리므로 문자열 HTML 이다. 이름은 반드시 이스케이프한다.
 */
export function markerHtml(name: string): string {
    return (
        `<div class="sticker sticker-press rounded-full bg-paper px-3 py-1.5 text-[13px] font-bold text-ink whitespace-nowrap cursor-pointer select-none">` +
        `${escapeHtml(name)}</div>`
    );
}

let loading: Promise<NaverMaps> | null = null;
let authFailed = false;
const authListeners = new Set<() => void>();

/** 키가 틀렸을 때 알림을 받는다. 지도를 만든 뒤에 늦게 올 수 있다. 해제 함수를 돌려준다 */
export function onMapAuthFailure(listener: () => void): () => void {
    if (authFailed) listener();
    authListeners.add(listener);
    return () => authListeners.delete(listener);
}

/** 스크립트를 받은 뒤 이 시간 안에 지도 라이브러리가 준비되지 않으면 실패로 본다 */
const READY_TIMEOUT_MS = 15_000;

/** 네이버 지도 스크립트를 한 번만 받는다. 실패하면 다음에 다시 시도할 수 있게 비워 둔다 */
function loadNaverMaps(): Promise<NaverMaps> {
    if (!KEY_ID) return Promise.reject(new MapUnavailableError("no-key"));
    if (authFailed) return Promise.reject(new MapUnavailableError("auth"));
    if (window.naver?.maps?.jsContentLoaded) return Promise.resolve(window.naver.maps);
    // 받다가 실패할 것이 뻔하면 기다리지 않는다
    if (!navigator.onLine) return Promise.reject(new MapUnavailableError("offline"));

    loading ??= new Promise<NaverMaps>((resolve, reject) => {
        window.navermap_authFailure = () => {
            authFailed = true;
            reject(new MapUnavailableError("auth"));
            // 받는 쪽 하나가 실패해도 나머지는 알림을 받아야 한다
            authListeners.forEach((listener) => {
                try {
                    listener();
                } catch (error) {
                    console.error(error);
                }
            });
        };
        // 네이버는 준비 함수(callback)를 window.naver.maps 를 만들기 전에 부른다(2026-11-21 확인).
        // 그래서 부름을 받으면 라이브러리가 실제로 준비될 때까지 잠깐씩 다시 본다
        const startedAt = Date.now();
        const waitUntilReady = () => {
            const maps = window.naver?.maps;
            if (maps?.jsContentLoaded) resolve(maps);
            else if (Date.now() - startedAt > READY_TIMEOUT_MS) reject(new MapUnavailableError("load"));
            else window.setTimeout(waitUntilReady, 50);
        };
        window.__nemoNaverMapReady = waitUntilReady;

        const script = document.createElement("script");
        script.src = naverScriptUrl(KEY_ID, STYLE_ID);
        script.async = true;
        script.onerror = () => {
            loading = null;
            script.remove();
            reject(new MapUnavailableError(navigator.onLine ? "load" : "offline"));
        };
        document.head.appendChild(script);
    });
    return loading;
}

export interface ShopMapHandle {
    destroy(): void;
}

/**
 * 굿즈샵 지도를 그린다. 굿즈샵이 하나면 그곳을 가운데에, 여럿이면 모두 보이게 맞춘다.
 * 마커를 누르면 onSelect(굿즈샵 id). 쓸 수 없으면 MapUnavailableError 를 던진다.
 */
export async function createShopMap(
    element: HTMLElement,
    shops: readonly MapShop[],
    onSelect: (shopId: string) => void,
): Promise<ShopMapHandle> {
    const maps = await loadNaverMaps();
    const first = shops[0] ?? FALLBACK_CENTER;

    const map = new maps.Map(element, {
        center: new maps.LatLng(first.lat, first.lng),
        zoom: SHOP_ZOOM,
        // 지도 위에는 굿즈샵 이름표만 둔다. 확대·축소는 손가락으로 한다
        scaleControl: false,
        mapDataControl: false,
        ...(STYLE_ID ? { gl: true, customStyleId: STYLE_ID } : {}),
    });

    const markers = shops.map((shop) => {
        const marker = new maps.Marker({
            map,
            position: new maps.LatLng(shop.lat, shop.lng),
            title: shop.name,
            icon: { content: markerHtml(shop.name), anchor: new maps.Point(12, 36) },
        });
        maps.Event.addListener(marker, "click", () => onSelect(shop.id));
        return marker;
    });

    if (shops.length > 1) {
        const bounds = new maps.LatLngBounds(
            new maps.LatLng(Math.min(...shops.map((s) => s.lat)), Math.min(...shops.map((s) => s.lng))),
            new maps.LatLng(Math.max(...shops.map((s) => s.lat)), Math.max(...shops.map((s) => s.lng))),
        );
        map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    }

    return {
        destroy() {
            try {
                markers.forEach((marker) => marker.setMap(null));
                map.destroy();
            } catch {
                // 인증에 실패하면 네이버가 지도 라이브러리를 먼저 거둬 가서 정리가 실패한다. 지울 것도 남지 않았으므로 무시한다
            }
        },
    };
}
