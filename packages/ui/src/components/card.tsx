import { cn } from "@bolao/ui/lib/utils";
import type * as React from "react";

type CardVariant = "default" | "elevated" | "inset" | "gradient" | "ghost";

function Card({
	className,
	variant = "default",
	hoverable = false,
	...props
}: React.ComponentProps<"div"> & {
	variant?: CardVariant;
	hoverable?: boolean;
}) {
	return (
		<div
			data-slot="card"
			data-variant={variant}
			data-hoverable={hoverable || undefined}
			className={cn(
				"group/card flex flex-col gap-4 overflow-hidden rounded-[28px] text-[var(--b-text)] text-sm/relaxed",
				/* Base por variant */
				variant === "default" && [
					"border border-[var(--b-border-sm)] bg-[var(--b-card)]",
					"shadow-[var(--b-shadow-soft)]",
				],
				variant === "elevated" && [
					"border border-[var(--b-border)] bg-[var(--b-card)]",
					"shadow-[var(--b-shadow-float)]",
				],
				variant === "inset" && [
					"border border-[var(--b-border-xs)] bg-[var(--b-inner)]",
				],
				variant === "gradient" && [
					"border border-[var(--b-border-sm)]",
					"[background:linear-gradient(135deg,color-mix(in_oklch,var(--b-brand)_8%,var(--b-card)),color-mix(in_oklch,var(--b-accent)_6%,var(--b-card)))]",
					"shadow-[var(--b-shadow-card)]",
				],
				variant === "ghost" && "bg-transparent",
				/* Hoverable */
				hoverable && [
					"cursor-pointer transition-[transform,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-out-quart)]",
					"hover:-translate-y-0.5 hover:shadow-[var(--b-shadow-brand-md)]",
				],
				className,
			)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				"grid auto-rows-min items-start gap-1 px-5 pt-5",
				className,
			)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-title"
			className={cn("text-[var(--b-text)] text-display-md text-lg", className)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-description"
			className={cn(
				"text-[var(--b-text-3)] text-sm leading-relaxed",
				className,
			)}
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-action"
			className={cn(
				"col-start-2 row-span-2 row-start-1 self-start justify-self-end",
				className,
			)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-content"
			className={cn("px-5", className)}
			{...props}
		/>
	);
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-footer"
			className={cn(
				"flex items-center border-[var(--b-border-xs)] border-t px-5 py-4",
				className,
			)}
			{...props}
		/>
	);
}

export {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
};
