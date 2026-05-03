import { cn } from "@bolao/ui/lib/utils";
import type * as React from "react";

type BentoVariant = "default" | "accent" | "gold" | "dark";

interface BentoTileProps extends React.ComponentProps<"div"> {
	variant?: BentoVariant;
	hoverable?: boolean;
	/** Span de colunas (1–4) */
	colSpan?: 1 | 2 | 3 | 4;
	/** Span de linhas (1–3) */
	rowSpan?: 1 | 2 | 3;
}

const variantStyles: Record<BentoVariant, string> = {
	default:
		"bg-[var(--b-card)] border border-[var(--b-border-sm)] text-[var(--b-text)]",
	accent: [
		"text-[var(--b-text)]",
		"[background:linear-gradient(180deg,color-mix(in_oklch,var(--b-brand)_14%,var(--b-card)),var(--b-card))]",
		"border border-[var(--b-brand-25)]",
	].join(" "),
	gold: [
		"text-[var(--b-text)]",
		"[background:linear-gradient(180deg,color-mix(in_oklch,var(--b-gold)_14%,var(--b-card)),var(--b-card))]",
		"border border-[color-mix(in_oklch,var(--b-gold)_30%,transparent)]",
	].join(" "),
	dark: [
		"text-white",
		"[background:var(--g-editorial-dark)]",
		"border border-white/10",
	].join(" "),
};

const colSpanMap: Record<1 | 2 | 3 | 4, string> = {
	1: "col-span-1",
	2: "col-span-1 sm:col-span-2",
	3: "col-span-1 sm:col-span-2 lg:col-span-3",
	4: "col-span-1 sm:col-span-2 lg:col-span-4",
};

const rowSpanMap: Record<1 | 2 | 3, string> = {
	1: "row-span-1",
	2: "row-span-2",
	3: "row-span-3",
};

export function BentoTile({
	variant = "default",
	hoverable = false,
	colSpan = 1,
	rowSpan = 1,
	className,
	children,
	...props
}: BentoTileProps) {
	return (
		<div
			data-slot="bento-tile"
			data-variant={variant}
			className={cn(
				"group/tile relative flex flex-col gap-3 overflow-hidden rounded-[28px] p-5 shadow-[var(--b-shadow-card-soft)]",
				variantStyles[variant],
				colSpanMap[colSpan],
				rowSpanMap[rowSpan],
				hoverable && [
					"cursor-pointer transition-[transform,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-out-quart)]",
					"hover:-translate-y-1 hover:shadow-[var(--b-shadow-brand-md)]",
				],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export function BentoTileHeader({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex items-center justify-between gap-3", className)}
			{...props}
		/>
	);
}

export function BentoTileEyebrow({
	className,
	children,
	...props
}: React.ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"text-eyebrow text-[var(--b-text-3)]",
				"data-[variant='dark']/tile:text-white/60",
				className,
			)}
			{...props}
		>
			{children}
		</p>
	);
}

export function BentoTileBody({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("flex flex-1 flex-col gap-2", className)} {...props} />
	);
}

export function BentoTileFooter({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"mt-auto flex items-center justify-between gap-2 text-xs text-[var(--b-text-3)]",
				className,
			)}
			{...props}
		/>
	);
}
