import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { action, internalAction } from "./_generated/server";
import { auth } from "./auth";

const API_BASE = "https://api.football-data.org/v4";
const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const API_FOOTBALL_CONFIG: Record<string, { league: number; season: number }> =
	{
		BSA2026: { league: 71, season: 2026 },
	};

const TEAM_ALIASES: Record<string, string> = {
	atleticomg: "atleticomineiro",
	atleticomineiro: "atleticomineiro",
	clubeatleticomineiro: "atleticomineiro",
	atleticoparanaense: "athleticoparanaense",
	athleticopr: "athleticoparanaense",
	clubathleticoparanaense: "athleticoparanaense",
	bahia: "bahia",
	ecbahia: "bahia",
	esporteclubebahia: "bahia",
	botafogo: "botafogo",
	botafogofr: "botafogo",
	botafogorj: "botafogo",
	bragantino: "bragantino",
	rbbragantino: "bragantino",
	redbullbragantino: "bragantino",
	ceara: "ceara",
	cearasc: "ceara",
	cearasportingclub: "ceara",
	corinthians: "corinthians",
	scorinthians: "corinthians",
	sportclubcorinthianspaulista: "corinthians",
	cruzeiro: "cruzeiro",
	cruzeiroec: "cruzeiro",
	cruzeiroesporteclube: "cruzeiro",
	flamengo: "flamengo",
	crflamengo: "flamengo",
	clubederegatasdoflamengo: "flamengo",
	fluminense: "fluminense",
	fluminensefc: "fluminense",
	fortaleza: "fortaleza",
	fortalezaec: "fortaleza",
	gremio: "gremio",
	gremiofbpa: "gremio",
	internacional: "internacional",
	scinternacional: "internacional",
	juventude: "juventude",
	ecjuventude: "juventude",
	mirassol: "mirassol",
	mirassolfc: "mirassol",
	palmeiras: "palmeiras",
	sepalmeiras: "palmeiras",
	sociedadeesportivapalmeiras: "palmeiras",
	remo: "remo",
	clubedoremo: "remo",
	santos: "santos",
	santosfc: "santos",
	saopaulo: "saopaulo",
	saopaulofc: "saopaulo",
	sport: "sportrecife",
	sportrecife: "sportrecife",
	sportclubdorecife: "sportrecife",
	vasco: "vasco",
	crvascodagama: "vasco",
	vascodagama: "vasco",
	vitoria: "vitoria",
	ecvitoria: "vitoria",
	esporteclubvitoria: "vitoria",
};

interface ApiTeam {
	id: number;
	name: string;
	shortName: string;
	crest: string;
	tla?: string;
	area?: { name: string };
}

interface ApiMatch {
	id: number;
	utcDate: string;
	status: string;
	matchday: number | null;
	stage: string;
	group: string | null;
	venue: string | null;
	homeTeam: ApiTeam;
	awayTeam: ApiTeam;
	score: {
		fullTime: { home: number | null; away: number | null };
		winner: string | null;
	};
}

interface ApiFootballFixture {
	fixture: {
		id: number;
		date: string;
		venue?: {
			id: number | null;
			name: string | null;
			city: string | null;
		} | null;
	};
	teams: {
		home: { name: string };
		away: { name: string };
	};
}

function normalizeStatus(status: string): string {
	const map: Record<string, string> = {
		TIMED: "TIMED",
		SCHEDULED: "SCHEDULED",
		LIVE: "LIVE",
		IN_PLAY: "IN_PLAY",
		PAUSED: "PAUSED",
		FINISHED: "FINISHED",
		POSTPONED: "POSTPONED",
		CANCELLED: "CANCELLED",
		SUSPENDED: "CANCELLED",
	};
	return map[status] ?? "SCHEDULED";
}

function normalizeTeamName(name: string): string {
	const key = name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/&/g, "e")
		.replace(/[^a-z0-9]/g, "");
	return TEAM_ALIASES[key] ?? key;
}

