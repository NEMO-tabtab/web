#!/usr/bin/env node
/*
 * 가챠샵 후보 뽑기·싣기. 쓰는 법은 scripts/shops/README.md
 *
 *   node scripts/shops/find-candidates.mjs find <상가정보 CSV>...   후보를 뽑아 candidates.json 에 합친다
 *   node scripts/shops/find-candidates.mjs apply                    검수를 통과한 후보를 public/shops/index.json 에 더한다
 */
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

import { applyReviewed, isCandidate, mergeCandidates, splitCsvLine, toCandidate } from "./candidates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES = path.join(here, "candidates.json");
const INDEX = path.join(here, "../../public/shops/index.json");

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 4)}\n`);
const readCandidates = () => (existsSync(CANDIDATES) ? readJson(CANDIDATES) : { source: "", candidates: [] });

async function readCsv(file) {
    const lines = createInterface({ input: createReadStream(file, "utf8"), crlfDelay: Infinity });
    const found = [];
    const sidos = new Set();
    let head = null;
    let broken = 0;
    for await (const raw of lines) {
        const line = head ? raw : raw.replace(/^﻿/, "");
        // 대부분의 줄은 후보가 아니다 — 칸을 나누기 전에 먼저 거른다
        if (head && !/[가갓캡gG]/.test(line)) continue;
        const cells = splitCsvLine(line);
        if (!head) {
            head = cells;
            continue;
        }
        if (cells.length !== head.length) {
            broken += 1;
            continue;
        }
        const row = Object.fromEntries(head.map((key, index) => [key, cells[index]]));
        if (!isCandidate(row)) continue;
        const candidate = toCandidate(row);
        if (!candidate) continue;
        found.push(candidate);
        sidos.add(candidate.sido);
    }
    return { found, sidos: [...sidos], broken };
}

async function find(files) {
    if (files.length === 0) throw new Error("상가정보 CSV 파일을 하나 이상 넘겨 주세요.");
    const current = readCandidates();
    let candidates = current.candidates;
    for (const file of files) {
        const { found, sidos, broken } = await readCsv(file);
        const merged = mergeCandidates(candidates, found, sidos);
        candidates = merged.candidates;
        console.log(`${path.basename(file)}: 후보 ${found.length}곳, 새로 더함 ${merged.added.length}곳`);
        if (broken > 0) console.log(`  칸 수가 맞지 않아 건너뛴 줄 ${broken}개`);
        for (const each of merged.gone)
            console.log(`  이번 자료에 없음(폐업했을 수 있음): ${each.name} — ${each.address}`);
    }
    // 파일 이름 끝의 기준 달(…_202609.csv)을 출처에 남긴다
    const month = /_(\d{4})(\d{2})\.csv$/.exec(files[0]);
    const source = `소상공인시장진흥공단 상가(상권)정보${month ? ` ${month[1]}-${month[2]}` : ""}`;
    writeJson(CANDIDATES, { source, candidates });
    const todo = candidates.filter((each) => each.review === "todo").length;
    console.log(`후보 ${candidates.length}곳 (검수 전 ${todo}곳) → ${path.relative(process.cwd(), CANDIDATES)}`);
}

function apply() {
    const { index, added } = applyReviewed(readJson(INDEX), readCandidates().candidates);
    writeJson(INDEX, index);
    console.log(`굿즈샵 ${added.length}곳을 더했다 → ${path.relative(process.cwd(), INDEX)}`);
    for (const shop of added) console.log(`  ${shop.name} — ${shop.address}`);
    console.log("pnpm test 로 형식 검사를 돌려 주세요.");
}

const [command, ...rest] = process.argv.slice(2);
try {
    if (command === "find") await find(rest);
    else if (command === "apply") apply();
    else {
        console.error("쓰는 법: find-candidates.mjs find <CSV>... | apply");
        process.exitCode = 1;
    }
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
}
