import { describe, expect, it } from "vitest";

import { markerHtml, naverScriptUrl } from "./naver";

describe("네이버 지도 스크립트 주소", () => {
    it("키와 준비 함수 이름을 넘긴다", () => {
        const url = new URL(naverScriptUrl("abc123", ""));
        expect(url.origin + url.pathname).toBe("https://oapi.map.naver.com/openapi/v3/maps.js");
        expect(url.searchParams.get("ncpKeyId")).toBe("abc123");
        expect(url.searchParams.get("callback")).toBe("__nemoNaverMapReady");
        expect(url.searchParams.has("submodules")).toBe(false);
    });

    it("흑백 스타일이 있으면 GL 서브 모듈을 함께 받는다", () => {
        expect(new URL(naverScriptUrl("abc123", "style-1")).searchParams.get("submodules")).toBe("gl");
    });
});

describe("굿즈샵 마커", () => {
    it("이름을 이스케이프한다 — 데이터에 든 글자가 HTML 로 실행되지 않는다", () => {
        const html = markerHtml(`<img src=x onerror="alert(1)">&'`);
        expect(html).not.toContain("<img");
        expect(html).toContain("&#60;img src=x onerror=&#34;alert(1)&#34;&#62;&#38;&#39;");
    });
});