function datesAreClose(first: string, second: string): boolean {
	const firstTime = new Date(first).getTime();
	const secondTime = new Date(second).getTime();
	if (!Number.isFinite(firstTime) || !Number.isFinite(secondTime)) return false;

	const sixHours = 6 * 60 * 60 * 1000;
	return Math.abs(firstTime - secondTime) <= sixHours;
}

function findApiFootballVenue(
	match: ApiMatch,
	apiFootballFixtures: ApiFootballFixture[],
): string | undefined {
	const home = normalizeTeamName(match.homeTeam.name);
	const away = normalizeTeamName(match.awayTeam.name);

	const fixture = apiFootballFixtures.find((candidate) => {
		const venueName = candidate.fixture.venue?.name?.trim();
		if (!venueName) return false;

		return (
			normalizeTeamName(candidate.teams.home.name) === home &&
			normalizeTeamName(candidate.teams.away.name) === away &&
			datesAreClose(match.utcDate, candidate.fixture.date)
		);
	});

	return fixture?.fixture.venue?.name?.trim() || undefined;
}

async function fetchApiFootballFixtures(
	tournament: string,
	dateFrom?: string,
	dateTo?: string,
): Promise<ApiFootballFixture[]> {
	const config = API_FOOTBALL_CONFIG[tournament];
	const apiKey = process.env.API_FOOTBALL_KEY;
	if (!config || !apiKey || !dateFrom || !dateTo) return [];

	const params = new URLSearchParams({
		league: String(config.league),
		season: String(config.season),
		from: dateFrom,
		to: dateTo,
		timezone: "UTC",
	});

	const res = await fetch(`${API_FOOTBALL_BASE}/fixtures?${params}`, {
		headers: { "x-apisports-key": apiKey },
	});

	if (!res.ok) {
		const body = await res.text();
		console.warn(`API-FOOTBALL venue enrichment failed ${res.status}: ${body}`);
		return [];
	}

	const data = (await res.json()) as {
		errors?: Record<string, string>;
		response?: ApiFootballFixture[];
	};
	if (data.errors && Object.keys(data.errors).length > 0) {
		console.warn(
			`API-FOOTBALL venue enrichment skipped: ${JSON.stringify(data.errors)}`,
		);
		return [];
	}

	return data.response ?? [];
}

// ─── Fallback de placar via ESPN (sem chave, tempo real) ─────────────────────
// A football-data.org (tier free) atrasa o placar: marca FINISHED com
// fullTime null por até horas. O scoreboard público da ESPN tem o placar
// na hora do apito final e serve de fonte secundária.

const ESPN_LEAGUE_CODES: Record<string, string> = {
	WC2026: "fifa.world",
	BSA2026: "bra.1",
};

interface EspnEvent {
	date: string;
	homeTla?: string;
	awayTla?: string;
	homeName: string;
	awayName: string;
	homeScore: number | null;
	awayScore: number | null;
	completed: boolean;
}

async function fetchEspnScoreboard(
	tournament: string,
	dates: string[],
): Promise<EspnEvent[]> {
	const leagueCode = ESPN_LEAGUE_CODES[tournament];
	if (!leagueCode || dates.length === 0) return [];

	const events: EspnEvent[] = [];
	for (const date of dates) {
		try {
			const res = await fetch(
				`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard?dates=${date}`,
			);
			if (!res.ok) {
				console.warn(`[ESPN fallback] HTTP ${res.status} para ${date}`);
				continue;
			}
			const data = (await res.json()) as {
				events?: Array<{
					date: string;
					status?: { type?: { completed?: boolean } };
					competitions?: Array<{
						competitors?: Array<{
							homeAway: string;
							score?: string;
							team?: { displayName?: string; abbreviation?: string };
						}>;
					}>;
				}>;
			};
			for (const event of data.events ?? []) {
				const competitors = event.competitions?.[0]?.competitors ?? [];
				const home = competitors.find((c) => c.homeAway === "home");
				const away = competitors.find((c) => c.homeAway === "away");
				if (!home?.team || !away?.team) continue;
				events.push({
					date: event.date,
					homeTla: home.team.abbreviation,
					awayTla: away.team.abbreviation,
					homeName: home.team.displayName ?? "",
					awayName: away.team.displayName ?? "",
					homeScore: home.score != null ? Number(home.score) : null,
					awayScore: away.score != null ? Number(away.score) : null,
					completed: event.status?.type?.completed === true,
				});
			}
		} catch (err) {
			console.warn(`[ESPN fallback] erro ao buscar ${date}: ${err}`);
		}
	}
	return events;
}

