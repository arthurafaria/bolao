import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { internalMutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";

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
    tournament: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("matches")
      .withIndex("by_apiId", (q) => q.eq("apiId", args.apiId))
      .unique();

    if (existing) {
      const wasFinished = existing.status === "FINISHED";
      await ctx.db.patch(existing._id, {
        status: args.status,
        homeScore: args.homeScore,
        awayScore: args.awayScore,
        utcDate: args.utcDate,
      });
      return { id: existing._id, justFinished: !wasFinished && args.status === "FINISHED" };
    }

    const id = await ctx.db.insert("matches", args);
    return { id, justFinished: false };
  },
});
