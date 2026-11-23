import type { Slot } from "./schema";

/*
 * 기계 줄 — 나란히 붙어 한 덩어리로 보이는 기기 자리들.
 * 실제 가챠샵의 기계는 벽을 따라, 또는 등을 맞대고 줄지어 선다. 그림도 줄 단위로 테두리를 두르고
 * 앞뒤 순서를 정한다(자리 하나하나를 따로 세우면 80곳이 넘는 매장에서 선이 뭉개지고 느리다).
 */

export interface Bank {
    /** 줄의 첫 자리 id — 그릴 때의 key 로 쓴다 */
    id: string;
    /** 줄을 따라 순서대로(서쪽에서 동쪽, 또는 북쪽에서 남쪽) */
    slots: Slot[];
    x: number;
    y: number;
    w: number;
    d: number;
    h: number;
}

/** 손잡이가 남·북을 보는 기기는 동서로, 동·서를 보는 기기는 남북으로 줄을 선다 */
const runsEastWest = (slot: Slot) => slot.facing === "n" || slot.facing === "s";

/**
 * 기기 자리를 줄로 묶는다. 같은 쪽을 보고, 높이와 깊이가 같고, 사이가 뜨지 않은 것끼리 한 줄이다.
 * 혼자 선 기기는 한 자리짜리 줄이 된다.
 */
export function groupBanks(slots: readonly Slot[]): Bank[] {
    const rows = new Map<string, Slot[]>();
    for (const slot of slots) {
        // 줄이 놓인 자리(가로줄이면 y 와 깊이, 세로줄이면 x 와 폭)까지 같아야 한 줄이다
        const line = runsEastWest(slot) ? `${slot.y}/${slot.d}` : `${slot.x}/${slot.w}`;
        const key = `${slot.facing}/${slot.h}/${line}`;
        rows.set(key, [...(rows.get(key) ?? []), slot]);
    }

    const banks: Bank[] = [];
    for (const row of rows.values()) {
        const eastWest = runsEastWest(row[0]);
        const start = (slot: Slot) => (eastWest ? slot.x : slot.y);
        const end = (slot: Slot) => (eastWest ? slot.x + slot.w : slot.y + slot.d);

        let run: Slot[] = [];
        const close = () => {
            if (run.length === 0) return;
            const [first] = run;
            const last = run[run.length - 1];
            banks.push({
                id: first.id,
                slots: run,
                x: first.x,
                y: first.y,
                w: eastWest ? end(last) - first.x : first.w,
                d: eastWest ? first.d : end(last) - first.y,
                h: first.h,
            });
            run = [];
        };

        for (const slot of [...row].sort((a, b) => start(a) - start(b))) {
            if (run.length > 0 && start(slot) !== end(run[run.length - 1])) close();
            run.push(slot);
        }
        close();
    }
    return banks;
}
