import { Badge, type BadgeVariant } from "@/components/common";
import type { HttpMethod } from "@/lib/api/client";

/** 메서드도 색이 아니라 채움·선으로 구분한다 — 삭제만 danger */
const variants: Record<HttpMethod, BadgeVariant> = {
    GET: "neutral",
    POST: "ink",
    PUT: "success",
    DELETE: "danger",
};

export function MethodBadge({ method }: { method: HttpMethod }) {
    return (
        <Badge variant={variants[method]} size="sm" className="w-14 shrink-0 justify-center font-mono">
            {method}
        </Badge>
    );
}
