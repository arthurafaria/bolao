/**
 * Registry de torneios — fonte única de verdade para qual torneio pontua
 * (ACTIVE_TOURNAMENT) e para os metadados de sincronização de cada um
 * (código na football-data.org, código na ESPN, se tem mata-mata).
 *
 * Para adicionar "mais um campeonato depois": crie uma entrada em
 * TOURNAMENTS e, quando ele passar a valer pontos, aponte
 * ACTIVE_TOURNAMENT para o novo código. Qualquer lugar do código que ainda
 * hardcode um código de torneio é um bug — deve ler daqui.
 */
export type TournamentConfig = {
	code: string; // stored in matches.tournament, e.g. "BSA2026"
	competitionCode: string; // football-data.org competition, e.g. "BSA" / "WC"
	espnCode: string | null; // ESPN league code, e.g. "bra.1" / "fifa.world"
	label: string; // "Brasileirão Série A"
	hasKnockout: boolean; // false for a league, true for a Cup
};

export const TOURNAMENTS: Record<string, TournamentConfig> = {
	BSA2026: {
		code: "BSA2026",
		competitionCode: "BSA",
		espnCode: "bra.1",
		label: "Brasileirão Série A",
		hasKnockout: false,
	},
	WC2026: {
		code: "WC2026",
		competitionCode: "WC",
		espnCode: "fifa.world",
		label: "Copa do Mundo",
		hasKnockout: true,
	},
};

// O torneio que atualmente pontua para o ranking das ligas.
export const ACTIVE_TOURNAMENT = "BSA2026";
