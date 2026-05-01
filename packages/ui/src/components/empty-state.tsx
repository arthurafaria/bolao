import { cn } from "@bolao/ui/lib/utils";
import type * as React from "react";

interface EmptyStateProps {
	icon?: React.ReactNode;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-4 rounded-[28px] px-8 py-14 text-center",
				"border border-dashed border-[var(--b-border-md)] bg-[var(--b-surface)]",
				"animate-fade-in",
				className,
			)}
		>
			{icon && (
				<div
					className="flex h-14 w-14 items-center justify-center rounded-2xl"
					style={{ background: "var(--b-brand-10)", color: "var(--b-brand)" }}
				>
					{icon}
				</div>
			)}
			<div className="max-w-xs space-y-1.5">
				<p className="font-display text-xl uppercase font-800 text-[var(--b-text)]">{title}</p>
				{description && (
					<p className="text-sm leading-relaxed text-[var(--b-text-3)]">{description}</p>
				)}
			</div>
			{action && <div className="mt-1">{action}</div>}
		</div>
	);
}
