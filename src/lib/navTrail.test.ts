import { beforeEach, describe, expect, it } from "vitest";

import { canGoBackInApp, hasMoved, resetTrail, visit } from "./navTrail";

describe("navTrail", () => {
    beforeEach(() => resetTrail());

    it("주소를 바로 연 첫 화면에서는 옮긴 적이 없다", () => {
        visit("/product/quick");
        expect(hasMoved()).toBe(false);
    });

    it("같은 화면을 거듭 불러도 옮긴 것으로 세지 않는다", () => {
        visit("/product/quick");
        visit("/product/quick");
        expect(hasMoved()).toBe(false);
    });

    it("다른 화면에서 넘어오면 옮긴 것이다", () => {
        visit("/shops");
        visit("/product/quick");
        expect(hasMoved()).toBe(true);
    });
});

describe("canGoBackInApp", () => {
    it("브라우저가 알려 주면 그 값을 따른다", () => {
        expect(canGoBackInApp({ canGoBack: true }, false)).toBe(true);
        expect(canGoBackInApp({ canGoBack: false }, true)).toBe(false);
    });

    it("브라우저가 알려 주지 않으면 화면을 옮긴 적이 있는지로 가늠한다", () => {
        expect(canGoBackInApp(undefined, true)).toBe(true);
        expect(canGoBackInApp(undefined, false)).toBe(false);
        expect(canGoBackInApp({}, true)).toBe(true);
    });
});
