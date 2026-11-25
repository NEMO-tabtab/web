import { describe, expect, it } from "vitest";

import { MARKS_HIDDEN_MAX, SMALL_FILTER_MAX, composeNemo, composeSymbol } from "./compose";
import { EXPRESSIONS, EXPRESSION_IDS } from "./expressions";
import { BODY, CANVAS, FACE, SYMBOL, TAPE } from "./geometry";
import type { Drawing } from "./types";

const strokesOf = (drawing: Drawing) => drawing.layers.flatMap((layer) => layer.strokes);
const paths = (drawing: Drawing) => strokesOf(drawing).map((stroke) => stroke.d);

describe("기준 치수", () => {
    it("눈과 볼은 몸 안에 있고 좌우가 가운데 세로선에 대칭이다", () => {
        expect(FACE.eyeLeftX + FACE.eyeRightX).toBe(BODY.cx * 2);
        expect(FACE.cheekLeftX + FACE.cheekRightX).toBe(BODY.cx * 2);
        for (const x of [FACE.eyeLeftX, FACE.eyeRightX, FACE.cheekLeftX, FACE.cheekRightX]) {
            expect(x).toBeGreaterThan(BODY.left);
            expect(x).toBeLessThan(BODY.right);
        }
        for (const y of [FACE.eyeY, FACE.cheekY, FACE.mouthY]) {
            expect(y).toBeGreaterThan(BODY.top);
            expect(y).toBeLessThan(BODY.bottom);
        }
    });

    it("테이프는 가운데에 있고, 몸 위로 솟아 눈 위에서 끝난다", () => {
        expect(TAPE.left + TAPE.right).toBe(BODY.cx * 2);
        expect(TAPE.top).toBeLessThan(BODY.top);
        expect(TAPE.tip).toBeLessThan(FACE.eyeY - FACE.eyeR);
    });
});

describe("표정 목록", () => {
    it("표정은 12개이고 모두 이름과 쓰는 순간이 있다", () => {
        expect(EXPRESSION_IDS).toHaveLength(12);
        for (const id of EXPRESSION_IDS) {
            expect(EXPRESSIONS[id].label.length).toBeGreaterThan(0);
            expect(EXPRESSIONS[id].when.length).toBeGreaterThan(0);
        }
    });

    it("이름이 겹치지 않는다", () => {
        const labels = EXPRESSION_IDS.map((id) => EXPRESSIONS[id].label);
        expect(new Set(labels).size).toBe(labels.length);
    });

    it("얼굴(눈·입·테이프·표시·기울기)이 똑같은 표정이 둘 있지 않다", () => {
        const faces = EXPRESSION_IDS.map((id) => paths(composeNemo({ expression: id })).join("|") + composeNemo({ expression: id }).layers[0].transform);
        expect(new Set(faces).size).toBe(faces.length);
    });
});

describe("전신", () => {
    it("모든 표정이 비지 않은 그림을 낸다", () => {
        for (const id of EXPRESSION_IDS) {
            const drawing = composeNemo({ expression: id });
            expect(drawing.viewBox).toBe(`0 0 ${CANVAS} ${CANVAS}`);
            // 팔 2 + 발 2 + 몸 + 테이프 + 볼 2 + 눈 2 + 입 = 11 이상
            expect(strokesOf(drawing).length).toBeGreaterThanOrEqual(11);
            for (const d of paths(drawing)) expect(d).toMatch(/^M-?\d/);
        }
    });

    it("기본 표정은 이 원본을 만들기 전의 NemoFace 와 같은 패스다", () => {
        // 이미 화면에 나가 있는 그림이다. 여기가 달라지면 홈·마이·빈 화면의 네모가 달라진다
        expect(paths(composeNemo())).toEqual([
            "M22 66 q-11 3 -4 15",
            "M98 66 q11 3 4 15",
            "M42 101 q0 10 11 8",
            "M78 101 q0 10 -11 8",
            "M25 34 Q24 26 32 25 L88 24 Q96 24 96 32 L97 92 Q97 100 89 101 L31 102 Q23 102 23 94 Z",
            "M51 12 L69 12 L69 40 L64.5 44 L60 40 L55.5 44 L51 40 Z",
            "M30.5 74 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0",
            "M78.5 74 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0",
            "M41.8 64 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0",
            "M69.8 64 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0",
            "M52 75 q4 6 8 0 q4 6 8 0",
        ]);
    });

    it("작은 크기에서는 표시를 빼고, 더 작으면 작은 필터를 쓴다", () => {
        const withMarks = EXPRESSION_IDS.filter((id) => "marks" in EXPRESSIONS[id]);
        expect(withMarks.length).toBeGreaterThan(0);
        for (const id of withMarks) {
            const large = strokesOf(composeNemo({ expression: id, size: MARKS_HIDDEN_MAX + 1 })).length;
            const small = strokesOf(composeNemo({ expression: id, size: MARKS_HIDDEN_MAX })).length;
            expect(small).toBeLessThan(large);
        }
        expect(composeNemo({ size: SMALL_FILTER_MAX + 1 }).filter).toBe("rough-line");
        expect(composeNemo({ size: SMALL_FILTER_MAX }).filter).toBe("rough-line-sm");
    });

    it("기울어지는 표정은 발밑 가운데를 축으로 돈다", () => {
        const drawing = composeNemo({ expression: "curious" });
        expect(drawing.layers[0].transform).toBe(`rotate(${EXPRESSIONS.curious.lean} ${BODY.cx} ${BODY.bottom})`);
        // 표시는 기울지 않는다
        expect(drawing.layers[1].transform).toBeUndefined();
    });
});

describe("심볼", () => {
    it("팔다리와 표시가 없고, 몸·테이프·얼굴은 전신과 같은 획이다", () => {
        for (const id of EXPRESSION_IDS) {
            const symbol = composeSymbol({ expression: id });
            expect(symbol.filter).toBe("rough-line-sm");
            expect(symbol.layers).toHaveLength(1);
            // 좁은 자리에 쓰므로 기울이지 않는다
            expect(symbol.layers[0].transform).toBeUndefined();
            // 전신: 팔 2 + 발 2 뒤로 몸·테이프·얼굴이 온다
            const whole = composeNemo({ expression: id }).layers[0].strokes.slice(4).map((stroke) => stroke.d);
            expect(paths(symbol)).toEqual(whole);
        }
    });

    it("잘라 낸 캔버스의 가운데에 몸이 있고, 테이프 꼭지와 발밑 선이 안에 들어간다", () => {
        const [x, y, width, height] = composeSymbol().viewBox.split(" ").map(Number);
        expect(width).toBe(SYMBOL.canvas);
        expect(height).toBe(SYMBOL.canvas);
        expect(x + width / 2).toBe(BODY.cx);
        expect(y).toBeLessThan(TAPE.top);
        expect(y + height).toBeGreaterThan(BODY.bottom);
    });

    it("선은 전신보다 굵다 — 24px 에서도 버티게", () => {
        const symbolBody = composeSymbol().layers[0].strokes[0];
        const wholeBody = composeNemo().layers[0].strokes[4];
        expect(symbolBody.d).toBe(wholeBody.d);
        expect(symbolBody.w ?? 0).toBeGreaterThan(wholeBody.w ?? 0);
    });
});
