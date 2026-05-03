"use client";

import { cn } from "@bolao/ui/lib/utils";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<SpinnerSize, { outer: string; inner: string }> = {
	xs: { outer: "h-3 w-3 border-[1.5px]", inner: "h-3 w-3 border-[1.5px]" },
	sm: { outer: "h-4 w-4 border-2", inner: "h-4 w-4 border-2" },
	md: { outer: "h-6 w-6 border-2", inner: "h-6 w-6 border-2" },
	lg: { outer: "h-8 w-8 border-[2.5px]", inner: "h-8 w-8 border-[2.5px]" },
	xl: { outer: "h-12 w-12 border-[3px]", inner: "h-12 w-12 border-[3px]" },
};

interface SpinnerProps {
	size?: SpinnerSize;
	className?: string;
	label?: string;
}

export function Spinner({
	size = "md",
	className,
	label = "Carregando...",
}: SpinnerProps) {
	const { outer, inner } = sizeMap[size];

	return (
		<span
			role="status"
			aria-label={label}
			className={cn(
				"relative inline-flex items-center justify-center",
				outer.split(" ").find((s) => s.startsWith("h-")),
				inner.split(" ").find((s) => s.startsWith("w-")),
				className,
			)}
		>
			{/* Anel externo */}
			<span
				className={cn(
					"absolute rounded-full border-[var(--b-brand-15)]",
					"animate-[spin-ring_1s_linear_infinite]",
					outer,
				)}
				style={{ borderTopColor: "var(--b-brand)" }}
			/>
			{/* Anel interno (direção oposta, velocidade diferente) */}
			<span
				className={cn(
					"absolute rounded-full border-[var(--b-brand-10)]",
					"animate-[spin-ring_0.7s_linear_infinite_reverse]",
					inner,
				)}
				style={{
					borderTopColor: "var(--b-accent)",
					transform: "scale(0.65)",
				}}
			/>
		</span>
	);
}
