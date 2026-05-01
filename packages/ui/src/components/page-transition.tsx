"use client";

import { cn } from "@bolao/ui/lib/utils";
import { usePathname } from "next/navigation";
import * as React from "react";

export function PageTransition({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const pathname = usePathname();

	return (
		<div
			key={pathname}
			className={cn("animate-slide-up", className)}
		>
			{children}
		</div>
	);
}
