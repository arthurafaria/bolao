// Chaveamento fixo da Copa do Mundo 2026 (mata-mata, jogos 73–104).
//
// A estrutura de slots (qual colocação de grupo joga onde) é publicada pela
// FIFA antes do torneio e é estável. Datas/horários/estádios aqui são o
// cronograma oficial publicado e servem só de PLACEHOLDER: assim que a API
// cria o jogo real (com os dois times definidos), a página de mata-mata passa
// a usar a data/estádio/placar reais daquele documento — então qualquer
// imprecisão pontual neste arquivo se auto-corrige.
//
// Mapa de confrontos das pré-oitavas conferido no chaveamento oficial:
//   8 jogos: Vencedor de grupo × 3º colocado
//   4 jogos: Vencedor de grupo × Vice de grupo
//   4 jogos: Vice × Vice

export type BracketStage =
	| "ROUND_OF_32"
	| "ROUND_OF_16"
	| "QUARTER_FINALS"
	| "SEMI_FINALS"
	| "THIRD_PLACE"
	| "FINAL";

/** Referência a uma vaga ainda não preenchida do chaveamento. */
export type SlotRef =
	/** 1º ou 2º colocado de um grupo. */
	| { kind: "group"; place: 1 | 2; group: string }
	/** Um dos melhores terceiros, vindo de um dos grupos candidatos. */
	| { kind: "third"; groups: string[] }
	/** Vencedor de um jogo anterior do mata-mata. */
	| { kind: "winner"; game: number }
	/** Perdedor de um jogo anterior (disputa de 3º lugar). */
	| { kind: "loser"; game: number };

export type TemplateGame = {
	/** Número oficial do jogo (73–104). */
	no: number;
	stage: BracketStage;
	utcDate: string;
	venue: string;
	home: SlotRef;
	away: SlotRef;
};

const g = (place: 1 | 2, group: string): SlotRef => ({
	kind: "group",
	place,
	group,
});
const third = (...groups: string[]): SlotRef => ({ kind: "third", groups });
const w = (game: number): SlotRef => ({ kind: "winner", game });
const l = (game: number): SlotRef => ({ kind: "loser", game });

