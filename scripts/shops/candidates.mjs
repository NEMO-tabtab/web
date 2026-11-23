/*
 * 가챠샵 후보 뽑기 — 소상공인시장진흥공단 상가(상권)정보 CSV 에서 상호로 후보를 고른다.
 * (docs/decisions/0004-map-and-indoor-map.md "공공데이터를 쓰는 곳")
 *
 * 여기는 파일을 읽고 쓰지 않는 계산만 둔다. 테스트: src/lib/shops/candidates.test.ts
 * 고른 것은 후보일 뿐이다 — 폐업했거나 가챠 기기가 없는 곳이 섞여 있으므로 사람이 검수한 것만 지도에 싣는다.
 */

/** 상호에 이 말이 있으면 후보로 본다 */
const NAME = /가챠|갓챠|가차|가샤폰|캡슐\s*토이|gacha|gashapon/i;
/** "엄마가 차린 밥상", "종가 차례상" 처럼 "가차"가 우연히 붙은 상호 */
const NOT_NAME = /가차(?:려|린|리|례)/;
/** 가챠샵이 등록돼 있는 업종 대분류. 음식·교육·수리 등은 뺀다 */
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
 * 상가 한 곳이 가챠샵 후보인지.
 * @param {Record<string, string>} row 머리글 이름으로 꺼내는 한 줄
 */
export function isCandidate(row) {
    const name = `${row["상호명"] ?? ""} ${row["지점명"] ?? ""}`;
    return CATEGORIES.has(row["상권업종대분류명"]) && NAME.test(name) && !NOT_NAME.test(name);
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
 * @property {string} id 굿즈샵 id (상가업소번호에서 만든다 — 다시 뽑아도 같다)
 * @property {string} name
 * @property {string} address
 * @property {string} [floorNote]
 * @property {number} lat
 * @property {number} lng
 * @property {string} sido
 * @property {string} category 상가정보의 업종 — 검수할 때 참고
 * @property {string} [building] 상가정보의 건물명 — 검수할 때 참고(엉뚱한 값이 많다)
 */

/**
 * 상가 한 줄을 후보로 바꾼다. 좌표가 없으면 null.
 * @param {Record<string, string>} row
 * @returns {Candidate | null}
 */
export function toCandidate(row) {
    const lat = Number(row["위도"]);
    const lng = Number(row["경도"]);
    const sourceId = (row["상가업소번호"] ?? "").trim().toLowerCase();
    if (!row["위도"] || !row["경도"] || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (!/^[a-z0-9]+$/.test(sourceId)) return null;

    const branch = (row["지점명"] ?? "").trim();
    const name = row["상호명"].trim();
    const address = (row["도로명주소"] || row["지번주소"] || "").trim();
    if (!name || !address) return null;

    /** @type {Candidate} */
    const candidate = {
        review: "todo",
        id: `sb-${sourceId}`,
        name: branch && !name.includes(branch) ? `${name} ${branch}` : name,
        address,
        lat,
        lng,
        sido: row["시도명"],
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
 * - 이미 있는 후보는 검수 결과(review·note)와 사람이 고친 이름·주소·층을 그대로 둔다
 * - 같은 이름·같은 주소로 두 번 등록된 곳은 하나만 남긴다
 * - 이번 자료에 없는 기존 후보도 지우지 않는다(다른 지역이거나, 폐업 여부는 사람이 본다). 대신 gone 으로 돌려준다
 * @param {Candidate[]} existing
 * @param {Candidate[]} found
 * @param {string[]} sidos 이번에 뽑은 시도 — 여기 속한 기존 후보만 "사라짐"을 따진다
 */
export function mergeCandidates(existing, found, sidos) {
    const byId = new Map(existing.map((each) => [each.id, each]));
    const place = (each) => `${each.name}|${each.address}`;
    const places = new Set(existing.map(place));
    const added = [];

    for (const candidate of found) {
        if (byId.has(candidate.id) || places.has(place(candidate))) continue;
        byId.set(candidate.id, candidate);
        places.add(place(candidate));
        added.push(candidate);
    }

    const foundIds = new Set(found.map((each) => each.id));
    const gone = existing.filter((each) => sidos.includes(each.sido) && !foundIds.has(each.id));
    const candidates = [...byId.values()].sort(
        (a, b) =>
            a.sido.localeCompare(b.sido, "ko") || a.address.localeCompare(b.address, "ko") || a.id.localeCompare(b.id),
    );
    return { candidates, added, gone };
}

/**
 * 검수를 통과한(ok) 후보를 굿즈샵 목록에 더한다. 이미 목록에 있는 id 는 건드리지 않는다
 * (내부 지도 버전이나 손으로 고친 값을 덮어쓰지 않으려고).
 * @param {{ schemaVersion: number, shops: Array<Record<string, unknown> & { id: string }> }} index
 * @param {Candidate[]} candidates
 */
export function applyReviewed(index, candidates) {
    const known = new Set(index.shops.map((shop) => shop.id));
    const added = candidates
        .filter((each) => each.review === "ok" && !known.has(each.id))
        .map(({ id, name, address, floorNote: floor, lat, lng }) => ({
            id,
            name,
            address,
            ...(floor ? { floorNote: floor } : {}),
            lat,
            lng,
        }));
    return { index: { ...index, shops: [...index.shops, ...added] }, added };
}
