"use client";

import { cn } from "@bolao/ui/lib/utils";

interface DotsLoaderProps {
	label?: string;
	className?: string;
	size?: "sm" | "md";
}

export function DotsLoader({ label, className, size = "md" }: DotsLoaderProps) {
	const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

	return (
		<span
			role="status"
			aria-label={label ?? "Carregando"}
			className={cn("inline-flex items-center gap-1.5", className)}
		>
			{[0, 1, 2].map((i) => (
				<span
					key={i}
					className={cn("rounded-full bg-[var(--b-brand)]", dotSize)}
					style={{
						animation: `bounce-dot 1.2s ease-in-out ${i * 0.16}s infinite`,
					}}
				/>
			))}
			{label && (
				<span className="ml-2 text-sm text-[var(--b-text-3)]">{label}</span>
			)}
		</span>
	);
}
