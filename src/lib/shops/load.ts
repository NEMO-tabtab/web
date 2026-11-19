import type { ZodType } from "zod";

import {
    findMismatches,
    layoutSchema,
    machineListSchema,
    seriesListSchema,
    shopListSchema,
    type Layout,
    type MachineList,
    type SeriesList,
    type Shop,
} from "./schema";

/*
 * 굿즈샵 데이터를 읽는다. 지금은 저장소의 정적 파일(public/shops/)이다 —
 * 서비스 워커가 설치할 때 함께 받아 두므로 오프라인에서도 열린다.
 * 나중에 서버로 옮겨도 화면은 이 함수들만 쓰므로 여기만 바꾸면 된다.
 *
 *   /shops/index.json                       굿즈샵 목록
 *   /shops/series.json                      시리즈 목록
 *   /shops/layouts/{shopId}/v{version}.json 매장 구조 (한 번 낸 버전은 바꾸지 않는다)
 *   /shops/machines/{shopId}.json           기기 내용
 */

/**
 * - missing : 파일이 없다
 * - invalid : 형식에 맞지 않거나 묶음끼리 서로 맞지 않는다
 * - network : 받지 못했다 (오프라인인데 받아 둔 것도 없다)
 */
export type ShopDataErrorKind = "missing" | "invalid" | "network";

export class ShopDataError extends Error {
    constructor(
        readonly kind: ShopDataErrorKind,
        message: string,
    ) {
        super(message);
        this.name = "ShopDataError";
    }
}

async function readJson<T>(path: string, schema: ZodType<T>): Promise<T> {
    let response: Response;
    try {
        response = await fetch(path);
    } catch {
        throw new ShopDataError("network", `${path} 를 받지 못했다`);
    }
    if (response.status === 404) throw new ShopDataError("missing", `${path} 가 없다`);
    if (!response.ok) throw new ShopDataError("network", `${path}: HTTP ${response.status}`);

    let raw: unknown;
    try {
        raw = await response.json();
    } catch {
        throw new ShopDataError("invalid", `${path} 가 JSON 이 아니다`);
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        throw new ShopDataError("invalid", `${path}: ${parsed.error.issues[0]?.message ?? "형식이 맞지 않는다"}`);
    }
    return parsed.data;
}

export async function loadShops(): Promise<Shop[]> {
    return (await readJson("/shops/index.json", shopListSchema)).shops;
}

export interface ShopInterior {
    shop: Shop;
    layout: Layout;
    machines: MachineList;
    series: SeriesList;
}

/**
 * 굿즈샵 한 곳의 내부 지도에 필요한 것을 모두 읽는다.
 * 내부 지도가 아직 없는 굿즈샵(layoutVersion 없음)이나 없는 굿즈샵이면 null.
 * 묶음끼리 맞지 않으면 반쯤 맞는 지도를 그리지 않고 던진다.
 */
export async function loadShopInterior(shopId: string): Promise<ShopInterior | null> {
    const shop = (await loadShops()).find((each) => each.id === shopId);
    if (!shop || shop.layoutVersion === undefined) return null;

    const [layout, machines, series] = await Promise.all([
        readJson(`/shops/layouts/${shop.id}/v${shop.layoutVersion}.json`, layoutSchema),
        readJson(`/shops/machines/${shop.id}.json`, machineListSchema),
        readJson("/shops/series.json", seriesListSchema),
    ]);

    const problems = findMismatches(layout, machines, series);
    if (layout.shopId !== shop.id) problems.unshift("구조 파일의 굿즈샵이 다르다");
    if (problems.length > 0) throw new ShopDataError("invalid", `${shop.id}: ${problems[0]}`);

    return { shop, layout, machines, series };
}
