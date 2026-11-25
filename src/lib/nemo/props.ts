import { circle, point, roundRect } from "./path";
import type { Stroke } from "./types";

/*
 * 소품 — 네모가 손(팔의 끝)에 든 것. `Icon` 과 같은 결의 먹선으로 그리고 종이로 채운다.
 * 좌표는 전신과 같은 120칸 캔버스이고, 팔을 내민 쪽으로 캔버스를 조금 넘는다(자세의 box 가 그만큼 넓다).
 * 몸보다 뒤에 그릴 것은 없다 — 모두 몸 앞이나 옆에 온다.
 */

const line = (d: string, w: number): Stroke => ({ d, w });
const sheet = (d: string, w: number = 4.5): Stroke => ({ d, fill: "paper", w });

export const PROPS = {
    /** 캡슐 — 열린 뚜껑 위로 떨어진다 */
    capsule: [
        sheet(circle(38, -12, 9.5)),
        line("M28.8 -11 q9.2 3.6 18.4 0", 3),
        // 떨어지는 선
        line("M33.5 -27 v-5", 3),
        line("M43 -27.5 v-6", 3),
    ],
    /** 돋보기 — 오른쪽 눈앞에 대어, 눈이 크게 보인다 */
    magnifier: [
        line("M86.5 69.5 L102 85", 6),
        sheet(circle(77, 60, 12.5)),
        { d: circle(77.5, 61, 6.2), fill: "ink" },
        line("M69.5 55 q2.5 -5.5 8.5 -6", 2.6),
    ],
    /** 바코드 라벨 — 왼손. 위의 짧은 선은 "삑" */
    barcode: [
        sheet(roundRect(-24, 33, 36, 26, 4)),
        line("M-17.5 39.5 v13", 2.6),
        line("M-12.5 39.5 v13", 1.6),
        line("M-8 39.5 v13", 2.6),
        line("M-3.5 39.5 v13", 1.6),
        line("M1 39.5 v13", 2.6),
        line("M5.5 39.5 v13", 1.6),
        line("M-28 27 l-4 -4.5", 3),
        line("M-12 24.5 v-6.5", 3),
        line("M4 26.5 l4 -5", 3),
    ],
    /** 카메라 — 오른손. 위의 짧은 선은 "찰칵" */
    camera: [
        sheet("M108 38.5 l3 -5.5 h10 l3 5.5 Z", 4),
        sheet(roundRect(100, 38, 34, 23, 4)),
        line(circle(117, 49.5, 6.2), 3.5),
        line(point(128.5, 43.5), 3.4),
        line("M133.5 28 l3.5 -5", 3),
        line("M139.5 34.5 l5.5 -2.5", 3),
    ],
    /** 지도 — 두 손으로 펼쳐 든다. 세 번 접힌 종이에 길과 도착 표시 */
    map: [
        sheet("M19 87 L39.5 82.5 L60 87 L80.5 82.5 L101 87 L101 110.5 L80.5 106 L60 110.5 L39.5 106 L19 110.5 Z"),
        line("M39.5 82.5 V106 M60 87 V110.5 M80.5 82.5 V106", 2.6),
        line("M26.5 102 l4.5 -3.5 M36 95.5 l5 1 M46 99 l4.5 2 M56 101.5 l5 -2.5 M66 96 l5 -1.5", 2.6),
        line("M86 91.5 l5.5 5.5 M91.5 91.5 l-5.5 5.5", 2.8),
    ],
    /** 꾸러미 — 끈으로 꼭꼭 묶어 리본을 맨 작은 상자. 왼손 */
    parcel: [
        sheet(roundRect(-26, 37, 34, 26, 3.5)),
        line("M-9 37 v26 M-26 50 h34", 3),
        sheet("M-9 37 q-8.5 -9.5 -11.5 -1.5 q3 5 11.5 1.5 Z", 3),
        sheet("M-9 37 q8.5 -9.5 11.5 -1.5 q-3 5 -11.5 1.5 Z", 3),
        line(point(-9, 37), 5),
    ],
} satisfies Record<string, readonly Stroke[]>;

export type PropId = keyof typeof PROPS;
