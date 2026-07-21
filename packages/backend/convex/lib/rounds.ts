/**
 * Rodada atual do torneio — mesma definição usada no frontend
 * (`currentRound()` em apps/web/src/lib/match-grouping.ts), mas extraída
 * aqui como helper puro para virar uma query de backend
 * (`matches.getCurrentRound`, ver plano 005) e ter uma única fonte de
 * verdade compartilhada entre dashboard e palpites.
 *
 * Rodada atual = a rodada (`matchday`) do jogo pendente com a data (`utcDate`)
 * mais próxima cronologicamente. Jogos remarcados (make-up games) não
 * respeitam a ordem das rodadas, então não dá pra usar "menor matchday com
 * jogo pendente" — isso prende a rodada atual em uma rodada antiga que só
 * tem um jogo remarcado pra uma data futura distante, enquanto rodadas mais
 * novas já estão em andamento. Se nenhum jogo estiver pendente, a maior
 * rodada. `null` se nenhum jogo tiver `matchday` definido.
 */
export type RoundStatusMatch = {
	matchday?: number | null;
	status: string;
	utcDate: string;
};

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

	const pending = matches.filter(
		(m) =>
			m.matchday != null &&
			m.status !== "FINISHED" &&
			m.status !== "POSTPONED" &&
			m.status !== "CANCELLED",
	);
	if (pending.length === 0) return { current: max, min, max };

	// utcDate são strings ISO 8601 UTC consistentemente formatadas, então
	// comparação lexicográfica de string equivale à ordem cronológica.
	let earliest = pending[0];
	for (const m of pending) {
		if (m.utcDate < earliest.utcDate) earliest = m;
	}
	return { current: earliest.matchday ?? null, min, max };
}