function findEspnScore(
	match: ApiMatch,
	espnEvents: EspnEvent[],
): EspnEvent | undefined {
	const homeTla = match.homeTeam.tla;
	const awayTla = match.awayTeam.tla;
	const homeName = normalizeTeamName(match.homeTeam.name);
	const awayName = normalizeTeamName(match.awayTeam.name);

	return espnEvents.find((event) => {
		if (!datesAreClose(match.utcDate, event.date)) return false;
		const tlaMatch =
			homeTla &&
			awayTla &&
			event.homeTla === homeTla &&
			event.awayTla === awayTla;
		const nameMatch =
			normalizeTeamName(event.homeName) === homeName &&
			normalizeTeamName(event.awayName) === awayName;
		return Boolean(tlaMatch || nameMatch);
	});
}

async function doSync(
	ctx: ActionCtx,
	competitionCode: string,
	tournament: string,
	dateFrom?: string,
	dateTo?: string,
): Promise<{
	synced: number;
	pointsComputed: number;
	promoted: number;
	venuesEnriched: number;
	fallbackApplied: number;
}> {
	const apiKey = process.env.FOOTBALL_DATA_API_KEY;
	if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY not set");

	let url = `${API_BASE}/competitions/${competitionCode}/matches`;
	const params: string[] = [];
	if (dateFrom) params.push(`dateFrom=${dateFrom}`);
	if (dateTo) params.push(`dateTo=${dateTo}`);
	if (params.length) url += `?${params.join("&")}`;

	const res = await fetch(url, {
		headers: { "X-Auth-Token": apiKey },
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`football-data API error ${res.status}: ${body}`);
	}

	const data = (await res.json()) as { matches: ApiMatch[] };
	const apiFootballFixtures = await fetchApiFootballFixtures(
		tournament,
		dateFrom,
		dateTo,
	);
	let synced = 0;
	let pointsComputed = 0;
	let venuesEnriched = 0;
	const scoreFallbackCandidates: {
		match: ApiMatch;
		dbId: Id<"matches">;
	}[] = [];

	for (const match of data.matches) {
		if (!match.homeTeam.id || !match.awayTeam.id) continue;
		const venue =
			match.venue?.trim() || findApiFootballVenue(match, apiFootballFixtures);
		if (!match.venue?.trim() && venue) venuesEnriched++;

		const homeTeamId = await ctx.runMutation(internal.matches.upsertTeam, {
			apiId: match.homeTeam.id,
			name: match.homeTeam.name,
			shortName: match.homeTeam.shortName ?? match.homeTeam.name,
			crest: match.homeTeam.crest ?? "",
			nationality: match.homeTeam.area?.name ?? "",
			tla: match.homeTeam.tla,
		});

		const awayTeamId = await ctx.runMutation(internal.matches.upsertTeam, {
			apiId: match.awayTeam.id,
			name: match.awayTeam.name,
			shortName: match.awayTeam.shortName ?? match.awayTeam.name,
			crest: match.awayTeam.crest ?? "",
			nationality: match.awayTeam.area?.name ?? "",
			tla: match.awayTeam.tla,
		});

		const status = normalizeStatus(match.status) as
			| "TIMED"
			| "SCHEDULED"
			| "LIVE"
			| "IN_PLAY"
			| "PAUSED"
			| "FINISHED"
			| "POSTPONED"
			| "CANCELLED";

		const result = await ctx.runMutation(internal.matches.upsertMatch, {
			apiId: match.id,
			homeTeamId,
			awayTeamId,
			utcDate: match.utcDate,
			status,
			homeScore: match.score.fullTime.home ?? undefined,
			awayScore: match.score.fullTime.away ?? undefined,
			stage: match.stage,
			group: match.group ?? undefined,
			matchday: match.matchday ?? undefined,
			venue,
			tournament,
		});

		synced++;

		if (result.shouldComputePoints) {
			if (
				match.score.fullTime.home == null ||
				match.score.fullTime.away == null
			) {
				console.warn(
					`[${tournament}] shouldComputePoints=true but score is null for apiId=${match.id}`,
				);
			}
			await ctx.runMutation(internal.predictions.computeForMatch, {
				matchId: result.id,
			});
			pointsComputed++;
		}

		// Candidato a fallback de placar: jogo que (provavelmente) acabou mas a
		// football-data ainda não publicou o placar.
		if (!result.hasScore) {
			const kickoff = new Date(match.utcDate).getTime();
			const likelyEnded = Date.now() - kickoff > 105 * 60 * 1000; // 1h45 após o início
			const liveStatuses = ["LIVE", "IN_PLAY", "PAUSED"];
			if (
				match.status === "FINISHED" ||
				(liveStatuses.includes(match.status) && likelyEnded)
			) {
				scoreFallbackCandidates.push({ match, dbId: result.id });
			}
		}
	}

	// Fallback ESPN: busca o placar dos jogos pendentes e computa pontos.
	let fallbackApplied = 0;
	if (scoreFallbackCandidates.length > 0) {
		const dates = [
			...new Set(
				scoreFallbackCandidates.map((c) =>
					c.match.utcDate.slice(0, 10).replace(/-/g, ""),
				),
			),
		];
		const espnEvents = await fetchEspnScoreboard(tournament, dates);
		for (const { match, dbId } of scoreFallbackCandidates) {
			const espn = findEspnScore(match, espnEvents);
			if (espn?.completed && espn.homeScore != null && espn.awayScore != null) {
				await ctx.runMutation(internal.matches.patchMatchScore, {
					matchId: dbId,
					homeScore: espn.homeScore,
					awayScore: espn.awayScore,
				});
				await ctx.runMutation(internal.predictions.computeForMatch, {
					matchId: dbId,
				});
				fallbackApplied++;
				console.log(
					`[${tournament}] [ESPN fallback] ${match.homeTeam.name} ${espn.homeScore} x ${espn.awayScore} ${match.awayTeam.name}`,
				);
			} else {
				// Nenhuma fonte tem o placar: alerta o admin uma única vez por jogo,
				// se o jogo já deveria ter terminado há bastante tempo.
				const kickoff = new Date(match.utcDate).getTime();
				if (Date.now() - kickoff > 150 * 60 * 1000) {
					const { shouldAlert } = await ctx.runMutation(
						internal.matches.claimScoreAlert,
						{ matchId: dbId },
					);
					if (shouldAlert) {
						await ctx.scheduler.runAfter(
							0,
							internal.notifications.sendScoreMissingAlert,
							{ matchId: dbId },
						);
					}
				}
			}
		}
	}

	// Promote any IN_PLAY/PAUSED matches that started >4h ago and have a score.
	// Handles football-data.org not emitting a clean FINISHED status transition.
	const { promoted } = await ctx.runMutation(
		internal.matches.forceFinishStaleLive,
		{},
	);
	if (promoted > 0) {
		await ctx.runAction(internal.predictions.recomputeAll, {});
	}

	console.log(
		`[${tournament}] Synced ${synced} matches, enriched ${venuesEnriched} venues, computed points for ${pointsComputed}, promoted ${promoted} stale matches, ESPN fallback ${fallbackApplied}`,
	);
	return { synced, pointsComputed, promoted, venuesEnriched, fallbackApplied };
}

