export const STAGE_LABELS: Record<string, string> = {
	GROUP_STAGE: "Fase de Grupos",
	LAST_32: "2ª Fase",
	ROUND_OF_32: "2ª Fase",
	PLAYOFF_ROUND_OF_32: "2ª Fase",
	LAST_16: "Oitavas de Final",
	ROUND_OF_16: "Oitavas de Final",
	QUARTER_FINALS: "Quartas de Final",
	SEMI_FINALS: "Semifinais",
	THIRD_PLACE: "Disputa de 3º lugar",
	FINAL: "Final",
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

/** Agrupa jogos da fase de grupos por grupo (A→L), preservando ordem de data dentro do grupo. */
export function groupByGroup<T extends RoundableMatch>(
	matches: T[],
): [string, T[]][] {
	const map = new Map<string, T[]>();
	for (const m of matches) {
		const letter = m.group?.replace(/^(?:GRUPO|GROUP)[_\s]+/, "") ?? "?";
		const list = map.get(letter) ?? [];
		list.push(m);
		map.set(letter, list);
	}
	return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
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
