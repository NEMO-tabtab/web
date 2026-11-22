import { Icon, Section } from "@/components/common";
import { cn } from "@/lib/cn";
import { EXTERNAL_LINK_PROPS, LEGAL_DOCS } from "@/lib/legal";

const rowClassName = (index: number) =>
    cn(
        "sticker-press flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
        index > 0 && "border-ink border-t-2",
    );

/** 약관 및 정책 — 로그인 여부와 상관없이 언제든 열 수 있어야 해서 마이 화면에 늘 둔다 */
export function PolicySection() {
    return (
        <Section title="약관 및 정책" titleClassName="scribble">
            <div className="sticker overflow-hidden rounded-nemo bg-paper">
                {LEGAL_DOCS.map((doc, index) => (
                    <a key={doc.key} href={doc.href} {...EXTERNAL_LINK_PROPS} className={rowClassName(index)}>
                        <span className="text-sm font-bold">
                            {doc.label}
                            <span className="sr-only"> (새 창에서 열림)</span>
                        </span>
                        <Icon name="external-link" className="text-lg text-ink-soft" />
                    </a>
                ))}
            </div>
        </Section>
    );
}
