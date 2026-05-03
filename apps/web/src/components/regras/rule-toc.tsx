"use client";

import { cn } from "@bolao/ui/lib/utils";
import { useEffect, useState } from "react";

export interface TocItem {
	id: string;
	label: string;
}

interface RuleTocProps {
	items: TocItem[];
	className?: string;
}

export function RuleToc({ items, className }: RuleTocProps) {
	const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

	useEffect(() => {
		const targets = items
			.map((it) => document.getElementById(it.id))
			.filter(Boolean) as HTMLElement[];

		if (targets.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible[0]) setActive(visible[0].target.id);
			},
			{ rootMargin: "-20% 0px -60% 0px", threshold: 0 },
		);

		for (const t of targets) observer.observe(t);
		return () => observer.disconnect();
	}, [items]);

	return (
		<nav className={cn("flex flex-col gap-1", className)} aria-label="Sumário">
			<span className="mb-2 text-[var(--b-text-3)] text-eyebrow">Sumário</span>
			{items.map((it) => {
				const isActive = it.id === active;
				return (
					<a
						key={it.id}
						href={`#${it.id}`}
						className={cn(
							"relative rounded-lg px-3 py-2 font-medium text-sm transition-colors duration-[var(--motion-base)]",
							isActive
								? "bg-[var(--b-brand-10)] text-[var(--b-brand)]"
								: "text-[var(--b-text-3)] hover:bg-[var(--b-tint)] hover:text-[var(--b-text-2)]",
						)}
					>
						{isActive && (
							<span
								aria-hidden
								className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[var(--b-brand)]"
							/>
						)}
						{it.label}
					</a>
				);
			})}
		</nav>
	);
}
