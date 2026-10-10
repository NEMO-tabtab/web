import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    test: {
        environment: "node",
        // Node 에는 IndexedDB 가 없다 — 메모리 구현으로 Dexie 를 돌린다
        setupFiles: ["fake-indexeddb/auto"],
        include: ["src/**/*.test.ts"],
        // 외장 드라이브(T7)에서 macOS 가 만드는 ._* 리소스 포크를 테스트로 오인하지 않게 한다
        exclude: ["**/node_modules/**", "**/._*"],
    },
});
