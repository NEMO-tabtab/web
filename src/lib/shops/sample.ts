import type { Layout, MachineList, SeriesList, ShopList } from "./schema";

/*
 * 형식을 보여 주는 가짜 굿즈샵. 실제 매장이 아니다 — 테스트와 화면 개발에만 쓰고 public/ 에는 넣지 않는다.
 *
 * 바닥 8×6칸(4m×3m). 북쪽 벽에 기기 자리 둘, 가운데 진열대, 남쪽 가운데가 입구.
 *
 *      0 1 2 3 4 5 6 7
 *   0  W W W W W W W W      W 벽
 *   1  . A A . B B . .      A, B 기기 자리 (남쪽을 본다)
 *   2  . . . . . . . .      S 진열대
 *   3  . . S S S . . C      C 계산대
 *   4  . . . . . . . C
 *   5  . . . E . . . .      E 입구
 */

export const sampleShops: ShopList = {
    schemaVersion: 1,
    shops: [
        {
            id: "sample-shop",
            name: "예시 굿즈샵",
            address: "서울특별시 예시구 예시로 1",
            floorNote: "2층",
            lat: 37.5665,
            lng: 126.978,
            layoutVersion: 1,
        },
    ],
};

export const sampleLayout: Layout = {
    schemaVersion: 1,
    shopId: "sample-shop",
    version: 1,
    cellCm: 50,
    floors: [
        {
            id: "f2",
            label: "2층",
            width: 8,
            depth: 6,
            entrance: { x: 3, y: 5 },
            fixtures: [
                { id: "wall-north", kind: "wall", x: 0, y: 0, w: 8, d: 1, h: 5 },
                { id: "shelf-center", kind: "shelf", x: 2, y: 3, w: 3, d: 1, h: 3 },
                { id: "counter", kind: "counter", x: 7, y: 3, w: 1, d: 2, h: 2 },
            ],
            slots: [
                { id: "slot-a", x: 1, y: 1, w: 2, d: 1, h: 4, facing: "s", tiers: 2 },
                { id: "slot-b", x: 4, y: 1, w: 2, d: 1, h: 4, facing: "s", tiers: 2 },
            ],
        },
    ],
};

export const sampleSeries: SeriesList = {
    schemaVersion: 1,
    series: [
        { id: "sample-cats", name: "예시 고양이 피규어", price: 3000 },
        { id: "sample-bread", name: "예시 빵 키링", price: 4000 },
    ],
};

export const sampleMachines: MachineList = {
    schemaVersion: 1,
    shopId: "sample-shop",
    layoutVersion: 1,
    machines: [
        { slotId: "slot-a", tier: 0, seriesId: "sample-cats", lastVerifiedAt: "2026-11-20" },
        { slotId: "slot-a", tier: 1, seriesId: "sample-bread", lastVerifiedAt: "2026-11-20" },
        { slotId: "slot-b", tier: 0, seriesId: "sample-cats", lastVerifiedAt: "2026-11-20" },
    ],
};
