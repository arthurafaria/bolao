"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@bolao/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

const buttonVariants = cva(
	[
		"group/button relative inline-flex shrink-0 select-none items-center justify-center",
		"whitespace-nowrap overflow-hidden rounded-xl border border-transparent bg-clip-padding",
		"font-semibold text-xs outline-none",
		"transition-[background-color,color,border-color,box-shadow,opacity,transform]",
		"duration-[var(--motion-fast)] ease-[var(--ease-out-quart)]",
		"focus-visible:outline-2 focus-visible:outline-[var(--b-brand)] focus-visible:outline-offset-2",
		"active:scale-[0.96] active:duration-[60ms]",
		"hover:scale-[1.02]",
		"disabled:pointer-events-none disabled:opacity-50",
		"aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
		"[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	].join(" "),
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-[var(--b-shadow-brand-sm)] hover:shadow-[var(--b-shadow-brand-md)] hover:bg-primary/90",
				brand:
					"text-[var(--b-brand-fg)] shadow-[var(--b-shadow-brand-sm)] hover:shadow-[var(--b-shadow-brand-md)]" +
					" [background:var(--g-brand-diag)] hover:brightness-110",
				accent:
					"bg-[var(--b-accent)] text-[var(--b-accent-fg)] hover:bg-[var(--b-accent-hi)] shadow-sm",
				outline:
					"border-[var(--b-border-md)] bg-[var(--b-card)] text-[var(--b-text)] hover:bg-[var(--b-surface)] hover:border-[var(--b-border-lg)]",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost:
					"hover:bg-[var(--b-tint-md)] text-[var(--b-text-3)] hover:text-[var(--b-text)]",
				success:
					"bg-[var(--b-success)] text-[var(--b-success-fg)] hover:brightness-105",
				danger:
					"bg-[var(--b-danger-bg)] text-[var(--b-danger)] border-[var(--b-danger)/20%] hover:bg-[var(--b-danger)/15%]",
				"danger-solid":
					"bg-[var(--b-danger)] text-white hover:brightness-110",
				link:
					"text-[var(--b-brand)] underline-offset-4 hover:underline rounded-none hover:scale-100",
			},
			size: {
				default: "h-9 gap-1.5 px-4",
				xs:   "h-7 gap-1 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
				sm:   "h-8 gap-1 rounded-lg px-3 [&_svg:not([class*='size-'])]:size-3.5",
				lg:   "h-11 gap-2 px-6 text-sm",
				xl:   "h-12 gap-2 px-8 text-sm",
				icon:    "size-9 rounded-xl gap-0",
				"icon-xs": "size-7 rounded-lg gap-0 [&_svg:not([class*='size-'])]:size-3.5",
				"icon-sm": "size-8 rounded-lg gap-0",
				"icon-lg": "size-11 rounded-xl gap-0",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type ButtonProps = ButtonPrimitive.Props &
	VariantProps<typeof buttonVariants> & {
		loading?: boolean;
	};

function Button({
	className,
	variant = "default",
	size = "default",
	loading = false,
	disabled,
	children,
	...props
}: ButtonProps) {
	const isDisabled = disabled || loading;

	return (
		<ButtonPrimitive
			data-slot="button"
			data-loading={loading || undefined}
			disabled={isDisabled}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		>
			{/* Shine sweep no hover pra variants brand/default */}
			{(variant === "brand" || variant === "default") && (
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 -skew-x-12 translate-x-[-100%] bg-white/20 group-hover/button:animate-[shine-sweep_0.6s_var(--ease-out-expo)_forwards]"
				/>
			)}

			{loading && (
				<Loader2 className="absolute h-4 w-4 animate-spin" aria-hidden />
			)}
			<span className={cn("flex items-center gap-inherit", loading && "opacity-0")}>
				{children}
			</span>
		</ButtonPrimitive>
	);
}

export { Button, buttonVariants };
