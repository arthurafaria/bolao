"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
	value: number;
	duration?: number;
	prefix?: string;
	suffix?: string;
	decimals?: number;
	className?: string;
}

export function AnimatedNumber({
	value,
	duration = 800,
	prefix = "",
	suffix = "",
	decimals = 0,
	className,
}: AnimatedNumberProps) {
	const [displayed, setDisplayed] = useState(value);
	const prevRef = useRef(value);
	const rafRef = useRef<number>(0);

	useEffect(() => {
		const from = prevRef.current;
		const to = value;
		if (from === to) return;
		prevRef.current = to;

		const start = performance.now();

		function tick(now: number) {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			// ease-out expo
			const eased = 1 - (1 - progress) ** 4;
			setDisplayed(from + (to - from) * eased);
			if (progress < 1) rafRef.current = requestAnimationFrame(tick);
		}

		rafRef.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafRef.current);
	}, [value, duration]);

	const formatted = displayed.toFixed(decimals);

	return (
		<span className={className} aria-live="polite">
			{prefix}
			{formatted}
			{suffix}
		</span>
	);
}
