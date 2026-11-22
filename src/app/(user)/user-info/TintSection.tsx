"use client";

import { useTint } from "@/app/components/TintProvider";
import { Card, Chip, RadioGroup, Section, Text } from "@/components/common";
import { rgbChannels } from "@/lib/tint/color";
import { isTintMode, type TintMode } from "@/lib/tint/palette";

/** 여러 캐릭터를 모았을 때 어떻게 보여 줄지 — 무엇을 남길지 정할 때까지 모두 고를 수 있게 둔다 */
const MODES: readonly { value: TintMode; title: string; hint: string }[] = [
    { value: "top", title: "제일 많은 색", hint: "가장 많이 모은 색 하나로 물들여요." },
    { value: "blend", title: "물감 번짐", hint: "모은 색을 비율대로 함께 써요. 양 볼과 밑줄, 바탕 귀퉁이에 번져요." },
    { value: "daily", title: "오늘의 색", hint: "모은 색 가운데 하나로 날마다 바뀌어요." },
    { value: "pick", title: "하나 고르기", hint: "위에서 누른 색으로 고정해요." },
    { value: "off", title: "끄기", hint: "원래의 흑백으로 봐요." },
];

const percent = (share: number) => `${Math.round(share * 100)}%`;

/** "파랑으로" · "보라로" — 받침이 없거나 ㄹ 받침이면 "로" */
function withEuro(word: string): string {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    const final = code >= 0 && code < 11172 ? code % 28 : 0;
    return `${word}${final === 0 || final === 8 ? "로" : "으로"}`;
}

/**
 * 마이 > 앱 색. 등록한 물건 사진에서 뽑은 색의 비율을 보여 주고, 여러 색을 칠하는 방식을 고른다.
 * 색 띠와 견본은 사용자의 물건에서 나온 값이라 토큰이 아닌 인라인 색을 쓴다(U1 의 예외 — 데이터로 그리는 색).
 */
export function TintSection() {
    const { palette, active, progress, settings, setSettings } = useTint();
    const scanning = progress.scanned < progress.withPhoto;

    const status =
        progress.withPhoto === 0
            ? "사진을 넣은 물건을 등록하면 그 물건의 색으로 앱이 물들어요."
            : scanning
              ? `사진에서 색을 찾는 중이에요… (${progress.scanned}/${progress.withPhoto})`
              : `사진이 있는 물건 ${progress.withPhoto}개 중 ${progress.colored}개에서 색을 찾았어요.`;

    return (
        <Section title="앱 색" description="등록한 물건의 사진 색으로 볼터치·제목 밑줄·바탕이 물들어요.">
            <Card padding="sm" className="space-y-4">
                {palette.length > 0 && (
                    <div className="space-y-3">
                        {/* 모은 색의 비율 — 칸 너비가 곧 비율이다 */}
                        <div
                            role="img"
                            aria-label={`모은 색: ${palette.map((s) => `${s.label} ${percent(s.share)}`).join(", ")}`}
                            className="sticker flex h-5 overflow-hidden rounded-full"
                        >
                            {palette.map((swatch) => (
                                <span
                                    key={swatch.family}
                                    style={{ flexGrow: swatch.count, backgroundColor: `rgb(${rgbChannels(swatch.rgb)})` }}
                                />
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {palette.map((swatch) => (
                                <Chip
                                    key={swatch.family}
                                    selected={settings.mode === "pick" && active.includes(swatch.family)}
                                    onClick={() => setSettings({ mode: "pick", pick: swatch.family })}
                                    aria-label={`${withEuro(swatch.label)} 고정하기, ${swatch.count}개`}
                                    className="tabular-nums"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="border-ink size-3 shrink-0 rounded-full border"
                                        style={{ backgroundColor: `rgb(${rgbChannels(swatch.rgb)})` }}
                                    />
                                    {swatch.label} {swatch.count}
                                </Chip>
                            ))}
                        </div>
                    </div>
                )}

                <Text size="xs" tone="muted" aria-live="polite">
                    {status}
                </Text>

                <RadioGroup
                    name="tint-mode"
                    label="여러 색을 모았을 때"
                    orientation="vertical"
                    value={settings.mode}
                    onChange={(event) => {
                        const mode = event.target.value;
                        if (!isTintMode(mode)) return;
                        // 하나 고르기를 처음 누르면 지금 가장 많은 색부터 고정한다
                        setSettings({ mode, pick: mode === "pick" ? (settings.pick ?? palette[0]?.family ?? null) : settings.pick });
                    }}
                    options={MODES.map((mode) => ({
                        value: mode.value,
                        label: (
                            <span className="block">
                                <span className="block">{mode.title}</span>
                                <span className="text-ink-soft block text-xs font-normal">{mode.hint}</span>
                            </span>
                        ),
                    }))}
                />
            </Card>
        </Section>
    );
}
