"use client";

import { Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const KICKOFF_MS = Date.UTC(2026, 5, 11, 12, 0, 0);
const FINAL_MS = Date.UTC(2026, 6, 19, 23, 59, 59);

export function CupCountdown() {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const id = window.setInterval(() => setNow(Date.now()), 60 * 1000);
		return () => window.clearInterval(id);
	}, []);

	const label = useMemo(() => {
		if (now > FINAL_MS) return null;
		if (now >= KICKOFF_MS) return "A Copa está rolando — palpite agora";

		const diff = Math.max(0, KICKOFF_MS - now);
		const minute = 60 * 1000;
		const hour = 60 * minute;
		const day = 24 * hour;
		const days = Math.floor(diff / day);
		const hours = Math.floor((diff % day) / hour);
		const minutes = Math.floor((diff % hour) / minute);
		return `Faltam ${days}d ${hours}h ${minutes}m pra bola rolar`;
	}, [now]);

	if (!label) return null;

	return (
		<div className="mt-6 inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-[var(--b-brand-25)] bg-[var(--b-brand-10)] px-4 py-2 font-bold text-[var(--b-brand)] text-xs uppercase tracking-wide sm:text-sm">
			<Timer className="h-4 w-4 shrink-0" />
			<span className="tabular-nums" suppressHydrationWarning>
				{label}
			</span>
		</div>
	);
}
