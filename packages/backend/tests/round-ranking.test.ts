import { describe, expect, test } from "bun:test";
import {
	compareByPoints,
	computeRoundStats,
	DEFAULT_SCORING,
} from "../convex/lib/ranking";
import { computeCurrentRound } from "../convex/lib/rounds";

describe("computeCurrentRound", () => {
	test("rodadas 1-2 encerradas, rodada 3 tem jogo agendado: atual é 3", () => {
		const matches = [
			{ matchday: 1, status: "FINISHED" },
			{ matchday: 1, status: "FINISHED" },
			{ matchday: 2, status: "FINISHED" },
			{ matchday: 3, status: "SCHEDULED" },
			{ matchday: 3, status: "TIMED" },
		];
		expect(computeCurrentRound(matches)).toEqual({
			current: 3,
			min: 1,
			max: 3,
		});
	});

	test("todas as rodadas encerradas: atual é a maior rodada", () => {
		const matches = [
			{ matchday: 1, status: "FINISHED" },
			{ matchday: 2, status: "FINISHED" },
			{ matchday: 3, status: "FINISHED" },
		];
		expect(computeCurrentRound(matches)).toEqual({
			current: 3,
			min: 1,
			max: 3,
		});
	});

	test("sem jogos com matchday: retorna tudo null", () => {
		expect(computeCurrentRound([])).toEqual({
			current: null,
			min: null,
			max: null,
		});
		expect(
			computeCurrentRound([{ matchday: null, status: "FINISHED" }]),
		).toEqual({ current: null, min: null, max: null });
	});

	test("ignora jogos sem matchday ao calcular min/max", () => {
		const matches = [
			{ matchday: null, status: "SCHEDULED" },
			{ matchday: 5, status: "FINISHED" },
			{ matchday: 7, status: "SCHEDULED" },
		];
		expect(computeCurrentRound(matches)).toEqual({
			current: 7,
			min: 5,
			max: 7,
		});
	});

	test("rodada com único jogo POSTPONED não bloqueia progressão: pula para a próxima rodada com jogo pendente", () => {
		const matches = [
			{ matchday: 1, status: "FINISHED" },
			{ matchday: 2, status: "FINISHED" },
			{ matchday: 3, status: "FINISHED" },
			{ matchday: 4, status: "POSTPONED" },
			{ matchday: 5, status: "FINISHED" },
			{ matchday: 18, status: "FINISHED" },
			{ matchday: 19, status: "SCHEDULED" },
		];
		expect(computeCurrentRound(matches)).toEqual({
			current: 19,
			min: 1,
			max: 19,
		});
	});

	test("rodada com único jogo CANCELLED não bloqueia progressão: pula para a próxima rodada com jogo pendente", () => {
		const matches = [
			{ matchday: 1, status: "FINISHED" },
			{ matchday: 4, status: "CANCELLED" },
			{ matchday: 5, status: "FINISHED" },
			{ matchday: 19, status: "SCHEDULED" },
		];
		expect(computeCurrentRound(matches)).toEqual({
			current: 19,
			min: 1,
			max: 19,
		});
	});
});

describe("computeRoundStats", () => {
	const matchIdsRound1 = new Set(["m1", "m2"]);
	const matchIdsRound2 = new Set(["m3", "m4"]);

	test("soma pontos/cravadas/resultados certos só da rodada informada", () => {
		const predictions = [
			// Rodada 1: cravada (result+home+away)
			{
				matchId: "m1",
				components: { result: true, homeGoals: true, awayGoals: true },
				calculatedAt: 1,
			},
			// Rodada 1: resultado certo sem cravar
			{
				matchId: "m2",
				components: { result: true, homeGoals: false, awayGoals: false },
				calculatedAt: 2,
			},
			// Rodada 2: não deve contar para o total da rodada 1
			{
				matchId: "m3",
				components: { result: true, homeGoals: true, awayGoals: true },
				calculatedAt: 3,
			},
		];

		const round1Stats = computeRoundStats(
			predictions,
			matchIdsRound1,
			DEFAULT_SCORING,
		);
		expect(round1Stats).toEqual({
			totalPoints:
				DEFAULT_SCORING.result +
				DEFAULT_SCORING.goal * 2 +
				DEFAULT_SCORING.exactBonus + // m1 cravada
				DEFAULT_SCORING.result, // m2 resultado certo
			exactScores: 1,
			correctResults: 2,
		});

		const round2Stats = computeRoundStats(
			predictions,
			matchIdsRound2,
			DEFAULT_SCORING,
		);
		expect(round2Stats).toEqual({
			totalPoints:
				DEFAULT_SCORING.result +
				DEFAULT_SCORING.goal * 2 +
				DEFAULT_SCORING.exactBonus,
			exactScores: 1,
			correctResults: 1,
		});
	});

	test("ignora predições sem components ou ainda não calculadas", () => {
		const predictions = [
			{ matchId: "m1", calculatedAt: undefined },
			{
				matchId: "m2",
				components: undefined,
				calculatedAt: 1,
			},
		];
		expect(
			computeRoundStats(predictions, matchIdsRound1, DEFAULT_SCORING),
		).toEqual({ totalPoints: 0, exactScores: 0, correctResults: 0 });
	});

	test("membros com pontuações de rodada diferentes ordenam via compareByPoints", () => {
		const scoring = DEFAULT_SCORING;
		const alice = computeRoundStats(
			[
				{
					matchId: "m1",
					components: { result: true, homeGoals: true, awayGoals: true },
					calculatedAt: 1,
				},
			],
			matchIdsRound1,
			scoring,
		);
		const bob = computeRoundStats(
			[
				{
					matchId: "m2",
					components: { result: true, homeGoals: false, awayGoals: false },
					calculatedAt: 1,
				},
			],
			matchIdsRound1,
			scoring,
		);
		const members = [
			{ name: "bob", ...bob },
			{ name: "alice", ...alice },
		];
		const sorted = [...members].sort(compareByPoints);
		expect(sorted.map((m) => m.name)).toEqual(["alice", "bob"]);
	});
});
