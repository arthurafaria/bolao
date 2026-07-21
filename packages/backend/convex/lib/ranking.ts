/**
 * Comparadores de ranking de liga — fonte única usada pelo backend
 * (getRanking) e pelo frontend (abas do painel de ranking).
 *
 * Ranking de pontos: total de pontos; cravadas desempatam; depois
 * resultados certos. Ranking de cravadas: só placares exatos contam;
 * pontos desempatam; depois resultados certos.
 */
export interface RankableMember {
	totalPoints: number;
	exactScores: number;
	correctResults: number;
}

export type ScoreComponents = {
	result: boolean;
	homeGoals: boolean;
	awayGoals: boolean;
};

export type Scoring = { result: number; goal: number; exactBonus: number };

export const DEFAULT_SCORING: Scoring = { result: 5, goal: 2, exactBonus: 1 };

/**
 * Pontos de um palpite a partir dos seus componentes (acertou resultado,
 * gols do mandante, gols do visitante) e da pontuação da liga. Fonte única
 * usada tanto no cálculo incremental (computeForMatch) quanto no ranking
 * por fase (getRankingByPhase).
 */
export function pointsFrom(c: ScoreComponents | undefined, s: Scoring): number {
	if (!c) return 0;
	const exact = c.result && c.homeGoals && c.awayGoals;
	return (
		(c.result ? s.result : 0) +
		(c.homeGoals ? s.goal : 0) +
		(c.awayGoals ? s.goal : 0) +
		(exact ? s.exactBonus : 0)
	);
}

export type RankingPhase = "OVERALL" | "GROUP" | "KNOCKOUT";

/**
 * Classifica uma fase do jogo (campo `stage` da Copa) em grupos vs mata-mata.
 * Grupos = GROUP_STAGE; mata-mata = qualquer fase eliminatória
 * (ROUND_OF_32, ROUND_OF_16, QUARTER_FINALS, SEMI_FINALS, THIRD_PLACE, FINAL).
 */
export function isKnockoutStage(stage: string): boolean {
	return stage !== "GROUP_STAGE";
}

export function compareByPoints(a: RankableMember, b: RankableMember): number {
	return (
		b.totalPoints - a.totalPoints ||
		b.exactScores - a.exactScores ||
		b.correctResults - a.correctResults
	);
}

export function compareByExacts(a: RankableMember, b: RankableMember): number {
	return (
		b.exactScores - a.exactScores ||
		b.totalPoints - a.totalPoints ||
		b.correctResults - a.correctResults
	);
}

export type RoundPrediction = {
	matchId: string;
	components?: ScoreComponents;
	calculatedAt?: number;
};

/**
 * Agrega pontos/cravadas/resultados certos de um jogador **numa única
 * rodada** (`matchIdsInRound`), a partir das predições calculadas. Fonte
 * única usada por `leagues.getRoundRanking` (ver plano 005) — mesmo formato
 * de agregação que `getRankingByPhase` já usa para fases, mas escopado a um
 * conjunto de jogos (rodada) em vez de uma fase inteira.
 */
export function computeRoundStats(
	predictions: RoundPrediction[],
	matchIdsInRound: Set<string>,
	scoring: Scoring,
): RankableMember {
	let totalPoints = 0;
	let exactScores = 0;
	let correctResults = 0;

	for (const pred of predictions) {
		if (!matchIdsInRound.has(pred.matchId)) continue;
		if (!pred.components || pred.calculatedAt === undefined) continue;
		const c = pred.components;
		const isExact = c.result && c.homeGoals && c.awayGoals;
		totalPoints += pointsFrom(c, scoring);
		if (isExact) exactScores += 1;
		if (c.result) correctResults += 1;
	}

	return { totalPoints, exactScores, correctResults };
}
