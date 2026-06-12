import { describe, expect, test } from "bun:test";
import { compareByExacts, compareByPoints } from "../convex/lib/ranking";

describe("compareByPoints", () => {
	test("mais pontos vence", () => {
		const a = { totalPoints: 50, exactScores: 2, correctResults: 8 };
		const b = { totalPoints: 40, exactScores: 5, correctResults: 9 };
		expect(compareByPoints(b, a)).toBeGreaterThan(0);
		expect(compareByPoints(a, b)).toBeLessThan(0);
	});

	test("empate em pontos: mais cravadas vence", () => {
		const a = { totalPoints: 50, exactScores: 3, correctResults: 7 };
		const b = { totalPoints: 50, exactScores: 1, correctResults: 9 };
		expect(compareByPoints(a, b)).toBeLessThan(0);
		expect(compareByPoints(b, a)).toBeGreaterThan(0);
	});

	test("empate em pontos e cravadas: mais resultados certos vence", () => {
		const a = { totalPoints: 50, exactScores: 2, correctResults: 9 };
		const b = { totalPoints: 50, exactScores: 2, correctResults: 7 };
		expect(compareByPoints(a, b)).toBeLessThan(0);
		expect(compareByPoints(b, a)).toBeGreaterThan(0);
	});

	test("empate total: retorna 0", () => {
		const a = { totalPoints: 50, exactScores: 2, correctResults: 7 };
		const b = { totalPoints: 50, exactScores: 2, correctResults: 7 };
		expect(compareByPoints(a, b)).toBe(0);
	});
});

describe("compareByExacts", () => {
	test("mais cravadas vence mesmo com menos pontos", () => {
		const a = { totalPoints: 30, exactScores: 5, correctResults: 4 };
		const b = { totalPoints: 60, exactScores: 2, correctResults: 10 };
		expect(compareByExacts(a, b)).toBeLessThan(0);
		expect(compareByExacts(b, a)).toBeGreaterThan(0);
	});

	test("empate em cravadas: mais pontos vence", () => {
		const a = { totalPoints: 60, exactScores: 3, correctResults: 8 };
		const b = { totalPoints: 40, exactScores: 3, correctResults: 9 };
		expect(compareByExacts(a, b)).toBeLessThan(0);
		expect(compareByExacts(b, a)).toBeGreaterThan(0);
	});
});

describe("sort integrado", () => {
	const members = [
		{ totalPoints: 30, exactScores: 1, correctResults: 5 },
		{ totalPoints: 50, exactScores: 2, correctResults: 8 },
		{ totalPoints: 50, exactScores: 4, correctResults: 6 },
		{ totalPoints: 40, exactScores: 3, correctResults: 7 },
		{ totalPoints: 50, exactScores: 2, correctResults: 9 },
	];

	test("compareByPoints ordena corretamente", () => {
		const sorted = [...members].sort(compareByPoints);
		expect(sorted[0]).toEqual({
			totalPoints: 50,
			exactScores: 4,
			correctResults: 6,
		});
		expect(sorted[1]).toEqual({
			totalPoints: 50,
			exactScores: 2,
			correctResults: 9,
		});
		expect(sorted[2]).toEqual({
			totalPoints: 50,
			exactScores: 2,
			correctResults: 8,
		});
		expect(sorted[3]).toEqual({
			totalPoints: 40,
			exactScores: 3,
			correctResults: 7,
		});
		expect(sorted[4]).toEqual({
			totalPoints: 30,
			exactScores: 1,
			correctResults: 5,
		});
	});

	test("compareByExacts ordena corretamente (ordem distinta)", () => {
		const sorted = [...members].sort(compareByExacts);
		expect(sorted[0]).toEqual({
			totalPoints: 50,
			exactScores: 4,
			correctResults: 6,
		});
		expect(sorted[1]).toEqual({
			totalPoints: 40,
			exactScores: 3,
			correctResults: 7,
		});
		expect(sorted[2]).toEqual({
			totalPoints: 50,
			exactScores: 2,
			correctResults: 9,
		});
		expect(sorted[3]).toEqual({
			totalPoints: 50,
			exactScores: 2,
			correctResults: 8,
		});
		expect(sorted[4]).toEqual({
			totalPoints: 30,
			exactScores: 1,
			correctResults: 5,
		});
	});
});
