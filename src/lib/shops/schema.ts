import { z } from "zod";

/*
 * 굿즈샵 데이터 형식 (docs/decisions/0004-map-and-indoor-map.md).
 *
 * 바뀌는 주기별로 네 묶음으로 나눈다:
 *   굿즈샵 목록   이름·좌표. 어느 구조 버전이 최신인지도 여기서 가리킨다
 *   매장 구조     벽·진열대·기기 자리. 위에서 내려다본 2D 격자(1칸 = 50cm)
 *   기기 내용     자리마다 어떤 시리즈가 들어 있는지 — 자주 바뀐다
 *   시리즈        이름·가격. 기기는 시리즈를 복사하지 않고 id 로 가리킨다
 *
 * 형식을 바꾸면 SCHEMA_VERSION 을 올리고, 이전 버전을 읽는 변환도 함께 넣을 것.
 */

export const SHOP_SCHEMA_VERSION = 1;
/** 격자 한 칸의 실제 길이(cm) */
export const CELL_CM = 50;

/** 주소·파일 경로에 들어가는 이름 — 영문 소문자·숫자·하이픈 */
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const cells = z.number().int().nonnegative();
const size = z.number().int().min(1);
const version = z.number().int().min(1);
const schemaVersion = z.literal(SHOP_SCHEMA_VERSION);
/** 날짜만 — "2026-11-20" */
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** 바닥에 놓인 상자. x 는 동쪽으로, y 는 남쪽으로 늘어난다(북서쪽 모서리가 0,0). 높이 h 도 칸 단위다 */
const box = {
    x: cells,
    y: cells,
    /** 동서 길이(칸) */
    w: size,
    /** 남북 길이(칸) */
    d: size,
    /** 높이(칸). 4칸 = 2m */
    h: size,
};

export const FIXTURE_KINDS = ["wall", "pillar", "counter", "shelf"] as const;
export const FACINGS = ["n", "e", "s", "w"] as const;

const fixtureSchema = z.object({
    id,
    kind: z.enum(FIXTURE_KINDS),
    ...box,
});

/** 가챠 기기가 놓이는 자리. 한 자리에 기기가 위로 여러 단 쌓인다 */
const slotSchema = z.object({
    id,
    ...box,
    /** 손잡이가 향하는 쪽 */
    facing: z.enum(FACINGS),
    /** 위로 쌓인 단 수. 단 번호는 아래부터 0 */
    tiers: z.number().int().min(1).max(6),
});

const floorSchema = z.object({
    id,
    /** 화면에 보일 이름 — "1층", "B1" */
    label: z.string().min(1),
    /** 바닥 크기(칸) */
    width: size,
    depth: size,
    /** 입구가 있는 바닥 칸 — 지도를 처음 보여 줄 방향과 "입구 쪽" 안내에 쓴다 */
    entrance: z.object({ x: cells, y: cells }),
    fixtures: z.array(fixtureSchema),
    slots: z.array(slotSchema),
});

type Footprint = { id: string; x: number; y: number; w: number; d: number };

const overlaps = (a: Footprint, b: Footprint) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.d && b.y < a.y + a.d;

export const layoutSchema = z
    .object({
        schemaVersion,
        shopId: id,
        /** 구조가 바뀔 때마다 올린다. 한 번 낸 버전의 내용은 바꾸지 않는다 */
        version,
        cellCm: z.literal(CELL_CM),
        floors: z.array(floorSchema).min(1),
    })
    .superRefine((layout, context) => {
        const issue = (message: string) => context.addIssue({ code: "custom", message });
        const seen = new Set<string>();

        for (const floor of layout.floors) {
            if (seen.has(floor.id)) issue(`층 id 가 겹친다: ${floor.id}`);
            seen.add(floor.id);

            if (floor.entrance.x >= floor.width || floor.entrance.y >= floor.depth) {
                issue(`${floor.id}: 입구가 바닥 밖에 있다`);
            }

            // 벽·진열대와 기기 자리는 같은 바닥을 나눠 쓴다 — 서로 겹치면 안 된다
            const placed: Footprint[] = [];
            for (const item of [...floor.fixtures, ...floor.slots]) {
                // 자리 id 는 기기 내용이 층 구분 없이 가리키므로 매장 전체에서 하나여야 한다
                if (seen.has(item.id)) issue(`id 가 겹친다: ${item.id}`);
                seen.add(item.id);

                if (item.x + item.w > floor.width || item.y + item.d > floor.depth) {
                    issue(`${floor.id}/${item.id}: 바닥 밖으로 나간다`);
                }
                const hit = placed.find((other) => overlaps(item, other));
                if (hit) issue(`${floor.id}: ${item.id} 와 ${hit.id} 가 겹친다`);
                placed.push(item);
            }
        }
    });

