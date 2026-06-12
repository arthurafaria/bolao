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