// ─── World Cup 2026 ───────────────────────────────────────────────────────────

export const syncAll = internalAction({
	args: { dateFrom: v.optional(v.string()), dateTo: v.optional(v.string()) },
	handler: async (ctx, args) => {
		return doSync(ctx, "WC", "WC2026", args.dateFrom, args.dateTo);
	},
});

export const syncToday = internalAction({
	args: {},
	handler: async (ctx) => {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);
		const future = new Date(today);
		future.setDate(today.getDate() + 60);
		const fmt = (d: Date) => d.toISOString().slice(0, 10);
		await doSync(ctx, "WC", "WC2026", fmt(yesterday), fmt(future));
	},
});

// ─── Brasileirão Série A 2026 ─────────────────────────────────────────────────

export const syncAllBSA = internalAction({
	args: { dateFrom: v.optional(v.string()), dateTo: v.optional(v.string()) },
	handler: async (ctx, args) => {
		return doSync(ctx, "BSA", "BSA2026", args.dateFrom, args.dateTo);
	},
});

export const syncTodayBSA = internalAction({
	args: {},
	handler: async (ctx) => {
		const today = new Date();
		const past = new Date(today);
		past.setDate(today.getDate() - 7);
		const future = new Date(today);
		future.setDate(today.getDate() + 30);
		const fmt = (d: Date) => d.toISOString().slice(0, 10);
		await doSync(ctx, "BSA", "BSA2026", fmt(past), fmt(future));
	},
});

