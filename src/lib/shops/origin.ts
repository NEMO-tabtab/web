import type { ProductOrigin } from "@/lib/db";
import type { SlotInfo } from "./contents";
import type { Floor, Layout, Shop } from "./schema";

/*
 * 물건의 "뽑은 곳"(ProductOrigin)을 만들고 글로 옮긴다.
 * 고른 순간의 이름·번호를 그대로 적어 두므로, 굿즈샵 데이터가 나중에 바뀌어도 기록은 그대로 읽힌다.
 */

/** 고른 굿즈샵·기기·단으로 뽑은 곳을 만든다. 그 기기에 없는 단이면 던진다 */
export function makeOrigin(shop: Shop, layout: Layout, floor: Floor, info: SlotInfo, tier: number): ProductOrigin {
    const content = info.tiers.find((each) => each.tier === tier);
    if (!content) throw new Error(`${info.slot.id} 기기에는 ${tier + 1}단이 없다`);
    return {
        shopId: shop.id,
        shopName: shop.name,
        layoutVersion: layout.version,
        floorId: floor.id,
        floorLabel: floor.label,
        slotId: info.slot.id,
        machineNumber: info.number,
        tier,
        seriesId: content.series?.id ?? null,
        seriesName: content.series?.name ?? null,
    };
}

/** "1층 3번 기기 2단" */
export const originPlace = (origin: ProductOrigin) =>
    `${origin.floorLabel} ${origin.machineNumber}번 기기 ${origin.tier + 1}단`;

/** "네모 가상 굿즈샵 · 1층 3번 기기 2단" */
export const originLabel = (origin: ProductOrigin) => `${origin.shopName} · ${originPlace(origin)}`;

/** 물건 카드처럼 좁은 곳에 쓸 짧은 글 — "네모 가상 굿즈샵 · 3번 기기" */
export const originShort = (origin: ProductOrigin) => `${origin.shopName} · ${origin.machineNumber}번 기기`;

/** 그 굿즈샵 내부 지도에서 그 기기를 표시한 채로 여는 주소 */
export const originHref = (origin: ProductOrigin) =>
    `/shops/view?${new URLSearchParams({ id: origin.shopId, slot: origin.slotId })}`;
