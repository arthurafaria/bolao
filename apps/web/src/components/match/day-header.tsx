"use client";

import { cn } from "@bolao/ui/lib/utils";

interface DayHeaderProps {
	date: Date | string;
	totalMatches: number;
	predictedMatches: number;
	className?: string;
}

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTHS = [
	"JAN",
	"FEV",
	"MAR",
	"ABR",
	"MAI",
	"JUN",
	"JUL",
	"AGO",
	"SET",
	"OUT",
	"NOV",
	"DEZ",
];

export function DayHeader({
	date,
	totalMatches,
	predictedMatches,
	className,
}: DayHeaderProps) {
	const d = date instanceof Date ? date : new Date(date);
	const weekday = WEEKDAYS[d.getDay()];
	const day = d.getDate();
	const month = MONTHS[d.getMonth()];
	const isToday = isSameDay(d, new Date());
	const isTomorrow = isSameDay(d, addDays(new Date(), 1));

	const allDone = predictedMatches >= totalMatches;
	const anyDone = predictedMatches > 0;
	const pct = totalMatches > 0 ? (predictedMatches / totalMatches) * 100 : 0;

	const label = isToday ? "HOJE" : isTomorrow ? "AMANHÃ" : weekday;

	return (
		<div
			className={cn(
				"sticky top-0 z-10 -mx-1 flex flex-col gap-1.5 px-1 pt-2 pb-3",
				"bg-[color-mix(in_oklch,var(--b-bg)_85%,transparent)] backdrop-blur-md",
				"transition-shadow duration-[var(--motion-base)]",
				"[&[data-stuck=true]]:shadow-[0_8px_16px_-12px_rgba(0,0,0,0.18)]",
				className,
			)}
		>
			<div className="flex items-end justify-between gap-3">
				<div className="flex items-baseline gap-2">
					<span
						className={cn(
							"font-bold font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl",
							isToday ? "text-[var(--b-brand)]" : "text-[var(--b-text)]",
						)}
					>
						{label}
					</span>
					<span className="text-[var(--b-text-3)] text-eyebrow">
						{day} {month}
					</span>
				</div>
				<span
					className={cn(
						"font-mono font-semibold text-xs tabular-nums",
						allDone
							? "text-[var(--b-success)]"
							: anyDone
								? "text-[var(--b-warning-fg)]"
								: "text-[var(--b-text-3)]",
					)}
				>
					{predictedMatches}/{totalMatches} palpitados
				</span>
			</div>
			<div
				aria-hidden
				className="h-0.5 w-full overflow-hidden rounded-full bg-[var(--b-tint-md)]"
			>
				<div
					className="h-full rounded-full transition-[width] duration-[var(--motion-medium)] ease-[var(--ease-out-expo)]"
					style={{
						width: `${pct}%`,
						background: allDone
							? "var(--b-success)"
							: anyDone
								? "var(--b-warning)"
								: "var(--b-brand)",
					}}
				/>
			</div>
		</div>
	);
}

function isSameDay(a: Date, b: Date) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

function addDays(d: Date, n: number) {
	const r = new Date(d);
	r.setDate(r.getDate() + n);
	return r;
}
