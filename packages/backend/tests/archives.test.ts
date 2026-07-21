import { describe, expect, test } from "bun:test";
import { type ArchivableMember, rankMembers } from "../convex/archives";

describe("rankMembers", () => {
	test("ordem decrescente simples por pontos", () => {
		const members: ArchivableMember[] = [
			{
				userId: "u1",
				name: "Ana",
				totalPoints: 30,
				exactScores: 1,
				correctResults: 5,
			},
			{
				userId: "u2",
				name: "Bia",
				totalPoints: 50,
				exactScores: 2,
				correctResults: 8,
			},
			{
				userId: "u3",
				name: "Caio",
				totalPoints: 40,
				exactScores: 3,
				correctResults: 7,
			},
		];

		const ranked = rankMembers(members);

		expect(ranked.map((m) => m.userId)).toEqual(["u2", "u3", "u1"]);
		expect(ranked.map((m) => m.rank)).toEqual([1, 2, 3]);
	});

	test("empate em pontos é desempatado por cravadas", () => {
		const members: ArchivableMember[] = [
			{
				userId: "u1",
				name: "Ana",
				totalPoints: 50,
				exactScores: 1,
				correctResults: 9,
			},
			{
				userId: "u2",
				name: "Bia",
				totalPoints: 50,
				exactScores: 4,
				correctResults: 6,
			},
		];

		const ranked = rankMembers(members);

		expect(ranked.map((m) => m.userId)).toEqual(["u2", "u1"]);
		expect(ranked[0]?.rank).toBe(1);
		expect(ranked[1]?.rank).toBe(2);
	});

	test("liga sem membros retorna array vazio", () => {
		expect(rankMembers([])).toEqual([]);
	});
});
