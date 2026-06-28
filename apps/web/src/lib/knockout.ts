// Resolve o chaveamento fixo da Copa 2026 (wc2026-bracket.ts) contra os jogos
// reais do banco: calcula a classificação dos grupos para preencher os slots
// "Vencedor A"/"Vice B", mantém os slots de 3º colocado como rótulo de
// candidatos ("3º A/E/F") até o jogo real existir, e propaga os vencedores
// pelas fases. Quando a API já criou o jogo real (dois times definidos), ele
// vira a fonte da verdade (times, placar, data, estádio e alvo do palpite).

import {
	type BracketStage,
	normalizeStage,
	type SlotRef,
	slotLabel,
	type TemplateGame,
	WC2026_BRACKET,
} from "./wc2026-bracket";

export type KnockoutTeam = {
	name: string;
	shortName: string;
	crest: string;
	tla?: string;
} | null;

/** Forma mínima de um jogo enriquecido vindo de `api.matches.getByStage`. */
export type SourceMatch = {
	_id: string;
	stage: string;
	group?: string | null;
	status: string;
	utcDate: string;
	venue?: string | null;
	homeScore?: number | null;
	awayScore?: number | null;
	/** REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT — placar guardado é o dos 90 min. */
	duration?: string | null;
	/** HOME_TEAM | AWAY_TEAM | DRAW — quem avançou (vale para ET/pênaltis). */
	winner?: string | null;
	homeTeam: KnockoutTeam;
	awayTeam: KnockoutTeam;
};

export type ResolvedSide =
	| { type: "team"; team: NonNullable<KnockoutTeam> }
	| { type: "pending"; label: string; shortLabel: string };

export type ResolvedGame = {
	no: number;
	stage: BracketStage;
	utcDate: string;
	venue: string;
	home: ResolvedSide;
	away: ResolvedSide;
	/** Jogo real correspondente (quando os dois times já estão definidos). */
	match: SourceMatch | null;
	homeScore: number | null;
	awayScore: number | null;
	status: string;
	/** Como terminou (para etiqueta de prorrogação/pênaltis). */
	duration: string | null;
	/** Quem avançou segundo a API (resolve empate de 90 min em ET/pênaltis). */
	winner: string | null;
};

const FINISHED = "FINISHED";

function teamSide(team: NonNullable<KnockoutTeam>): ResolvedSide {
	return { type: "team", team };
}

function pendingSide(ref: SlotRef): ResolvedSide {
	return {
		type: "pending",
		label: slotLabel(ref, false),
		shortLabel: slotLabel(ref, true),
	};
}

function groupLetter(raw?: string | null): string | null {
	if (!raw) return null;
	const m = raw.replace(/^(?:GRUPO|GROUP)[_\s]+/i, "").trim();
	return m.length ? m.toUpperCase() : null;
}

type Standing = {
	team: NonNullable<KnockoutTeam>;
	points: number;
	gd: number;
	gf: number;
	played: number;
};

type GroupTable = { complete: boolean; order: NonNullable<KnockoutTeam>[] };

/**
 * Classificação por grupo a partir dos jogos da fase de grupos. Só marca o
 * grupo como `complete` quando todos os jogos dele estão encerrados — antes
 * disso os slots continuam como rótulo. Critérios de desempate: pontos →
 * saldo → gols pró (aproximação; o jogo real é a fonte definitiva).
 */
export function computeGroupTables(
	groupMatches: SourceMatch[],
): Map<string, GroupTable> {
	const byGroup = new Map<string, SourceMatch[]>();
	for (const m of groupMatches) {
		const letter = groupLetter(m.group);
		if (!letter) continue;
		const list = byGroup.get(letter) ?? [];
		list.push(m);
		byGroup.set(letter, list);
	}

	const tables = new Map<string, GroupTable>();
	for (const [letter, matches] of byGroup) {
		const standings = new Map<string, Standing>();
		const ensure = (team: NonNullable<KnockoutTeam>): Standing => {
			const existing = standings.get(team.shortName);
			if (existing) return existing;
			const fresh: Standing = { team, points: 0, gd: 0, gf: 0, played: 0 };
			standings.set(team.shortName, fresh);
			return fresh;
		};

		let allFinished = true;
		for (const m of matches) {
			if (m.status !== FINISHED || m.homeScore == null || m.awayScore == null) {
				allFinished = false;
				continue;
			}
			if (!m.homeTeam || !m.awayTeam) continue;
			const home = ensure(m.homeTeam);
			const away = ensure(m.awayTeam);
			home.played++;
			away.played++;
			home.gf += m.homeScore;
			away.gf += m.awayScore;
			home.gd += m.homeScore - m.awayScore;
			away.gd += m.awayScore - m.homeScore;
			if (m.homeScore > m.awayScore) home.points += 3;
			else if (m.homeScore < m.awayScore) away.points += 3;
			else {
				home.points += 1;
				away.points += 1;
			}
		}

		const order = [...standings.values()]
			.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
			.map((s) => s.team);

		// "Completo" exige todos os jogos encerrados e os 4 times presentes —
		// senão o 3º colocado (que destrava terceiros) ainda não é confiável.
		const complete = allFinished && order.length >= 4;
		tables.set(letter, { complete, order });
	}
	return tables;
}

