/*
 * 가챠 기계 카탈로그 — 기계 종류마다 실제 치수와 기준으로 삼은 기계를 적는다.
 * 그림은 compose.ts 가 이 치수로 그린다. 업적에 쓸 가챠 기계 디자인은 이 종류들을 바탕으로 만든다
 * (docs/decisions/0009-indoor-map-on-hold.md).
 *
 * 치수는 가챠 본체를 파는 곳과 안내하는 곳에 적힌 제원이다(2026-11-26 확인). 제조사의 공식 문서에서 본 값이 아니다.
 * 종류의 이름은 우리가 붙인 것이고, 기준 기계의 이름은 파는 곳에 적힌 이름을 한글로 옮긴 것이다.
 */

export const MACHINE_MODEL_IDS = ["standard-2", "half-1", "tabletop-box", "tabletop-cube", "spiral-tower"] as const;
export type MachineModelId = (typeof MACHINE_MODEL_IDS)[number];

/** 본체 크기(mm) */
export interface MachineSize {
    width: number;
    depth: number;
    height: number;
}

/** 기준으로 삼은 실제 기계 */
export interface MachineReference {
    name: string;
    /** 제원을 적은 쪽이 제조사를 밝힌 경우에만 */
    maker?: string;
    size: MachineSize;
    /** 제원을 본 곳 */
    url: string;
    note?: string;
}

export interface MachineModel {
    id: MachineModelId;
    name: string;
    /** 어떤 기계인지 한 줄 */
    summary: string;
    /** 위로 쌓인 단 수 — 단마다 통과 손잡이가 하나씩 있다 */
    tiers: number;
    /** 그림의 기준 치수(mm). references 의 첫 기계와 같다 */
    size: MachineSize;
    /** 받는 캡슐의 지름(mm) — 가장 작은 것과 가장 큰 것 */
    capsule: readonly [min: number, max: number];
    references: readonly MachineReference[];
}

const mm = (width: number, depth: number, height: number): MachineSize => ({ width, depth, height });

export const MACHINE_MODELS: readonly MachineModel[] = [
    {
        id: "standard-2",
        name: "2단 표준형",
        summary: "가챠샵의 벽과 섬을 채우는 기계. 통과 손잡이가 위아래로 두 벌이고, 옆으로 이어 붙여 줄을 만든다.",
        tiers: 2,
        size: mm(280, 450, 1300),
        capsule: [48, 75],
        references: [
            {
                name: "캡슐 스테이션 6",
                maker: "반다이",
                size: mm(280, 450, 1300),
                url: "https://gachahon.com/capsta6/",
                note: "4·5도 크기가 같다",
            },
            {
                name: "가챠 2 이지 (Gacha.2 Ez)",
                maker: "타카라토미아츠",
                size: mm(290, 450, 1275),
                url: "https://gachahon.com/g-2ez/",
            },
        ],
    },
    {
        id: "half-1",
        name: "1단 하프형",
        summary: "2단 표준형의 한 단짜리. 바퀴를 단 것, 받침을 단 것, 아무것도 달지 않은 것이 있다.",
        tiers: 1,
        size: mm(270, 450, 640),
        capsule: [48, 75],
        references: [
            {
                name: "캡슐 스테이션 6 하프 (바퀴 없음)",
                size: mm(270, 450, 640),
                url: "https://gacha-gacha.net/hon/cps/1259",
            },
            {
                name: "캡슐 스테이션 6 하프 (받침)",
                size: mm(270, 450, 645),
                url: "https://gacha-gacha.net/hon/cps/1247",
            },
            {
                name: "캡슐 스테이션 6 하프 (바퀴)",
                size: mm(270, 450, 740),
                url: "https://gacha-gacha.net/hon/cps/1268",
            },
        ],
    },
    {
        id: "tabletop-box",
        name: "탁상 상자형",
        summary: "네모난 투명 통을 몸통 위에 얹은 옛날식 탁상 기계. 메달이나 500엔 동전으로 돌린다.",
        tiers: 1,
        size: mm(230, 300, 440),
        capsule: [48, 55],
        references: [
            {
                name: "가챠 컵 (메달)",
                size: mm(230, 300, 440),
                url: "https://gacha-gacha.net/hon/gco/13428",
            },
            {
                name: "가챠 컵 L (500엔)",
                size: mm(330, 330, 560),
                url: "https://gacha-gacha.net/hon/gco/13437",
                note: "65·75mm 캡슐",
            },
        ],
    },
    {
        id: "tabletop-cube",
        name: "탁상 큐브형",
        summary: "모서리가 둥근 주사위 모양의 탁상 기계. 메달로 돌린다.",
        tiers: 1,
        size: mm(330, 360, 530),
        capsule: [48, 75],
        references: [
            {
                name: "가챠 큐브 (메달)",
                size: mm(330, 360, 530),
                url: "https://gacha-gacha.net/hon/gcu/13422",
                note: "폭은 '약 330'으로 적혀 있다. 65·75mm 캡슐은 끼움쇠를 떼고 넣는다",
            },
        ],
    },
    {
        id: "spiral-tower",
        name: "스파이럴 타워형",
        summary: "둥근 통에서 나온 캡슐이 투명 기둥의 나선을 타고 내려오는 큰 기계. 바닥에 세운다.",
        tiers: 1,
        size: mm(580, 580, 1420),
        capsule: [48, 75],
        references: [
            {
                name: "스파이랙스 2",
                size: mm(580, 580, 1420),
                url: "https://gacha-gacha.net/hon/spx/1287",
            },
            {
                name: "스파이랙스 미니",
                size: mm(580, 580, 1150),
                url: "https://gacha-gacha.net/hon/spx/3231",
            },
            {
                name: "비원 (메달)",
                size: mm(480, 480, 1175),
                url: "https://gacha-gacha.net/hon/b1/1283",
            },
        ],
    },
];

const byId = new Map<MachineModelId, MachineModel>(MACHINE_MODELS.map((model) => [model.id, model]));

export function machineModel(id: MachineModelId): MachineModel {
    const model = byId.get(id);
    if (!model) throw new Error(`없는 기계 종류다: ${id}`);
    return model;
}

/**
 * 매장 구조의 격자에 적을 때의 크기(칸). 가장 가까운 칸 수로 맞추되 한 칸보다 작아지지 않는다.
 * 2단 표준형은 폭 1칸 × 깊이 2칸 × 높이 5칸 — 결정 기록 0004 의 표준 기계와 같다.
 */
export function modelCells(model: MachineModel, cellCm = 25): { w: number; d: number; h: number } {
    const cells = (length: number) => Math.max(1, Math.round(length / 10 / cellCm));
    return { w: cells(model.size.width), d: cells(model.size.depth), h: cells(model.size.height) };
}

/** "28 × 45 × 130cm" — 폭 × 깊이 × 높이 */
export function sizeLabel(size: MachineSize): string {
    const cm = (length: number) => String(length / 10);
    return `${cm(size.width)} × ${cm(size.depth)} × ${cm(size.height)}cm`;
}
