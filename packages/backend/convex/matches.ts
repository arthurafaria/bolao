import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { internalMutation, internalQuery, query } from "./_generated/server";

async function enrichMatch(ctx: QueryCtx, match: Doc<"matches">) {
	const [homeTeam, awayTeam] = await Promise.all([
		ctx.db.get(match.homeTeamId),
		ctx.db.get(match.awayTeamId),
	]);
	return { ...match, homeTeam, awayTeam };
}

export const getUpcoming = query({
	args: { limit: v.optional(v.number()), tournament: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const now = new Date().toISOString();
		if (args.tournament) {
			const matches = await ctx.db
				.query("matches")
				.withIndex("by_tournament_date", (q) =>
					q.eq("tournament", args.tournament!).gte("utcDate", now),
				)
				.order("asc")
				.take(args.limit ?? 10);
			return Promise.all(matches.map((m) => enrichMatch(ctx, m)));
		}
		const matches = await ctx.db
			.query("matches")
			.withIndex("by_utcDate")
			.order("asc")
			.filter((q) => q.gte(q.field("utcDate"), now))
			.take(args.limit ?? 10);
		return Promise.all(matches.map((m) => enrichMatch(ctx, m)));
	},
});

export const getByStage = query({
	args: { tournament: v.string(), stage: v.optional(v.string()) },
	handler: async (ctx, args) => {
		let matches: Doc<"matches">[];
		if (args.stage) {
			matches = await ctx.db
				.query("matches")
				.withIndex("by_tournament_stage", (q) =>
					q.eq("tournament", args.tournament).eq("stage", args.stage!),
				)
				.order("asc")
				.take(100);
		} else {
			matches = await ctx.db
				.query("matches")
				.withIndex("by_tournament_stage", (q) =>
					q.eq("tournament", args.tournament),
				)
				.order("asc")
				.take(100);
		}
		return Promise.all(matches.map((m) => enrichMatch(ctx, m)));
	},
});

export const getById = query({
	args: { matchId: v.id("matches") },
	handler: async (ctx, args) => {
		const match = await ctx.db.get(args.matchId);
		if (!match) return null;
		return enrichMatch(ctx, match);
	},
});

export const getLive = query({
	args: {},
	handler: async (ctx) => {
		const inPlay = await ctx.db
			.query("matches")
			.withIndex("by_status", (q) => q.eq("status", "IN_PLAY"))
			.take(20);
		const paused = await ctx.db
			.query("matches")
			.withIndex("by_status", (q) => q.eq("status", "PAUSED"))
			.take(20);
		return Promise.all([...inPlay, ...paused].map((m) => enrichMatch(ctx, m)));
	},
});

export const getAllByDate = query({
	args: { tournament: v.string() },
	handler: async (ctx, args) => {
		const matches = await ctx.db
			.query("matches")
			.withIndex("by_utcDate")
			.order("asc")
			.filter((q) => q.eq(q.field("tournament"), args.tournament))
			.take(200);
		return Promise.all(matches.map((m) => enrichMatch(ctx, m)));
	},
});

export const upsertTeam = internalMutation({
	args: {
		apiId: v.number(),
		name: v.string(),
		shortName: v.string(),
		crest: v.string(),
		nationality: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("teams")
			.withIndex("by_apiId", (q) => q.eq("apiId", args.apiId))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				name: args.name,
				shortName: args.shortName,
				crest: args.crest,
				nationality: args.nationality,
			});
			return existing._id;
		}

		return ctx.db.insert("teams", args);
	},
});

export const upsertMatch = internalMutation({
	args: {
		apiId: v.number(),
		homeTeamId: v.id("teams"),
		awayTeamId: v.id("teams"),
		utcDate: v.string(),
		status: v.union(
			v.literal("TIMED"),
			v.literal("SCHEDULED"),
			v.literal("LIVE"),
			v.literal("IN_PLAY"),
			v.literal("PAUSED"),
			v.literal("FINISHED"),
			v.literal("POSTPONED"),
			v.literal("CANCELLED"),
		),
		homeScore: v.optional(v.number()),
		awayScore: v.optional(v.number()),
		stage: v.string(),
		group: v.optional(v.string()),
		matchday: v.optional(v.number()),
		venue: v.optional(v.string()),
		tournament: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("matches")
			.withIndex("by_apiId", (q) => q.eq("apiId", args.apiId))
			.unique();

		if (existing) {
			const wasFinished = existing.status === "FINISHED";
			const newlyFinished = !wasFinished && args.status === "FINISHED";
			const scoreNowVisible =
				args.status === "FINISHED" &&
				(existing.homeScore == null || existing.awayScore == null) &&
				args.homeScore != null &&
				args.awayScore != null;
			// Always recompute for already-FINISHED matches: computeForMatch is
			// idempotent (skips predictions already having calculatedAt set).
			const alreadyFinishedWithScore =
				wasFinished && args.homeScore != null && args.awayScore != null;
			await ctx.db.patch(existing._id, {
				status: args.status,
				homeScore: args.homeScore,
				awayScore: args.awayScore,
				utcDate: args.utcDate,
				venue: args.venue,
			});
			return {
				id: existing._id,
				shouldComputePoints:
					newlyFinished || scoreNowVisible || alreadyFinishedWithScore,
			};
		}

		const id = await ctx.db.insert("matches", args);
		return { id, shouldComputePoints: false };
	},
});

export const getFinishedWithScore = internalQuery({
	args: {},
	handler: async (ctx) => {
		const matches = await ctx.db
			.query("matches")
			.withIndex("by_status", (q) => q.eq("status", "FINISHED"))
			.take(500);
		return matches.filter((m) => m.homeScore != null && m.awayScore != null);
	},
});

// Promotes LIVE/IN_PLAY/PAUSED matches that started >STALE_MS ago and already
// have a score to FINISHED. Handles the case where football-data.org never
// emits a clean FINISHED transition (common with free-tier data latency).
export const forceFinishStaleLive = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const STALE_MS = 4 * 60 * 60 * 1000; // 4h covers 90min + extra time + penalties
		const staleStatuses = ["LIVE", "IN_PLAY", "PAUSED"] as const;

		let promoted = 0;
		const promotedIds: string[] = [];

		for (const status of staleStatuses) {
			const matches = await ctx.db
				.query("matches")
				.withIndex("by_status", (q) => q.eq("status", status))
				.take(100);
			for (const m of matches) {
				const start = new Date(m.utcDate).getTime();
				const isStale = now - start > STALE_MS;
				const hasScore = m.homeScore != null && m.awayScore != null;
				if (isStale && hasScore) {
					await ctx.db.patch(m._id, { status: "FINISHED" });
					promotedIds.push(m._id);
					promoted++;
				} else if (isStale && !hasScore) {
					console.warn(
						`[forceFinishStaleLive] Stale ${status} match without score: ${m._id} (${m.utcDate})`,
					);
				}
			}
		}

		if (promoted > 0) {
			console.log(
				`[forceFinishStaleLive] Promoted ${promoted} matches to FINISHED`,
			);
		}
		return { promoted, promotedIds };
	},
});
