/* 패스 문자열을 만드는 작은 도구. 좌표는 소수 둘째 자리까지만 남긴다 */

const n = (value: number) => Math.round(value * 100) / 100;

/** 원 — Icon.tsx 의 circle 과 같은 방식(호 두 개) */
export const circle = (cx: number, cy: number, r: number) =>
    `M${n(cx - r)} ${n(cy)} a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0 a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0`;

/** 타원 */
export const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
    `M${n(cx - rx)} ${n(cy)} a${n(rx)} ${n(ry)} 0 1 0 ${n(rx * 2)} 0 a${n(rx)} ${n(ry)} 0 1 0 ${n(-rx * 2)} 0`;

/** 가운데가 휜 짧은 선. rise 가 음수면 위로 볼록(⌒), 양수면 아래로 볼록(‿) */
export const arc = (cx: number, y: number, half: number, rise: number) =>
    `M${n(cx - half)} ${n(y)} q${n(half)} ${n(rise)} ${n(half * 2)} 0`;

/** 가로로 곧은 짧은 선 */
export const dash = (cx: number, y: number, half: number) => `M${n(cx - half)} ${n(y)} h${n(half * 2)}`;

/**
 * 윗부분을 비스듬히 잘라 낸 원 — 힘을 준 눈.
 * 왼쪽 끝은 수평에서 leftDeg, 오른쪽 끝은 rightDeg 만큼 올라간 자리에서 자른다(도).
 */
export const cutDisc = (cx: number, cy: number, r: number, leftDeg: number, rightDeg: number) => {
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx - r * Math.cos(rad(leftDeg));
    const y1 = cy - r * Math.sin(rad(leftDeg));
    const x2 = cx + r * Math.cos(rad(rightDeg));
    const y2 = cy - r * Math.sin(rad(rightDeg));
    // 오른쪽 끝에서 아래를 돌아 왼쪽 끝으로 — 반 바퀴보다 긴 호
    return `M${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)} A${n(r)} ${n(r)} 0 1 1 ${n(x1)} ${n(y1)} Z`;
};

/** 모서리가 둥근 사각 */
export const roundRect = (x: number, y: number, width: number, height: number, r: number) =>
    [
        `M${n(x + r)} ${n(y)}`,
        `h${n(width - r * 2)}`,
        `a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(r)}`,
        `v${n(height - r * 2)}`,
        `a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(r)}`,
        `h${n(-(width - r * 2))}`,
        `a${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(-r)}`,
        `v${n(-(height - r * 2))}`,
        `a${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(-r)}`,
        "Z",
    ].join(" ");

/** 네 갈래 별(반짝). pinch 가 작을수록 가늘다 */
export const star = (cx: number, cy: number, r: number, pinch = 0.2) => {
    const k = r * pinch;
    return [
        `M${n(cx)} ${n(cy - r)}`,
        `Q${n(cx + k)} ${n(cy - k)} ${n(cx + r)} ${n(cy)}`,
        `Q${n(cx + k)} ${n(cy + k)} ${n(cx)} ${n(cy + r)}`,
        `Q${n(cx - k)} ${n(cy + k)} ${n(cx - r)} ${n(cy)}`,
        `Q${n(cx - k)} ${n(cy - k)} ${n(cx)} ${n(cy - r)}`,
        "Z",
    ].join(" ");
};

/** 점 — 길이가 거의 없는 선을 둥근 끝으로 긋는다. 굵기가 곧 지름이다 */
export const point = (cx: number, cy: number) => `M${n(cx)} ${n(cy)} h0.01`;
