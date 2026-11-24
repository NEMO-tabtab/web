"use client";

import Link from "next/link";

import { Badge, Card } from "@/components/common";
import { NemoFace } from "@/components/NemoFace";
import { cn } from "@/lib/cn";
import { productQueryHref } from "@/lib/productSearch";
import { summarize, type Placement } from "@/lib/pullResult";

const linkPill = "sticker sticker-press bg-paper text-ink rounded-full px-4 py-2 text-[13px] font-bold";

/** 한 줄에 붙는 도장. 새 것에만 먹 채움과 움직임을 쓴다 — 중복은 숫자만 */
function Stamp({ placement, order }: { placement: Exclude<Placement, { kind: "plain" }>; order: number }) {
    if (placement.kind === "duplicate") {
        return <span className="text-ink-soft font-sans text-[13px] font-bold tabular-nums">×{placement.owned}</span>;
    }
    if (placement.kind === "unknown") return null;
    return (
        <Badge
            variant="ink"
            size="sm"
            className="stamp-in"
            // 위에서부터 하나씩 찍힌다
            style={{ animationDelay: `${120 + order * 90}ms` }}
        >
            {placement.kind === "new-series" ? "새 시리즈" : "새 종류"}
        </Badge>
    );
}

export interface PullResultCardProps {
    /** 방금 등록한 물건들의 자리. 등록한 순서대로 */
    placements: Placement[];
    /** 이 화면을 연 뒤로 기록한 수 */
    totalCount: number;
    /** 방금 등록한 것 중 이름을 안 적은 물건이 있는가 */
    hasUnnamed: boolean;
}

/**
 * 등록한 순간의 반응(#202) — 방금 넣은 물건이 새 종류인지, 또 나온 종류인지, 그 시리즈를 얼마나 모았는지.
 * 색은 먹과 볼터치(네모의 볼)뿐이다. 움직임은 새 것이 있을 때만 쓰고, 줄이도록 설정한 기기에서는 쓰지 않는다(globals.css).
 */
export function PullResultCard({ placements, totalCount, hasUnnamed }: PullResultCardProps) {
    const summary = summarize(placements);
    const rows = placements.filter((each): each is Exclude<Placement, { kind: "plain" }> => each.kind !== "plain");

    return (
        <Card padding="sm" className="space-y-4" role="status">
            <div className="flex items-center gap-3">
                <span className={cn("shrink-0", summary.happy && "hop")}>
                    <NemoFace size={56} />
                </span>
                <div className="min-w-0">
                    <p className="font-display text-xl leading-snug break-keep">{summary.headline}</p>
                    <p className="text-ink-soft mt-0.5 text-[13px] font-bold">
                        지금까지 <span className="font-sans tabular-nums">{totalCount}</span>개 기록했어요. 이어서 더
                        등록할 수 있어요.
                    </p>
                </div>
            </div>

            {rows.length > 0 && (
                <ul className="space-y-1.5">
                    {rows.map((placement, index) => (
                        <li key={index} className="flex items-center justify-between gap-3">
                            <span className={cn("min-w-0 truncate text-sm font-bold", !placement.variantName && "text-ink-soft")}>
                                {placement.variantName ?? "종류 안 적음"}
                            </span>
                            <Stamp placement={placement} order={index} />
                        </li>
                    ))}
                </ul>
            )}

            {summary.series.length > 0 && (
                <ul className="border-line space-y-1 border-t pt-3">
                    {summary.series.map((series) => (
                        <li key={series.key}>
                            <Link
                                href={productQueryHref({ series: series.key })}
                                className="flex items-center justify-between gap-3 py-1 text-[13px] font-bold"
                            >
                                <span className="min-w-0 truncate underline underline-offset-4">{series.name}</span>
                                <span className="text-ink-soft shrink-0 font-sans tabular-nums">
                                    {series.kinds > 0 ? `모은 종류 ${series.kinds}` : "종류 안 적음"}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex flex-wrap gap-2">
                <Link href="/product" className={linkPill}>
                    목록에서 보기
                </Link>
                {hasUnnamed && (
                    <Link href={productQueryHref({ unnamed: true })} className={linkPill}>
                        이름 채우기
                    </Link>
                )}
            </div>
        </Card>
    );
}
