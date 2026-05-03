"use client";

import { AnimatedNumber } from "@bolao/ui/components/animated-number";
import {
	BentoTile,
	BentoTileBody,
	BentoTileEyebrow,
	BentoTileFooter,
	BentoTileHeader,
} from "@bolao/ui/components/bento-tile";
import { DeltaBadge } from "@bolao/ui/components/delta-badge";
import { Sparkline } from "@bolao/ui/components/sparkline";
import { cn } from "@bolao/ui/lib/utils";

interface StatTileProps {
	label: string;
	value: number;
	suffix?: string;
	prefix?: string;
	delta?: number;
	deltaSuffix?: string;
	deltaInverted?: boolean;
	trend?: number[];
	icon?: React.ComponentType<{ className?: string }>;
	footer?: React.ReactNode;
	variant?: "default" | "accent" | "gold" | "dark";
	colSpan?: 1 | 2 | 3 | 4;
	className?: string;
}

export function StatTile({
	label,
	value,
	suffix,
	prefix,
	delta,
	deltaSuffix,
	deltaInverted,
	trend,
	icon: Icon,
	footer,
	variant = "default",
	colSpan = 1,
	className,
}: StatTileProps) {
	const isAccent = variant === "accent";
	const valueColor =
		variant === "dark"
			? "text-white"
			: isAccent
				? "text-[var(--b-brand-hi)]"
				: variant === "gold"
					? "text-[var(--b-gold)]"
					: "text-[var(--b-text)]";

	return (
		<BentoTile variant={variant} colSpan={colSpan} className={className}>
			<BentoTileHeader>
				<BentoTileEyebrow>{label}</BentoTileEyebrow>
				{Icon && (
					<span
						className={cn(
							"flex h-8 w-8 items-center justify-center rounded-full",
							variant === "dark"
								? "bg-white/10 text-white"
								: isAccent
									? "bg-[var(--b-brand-12)] text-[var(--b-brand)]"
									: variant === "gold"
										? "bg-[var(--b-gold-bg)] text-[var(--b-gold)]"
										: "bg-[var(--b-tint-md)] text-[var(--b-text-3)]",
						)}
					>
						<Icon className="h-4 w-4" />
					</span>
				)}
			</BentoTileHeader>
			<BentoTileBody>
				<div className="flex items-baseline gap-2">
					<span
						className={cn(
							"font-black font-display text-5xl tabular-nums leading-none sm:text-6xl",
							valueColor,
						)}
					>
						{prefix}
						<AnimatedNumber value={value} />
						{suffix}
					</span>
					{delta != null && (
						<DeltaBadge
							value={delta}
							suffix={deltaSuffix}
							inverted={deltaInverted}
						/>
					)}
				</div>
				{trend && trend.length > 1 && (
					<div className="mt-1">
						<Sparkline
							data={trend}
							width={140}
							height={32}
							stroke={
								isAccent
									? "var(--b-brand-hi)"
									: variant === "gold"
										? "var(--b-gold)"
										: variant === "dark"
											? "rgba(255,255,255,0.85)"
											: "var(--b-brand)"
							}
						/>
					</div>
				)}
			</BentoTileBody>
			{footer && <BentoTileFooter>{footer}</BentoTileFooter>}
		</BentoTile>
	);
}
