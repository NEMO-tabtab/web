"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useProductCovers } from "@/lib/db/hooks";
import { analyzeImage } from "@/lib/tint/extract";
import { buildPalette, chooseSwatches, localDayNumber, tintVars, type FamilyId, type Swatch } from "@/lib/tint/palette";
import {
    DEFAULT_SETTINGS,
    applyTint,
    loadColorCache,
    loadSettings,
    saveColorCache,
    saveSettings,
    type ColorCache,
    type TintSettings,
} from "@/lib/tint/storage";

export interface TintState {
    /** 모은 색, 많은 순. 아직 읽는 중이면 빈 배열 */
    palette: Swatch[];
    /** 지금 앱에 칠해진 색 갈래 */
    active: FamilyId[];
    /** 사진이 있는 물건 수 / 그중 색을 살펴본 수 / 색을 찾은 수 */
    progress: { withPhoto: number; scanned: number; colored: number };
    settings: TintSettings;
    setSettings: (next: TintSettings) => void;
}

const TintContext = createContext<TintState | null>(null);

export function useTint(): TintState {
    const state = useContext(TintContext);
    if (!state) throw new Error("useTint 는 TintProvider 안에서만 쓸 수 있습니다");
    return state;
}

/** 사진 한 장을 본 뒤 화면이 숨 돌릴 틈을 준다 — 물건이 많아도 스크롤이 끊기지 않게 */
const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 16));

/**
 * 앱 색(물들이기). 등록한 물건의 대표 사진에서 색을 뽑아 앱의 볼터치·제목 밑줄·바탕을 칠한다.
 *
 * 색은 사진 id 마다 한 번만 뽑아 기기에 남긴다(src/lib/tint/storage.ts). 사진이 바뀌면 id 가 바뀌므로 다시 뽑는다.
 * children 을 그대로 넘기므로 감싸인 화면은 서버 렌더링을 유지하고, 이 상태를 쓰는 곳만 다시 그려진다.
 */
export default function TintProvider({ children }: { children: React.ReactNode }) {
    const covers = useProductCovers();
    const [ready, setReady] = useState(false);
    const [settings, setSettingsState] = useState<TintSettings>(DEFAULT_SETTINGS);
    const [colors, setColors] = useState<ColorCache>({});
    const colorsRef = useRef<ColorCache>({});
    const inflight = useRef(new Set<string>());

    // localStorage 는 브라우저에서만 있다 — 서버 렌더링 결과와 어긋나지 않게 마운트 뒤에 읽는다
    useEffect(() => {
        colorsRef.current = loadColorCache();
        setColors(colorsRef.current);
        setSettingsState(loadSettings());
        setReady(true);
    }, []);

    // 아직 색을 보지 않은 사진을 하나씩 살펴본다
    useEffect(() => {
        if (!covers || !ready) return;
        let cancelled = false;
        const liveIds = new Set(covers.flatMap(({ cover }) => (cover ? [cover.id] : [])));

        (async () => {
            for (const { cover } of covers) {
                if (cancelled) return;
                if (!cover || cover.id in colorsRef.current || inflight.current.has(cover.id)) continue;
                inflight.current.add(cover.id);
                const color = await analyzeImage(cover.blob);
                inflight.current.delete(cover.id);
                // 화면을 떠났어도 뽑은 색은 맞는 값이라 버리지 않는다
                colorsRef.current = { ...colorsRef.current, [cover.id]: color };
                saveColorCache(colorsRef.current, liveIds);
                if (cancelled) return;
                setColors(colorsRef.current);
                await yieldToBrowser();
            }
            // 지운 사진의 색을 정리한다
            saveColorCache(colorsRef.current, liveIds);
        })();

        return () => {
            cancelled = true;
        };
    }, [covers, ready]);

    const { palette, progress } = useMemo(() => {
        let withPhoto = 0;
        let scanned = 0;
        const items = [];
        for (const { product, cover } of covers ?? []) {
            if (!cover) continue;
            withPhoto++;
            if (!(cover.id in colors)) continue;
            scanned++;
            const color = colors[cover.id];
            if (color) items.push({ color, count: product.count });
        }
        return { palette: buildPalette(items), progress: { withPhoto, scanned, colored: items.length } };
    }, [covers, colors]);

    const chosen = useMemo(
        () => chooseSwatches(settings.mode, palette, settings.pick, localDayNumber(new Date())),
        [settings, palette],
    );

    // 저장소를 다 읽고 나서야 칠한다 — 읽기 전에 칠하면 켤 때 칠해 둔 색(TINT_BOOT_SCRIPT)을 지웠다가 다시 칠하게 된다
    useEffect(() => {
        if (!covers || !ready) return;
        applyTint(tintVars(chosen));
    }, [chosen, covers, ready]);

    const setSettings = useCallback((next: TintSettings) => {
        setSettingsState(next);
        saveSettings(next);
    }, []);

    const value = useMemo<TintState>(
        () => ({ palette, active: chosen.map((swatch) => swatch.family), progress, settings, setSettings }),
        [palette, chosen, progress, settings, setSettings],
    );

    return <TintContext.Provider value={value}>{children}</TintContext.Provider>;
}
