/*
 * 가챠샵 후보 뽑기 — 소상공인시장진흥공단 상가(상권)정보 CSV 에서 상호로 후보를 고른다.
 * (docs/decisions/0004-map-and-indoor-map.md "공공데이터를 쓰는 곳")
 *
 * 여기는 파일을 읽고 쓰지 않는 계산만 둔다. 테스트: src/lib/shops/candidates.test.ts
 * 고른 것은 후보일 뿐이다 — 폐업했거나 뽑기 기기가 없는 곳이 섞여 있으므로 사람이 검수한 것만 지도에 싣는다.
 */

/** 가챠(캡슐토이) 가게로 보이는 상호 */
const GACHA = /가챠|갓챠|가차|가샤폰|캡슐\s*토이|gacha|gashapon/i;
/** "엄마가 차린 밥상", "종가 차례상" 처럼 "가차"가 우연히 붙은 상호 */
const NOT_GACHA = /가차(?:려|린|리|례)/;
/** 인형뽑기 등 뽑기 가게로 보이는 상호 — 뽑기방, 뽑아핑, 뽑짱… */
const CLAW = /뽑/;
/** 캐치팡·캐칭덕·크레인짱처럼 뽑기 가게에 흔하지만 다른 가게에도 쓰이는 말(캐치필라테스, 젬크레인) — 아래 업종일 때만 본다 */
const CLAW_LOOSE = /캐치|캐칭|크레인/;
const CLAW_LOOSE_TRADES = new Set([
    "전자 게임장",
    "기타 오락장",
    "장난감 소매업",
    "문구/회화용품 소매업",
    "그 외 기타 종합 소매업",
]);

/**
 * 상호에 위 낱말이 없는 뽑기 프랜차이즈. 상가정보에서 지점이 10곳 넘게 되풀이되는 이름을 골랐다(2026-09 자료).
 * 뽑아핑·캐칭덕·크레이지팡은 뽑기 프랜차이즈임을 기사·매장 목록으로 확인했고, 나머지는 확인하지 못했다 — 검수에서 본다.
 * 흔한 낱말이라 오락·장난감 업종일 때만 본다.
 */
export const FRANCHISES = [
    "봉봉스테이션",
    "블링팝",
    "모모스테이션",
    "헌터독",
    "뽀끼뽀끼",
    "크레이지팡",
    "버블팝",
    "유에프오",
    "팡야팡야",
    "미니돌",
    "반다이남코",
    "플레이콕",
    "캑티",
];
const FRANCHISE_TRADES = new Set(["전자 게임장", "기타 오락장", "장난감 소매업"]);

/** 뽑기 가게가 등록돼 있는 업종 대분류. 음식·교육·수리 등은 뺀다 */
const CATEGORIES = new Set(["소매", "예술·스포츠"]);

/**
 * CSV 한 줄을 칸으로 나눈다. 큰따옴표로 감싼 칸 안의 쉼표와 ""(따옴표 하나)를 처리한다.
 * 칸 안에 줄바꿈이 든 경우는 다루지 않는다 — 부르는 쪽이 칸 수로 걸러낸다.
 * @param {string} line
 * @returns {string[]}
 */
export function splitCsvLine(line) {
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (quoted) {
            if (char !== '"') cell += char;
            else if (line[i + 1] === '"') {
                cell += '"';
                i += 1;
            } else quoted = false;
        } else if (char === '"') quoted = true;
        else if (char === ",") {
            cells.push(cell);
            cell = "";
        } else cell += char;
    }
    cells.push(cell);
    return cells;
}

/**
 * 상가 한 곳이 어떤 까닭으로 후보인지. 후보가 아니면 null.
 * - gacha: 상호가 가챠 가게다
 * - claw: 상호가 인형뽑기 등 뽑기 가게다
 * - franchise: 뽑기 프랜차이즈의 지점이다
 * @param {Record<string, string>} row 머리글 이름으로 꺼내는 한 줄
 * @returns {{ kind: "gacha" | "claw" | "franchise", matched: string } | null}
 */