function resolveGroupSlot(
	ref: Extract<SlotRef, { kind: "group" }>,
	tables: Map<string, GroupTable>,
): ResolvedSide {
	const table = tables.get(ref.group);
	if (table?.complete) {
		const team = table.order[ref.place - 1];
		if (team) return teamSide(team);
	}
	return pendingSide(ref);
}

/** Vencedor/perdedor de um jogo já resolvido, quando dá para determinar. */
function outcome(
	game: ResolvedGame | undefined,
	want: "winner" | "loser",
): NonNullable<KnockoutTeam> | null {
	if (!game?.match || game.status !== FINISHED) return null;
	const { homeScore, awayScore, match } = game;
	if (homeScore == null || awayScore == null) return null;
	let homeWon: boolean;
	if (homeScore === awayScore) {
		// Empate nos 90 min: decidido na prorrogação/pênaltis. O placar guardado
		// é só dos 90 min, então usamos o `winner` da API para saber quem avançou.
		if (match.winner === "HOME_TEAM") homeWon = true;
		else if (match.winner === "AWAY_TEAM") homeWon = false;
		else return null; // sem info de vencedor ainda — deixa pendente
	} else {
		homeWon = homeScore > awayScore;
	}
	if (want === "winner") return homeWon ? match.homeTeam : match.awayTeam;
	return homeWon ? match.awayTeam : match.homeTeam;
}

/** Mapeia jogos reais do mata-mata aos jogos do template por proximidade de horário dentro da fase. */
function mapRealMatches(
	knockoutMatches: SourceMatch[],
): Map<number, SourceMatch> {
	const assigned = new Map<number, SourceMatch>();
	const byStage = new Map<BracketStage, SourceMatch[]>();
	for (const m of knockoutMatches) {
		const stage = normalizeStage(m.stage);
		if (!stage || !m.homeTeam || !m.awayTeam) continue;
		const list = byStage.get(stage) ?? [];
		list.push(m);
		byStage.set(stage, list);
	}

	for (const [stage, matches] of byStage) {
		const slots = WC2026_BRACKET.filter((t) => t.stage === stage);
		const usedSlots = new Set<number>();
		// Casa cada jogo real ao slot livre da mesma fase com horário mais próximo.
		const sorted = [...matches].sort(
			(a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
		);
		for (const m of sorted) {
			const t = new Date(m.utcDate).getTime();
			let best: TemplateGame | null = null;
			let bestDiff = Number.POSITIVE_INFINITY;
			for (const slot of slots) {
				if (usedSlots.has(slot.no)) continue;
				const diff = Math.abs(new Date(slot.utcDate).getTime() - t);
				if (diff < bestDiff) {
					bestDiff = diff;
					best = slot;
				}
			}
			if (best) {
				usedSlots.add(best.no);
				assigned.set(best.no, m);
			}
		}
	}
	return assigned;
}

/**
 * Resolve o chaveamento inteiro. Recebe TODOS os jogos do torneio (fase de
 * grupos + mata-mata) já enriquecidos e devolve os 32 jogos do mata-mata na
 * ordem dos jogos (73→104), com cada lado resolvido em time ou rótulo pendente.
 */
export function resolveBracket(allMatches: SourceMatch[]): ResolvedGame[] {
	const groupMatches: SourceMatch[] = [];
	const knockoutMatches: SourceMatch[] = [];
	for (const m of allMatches) {
		if (normalizeStage(m.stage)) knockoutMatches.push(m);
		else if (groupLetter(m.group)) groupMatches.push(m);
	}

	const tables = computeGroupTables(groupMatches);
	const realByGame = mapRealMatches(knockoutMatches);

	const resolved = new Map<number, ResolvedGame>();
	const games: ResolvedGame[] = [];

	const resolveSlot = (ref: SlotRef): ResolvedSide => {
		switch (ref.kind) {
			case "group":
				return resolveGroupSlot(ref, tables);
			case "third":
				return pendingSide(ref);
			case "winner": {
				const team = outcome(resolved.get(ref.game), "winner");
				return team ? teamSide(team) : pendingSide(ref);
			}
			case "loser": {
				const team = outcome(resolved.get(ref.game), "loser");
				return team ? teamSide(team) : pendingSide(ref);
			}
		}
	};

	// Percorre na ordem dos jogos para que vencedores propaguem às fases seguintes.
	for (const tmpl of WC2026_BRACKET) {
		const real = realByGame.get(tmpl.no) ?? null;
		let home: ResolvedSide;
		let away: ResolvedSide;

		if (real?.homeTeam && real.awayTeam) {
			home = teamSide(real.homeTeam);
			away = teamSide(real.awayTeam);
		} else {
			home = resolveSlot(tmpl.home);
			away = resolveSlot(tmpl.away);
		}

		const game: ResolvedGame = {
			no: tmpl.no,
			stage: tmpl.stage,
			utcDate: real?.utcDate ?? tmpl.utcDate,
			venue: real?.venue ?? tmpl.venue,
			home,
			away,
			match: real,
			homeScore: real?.homeScore ?? null,
			awayScore: real?.awayScore ?? null,
			status: real?.status ?? "SCHEDULED",
			duration: real?.duration ?? null,
			winner: real?.winner ?? null,
		};
		resolved.set(tmpl.no, game);
		games.push(game);
	}

	return games;
}