export const seriesListSchema = z
    .object({
        schemaVersion,
        series: z.array(
            z.object({
                id,
                name: z.string().min(1),
                /** 한 번 돌리는 값(원) */
                price: z.number().int().nonnegative(),
                /** 저장소 안의 이미지 경로. 이용 허락을 확인한 것만 넣는다 */
                image: z.string().startsWith("/").optional(),
            }),
        ),
    })
    .superRefine((list, context) => {
        const ids = list.series.map((series) => series.id);
        if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: "시리즈 id 가 겹친다" });
    });

export const machineListSchema = z.object({
    schemaVersion,
    shopId: id,
    /** 이 내용이 맞춰 쓰인 구조 버전 */
    layoutVersion: version,
    machines: z.array(
        z.object({
            slotId: id,
            /** 아래부터 0 */
            tier: z.number().int().nonnegative(),
            seriesId: id,
            /** 사람이 현장에서 마지막으로 확인한 날. 오래되면 화면에서 "확인이 오래됐다"고 알린다 */
            lastVerifiedAt: day,
        }),
    ),
});

export const shopListSchema = z
    .object({
        schemaVersion,
        shops: z.array(
            z.object({
                id,
                name: z.string().min(1),
                address: z.string().min(1),
                /** 건물 안의 위치 — "2층", "지하 1층 A-12" */
                floorNote: z.string().optional(),
                lat: z.number().min(-90).max(90),
                lng: z.number().min(-180).max(180),
                /** 지금 보여 줄 매장 구조의 버전. 내부 지도가 아직 없으면 뺀다 */
                layoutVersion: version.optional(),
            }),
        ),
    })
    .superRefine((list, context) => {
        const ids = list.shops.map((shop) => shop.id);
        if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: "굿즈샵 id 가 겹친다" });
    });

export type ShopList = z.infer<typeof shopListSchema>;
export type Shop = ShopList["shops"][number];
export type Layout = z.infer<typeof layoutSchema>;
export type Floor = Layout["floors"][number];
export type Fixture = Floor["fixtures"][number];
export type Slot = Floor["slots"][number];
export type SeriesList = z.infer<typeof seriesListSchema>;
export type Series = SeriesList["series"][number];
export type MachineList = z.infer<typeof machineListSchema>;
export type Machine = MachineList["machines"][number];

/**
 * 따로 읽은 묶음들이 서로 맞는지 본다 — 기기 내용이 구조에 없는 자리나 없는 시리즈를 가리키면 안 된다.
 * 맞지 않는 점을 글로 돌려준다(빈 배열이면 맞는다).
 */
export function findMismatches(layout: Layout, machines: MachineList, series: SeriesList): string[] {
    const problems: string[] = [];
    if (machines.shopId !== layout.shopId) problems.push("기기 내용과 구조의 굿즈샵이 다르다");
    if (machines.layoutVersion !== layout.version) {
        problems.push(`기기 내용은 구조 v${machines.layoutVersion} 용인데 구조는 v${layout.version} 이다`);
    }

    const slots = new Map(layout.floors.flatMap((floor) => floor.slots).map((slot) => [slot.id, slot]));
    const seriesIds = new Set(series.series.map((each) => each.id));
    const taken = new Set<string>();

    for (const machine of machines.machines) {
        const where = `${machine.slotId} ${machine.tier}단`;
        const slot = slots.get(machine.slotId);
        if (!slot) problems.push(`구조에 없는 자리: ${machine.slotId}`);
        else if (machine.tier >= slot.tiers) problems.push(`${where}: 그 자리는 ${slot.tiers}단뿐이다`);

        if (!seriesIds.has(machine.seriesId)) problems.push(`${where}: 없는 시리즈 ${machine.seriesId}`);

        if (taken.has(where)) problems.push(`${where}: 기기가 두 번 적혀 있다`);
        taken.add(where);
    }
    return problems;
}