export function matchCandidate(row) {
    if (!CATEGORIES.has(row["상권업종대분류명"])) return null;
    const name = `${row["상호명"] ?? ""} ${row["지점명"] ?? ""}`;

    const gacha = GACHA.exec(name);
    if (gacha && !NOT_GACHA.test(name)) return { kind: "gacha", matched: gacha[0] };

    const claw = CLAW.exec(name) ?? (CLAW_LOOSE_TRADES.has(row["상권업종소분류명"]) ? CLAW_LOOSE.exec(name) : null);
    if (claw) return { kind: "claw", matched: claw[0] };

    if (FRANCHISE_TRADES.has(row["상권업종소분류명"])) {
        const squeezed = name.replace(/\s+/g, "");
        const brand = FRANCHISES.find((each) => squeezed.includes(each));
        if (brand) return { kind: "franchise", matched: brand };
    }
    return null;
}

/** "1" → "1층", "지" → "지하". 모르는 값은 뺀다 */
function floorNote(raw) {
    const value = (raw ?? "").trim();
    if (/^\d+$/.test(value)) return `${Number(value)}층`;
    if (/^지\d*$/.test(value)) return value === "지" ? "지하" : `지하 ${Number(value.slice(1))}층`;
    return undefined;
}

/**
 * @typedef {object} Candidate
 * @property {"todo" | "ok" | "no"} review 검수 결과. ok 만 지도에 싣는다
 * @property {string} [note] 검수하며 남긴 말 — 왜 뺐는지, 무엇을 고쳤는지
 * @property {string} [id] 굿즈샵 id. 지도에 실을 때 매긴다(assignIds). 한 번 매기면 바꾸지 않는다
 * @property {string} [sourceId] 상가업소번호 — 다시 뽑을 때 같은 곳인지 알아본다. 손으로 더한 후보에는 없다
 * @property {"gacha" | "claw" | "franchise"} kind 후보가 된 까닭
 * @property {string} matched 걸린 낱말이나 프랜차이즈 이름
 * @property {string} name
 * @property {string} address
 * @property {string} [floorNote]
 * @property {number} lat
 * @property {number} lng
 * @property {string} sido
 * @property {string} sigungu
 * @property {string} region 시군구코드 5자리(시도 2 + 시군구 3) — id 를 매길 때 쓴다
 * @property {string} category 상가정보의 업종 — 검수할 때 참고
 * @property {string} [building] 상가정보의 건물명 — 검수할 때 참고(엉뚱한 값이 많다)
 */

/**
 * 상가 한 줄을 후보로 바꾼다. 후보가 아니거나 좌표·주소·지역코드가 없으면 null.
 * @param {Record<string, string>} row
 * @returns {Candidate | null}
 */
