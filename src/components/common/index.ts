/**
 * NEMO 공통 프리미티브 배럴.
 *
 * `BottomNavigation` / `Tabs` / `Modal` 은 의도적으로 제외한다 — "use client" 모듈이라
 * 서버 컴포넌트가 이 배럴에서 아무거나 import 하면 클라이언트 경계가 딸려온다.
 * 이들은 `@/components/common/Tabs` 처럼 직접 경로로 import 할 것.
 */

export { Badge, badgeSizes, badgeVariants } from "./Badge";
export type { BadgeProps, BadgeVariant } from "./Badge";

export { Button, buttonSizes, buttonVariants } from "./Button";
export type { ButtonProps, ButtonVariant } from "./Button";

export { Card, cardPaddings, cardVariants } from "./Card";
export type { CardProps, CardVariant } from "./Card";

export { Checkbox } from "./Checkbox";
export type { CheckboxProps } from "./Checkbox";

export { Chip } from "./Chip";
export type { ChipProps } from "./Chip";

export { Divider, dividerTones } from "./Divider";
export type { DividerProps } from "./Divider";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export { ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";

export { FAB, fabSizes, fabVariants } from "./FAB";
export type { FABProps, FabVariant } from "./FAB";

export { IconTile, iconTileShapes, iconTileSizes, iconTileTones } from "./IconTile";
export type { IconTileProps } from "./IconTile";

export { InfoRow } from "./InfoRow";
export type { InfoRowProps } from "./InfoRow";

export { Input } from "./Input";
export type { InputProps } from "./Input";

export { PageHeader, PageShell, shellWidths } from "./PageShell";
export type { PageHeaderProps, PageShellProps } from "./PageShell";

export { Price, priceSizes } from "./Price";
export type { PriceProps } from "./Price";

export { ProductCard } from "./ProductCard";
export type { ProductCardProps } from "./ProductCard";

export { RadioGroup } from "./RadioGroup";
export type { RadioGroupProps, RadioOption } from "./RadioGroup";

export { Section } from "./Section";
export type { SectionProps } from "./Section";

export { LoadingState, ProductCardSkeleton, Skeleton } from "./Skeleton";
export type { LoadingStateProps, SkeletonProps } from "./Skeleton";

export { StatTile } from "./StatTile";
export type { StatTileProps } from "./StatTile";

export { Textarea } from "./Textarea";
export type { TextareaProps } from "./Textarea";

export { Heading, Text, headingLevels, textSizes, textWeights, toneClasses } from "./Typography";
export type { HeadingProps, TextProps, Tone } from "./Typography";
