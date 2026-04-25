import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { internalAction } from "./_generated/server";

const API_BASE = "https://api.football-data.org/v4";

interface ApiTeam {
	id: number;
	name: string;
	shortName: string;
	crest: string;
	area?: { name: string };
}

interface ApiMatch {
	id: number;
	utcDate: string;
	status: string;
	matchday: number | null;
	stage: string;
	group: string | null;
	homeTeam: ApiTeam;
	awayTeam: ApiTeam;
	score: {
		fullTime: { home: number | null; away: number | null };
		winner: string | null;
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

async function doSync(
	ctx: ActionCtx,
	competitionCode: string,
	tournament: string,
	dateFrom?: string,
	dateTo?: string,
) {
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
	let synced = 0;
	let pointsComputed = 0;

	for (const match of data.matches) {
		if (!match.homeTeam.id || !match.awayTeam.id) continue;

		const homeTeamId = await ctx.runMutation(internal.matches.upsertTeam, {
			apiId: match.homeTeam.id,
			name: match.homeTeam.name,
			shortName: match.homeTeam.shortName ?? match.homeTeam.name,
			crest: match.homeTeam.crest ?? "",
			nationality: match.homeTeam.area?.name ?? "",
		});

		const awayTeamId = await ctx.runMutation(internal.matches.upsertTeam, {
			apiId: match.awayTeam.id,
			name: match.awayTeam.name,
			shortName: match.awayTeam.shortName ?? match.awayTeam.name,
			crest: match.awayTeam.crest ?? "",
			nationality: match.awayTeam.area?.name ?? "",
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
			tournament,
		});

		synced++;

		if (result.justFinished) {
			await ctx.runMutation(internal.predictions.computeForMatch, {
				matchId: result.id,
			});
			pointsComputed++;
		}
	}

	console.log(
		`[${tournament}] Synced ${synced} matches, computed points for ${pointsComputed}`,
	);
	return { synced, pointsComputed };
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
		const future = new Date(today);
		future.setDate(today.getDate() + 60);
		const fmt = (d: Date) => d.toISOString().slice(0, 10);
		await doSync(ctx, "WC", "WC2026", fmt(today), fmt(future));
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
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);
		const fmt = (d: Date) => d.toISOString().slice(0, 10);
		await doSync(ctx, "BSA", "BSA2026", fmt(today), fmt(tomorrow));
	},
});
