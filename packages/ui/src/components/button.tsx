"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { buttonVariants } from "@bolao/ui/lib/button-variants";
import { cn } from "@bolao/ui/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

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
