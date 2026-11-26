"use client";

import React, { useState } from "react";

import { Button } from "@/components/common";
import { GachaPull } from "@/components/machine/GachaPull";
import type { MachineModelId } from "@/lib/machine/models";

/**
 * 기계가 돌아가는 모습을 다시 돌려 볼 수 있는 칸.
 * 움직임은 부품이 화면에 올라올 때 한 번 돈다 — 그래서 `key` 를 바꿔 다시 올린다.
 */
export function PullDemo({ model, size, label }: { model: MachineModelId; size: number; label: string }) {
    const [turn, setTurn] = useState(0);
    return (
        <div className="flex flex-col items-center gap-2">
            <GachaPull key={turn} model={model} size={size} />
            <p className="text-center text-[11px] font-bold leading-tight">{label}</p>
            <Button
                size="sm"
                variant="outline"
                shape="pill"
                aria-label={`${label} 다시 돌리기`}
                onClick={() => setTurn((count) => count + 1)}
            >
                다시 돌리기
            </Button>
        </div>
    );
}