export const WC2026_BRACKET: TemplateGame[] = [
	// ─── Pré-oitavas (Round of 32) ──────────────────────────────────────────
	{
		no: 73,
		stage: "ROUND_OF_32",
		utcDate: "2026-06-28T19:00:00.000Z",
		venue: "SoFi Stadium, Inglewood",
		home: g(2, "A"),
		away: g(2, "B"),
	},
	{
		no: 74,
		stage: "ROUND_OF_32",
		utcDate: "2026-06-29T20:30:00.000Z",
		venue: "Gillette Stadium, Foxborough",
		home: g(1, "E"),
		away: third("A", "B", "C", "D", "F"),
	},
	{
		no: 75,
		stage: "ROUND_OF_32",
		utcDate: "2026-06-30T01:00:00.000Z",
		venue: "Estadio BBVA, Guadalupe",
		home: g(1, "F"),
		away: g(2, "C"),
	},
	{
		no: 76,
		stage: "ROUND_OF_32",
		utcDate: "2026-06-29T17:00:00.000Z",
		venue: "NRG Stadium, Houston",
		home: g(1, "C"),
		away: g(2, "F"),
	},
	{
		no: 77,
		stage: "ROUND_OF_32",
		utcDate: "2026-06-30T21:00:00.000Z",
		venue: "MetLife Stadium, East Rutherford",
		home: g(1, "I"),
		away: third("C", "D", "F", "G", "H"),
	},
	{
		no: 78,
		stage: "ROUND_OF_32",
		utcDate: "2026-06-30T17:00:00.000Z",
		venue: "AT&T Stadium, Arlington",
		home: g(2, "E"),
		away: g(2, "I"),
	},
	{
		no: 79,
		stage: "ROUND_OF_32",
		utcDate: "2026-07-01T01:00:00.000Z",
		venue: "Estadio Azteca, Cidade do México",
		home: g(1, "A"),
		away: third("C", "E", "F", "H", "I"),
	},
	{
		no: 80,
		stage: "ROUND_OF_32",
		utcDate: "2026-07-01T16:00:00.000Z",
		venue: "Mercedes-Benz Stadium, Atlanta",
		home: g(1, "L"),
		away: third("E", "H", "I", "J", "K"),
	},
	{
		no: 81,
		stage: "ROUND_OF_32",
		utcDate: "2026-07-02T00:00:00.000Z",
		venue: "Levi's Stadium, Santa Clara",
		home: g(1, "D"),
		away: third("B", "E", "F", "I", "J"),
	},
	{
		no: 82,
		stage: "ROUND_OF_32",
		utcDate: "2026-07-01T20:00:00.000Z",
		venue: "Lumen Field, Seattle",
		home: g(1, "G"),
		away: third("A", "E", "H", "I", "J"),
	},
	{
		no: 83,
		stage: "ROUND_OF_32",
		utcDate: "2026-07-02T23:00:00.000Z",
		venue: "BMO Field, Toronto",
		home: g(2, "K"),
		away: g(2, "L"),
	},
	{
		no: 84,
		stage: "ROUND_OF_32",
		utcDate: "2026-07-02T19:00:00.000Z",
		venue: "SoFi Stadium, Inglewood",
		home: g(1, "H"),
		away: g(2, "J"),
	},
	{
		no: 85,
		stage: "ROUND_OF_32",
		utcDate: "2026-07-03T03:00:00.000Z",
		venue: "BC Place, Vancouver",
		home: g(1, "B"),
		away: third("E", "F", "G", "I", "J"),
	},
	{
		no: 86,
		stage: "ROUND_OF_32",
		utcDate: "2026-07-03T22:00:00.000Z",
		venue: "Hard Rock Stadium, Miami Gardens",
		home: g(1, "J"),
		away: g(2, "H"),
	},
	{
		no: 87,
		stage: "ROUND_OF_32",
		utcDate: "2026-07-04T01:30:00.000Z",
		venue: "Arrowhead Stadium, Kansas City",
		home: g(1, "K"),
		away: third("D", "E", "I", "J", "L"),
	},
	{
		no: 88,
		stage: "ROUND_OF_32",
		utcDate: "2026-07-03T18:00:00.000Z",
		venue: "AT&T Stadium, Arlington",
		home: g(2, "D"),
		away: g(2, "G"),
	},

	// ─── Oitavas (Round of 16) ──────────────────────────────────────────────
	{
		no: 89,
		stage: "ROUND_OF_16",
		utcDate: "2026-07-04T21:00:00.000Z",
		venue: "Lincoln Financial Field, Philadelphia",
		home: w(74),
		away: w(77),
	},
	{
		no: 90,
		stage: "ROUND_OF_16",
		utcDate: "2026-07-04T17:00:00.000Z",
		venue: "NRG Stadium, Houston",
		home: w(73),
		away: w(75),
	},
	{
		no: 91,
		stage: "ROUND_OF_16",
		utcDate: "2026-07-05T20:00:00.000Z",
		venue: "MetLife Stadium, East Rutherford",
		home: w(76),
		away: w(78),
	},
	{
		no: 92,
		stage: "ROUND_OF_16",
		utcDate: "2026-07-06T00:00:00.000Z",
		venue: "Estadio Azteca, Cidade do México",
		home: w(79),
		away: w(80),
	},
	{
		no: 93,
		stage: "ROUND_OF_16",
		utcDate: "2026-07-06T19:00:00.000Z",
		venue: "AT&T Stadium, Arlington",
		home: w(83),
		away: w(84),
	},
	{
		no: 94,
		stage: "ROUND_OF_16",
		utcDate: "2026-07-07T00:00:00.000Z",
		venue: "Lumen Field, Seattle",
		home: w(81),
		away: w(82),
	},
	{
		no: 95,
		stage: "ROUND_OF_16",
		utcDate: "2026-07-07T16:00:00.000Z",
		venue: "Mercedes-Benz Stadium, Atlanta",
		home: w(86),
		away: w(88),
	},
	{
		no: 96,
		stage: "ROUND_OF_16",
		utcDate: "2026-07-07T20:00:00.000Z",
		venue: "BC Place, Vancouver",
		home: w(85),
		away: w(87),
	},

	// ─── Quartas ────────────────────────────────────────────────────────────
	{
		no: 97,
		stage: "QUARTER_FINALS",
		utcDate: "2026-07-09T20:00:00.000Z",
		venue: "Gillette Stadium, Foxborough",
		home: w(89),
		away: w(90),
	},
	{
		no: 98,
		stage: "QUARTER_FINALS",
		utcDate: "2026-07-10T19:00:00.000Z",
		venue: "SoFi Stadium, Inglewood",
		home: w(93),
		away: w(94),
	},
	{
		no: 99,
		stage: "QUARTER_FINALS",
		utcDate: "2026-07-11T21:00:00.000Z",
		venue: "Hard Rock Stadium, Miami Gardens",
		home: w(91),
		away: w(92),
	},
	{
		no: 100,
		stage: "QUARTER_FINALS",
		utcDate: "2026-07-12T01:00:00.000Z",
		venue: "Arrowhead Stadium, Kansas City",
		home: w(95),
		away: w(96),
	},

	// ─── Semifinais ─────────────────────────────────────────────────────────
	{
		no: 101,
		stage: "SEMI_FINALS",
		utcDate: "2026-07-14T19:00:00.000Z",
		venue: "AT&T Stadium, Arlington",
		home: w(97),
		away: w(98),
	},
	{
		no: 102,
		stage: "SEMI_FINALS",
		utcDate: "2026-07-15T19:00:00.000Z",
		venue: "Mercedes-Benz Stadium, Atlanta",
		home: w(99),
		away: w(100),
	},

	// ─── Disputa de 3º lugar e Final ────────────────────────────────────────
	{
		no: 103,
		stage: "THIRD_PLACE",
		utcDate: "2026-07-18T21:00:00.000Z",
		venue: "Hard Rock Stadium, Miami Gardens",
		home: l(101),
		away: l(102),
	},
	{
		no: 104,
		stage: "FINAL",
		utcDate: "2026-07-19T19:00:00.000Z",
		venue: "MetLife Stadium, East Rutherford",
		home: w(101),
		away: w(102),
	},
];

