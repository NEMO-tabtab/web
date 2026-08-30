export interface SwatchItem {
    name: string;
    hex: string;
    /**
     * 리터럴 클래스 문자열이어야 한다. `bg-${name}` 처럼 조합하면
     * Tailwind 스캐너가 못 보고 규칙 자체를 방출하지 않는다.
     */
    className: string;
    note?: string;
}

/** 색 견본 한 장 — 먹선 스티커 안에 색면을 얹고 아래에 이름·값을 적는다 */
export function Swatch({ item }: { item: SwatchItem }) {
    return (
        <div className="sticker rounded-nemo bg-paper overflow-hidden">
            {/* paper 견본은 카드 배경과 같은 색이라 아래 먹선이 유일한 경계다 */}
            <div className={`border-ink h-16 w-full border-b-2 ${item.className}`} />
            <div className="space-y-0.5 p-3">
                <p className="text-ink text-xs font-bold">{item.name}</p>
                <p className="text-ink-soft font-sans text-[11px] uppercase tabular-nums">{item.hex}</p>
                {item.note && <p className="text-ink-soft text-[11px] leading-snug">{item.note}</p>}
            </div>
        </div>
    );
}

export function SwatchGrid({ items }: { items: readonly SwatchItem[] }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
                <Swatch key={item.name} item={item} />
            ))}
        </div>
    );
}
