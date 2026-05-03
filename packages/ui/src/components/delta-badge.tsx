import { cn } from "@bolao/ui/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface DeltaBadgeProps {
	value: number;
	suffix?: string;
	size?: "sm" | "md";
	className?: string;
	/** Inverter cor (ex.: posição menor = melhor) */
	inverted?: boolean;
}

export function DeltaBadge({
	value,
	suffix = "",
	size = "md",
	className,
	inverted = false,
}: DeltaBadgeProps) {
	const isUp = value > 0;
	const isDown = value < 0;
	const isFlat = value === 0;

	const goodIsUp = !inverted;
	const isGood = (isUp && goodIsUp) || (isDown && !goodIsUp);
	const isBad = (isDown && goodIsUp) || (isUp && !goodIsUp);

	const Icon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown;

	const color = isFlat
		? "text-[var(--b-text-4)] bg-[var(--b-tint-md)]"
		: isGood
			? "text-[var(--b-success)] bg-[var(--b-success-bg)]"
			: isBad
				? "text-[var(--b-danger)] bg-[var(--b-danger-bg)]"
				: "text-[var(--b-text-4)]";

	const sizing =
		size === "sm"
			? "h-5 px-1.5 text-[10px] gap-0.5"
			: "h-6 px-2 text-xs gap-1";

	const display = isFlat ? "0" : `${isUp ? "+" : ""}${value}`;

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full font-bold tabular-nums",
				sizing,
				color,
				className,
			)}
		>
			<Icon
				className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"}
				strokeWidth={3}
			/>
			{display}
			{suffix}
		</span>
	);
}
