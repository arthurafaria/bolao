export type PointsTier = {
	color: string;
	bg: string;
	border: string;
	label: string;
	prefix: string | null;
};

export function getPointsTier(points: number): PointsTier {
	if (points === 10) {
		return {
			color: "oklch(0.83 0.20 90)",
			bg: "oklch(0.83 0.20 90 / 0.12)",
			border: "oklch(0.83 0.20 90 / 0.30)",
			label: `⭐ ${points} pts`,
			prefix: "⭐",
		};
	}
	if (points >= 7) {
		return {
			color: "var(--b-brand-hi)",
			bg: "var(--b-brand-10)",
			border: "var(--b-brand-25)",
			label: `${points} pts`,
			prefix: null,
		};
	}
	if (points >= 5) {
		return {
			color: "oklch(0.60 0.12 145)",
			bg: "var(--b-brand-5)",
			border: "var(--b-border)",
			label: `${points} pts`,
			prefix: null,
		};
	}
	if (points > 0) {
		return {
			color: "oklch(0.72 0.18 60)",
			bg: "oklch(0.70 0.18 60 / 0.08)",
			border: "oklch(0.70 0.18 60 / 0.20)",
			label: `${points} pts`,
			prefix: null,
		};
	}
	return {
		color: "oklch(0.50 0.04 145)",
		bg: "var(--b-bg)",
		border: "var(--b-border-xs)",
		label: "0 pts",
		prefix: null,
	};
}
