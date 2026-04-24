import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { auth, requireUserId } from "./auth";

const LOCK_WINDOW_MS = 60 * 60 * 1000; // 1 hour before match

function calcPoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
): { points: number; isExact: boolean; isCorrectResult: boolean } {
  if (predHome === actualHome && predAway === actualAway) {
    return { points: 10, isExact: true, isCorrectResult: true };
  }

  const isCorrectResult =
    Math.sign(predHome - predAway) === Math.sign(actualHome - actualAway);

  // +2 for each team's exact goal count, regardless of result
  const homeBonus = predHome === actualHome ? 2 : 0;
  const awayBonus = predAway === actualAway ? 2 : 0;

  if (isCorrectResult) {
    return { points: 5 + homeBonus + awayBonus, isExact: false, isCorrectResult: true };
  }

  return { points: homeBonus + awayBonus, isExact: false, isCorrectResult: false };
}

export const upsert = mutation({
  args: {
    matchId: v.id("matches"),
    predictedHome: v.number(),
    predictedAway: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    if (args.predictedHome < 0 || args.predictedAway < 0) {
      throw new ConvexError("Scores cannot be negative");
    }

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new ConvexError("Match not found");

    const matchTime = new Date(match.utcDate).getTime();
    if (Date.now() >= matchTime - LOCK_WINDOW_MS) {
      throw new ConvexError("Predictions are locked 1 hour before kick-off");
    }

    const existing = await ctx.db
      .query("predictions")
      .withIndex("by_user_match", (q) =>
        q.eq("userId", userId).eq("matchId", args.matchId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        predictedHome: args.predictedHome,
        predictedAway: args.predictedAway,
        points: undefined,
        calculatedAt: undefined,
      });
      return existing._id;
    }

    return ctx.db.insert("predictions", {
      userId,
      matchId: args.matchId,
      predictedHome: args.predictedHome,
      predictedAway: args.predictedAway,
    });
  },
});

export const getForMatch = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    return ctx.db
      .query("predictions")
      .withIndex("by_user_match", (q) =>
        q.eq("userId", userId).eq("matchId", args.matchId),
      )
      .unique();
  },
});

export const getUserPredictions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return ctx.db
      .query("predictions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(200);
  },
});

export const getLeagueMemberPredictions = query({
  args: { matchId: v.id("matches"), leagueId: v.id("leagues") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    const matchTime = new Date(match.utcDate).getTime();
    const lockTime = matchTime - LOCK_WINDOW_MS;
    if (Date.now() < lockTime) return null;

    const membership = await ctx.db
      .query("leagueMembers")
      .withIndex("by_league_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .unique();
    if (!membership || membership.status !== "ACTIVE") return null;

    const members = await ctx.db
      .query("leagueMembers")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .take(50);

    const predictions = await Promise.all(
      members.map(async (m) => {
        const pred = await ctx.db
          .query("predictions")
          .withIndex("by_user_match", (q) =>
            q.eq("userId", m.userId).eq("matchId", args.matchId),
          )
          .unique();
        return { userId: m.userId, prediction: pred };
      }),
    );

    return predictions;
  },
});

export const computeForMatch = internalMutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match || match.status !== "FINISHED") return;
    if (match.homeScore == null || match.awayScore == null) return;

    const predictions = await ctx.db
      .query("predictions")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .filter((q) => q.eq(q.field("calculatedAt"), undefined))
      .take(200);

    const now = Date.now();

    for (const pred of predictions) {
      const { points, isExact, isCorrectResult } = calcPoints(
        pred.predictedHome,
        pred.predictedAway,
        match.homeScore,
        match.awayScore,
      );

      await ctx.db.patch(pred._id, { points, calculatedAt: now });

      const memberships = await ctx.db
        .query("leagueMembers")
        .withIndex("by_user", (q) => q.eq("userId", pred.userId))
        .filter((q) => q.eq(q.field("status"), "ACTIVE"))
        .take(50);

      for (const membership of memberships) {
        await ctx.db.patch(membership._id, {
          totalPoints: membership.totalPoints + points,
          exactScores: membership.exactScores + (isExact ? 1 : 0),
          correctResults: membership.correctResults + (isCorrectResult ? 1 : 0),
        });
      }
    }
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const allPredictions = await ctx.db
      .query("predictions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(200);

    const calculated = allPredictions.filter((p) => p.calculatedAt !== undefined);

    const total = allPredictions.length;
    const exact = calculated.filter((p) => p.points === 10).length;
    const correct = calculated.filter((p) => (p.points ?? 0) > 0).length;
    const totalPoints = calculated.reduce((s, p) => s + (p.points ?? 0), 0);

    return { total, exact, correct, totalPoints };
  },
});
