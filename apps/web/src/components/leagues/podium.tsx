"use client";

import { cn } from "@bolao/ui/lib/utils";
import { Crown, Medal } from "lucide-react";

export interface PodiumEntry {
	position: 1 | 2 | 3;
	name: string;
	points: number;
	avatarUrl?: string;
}

interface PodiumProps {
	entries: PodiumEntry[];
	className?: string;
}

function avatarColor(name: string): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash) % 360;
	return `oklch(0.62 0.16 ${hue})`;
}

const STEP = {
	1: {
		height: "h-32 sm:h-40",
		color: "var(--b-gold)",
		bg: "var(--b-gold-bg)",
		order: "order-2",
		delay: "240ms",
		labelSize: "text-3xl sm:text-4xl",
		avatarSize: "h-20 w-20",
	},
	2: {
		height: "h-24 sm:h-32",
		color: "var(--b-silver)",
		bg: "var(--b-silver-bg)",
		order: "order-1",
		delay: "120ms",
		labelSize: "text-2xl sm:text-3xl",
		avatarSize: "h-16 w-16",
	},
	3: {
		height: "h-20 sm:h-24",
		color: "var(--b-bronze)",
		bg: "var(--b-bronze-bg)",
		order: "order-3",
		delay: "0ms",
		labelSize: "text-xl sm:text-2xl",
		avatarSize: "h-14 w-14",
	},
} as const;

export function Podium({ entries, className }: PodiumProps) {
	const filled = [1, 2, 3]
		.map((p) => entries.find((e) => e.position === p))
		.filter(Boolean) as PodiumEntry[];

	if (filled.length === 0) return null;

	return (
		<div
			className={cn(
				"grid grid-cols-3 items-end gap-3 sm:gap-6 px-4",
				className,
			)}
		>
			{filled.map((entry) => {
				const step = STEP[entry.position];
				return (
					<div
						key={entry.position}
						className={cn("flex flex-col items-center gap-3", step.order)}
					>
						{/* Avatar */}
						<div
							className="relative animate-podium-rise"
							style={{ animationDelay: step.delay }}
						>
							{entry.position === 1 && (
								<Crown
									className="-top-7 -translate-x-1/2 absolute left-1/2 h-7 w-7 animate-float"
									style={{
										color: "var(--b-gold)",
										filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
									}}
								/>
							)}
							{entry.avatarUrl ? (
								// biome-ignore lint/performance/noImgElement: avatar
								<img
									src={entry.avatarUrl}
									alt={entry.name}
									className={cn(
										"rounded-full object-cover ring-4",
										step.avatarSize,
									)}
									style={{ borderColor: step.color }}
								/>
							) : (
								<div
									className={cn(
										"flex items-center justify-center rounded-full font-black text-xl text-white ring-4",
										step.avatarSize,
									)}
									style={{
										background: avatarColor(entry.name),
										// @ts-expect-error CSS var
										"--tw-ring-color": step.color,
									}}
								>
									{entry.name.slice(0, 2).toUpperCase()}
								</div>
							)}
						</div>

						{/* Name + points */}
						<div
							className="flex animate-podium-rise flex-col items-center gap-0.5 text-center"
							style={{ animationDelay: step.delay }}
						>
							<span className="line-clamp-1 max-w-full font-bold font-display text-sm uppercase tracking-tight text-[var(--b-text)]">
								{entry.name}
							</span>
							<span
								className={cn(
									"font-black font-display tabular-nums leading-none",
									step.labelSize,
								)}
								style={{ color: step.color }}
							>
								{entry.points}
							</span>
							<span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
								pts
							</span>
						</div>

						{/* Step block */}
						<div
							className={cn(
								"flex w-full animate-podium-rise items-center justify-center rounded-t-2xl border-2 font-black font-display text-3xl",
								step.height,
							)}
							style={{
								borderColor: step.color,
								background: step.bg,
								color: step.color,
								animationDelay: step.delay,
							}}
						>
							{entry.position === 1 ? (
								<Crown className="h-8 w-8" />
							) : (
								<Medal className="h-7 w-7" />
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
