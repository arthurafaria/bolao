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

type RoundStatusMatch = { matchday?: number | null; status: string };

/**
 * Rodada atual: a menor rodada (matchday) que ainda tem jogo não encerrado.
 * Se todas as rodadas com jogos estiverem encerradas, retorna a maior rodada.
 * Retorna null se nenhum jogo tiver matchday definido.
 *
 * Função pura para poder ser reutilizada por dashboard + predictions sem
 * depender de uma query específica (client-side derivation; ver plano 005
 * para a versão server-side `matches.getCurrentRound`).
 */
export function currentRound<T extends RoundStatusMatch>(
	matches: T[],
): number | null {
	const byRound = new Map<number, T[]>();
	for (const m of matches) {
		if (m.matchday == null) continue;
		const list = byRound.get(m.matchday) ?? [];
		list.push(m);
		byRound.set(m.matchday, list);
	}
	if (byRound.size === 0) return null;

	const rounds = Array.from(byRound.keys()).sort((a, b) => a - b);
	for (const round of rounds) {
		const roundMatches = byRound.get(round) ?? [];
		if (
			roundMatches.some(
				(m) =>
					m.status !== "FINISHED" &&
					m.status !== "POSTPONED" &&
					m.status !== "CANCELLED",
			)
		)
			return round;
	}
	return rounds[rounds.length - 1] ?? null;
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
