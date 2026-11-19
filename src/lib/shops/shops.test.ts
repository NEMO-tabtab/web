import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { ShopDataError, loadShopInterior, loadShops } from "./load";
import { sampleLayout, sampleMachines, sampleSeries, sampleShops } from "./sample";
import {
    findMismatches,
    layoutSchema,
    machineListSchema,
    seriesListSchema,
    shopListSchema,
    type Layout,
} from "./schema";

/** 예시 구조의 첫 층을 고쳐 본다 */
const withFloor = (edit: (floor: Layout["floors"][number]) => void): Layout => {
    const layout = structuredClone(sampleLayout);
    edit(layout.floors[0]);
    return layout;
};

const firstIssue = (layout: Layout) => {
    const parsed = layoutSchema.safeParse(layout);
    return parsed.success ? null : parsed.error.issues[0].message;
};

describe("예시 굿즈샵", () => {
    it("형식에 맞고 묶음끼리도 맞는다", () => {
        expect(shopListSchema.safeParse(sampleShops).success).toBe(true);
        expect(layoutSchema.safeParse(sampleLayout).success).toBe(true);
        expect(seriesListSchema.safeParse(sampleSeries).success).toBe(true);
        expect(machineListSchema.safeParse(sampleMachines).success).toBe(true);
        expect(findMismatches(sampleLayout, sampleMachines, sampleSeries)).toEqual([]);
    });
});

describe("매장 구조 검사", () => {
    it("바닥 밖으로 나간 물체를 거른다", () => {
        expect(firstIssue(withFloor((floor) => (floor.slots[0].x = 7)))).toContain("바닥 밖");
        expect(firstIssue(withFloor((floor) => (floor.fixtures[1].d = 4)))).toContain("바닥 밖");
    });

    it("겹치는 물체를 거른다 (진열대와 기기 자리도 서로)", () => {
        expect(firstIssue(withFloor((floor) => (floor.slots[1].x = 2)))).toContain("겹친다");
        expect(firstIssue(withFloor((floor) => (floor.fixtures[1].y = 1)))).toContain("겹친다");
    });

    it("모서리만 맞닿은 것은 겹친 것이 아니다", () => {
        // slot-a(x 1~2)와 slot-b 를 바로 옆(x 3~4)에 붙인다
        expect(firstIssue(withFloor((floor) => (floor.slots[1].x = 3)))).toBeNull();
    });

    it("id 가 겹치면 거른다 — 다른 층이어도", () => {
        expect(firstIssue(withFloor((floor) => (floor.slots[1].id = "slot-a")))).toContain("id 가 겹친다");

        const twoFloors = structuredClone(sampleLayout);
        twoFloors.floors.push({ ...structuredClone(sampleLayout.floors[0]), id: "f3", label: "3층" });
        expect(firstIssue(twoFloors)).toContain("id 가 겹친다");
    });

    it("입구가 바닥 밖이면 거른다", () => {
        expect(firstIssue(withFloor((floor) => (floor.entrance = { x: 8, y: 0 })))).toContain("입구");
    });

    it("칸 단위가 정수가 아니거나 형식 버전이 다르면 거른다", () => {
        expect(layoutSchema.safeParse(withFloor((floor) => (floor.slots[0].w = 1.5))).success).toBe(false);
        expect(layoutSchema.safeParse({ ...sampleLayout, schemaVersion: 2 }).success).toBe(false);
        expect(layoutSchema.safeParse({ ...sampleLayout, cellCm: 100 }).success).toBe(false);
    });
});

describe("묶음끼리 맞는지", () => {
    const machinesWith = (edit: (machines: typeof sampleMachines) => void) => {
        const machines = structuredClone(sampleMachines);
        edit(machines);
        return findMismatches(sampleLayout, machines, sampleSeries);
    };

    it("구조에 없는 자리를 가리키는 기기", () => {
        expect(machinesWith((machines) => (machines.machines[0].slotId = "slot-z"))).toEqual([
            "구조에 없는 자리: slot-z",
        ]);
    });

    it("자리의 단 수를 넘는 기기", () => {
        expect(machinesWith((machines) => (machines.machines[2].tier = 2))[0]).toContain("2단뿐이다");
    });

    it("없는 시리즈를 가리키는 기기", () => {
        expect(machinesWith((machines) => (machines.machines[0].seriesId = "nope"))[0]).toContain("없는 시리즈");
    });

    it("같은 자리·같은 단에 기기가 두 번", () => {
        expect(machinesWith((machines) => (machines.machines[1].tier = 0))[0]).toContain("두 번");
    });

    it("다른 구조 버전에 맞춰 쓴 기기 내용", () => {
        expect(machinesWith((machines) => (machines.layoutVersion = 2))[0]).toContain("v2");
    });
});