/** Quantos jogos cada fase tem — usado para placeholders/colunas. */
export const STAGE_GAME_COUNT: Record<BracketStage, number> = {
	ROUND_OF_32: 16,
	ROUND_OF_16: 8,
	QUARTER_FINALS: 4,
	SEMI_FINALS: 2,
	THIRD_PLACE: 1,
	FINAL: 1,
};

/** Normaliza os vários valores de `stage` da API para a fase do chaveamento. */
export function normalizeStage(stage: string): BracketStage | null {
	switch (stage) {
		case "LAST_32":
		case "ROUND_OF_32":
		case "PLAYOFF_ROUND_OF_32":
			return "ROUND_OF_32";
		case "LAST_16":
		case "ROUND_OF_16":
			return "ROUND_OF_16";
		case "QUARTER_FINALS":
			return "QUARTER_FINALS";
		case "SEMI_FINALS":
			return "SEMI_FINALS";
		case "THIRD_PLACE":
			return "THIRD_PLACE";
		case "FINAL":
			return "FINAL";
		default:
			return null;
	}
}

/** Rótulo pt-BR de uma vaga ainda não preenchida. `short` para os cards estreitos do bracket. */
export function slotLabel(ref: SlotRef, short = false): string {
	switch (ref.kind) {
		case "group":
			if (short) return `${ref.place}º ${ref.group}`;
			return ref.place === 1
				? `Vencedor do Grupo ${ref.group}`
				: `Vice do Grupo ${ref.group}`;
		case "third": {
			const groups = ref.groups.join("/");
			return short ? `3º ${groups}` : `3º colocado (${groups})`;
		}
		case "winner":
			return short ? `Venc. J${ref.game}` : `Vencedor do Jogo ${ref.game}`;
		case "loser":
			return short ? `Perd. J${ref.game}` : `Perdedor do Jogo ${ref.game}`;
	}
}
