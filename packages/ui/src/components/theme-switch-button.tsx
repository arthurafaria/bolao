"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

interface ThemeSwitchProps {
	className?: string;
}

export function ThemeSwitch({ className = "" }: ThemeSwitchProps) {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => setMounted(true), []);

	if (!mounted) return <div className="h-8 w-8" />;

	const isDark = resolvedTheme === "dark";

	function toggle() {
		const next = isDark ? "light" : "dark";

		// View Transitions API — progressivo, com fallback gracioso
		if (!document.startViewTransition) {
			setTheme(next);
			return;
		}
		document.startViewTransition(() => {
			setTheme(next);
		});
	}

	return (
		<button
			type="button"
			onClick={toggle}
			className={[
				"relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full",
				"transition-[opacity,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out-quart)]",
				"hover:bg-[var(--b-tint-md)] hover:opacity-100 opacity-80",
				className,
			].join(" ")}
			aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
		>
			<Sun
				className={[
					"absolute h-4.5 w-4.5 transition-all duration-[var(--motion-medium)]",
					"ease-[var(--ease-out-back)]",
					!isDark
						? "translate-y-0 scale-100 opacity-100"
						: "translate-y-5 scale-50 opacity-0",
				].join(" ")}
			/>
			<Moon
				className={[
					"absolute h-4.5 w-4.5 transition-all duration-[var(--motion-medium)]",
					"ease-[var(--ease-out-back)]",
					isDark
						? "translate-y-0 scale-100 opacity-100"
						: "translate-y-5 scale-50 opacity-0",
				].join(" ")}
			/>
		</button>
	);
}
