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
			{ matchday: 1, status: "FINISHED", utcDate: "2026-01-01T20:00:00Z" },
			{ matchday: 1, status: "FINISHED", utcDate: "2026-01-02T20:00:00Z" },
			{ matchday: 2, status: "FINISHED", utcDate: "2026-01-08T20:00:00Z" },
			{ matchday: 3, status: "SCHEDULED", utcDate: "2026-01-15T20:00:00Z" },
			{ matchday: 3, status: "TIMED", utcDate: "2026-01-15T22:30:00Z" },
		];
		expect(computeCurrentRound(matches)).toEqual({
			current: 3,
			min: 1,
			max: 3,
		});
	});

	test("todas as rodadas encerradas: atual é a maior rodada", () => {
		const matches = [
			{ matchday: 1, status: "FINISHED", utcDate: "2026-01-01T20:00:00Z" },
			{ matchday: 2, status: "FINISHED", utcDate: "2026-01-08T20:00:00Z" },
			{ matchday: 3, status: "FINISHED", utcDate: "2026-01-15T20:00:00Z" },
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
			computeCurrentRound([
				{ matchday: null, status: "FINISHED", utcDate: "2026-01-01T20:00:00Z" },
			]),
		).toEqual({ current: null, min: null, max: null });
	});

	test("ignora jogos sem matchday ao calcular min/max", () => {
		const matches = [
			{ matchday: null, status: "SCHEDULED", utcDate: "2026-01-01T20:00:00Z" },
			{ matchday: 5, status: "FINISHED", utcDate: "2026-02-01T20:00:00Z" },
			{ matchday: 7, status: "SCHEDULED", utcDate: "2026-02-15T20:00:00Z" },
		];
		expect(computeCurrentRound(matches)).toEqual({
			current: 7,
			min: 5,
			max: 7,
		});
	});

	test("rodada com único jogo POSTPONED não bloqueia progressão: pula para a próxima rodada com jogo pendente", () => {
		const matches = [
			{ matchday: 1, status: "FINISHED", utcDate: "2026-01-01T20:00:00Z" },
			{ matchday: 2, status: "FINISHED", utcDate: "2026-01-08T20:00:00Z" },
			{ matchday: 3, status: "FINISHED", utcDate: "2026-01-15T20:00:00Z" },
			{ matchday: 4, status: "POSTPONED", utcDate: "2026-01-22T20:00:00Z" },
			{ matchday: 5, status: "FINISHED", utcDate: "2026-01-29T20:00:00Z" },
			{ matchday: 18, status: "FINISHED", utcDate: "2026-06-01T20:00:00Z" },
			{ matchday: 19, status: "SCHEDULED", utcDate: "2026-06-08T20:00:00Z" },
		];
		expect(computeCurrentRound(matches)).toEqual({
			current: 19,
			min: 1,
			max: 19,
		});
	});

	test("rodada com único jogo CANCELLED não bloqueia progressão: pula para a próxima rodada com jogo pendente", () => {
		const matches = [
			{ matchday: 1, status: "FINISHED", utcDate: "2026-01-01T20:00:00Z" },
			{ matchday: 4, status: "CANCELLED", utcDate: "2026-01-22T20:00:00Z" },
			{ matchday: 5, status: "FINISHED", utcDate: "2026-01-29T20:00:00Z" },
			{ matchday: 19, status: "SCHEDULED", utcDate: "2026-06-08T20:00:00Z" },
		];
		expect(computeCurrentRound(matches)).toEqual({
			current: 19,
			min: 1,
			max: 19,
		});
	});

	test("jogo remarcado (TIMED) de rodada antiga com data futura mais distante que rodada nova não trava a rodada atual: usa a data mais próxima, não o menor matchday", () => {
		// Cenário real: rodada 4 tem um jogo POSTPONED (sem data, ignorado) e
		// um jogo TIMED remarcado pra 2026-07-23, mais tarde que o próximo
		// jogo pendente da rodada 19 (2026-07-21). Rodadas 5-18 já terminaram.
		// A rodada atual deve seguir a progressão cronológica real (19), não
		// ficar presa na rodada 4 só porque tecnicamente ainda tem jogo
		// pendente lá.
		const matches = [
			{
				matchday: 4,
				status: "POSTPONED",
				utcDate: "2026-04-01T20:00:00Z",
			},
			{
				matchday: 4,
				status: "TIMED",
				utcDate: "2026-07-23T18:00:00Z",
			},
			{ matchday: 5, status: "FINISHED", utcDate: "2026-04-08T20:00:00Z" },
			{ matchday: 6, status: "FINISHED", utcDate: "2026-04-15T20:00:00Z" },
			{ matchday: 7, status: "FINISHED", utcDate: "2026-04-22T20:00:00Z" },
			{ matchday: 8, status: "FINISHED", utcDate: "2026-04-29T20:00:00Z" },
			{ matchday: 9, status: "FINISHED", utcDate: "2026-05-06T20:00:00Z" },
			{ matchday: 10, status: "FINISHED", utcDate: "2026-05-13T20:00:00Z" },
			{ matchday: 11, status: "FINISHED", utcDate: "2026-05-20T20:00:00Z" },
			{ matchday: 12, status: "FINISHED", utcDate: "2026-05-27T20:00:00Z" },
			{ matchday: 13, status: "FINISHED", utcDate: "2026-06-03T20:00:00Z" },
			{ matchday: 14, status: "FINISHED", utcDate: "2026-06-10T20:00:00Z" },
			{ matchday: 15, status: "FINISHED", utcDate: "2026-06-17T20:00:00Z" },
			{ matchday: 16, status: "FINISHED", utcDate: "2026-06-24T20:00:00Z" },
			{ matchday: 17, status: "FINISHED", utcDate: "2026-07-01T20:00:00Z" },
			{ matchday: 18, status: "FINISHED", utcDate: "2026-07-08T20:00:00Z" },
			{
				matchday: 19,
				status: "TIMED",
				utcDate: "2026-07-21T22:30:00Z",
			},
			{ matchday: 20, status: "SCHEDULED", utcDate: "2026-07-28T20:00:00Z" },
		];
		expect(computeCurrentRound(matches)).toEqual({
			current: 19,
			min: 4,
			max: 20,
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
