import { describe, expect, test } from "bun:test";
import { ACTIVE_TOURNAMENT, TOURNAMENTS } from "../convex/lib/tournaments";

describe("ACTIVE_TOURNAMENT", () => {
	test("é o Brasileirão (BSA2026)", () => {
		expect(ACTIVE_TOURNAMENT).toBe("BSA2026");
	});

	test("o torneio ativo não tem mata-mata", () => {
		expect(TOURNAMENTS[ACTIVE_TOURNAMENT].hasKnockout).toBe(false);
	});
});

describe("TOURNAMENTS.BSA2026", () => {
	test("aponta para os códigos corretos de sincronização", () => {
		expect(TOURNAMENTS.BSA2026.espnCode).toBe("bra.1");
		expect(TOURNAMENTS.BSA2026.competitionCode).toBe("BSA");
	});
});
