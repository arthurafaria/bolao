import { cva } from "class-variance-authority";

export const buttonVariants = cva(
	[
		"group/button relative inline-flex shrink-0 select-none items-center justify-center",
		"overflow-hidden whitespace-nowrap rounded-xl border border-transparent bg-clip-padding",
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
					"bg-primary text-primary-foreground shadow-[var(--b-shadow-brand-sm)] hover:bg-primary/90 hover:shadow-[var(--b-shadow-brand-md)]",
				brand:
					"bg-[var(--b-brand)] text-[var(--b-brand-fg)] shadow-[var(--b-shadow-brand-sm)] hover:bg-[var(--b-brand-hi)] hover:shadow-[var(--b-shadow-brand-md)]",
				accent:
					"bg-[var(--b-accent)] text-[var(--b-accent-fg)] shadow-sm hover:bg-[var(--b-accent-hi)]",
				outline:
					"border-[var(--b-border-md)] bg-[var(--b-card)] text-[var(--b-text)] hover:border-[var(--b-border-lg)] hover:bg-[var(--b-surface)]",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost:
					"text-[var(--b-text-3)] hover:bg-[var(--b-tint-md)] hover:text-[var(--b-text)]",
				success:
					"bg-[var(--b-success)] text-[var(--b-success-fg)] hover:brightness-105",
				danger:
					"border-[var(--b-danger)/20%] bg-[var(--b-danger-bg)] text-[var(--b-danger)] hover:bg-[var(--b-danger)/15%]",
				"danger-solid": "bg-[var(--b-danger)] text-white hover:brightness-110",
				link: "rounded-none text-[var(--b-brand)] underline-offset-4 hover:scale-100 hover:underline",
			},
			size: {
				default: "h-9 gap-1.5 px-4",
				xs: "h-7 gap-1 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 gap-1 rounded-lg px-3 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-11 gap-2 px-6 text-sm",
				xl: "h-12 gap-2 px-8 text-sm",
				icon: "size-9 gap-0 rounded-xl",
				"icon-xs":
					"size-7 gap-0 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
				"icon-sm": "size-8 gap-0 rounded-lg",
				"icon-lg": "size-11 gap-0 rounded-xl",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);
