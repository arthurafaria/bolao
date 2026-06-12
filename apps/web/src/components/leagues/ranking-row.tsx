"use client";

import { DeltaBadge } from "@bolao/ui/components/delta-badge";
import { cn } from "@bolao/ui/lib/utils";
import { Crown } from "lucide-react";

interface RankingRowProps {
	position: number;
	name: string;
	points: number;
	exacts?: number;
	metric?: "points" | "exacts";
	delta?: number;
	avatarUrl?: string;
	isYou?: boolean;
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

export function RankingRow({
	position,
	name,
	points,
	exacts,
	metric = "points",
	delta,
	avatarUrl,
	isYou = false,
	className,
}: RankingRowProps) {
	const isPodium = position <= 3;
	const podiumColor =
		position === 1
			? "var(--b-gold)"
			: position === 2
				? "var(--b-silver)"
				: position === 3
					? "var(--b-bronze)"
					: undefined;

	return (
		<div
			className={cn(
				"group relative flex items-center gap-3 rounded-2xl border border-[var(--b-border-sm)] bg-[var(--b-card)] px-4 py-3",
				"transition-[transform,box-shadow,background] duration-[var(--motion-base)] ease-[var(--ease-out-quart)]",
				"hover:-translate-y-0.5 hover:shadow-[var(--b-shadow-brand-sm)]",
				isYou &&
					"ring-2 ring-[var(--b-brand)] ring-offset-2 ring-offset-[var(--b-bg)]",
				className,
			)}
			style={
				isPodium
					? {
							borderLeft: `3px solid ${podiumColor}`,
						}
					: undefined
			}
		>
			{/* Position */}
			<div
				className={cn(
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black font-display text-lg tabular-nums",
				)}
				style={{
					background: isPodium
						? `color-mix(in oklch, ${podiumColor} 14%, var(--b-card))`
						: "var(--b-tint-md)",
					color: isPodium ? podiumColor : "var(--b-text-3)",
				}}
			>
				{position}
			</div>

			{/* Avatar */}
			<div className="relative shrink-0">
				{avatarUrl ? (
					// biome-ignore lint/performance/noImgElement: avatar
					<img
						src={avatarUrl}
						alt={name}
						className="h-10 w-10 rounded-full object-cover"
					/>
				) : (
					<div
						className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm text-white"
						style={{ background: avatarColor(name) }}
					>
						{name.slice(0, 2).toUpperCase()}
					</div>
				)}
				{position === 1 && (
					<Crown
						className="absolute -top-2 -right-1 h-4 w-4 animate-float"
						style={{
							color: "var(--b-gold)",
							filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
						}}
					/>
				)}
			</div>

			{/* Name */}
			<div className="flex min-w-0 flex-1 flex-col">
				<span
					className={cn(
						"truncate font-bold font-display text-base uppercase tracking-tight",
						isYou ? "text-[var(--b-brand)]" : "text-[var(--b-text)]",
					)}
				>
					{name}
					{isYou && (
						<span className="ml-2 font-mono font-normal text-[var(--b-text-3)] text-xs normal-case">
							(você)
						</span>
					)}
				</span>
			</div>

			{/* Delta */}
			{delta != null && (
				<DeltaBadge value={delta} size="sm" inverted className="shrink-0" />
			)}

			{/* Stats: pontos | cravadas */}
			{exacts !== undefined ? (
				<div className="flex shrink-0 items-center gap-2">
					{/* Pontos — sempre à esquerda */}
					<div
						className={cn(
							"flex flex-col items-end",
							metric === "points"
								? "text-[var(--b-text)]"
								: "text-[var(--b-text-3)]",
						)}
					>
						<span
							className={cn(
								"font-black font-display tabular-nums leading-none",
								metric === "points" ? "text-2xl" : "text-lg",
							)}
						>
							{points}
						</span>
						<span className="text-[10px] uppercase tracking-wider">pts</span>
					</div>
					<span className="h-8 w-px bg-[var(--b-border-md)]" />
					{/* Cravadas — sempre à direita */}
					<div
						className={cn(
							"flex flex-col items-end",
							metric === "exacts"
								? "text-[var(--b-text)]"
								: "text-[var(--b-text-3)]",
						)}
					>
						<span
							className={cn(
								"font-black font-display tabular-nums leading-none",
								metric === "exacts" ? "text-2xl" : "text-lg",
							)}
						>
							{exacts}
						</span>
						<span className="text-[10px] uppercase tracking-wider">
							{exacts === 1 ? "cravada" : "cravadas"}
						</span>
					</div>
				</div>
			) : (
				<div className="flex shrink-0 flex-col items-end">
					<span className="font-black font-display text-2xl text-[var(--b-text)] tabular-nums leading-none">
						{points}
					</span>
					<span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
						pts
					</span>
				</div>
			)}
		</div>
	);
}
