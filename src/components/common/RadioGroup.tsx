import React from "react";

import { cn } from "@/lib/cn";

export interface RadioOption {
    value: string;
    label: React.ReactNode;
}

export interface RadioGroupProps {
    name: string;
    label?: React.ReactNode;
    options: readonly RadioOption[];
    value?: string;
    defaultValue?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    required?: boolean;
    /** 선택 오류. Input · Textarea 의 error 와 같은 자리에 같은 모양으로 붙는다. */
    error?: string;
    orientation?: "horizontal" | "vertical";
    className?: string;
}

/**
 * Checkbox 와 같은 방식 — 네이티브 라디오를 지우고 2px 먹선 원을 직접 그린다.
 * 선택되면 안쪽에 먹 점이 찍힌다. 점은 input 의 형제라 `peer-checked:` 로 켠다.
 * fieldset/legend 구조는 그대로 둔다 (스크린리더가 그룹 이름을 읽는다).
 */
export function RadioGroup({
    name,
    label,
    options,
    value,
    defaultValue,
    onChange,
    required,
    error,
    orientation = "horizontal",
    className,
}: RadioGroupProps) {
    // 오류는 fieldset 의 aria-describedby 로만 알린다 —
    // aria-invalid 는 role="radio" 가 지원하지 않아 개별 라디오에는 달 수 없다.
    // name 은 폼 안에서 라디오 그룹을 가르는 키라 이미 유일하다 — id prop 을 따로 받지 않고 여기서 파생시킨다.
    const errorId = `${name}-error`;

    return (
        // fieldset 의 기본 min-width: min-content 가 flex 안에서 레이아웃을 밀어낸다
        <fieldset className={cn("min-w-0", className)} aria-describedby={error ? errorId : undefined}>
            {label && (
                <legend className="text-ink mb-1.5 text-[13px] font-bold">
                    {label}
                    {/* 필수 표시는 먹선 그대로 — danger 는 삭제·오류 전용이다 */}
                    {required && <span aria-hidden="true"> *</span>}
                </legend>
            )}
            <div className={cn("flex gap-x-4 gap-y-2", orientation === "vertical" ? "flex-col" : "flex-wrap")}>
                {options.map((option) => (
                    <label
                        key={option.value}
                        className="text-ink flex cursor-pointer items-center gap-2 text-sm font-medium select-none"
                    >
                        <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
                            <input
                                type="radio"
                                name={name}
                                value={option.value}
                                checked={value === undefined ? undefined : value === option.value}
                                defaultChecked={defaultValue === undefined ? undefined : defaultValue === option.value}
                                onChange={onChange}
                                required={required}
                                className={cn(
                                    "peer border-ink bg-paper size-5 appearance-none rounded-full border-2",
                                    "focus-visible:outline-ink focus-visible:outline-[3px] focus-visible:outline-offset-2",
                                    // .field 를 쓰지 않는 컨트롤이라 ! 없이 평범하게 덮인다
                                    error && "border-danger",
                                )}
                            />
                            {/* 선택 표시 — 안쪽 먹 점 */}
                            <span
                                aria-hidden="true"
                                className="bg-ink pointer-events-none absolute size-2.5 rounded-full opacity-0 peer-checked:opacity-100"
                            />
                        </span>
                        <span>{option.label}</span>
                    </label>
                ))}
            </div>
            {error && (
                <p id={errorId} className="text-danger mt-1.5 text-xs">
                    {error}
                </p>
            )}
        </fieldset>
    );
}
