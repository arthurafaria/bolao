import { cn } from "@bolao/ui/lib/utils";
import type * as React from "react";

type TagVariant =
	| "brand"
	| "accent"
	| "success"
	| "warning"
	| "danger"
	| "muted";

const variantStyles: Record<TagVariant, string> = {
	brand:
		"bg-[var(--b-brand-10)] text-[var(--b-brand)] border-[var(--b-brand-25)]",
	accent:
		"bg-[var(--b-accent-50)] text-[var(--b-accent-fg)] border-[var(--b-accent)/30%]",
	success:
		"bg-[var(--b-success-bg)] text-[var(--b-success)] border-[var(--b-success)/20%]",
	warning:
		"bg-[var(--b-warning-bg)] text-[var(--b-warning-fg)] border-[var(--b-warning)/20%]",
	danger:
		"bg-[var(--b-danger-bg)] text-[var(--b-danger)] border-[var(--b-danger)/20%]",
	muted:
		"bg-[var(--b-tint-md)] text-[var(--b-text-3)] border-[var(--b-border-sm)]",
};

interface TagProps extends React.ComponentProps<"span"> {
	variant?: TagVariant;
	dot?: boolean;
}

export function Tag({
	variant = "brand",
	dot = false,
	className,
	children,
	...props
}: TagProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
				"font-semibold text-xs uppercase tracking-[0.18em]",
				variantStyles[variant],
				className,
			)}
			{...props}
		>
			{dot && (
				<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
			)}
			{children}
		</span>
	);
}
