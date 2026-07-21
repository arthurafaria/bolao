/**
 * Rodada atual do torneio — mesma definição usada no frontend
 * (`currentRound()` em apps/web/src/lib/match-grouping.ts), mas extraída
 * aqui como helper puro para virar uma query de backend
 * (`matches.getCurrentRound`, ver plano 005) e ter uma única fonte de
 * verdade compartilhada entre dashboard e palpites.
 *
 * Rodada atual = a menor `matchday` que ainda tem jogo não encerrado. Se
 * todas as rodadas com jogos estiverem encerradas, a maior rodada. `null`
 * se nenhum jogo tiver `matchday` definido.
 */
export type RoundStatusMatch = { matchday?: number | null; status: string };

export type CurrentRoundResult = {
	current: number | null;
	min: number | null;
	max: number | null;
};

export function computeCurrentRound(
	matches: RoundStatusMatch[],
): CurrentRoundResult {
	const rounds = new Set<number>();
	for (const m of matches) {
		if (m.matchday != null) rounds.add(m.matchday);
	}
	if (rounds.size === 0) return { current: null, min: null, max: null };

	const sorted = Array.from(rounds).sort((a, b) => a - b);
	const min = sorted[0];
	const max = sorted[sorted.length - 1];

	for (const round of sorted) {
		const hasUnfinished = matches.some(
			(m) => m.matchday === round && m.status !== "FINISHED",
		);
		if (hasUnfinished) return { current: round, min, max };
	}
	return { current: max, min, max };
}