// ─── Admin public wrappers (guarded by email) ─────────────────────────────────
// Inline the sync logic to avoid circular type-inference with internal refs.

async function checkAdmin(ctx: ActionCtx, userId: string): Promise<boolean> {
	const result = await ctx.runQuery(internal.predictions.getAdminUser, {
		userId,
	});
	return result?.isAdmin === true;
}

export const adminSyncBSA = action({
	args: {},
	handler: async (
		ctx,
	): Promise<{
		synced: number;
		pointsComputed: number;
		promoted: number;
		venuesEnriched: number;
	}> => {
		const userId = await auth.getUserId(ctx);
		if (!userId || !(await checkAdmin(ctx, userId)))
			throw new ConvexError("Unauthorized");
		const today = new Date();
		const past = new Date(today);
		past.setDate(today.getDate() - 7);
		const future = new Date(today);
		future.setDate(today.getDate() + 30);
		const fmt = (d: Date) => d.toISOString().slice(0, 10);
		return doSync(ctx, "BSA", "BSA2026", fmt(past), fmt(future));
	},
});

export const adminPatchMatchScore = action({
	args: {
		homeTeamShortName: v.string(),
		awayTeamShortName: v.string(),
		homeScore: v.number(),
		awayScore: v.number(),
	},
	handler: async (ctx, args): Promise<{ matchId: string; patched: string }> => {
		const userId = await auth.getUserId(ctx);
		if (!userId || !(await checkAdmin(ctx, userId)))
			throw new ConvexError("Unauthorized");

		const match = await ctx.runQuery(internal.matches.getMatchByTeamNames, {
			homeShortName: args.homeTeamShortName,
			awayShortName: args.awayTeamShortName,
		});
		if (!match)
			throw new ConvexError(
				`Jogo não encontrado: ${args.homeTeamShortName} vs ${args.awayTeamShortName}`,
			);

		await ctx.runMutation(internal.matches.patchMatchScore, {
			matchId: match._id,
			homeScore: args.homeScore,
			awayScore: args.awayScore,
		});

		await ctx.runMutation(internal.predictions.computeForMatch, {
			matchId: match._id,
		});

		return {
			matchId: match._id,
			patched: `${match.homeTeam.shortName} ${args.homeScore} × ${args.awayScore} ${match.awayTeam.shortName}`,
		};
	},
});

export const adminSyncWC = action({
	args: {},
	handler: async (
		ctx,
	): Promise<{
		synced: number;
		pointsComputed: number;
		promoted: number;
		venuesEnriched: number;
	}> => {
		const userId = await auth.getUserId(ctx);
		if (!userId || !(await checkAdmin(ctx, userId)))
			throw new ConvexError("Unauthorized");
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);
		const future = new Date(today);
		future.setDate(today.getDate() + 60);
		const fmt = (d: Date) => d.toISOString().slice(0, 10);
		return doSync(ctx, "WC", "WC2026", fmt(yesterday), fmt(future));
	},
});