export function toCandidate(row) {
    const match = matchCandidate(row);
    if (!match) return null;

    const lat = Number(row["위도"]);
    const lng = Number(row["경도"]);
    if (!row["위도"] || !row["경도"] || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const sourceId = (row["상가업소번호"] ?? "").trim();
    const region = (row["시군구코드"] ?? "").trim();
    const name = (row["상호명"] ?? "").trim();
    const branch = (row["지점명"] ?? "").trim();
    const address = (row["도로명주소"] || row["지번주소"] || "").trim();
    if (!sourceId || !/^\d{5}$/.test(region) || !name || !address) return null;

    /** @type {Candidate} */
    const candidate = {
        review: "todo",
        sourceId,
        ...match,
        name: branch && !name.includes(branch) ? `${name} ${branch}` : name,
        address,
        lat,
        lng,
        sido: row["시도명"],
        sigungu: row["시군구명"],
        region,
        category: row["상권업종소분류명"],
    };
    const floor = floorNote(row["층정보"]);
    if (floor) candidate.floorNote = floor;
    const building = (row["건물명"] ?? "").trim();
    if (building) candidate.building = building;
    return candidate;
}

/**
 * 새로 뽑은 후보를 이미 있는 검수 파일에 합친다.
 * - 이미 있는 후보는 검수 결과(review·note), 매긴 id, 사람이 고친 이름·주소·층을 그대로 둔다
 * - 같은 이름·같은 주소로 두 번 등록된 곳은 하나만 남긴다
 * - 이번 자료에 없는 기존 후보도 지우지 않는다(다른 지역이거나, 폐업 여부는 사람이 본다). 대신 gone 으로 돌려준다
 * @param {Candidate[]} existing
 * @param {Candidate[]} found
 * @param {string[]} sidos 이번에 뽑은 시도 — 여기 속한 기존 후보만 "사라짐"을 따진다
 */
export function mergeCandidates(existing, found, sidos) {
    const place = (each) => `${each.name}|${each.address}`;
    const sources = new Set(existing.map((each) => each.sourceId).filter(Boolean));
    const places = new Set(existing.map(place));
    const added = [];

    for (const candidate of found) {
        if (sources.has(candidate.sourceId) || places.has(place(candidate))) continue;
        sources.add(candidate.sourceId);
        places.add(place(candidate));
        added.push(candidate);
    }

    const foundSources = new Set(found.map((each) => each.sourceId));
    const gone = existing.filter(
        (each) => each.sourceId && sidos.includes(each.sido) && !foundSources.has(each.sourceId),
    );
    const candidates = [...existing, ...added].sort(
        (a, b) =>
            a.region.localeCompare(b.region) ||
            a.address.localeCompare(b.address, "ko") ||
            a.name.localeCompare(b.name, "ko"),
    );
    return { candidates, added, gone };
}

/**
 * 굿즈샵 id — kr-(시도코드 2자리)-(시군구코드 3자리)-(그 시군구에서 몇 번째인지, 세 자리부터).
 * 예: kr-11-440-001 = 서울특별시(11) 마포구(440)의 첫 번째.
 */
const shopId = (region, order) => `kr-${region.slice(0, 2)}-${region.slice(2)}-${String(order).padStart(3, "0")}`;
const ID = /^kr-(\d{2})-(\d{3})-(\d{3,})$/;

/**
 * 검수를 통과했는데(ok) 아직 id 가 없는 후보에 id 를 매긴다.
 * 번호는 그 시군구에서 이미 쓴 가장 큰 번호 다음부터다 — 빠진 번호를 다시 쓰지 않는다
 * (지도에서 내린 굿즈샵의 id 를 다른 곳이 물려받으면 사용자의 기록이 엉뚱한 곳을 가리킨다).
 * 한 번에 여럿을 매길 때는 상가업소번호 순(대체로 등록된 순)이고, 손으로 더한 후보는 그 뒤에 이름 순이다.
 * @param {Candidate[]} candidates
 * @param {string[]} usedIds 굿즈샵 목록에 이미 있는 id
 * @returns {Candidate[]} id 가 채워진 새 배열(순서는 그대로)
 */
export function assignIds(candidates, usedIds) {
    const last = new Map();
    for (const id of [...usedIds, ...candidates.map((each) => each.id)]) {
        const parts = ID.exec(id ?? "");
        if (!parts) continue;
        const region = parts[1] + parts[2];
        last.set(region, Math.max(last.get(region) ?? 0, Number(parts[3])));
    }

    const waiting = candidates
        .filter((each) => each.review === "ok" && !each.id)
        .sort(
            (a, b) =>
                Number(!a.sourceId) - Number(!b.sourceId) ||
                (a.sourceId ?? "").localeCompare(b.sourceId ?? "") ||
                a.name.localeCompare(b.name, "ko"),
        );
    const assigned = new Map();
    for (const candidate of waiting) {
        const order = (last.get(candidate.region) ?? 0) + 1;
        last.set(candidate.region, order);
        assigned.set(candidate, shopId(candidate.region, order));
    }
    // id 를 앞쪽에 두어 검수 파일에서 눈에 띄게 한다
    return candidates.map((each) => {
        if (!assigned.has(each)) return each;
        const { review, note, ...rest } = each;
        return { review, ...(note ? { note } : {}), id: assigned.get(each), ...rest };
    });
}

/**
 * 검수를 통과한(ok) 후보에 id 를 매기고 굿즈샵 목록에 더한다. 이미 목록에 있는 id 는 건드리지 않는다
 * (내부 지도 버전이나 손으로 고친 값을 덮어쓰지 않으려고).
 * @param {{ schemaVersion: number, shops: Array<Record<string, unknown> & { id: string }> }} index
 * @param {Candidate[]} candidates
 */
export function applyReviewed(index, candidates) {
    const known = new Set(index.shops.map((shop) => shop.id));
    const withIds = assignIds(candidates, [...known]);
    const added = withIds
        .filter((each) => each.review === "ok" && !known.has(each.id))
        .sort((a, b) => (a.id ?? "").localeCompare(b.id ?? ""))
        .map(({ id, name, address, floorNote: floor, lat, lng }) => ({
            id: /** @type {string} */ (id),
            name,
            address,
            ...(floor ? { floorNote: floor } : {}),
            lat,
            lng,
        }));
    return { index: { ...index, shops: [...index.shops, ...added] }, candidates: withIds, added };
}