describe("불러오기", () => {
    const files: Record<string, unknown> = {
        "/shops/index.json": sampleShops,
        "/shops/series.json": sampleSeries,
        "/shops/layouts/sample-shop/v1.json": sampleLayout,
        "/shops/machines/sample-shop.json": sampleMachines,
    };

    const serve = (overrides: Record<string, unknown> = {}) =>
        vi.stubGlobal(
            "fetch",
            vi.fn(async (input: string) => {
                const body = { ...files, ...overrides }[input];
                return body === undefined
                    ? new Response("not found", { status: 404 })
                    : new Response(typeof body === "string" ? body : JSON.stringify(body));
            }),
        );

    afterEach(() => vi.unstubAllGlobals());

    it("굿즈샵 목록을 읽는다", async () => {
        serve();
        expect((await loadShops()).map((shop) => shop.name)).toEqual(["예시 굿즈샵"]);
    });

    it("내부 지도에 필요한 것을 한 번에 읽는다 — 목록이 가리키는 구조 버전으로", async () => {
        serve();
        const interior = await loadShopInterior("sample-shop");

        expect(interior?.layout.floors[0].slots).toHaveLength(2);
        expect(interior?.machines.machines).toHaveLength(3);
        expect(fetch).toHaveBeenCalledWith("/shops/layouts/sample-shop/v1.json");
    });

    it("없는 굿즈샵, 내부 지도가 아직 없는 굿즈샵은 null", async () => {
        serve({
            "/shops/index.json": {
                schemaVersion: 1,
                shops: [{ ...sampleShops.shops[0], layoutVersion: undefined }],
            },
        });
        expect(await loadShopInterior("nowhere")).toBeNull();
        expect(await loadShopInterior("sample-shop")).toBeNull();
    });

    it("형식이 깨진 파일은 반쯤 읽지 않고 던진다", async () => {
        serve({ "/shops/layouts/sample-shop/v1.json": { ...sampleLayout, floors: [] } });
        await expect(loadShopInterior("sample-shop")).rejects.toMatchObject({ name: "ShopDataError", kind: "invalid" });

        serve({ "/shops/series.json": "<html>" });
        await expect(loadShopInterior("sample-shop")).rejects.toMatchObject({ kind: "invalid" });
    });

    it("묶음끼리 맞지 않으면 던진다", async () => {
        serve({ "/shops/series.json": { schemaVersion: 1, series: [] } });
        const error = await loadShopInterior("sample-shop").catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ShopDataError);
        expect((error as ShopDataError).message).toContain("없는 시리즈");
    });

    it("파일이 없으면 missing, 받지 못하면 network", async () => {
        serve({ "/shops/machines/sample-shop.json": undefined });
        await expect(loadShopInterior("sample-shop")).rejects.toMatchObject({ kind: "missing" });

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new TypeError("Failed to fetch");
            }),
        );
        await expect(loadShops()).rejects.toMatchObject({ kind: "network" });
    });
});

describe("저장소에 든 실제 데이터 (public/shops)", () => {
    const root = path.join(process.cwd(), "public/shops");
    const read = (file: string) => JSON.parse(readFileSync(path.join(root, file), "utf8")) as unknown;
    const jsonFiles = (dir: string): string[] => {
        try {
            return readdirSync(path.join(root, dir))
                .filter((name) => !name.startsWith("."))
                .flatMap((name) => {
                    const relative = path.join(dir, name);
                    return statSync(path.join(root, relative)).isDirectory() ? jsonFiles(relative) : [relative];
                });
        } catch {
            return [];
        }
    };

    it("목록과 시리즈가 형식에 맞는다", () => {
        expect(shopListSchema.safeParse(read("index.json")).success).toBe(true);
        expect(seriesListSchema.safeParse(read("series.json")).success).toBe(true);
    });

    it("내부 지도가 있다고 적힌 굿즈샵은 구조·기기 내용이 있고 서로 맞는다", () => {
        const { shops } = shopListSchema.parse(read("index.json"));
        const series = seriesListSchema.parse(read("series.json"));

        for (const shop of shops) {
            if (shop.layoutVersion === undefined) continue;
            const layout = layoutSchema.parse(read(`layouts/${shop.id}/v${shop.layoutVersion}.json`));
            const machines = machineListSchema.parse(read(`machines/${shop.id}.json`));
            expect(layout.shopId).toBe(shop.id);
            expect(findMismatches(layout, machines, series)).toEqual([]);
        }
    });

    it("구조 파일은 모두 형식에 맞고, 경로의 굿즈샵·버전과 내용이 같다", () => {
        for (const file of jsonFiles("layouts")) {
            const layout = layoutSchema.parse(read(file));
            expect(file).toBe(path.join("layouts", layout.shopId, `v${layout.version}.json`));
        }
    });
});
