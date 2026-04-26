export const STAGE_LABELS: Record<string, string> = {
	ROUND_OF_16: "Oitavas de Final",
	QUARTER_FINALS: "Quartas de Final",
	SEMI_FINALS: "Semifinais",
	FINAL: "Final",
	GROUP_STAGE: "Fase de Grupos",
};

type RoundableMatch = {
	matchday?: number | null;
	group?: string | null;
	stage: string;
	utcDate: string;
};

export function roundKey(match: RoundableMatch): string {
	if (match.matchday != null) return `matchday_${match.matchday}`;
	if (match.group) return `stage_${match.stage}_${match.group}`;
	return `stage_${match.stage}`;
}

export function roundLabel(match: RoundableMatch): string {
	const groupLetter = match.group?.replace(/^(?:GRUPO|GROUP)[_\s]+/, "");
	if (groupLetter) return `Grupo ${groupLetter}`;
	if (match.matchday != null) return `Rodada ${match.matchday}`;
	return STAGE_LABELS[match.stage] ?? match.stage.replace(/_/g, " ");
}

export function groupByRound<T extends RoundableMatch>(
	matches: T[],
): [string, string, T[]][] {
	const map = new Map<string, { label: string; matches: T[] }>();
	for (const m of matches) {
		const key = roundKey(m);
		const entry = map.get(key) ?? { label: roundLabel(m), matches: [] };
		entry.matches.push(m);
		map.set(key, entry);
	}
	return Array.from(map.entries()).map(([key, { label, matches }]) => [
		key,
		label,
		matches,
	]);
}
