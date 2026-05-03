"use client";

import { cn } from "@bolao/ui/lib/utils";
import { useEffect, useState } from "react";

interface LiveClockProps {
	/** Data alvo (kickoff). Mostra contagem regressiva até ela. */
	target: Date | string | number;
	/** Tamanho */
	size?: "sm" | "md" | "lg" | "xl";
	/** Mostrar dias quando > 24h */
	showDays?: boolean;
	/** Texto se já passou */
	expiredLabel?: string;
	className?: string;
}

interface Parts {
	d: number;
	h: number;
	m: number;
	s: number;
	expired: boolean;
}

function diffParts(target: number, now: number): Parts {
	const ms = target - now;
	if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
	const totalSec = Math.floor(ms / 1000);
	const d = Math.floor(totalSec / 86400);
	const h = Math.floor((totalSec % 86400) / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	return { d, h, m, s, expired: false };
}

const pad = (n: number) => n.toString().padStart(2, "0");

const sizeStyles = {
	sm: "text-base",
	md: "text-2xl",
	lg: "text-4xl",
	xl: "text-[var(--font-scoreboard-size)]",
} as const;

export function LiveClock({
	target,
	size = "lg",
	showDays = true,
	expiredLabel = "Em jogo",
	className,
}: LiveClockProps) {
	const targetMs =
		target instanceof Date
			? target.getTime()
			: typeof target === "string"
				? new Date(target).getTime()
				: target;

	const [parts, setParts] = useState<Parts>(() =>
		diffParts(targetMs, Date.now()),
	);

	useEffect(() => {
		setParts(diffParts(targetMs, Date.now()));
		const id = setInterval(() => {
			setParts(diffParts(targetMs, Date.now()));
		}, 1000);
		return () => clearInterval(id);
	}, [targetMs]);

	if (parts.expired) {
		return (
			<span
				className={cn(
					"font-bold font-display text-[var(--b-danger)] uppercase tracking-widest",
					sizeStyles[size],
					className,
				)}
			>
				{expiredLabel}
			</span>
		);
	}

	const showD = showDays && parts.d > 0;
	const showH = showD || parts.h > 0;

	return (
		<span
			className={cn(
				"inline-flex items-baseline gap-1 font-medium font-mono tabular-nums leading-none",
				sizeStyles[size],
				className,
			)}
			aria-live="polite"
		>
			{showD && (
				<>
					<Digit value={parts.d} />
					<Sep>d</Sep>
				</>
			)}
			{showH && <Digit value={pad(parts.h)} />}
			{showH && <Sep>:</Sep>}
			<Digit value={pad(parts.m)} />
			<Sep>:</Sep>
			<Digit value={pad(parts.s)} />
		</span>
	);
}

function Digit({ value }: { value: string | number }) {
	return <span className="inline-block">{value}</span>;
}

function Sep({ children }: { children: React.ReactNode }) {
	return (
		<span className="opacity-50" aria-hidden>
			{children}
		</span>
	);
}
