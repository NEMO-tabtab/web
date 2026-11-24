"use client";

import { Chip, Input } from "@/components/common";
import { seriesKey, type MySeries } from "@/lib/series";

/** 칩으로 보여 줄 수 — 그보다 오래된 시리즈는 이름을 적으면 찾는다 */
const SHOWN = 6;

const groupLabel = "mb-2 block text-xs font-bold text-ink-soft";

export interface SeriesFieldProps {
    seriesName: string;
    onSeriesChange: (name: string) => void;
    /** 주지 않으면 종류 칸을 그리지 않는다(빠른 등록은 사진마다 종류를 적는다) */
    variantName?: string;
    onVariantChange?: (name: string) => void;
    /** 전에 적은 시리즈. 최근에 쓴 것부터 */
    suggestions: MySeries[];
}

/**
 * 시리즈·종류 입력(#201). 전에 적은 시리즈를 칩으로 골라 다시 적지 않게 한다.
 * 적는 중에는 그 글자가 든 시리즈만 칩으로 남긴다.
 */
export function SeriesField({ seriesName, onSeriesChange, variantName, onVariantChange, suggestions }: SeriesFieldProps) {
    const typed = seriesName.trim();
    const currentKey = typed ? seriesKey({ seriesId: null, seriesName: typed }) : null;
    const current = suggestions.find((each) => seriesKey({ seriesId: null, seriesName: each.name }) === currentKey);
    const folded = typed.toLowerCase().replace(/\s+/g, "");
    const shown = (
        current
            ? []
            : suggestions.filter((each) => each.name.toLowerCase().replace(/\s+/g, "").includes(folded))
    ).slice(0, SHOWN);
    const variants = current && onVariantChange ? current.variants.slice(0, SHOWN * 2) : [];

    return (
        <div className="space-y-3">
            <Input
                label="시리즈"
                placeholder="예: 치이카와 마스코트 3탄"
                hint={suggestions.length === 0 ? "한 번 적어 두면 다음부터 골라서 넣을 수 있어요." : undefined}
                value={seriesName}
                onChange={(event) => onSeriesChange(event.target.value)}
            />
            {shown.length > 0 && (
                <div role="group" aria-label="전에 적은 시리즈">
                    <p className={groupLabel}>전에 적은 시리즈</p>
                    <div className="flex flex-wrap gap-2">
                        {shown.map((each) => (
                            <Chip key={each.key} onClick={() => onSeriesChange(each.name)}>
                                {each.name}
                            </Chip>
                        ))}
                    </div>
                </div>
            )}

            {onVariantChange && (
                <>
                    <Input
                        label="종류"
                        placeholder="예: 하치와레"
                        hint="시리즈 안에서 무엇이 나왔는지. 몰라도 돼요."
                        value={variantName ?? ""}
                        onChange={(event) => onVariantChange(event.target.value)}
                    />
                    {variants.length > 0 && (
                        <div role="group" aria-label="이 시리즈에서 전에 적은 종류">
                            <p className={groupLabel}>이 시리즈에서 전에 적은 종류</p>
                            <div className="flex flex-wrap gap-2">
                                {variants.map((name) => (
                                    <Chip
                                        key={name}
                                        selected={(variantName ?? "").trim() === name}
                                        onClick={() => onVariantChange(name)}
                                    >
                                        {name}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
