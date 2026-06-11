"use client";

import { cn } from "@bolao/ui/lib/utils";
import { useEffect, useId, useRef, useState } from "react";

export interface PillTabItem<T extends string = string> {
	value: T;
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	count?: number;
}

interface PillTabsProps<T extends string> {
	items: PillTabItem<T>[];
	value: T;
	onChange: (value: T) => void;
	className?: string;
	size?: "sm" | "md";
	"aria-label"?: string;
}

export function PillTabs<T extends string>({
	items,
	value,
	onChange,
	className,
	size = "md",
	"aria-label": ariaLabel,
}: PillTabsProps<T>) {
	const id = useId();
	const containerRef = useRef<HTMLDivElement>(null);
	const [pillStyle, setPillStyle] = useState<{
		left: number;
		width: number;
	} | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const el =
			container.querySelector<HTMLButtonElement>(`[data-active="true"]`);
		if (!el) return;
		setPillStyle({
			left: el.offsetLeft,
			width: el.offsetWidth,
		});
	}, [value, items]);

	const padding = size === "sm" ? "p-1" : "p-1.5";
	const buttonSize = size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";

	return (
		<div
			ref={containerRef}
			role="tablist"
			aria-label={ariaLabel}
			className={cn(
				"relative inline-flex items-center gap-1 rounded-full border border-[var(--b-border-sm)] bg-[var(--b-inner)]",
				padding,
				className,
			)}
		>
			{pillStyle && (
				<span
					aria-hidden
					className="pointer-events-none absolute top-1/2 z-0 -translate-y-1/2 rounded-full bg-[var(--b-action)] shadow-[0_2px_6px_oklch(0.55_0.14_95_/_0.4)]"
					style={{
						left: pillStyle.left,
						width: pillStyle.width,
						height: size === "sm" ? 32 : 40,
						transition:
							"left var(--motion-base) var(--ease-out-expo), width var(--motion-base) var(--ease-out-expo)",
					}}
				/>
			)}
			{items.map((item) => {
				const active = item.value === value;
				const Icon = item.icon;
				return (
					<button
						key={item.value}
						type="button"
						role="tab"
						aria-selected={active}
						aria-controls={`${id}-panel-${item.value}`}
						data-active={active || undefined}
						onClick={() => onChange(item.value)}
						className={cn(
							"relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full font-semibold uppercase tracking-wide transition-colors duration-[var(--motion-base)]",
							buttonSize,
							active
								? "text-[var(--b-action-fg)] dark:text-[var(--b-action-fg)]"
								: "text-[var(--b-text-3)] hover:text-[var(--b-text-2)]",
						)}
					>
						{Icon && <Icon className="h-3.5 w-3.5" />}
						<span>{item.label}</span>
						{item.count != null && (
							<span
								className={cn(
									"ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-bold text-[10px] tabular-nums",
									active
										? "bg-[oklch(0.55_0.14_95_/_0.35)] text-[var(--b-action-fg)]"
										: "bg-[var(--b-tint-md)] text-[var(--b-text-3)]",
								)}
							>
								{item.count}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
