"use client";

import { cn } from "@bolao/ui/lib/utils";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

interface LockCountdownProps {
	/** Data UTC do kickoff (ISO ou ms) */
	kickoff: Date | string | number;
	/** Antecedência do lock em minutos. Default: 60. */
	lockMinutesBefore?: number;
	className?: string;
}

type Urgency = "calm" | "warning" | "danger" | "critical" | "locked";

function classify(msToLock: number): Urgency {
	if (msToLock <= 0) return "locked";
	const min = msToLock / 60_000;
	if (min < 5) return "critical";
	if (min < 60) return "danger";
	if (min < 6 * 60) return "warning";
	return "calm";
}

function formatRemaining(ms: number): string {
	if (ms <= 0) return "Bloqueado";
	const totalSec = Math.floor(ms / 1000);
	const d = Math.floor(totalSec / 86400);
	const h = Math.floor((totalSec % 86400) / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	if (d > 0) return `${d}d ${h}h`;
	if (h > 0) return `${h}h ${m}m`;
	if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
	return `${s}s`;
}

const urgencyStyles: Record<Urgency, string> = {
	calm: "bg-[var(--b-tint-md)] text-[var(--b-text-3)]",
	warning: "bg-[var(--b-warning-bg)] text-[var(--b-warning-fg)]",
	danger: "bg-[var(--b-danger-bg)] text-[var(--b-danger-fg)]",
	critical:
		"bg-[var(--b-danger-bg)] text-[var(--b-danger-fg)] animate-pulse-danger",
	locked: "bg-[var(--b-tint-md)] text-[var(--b-text-4)]",
};

const urgencyLabel: Record<Urgency, string> = {
	calm: "Fecha em",
	warning: "Fecha em",
	danger: "Fecha em",
	critical: "Última chance",
	locked: "Fechado",
};

export function LockCountdown({
	kickoff,
	lockMinutesBefore = 60,
	className,
}: LockCountdownProps) {
	const kickoffMs =
		kickoff instanceof Date
			? kickoff.getTime()
			: typeof kickoff === "string"
				? new Date(kickoff).getTime()
				: kickoff;
	const lockMs = kickoffMs - lockMinutesBefore * 60_000;

	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		setNow(Date.now());
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	const remain = lockMs - now;
	const urgency = classify(remain);

	return (
		<span
			className={cn(
				"inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 font-bold font-mono text-xs tabular-nums",
				urgencyStyles[urgency],
				className,
			)}
			aria-live="polite"
		>
			<Lock className="h-3 w-3" strokeWidth={2.5} />
			<span className="text-[10px] text-eyebrow tracking-[0.18em]">
				{urgencyLabel[urgency]}
			</span>
			{urgency !== "locked" && (
				<span className="font-mono">{formatRemaining(remain)}</span>
			)}
		</span>
	);
}
