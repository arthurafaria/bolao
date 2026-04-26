import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
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
		return {
			points: 5 + homeBonus + awayBonus,
			isExact: false,
			isCorrectResult: true,
		};
	}

	return {
		points: homeBonus + awayBonus,
		isExact: false,
		isCorrectResult: false,
	};
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

export const getMemberLockedPredictions = query({
	args: {
		leagueId: v.id("leagues"),
		memberUserId: v.string(),
		tournament: v.string(),
	},
	handler: async (ctx, args) => {
		const callerId = await auth.getUserId(ctx);
		if (!callerId) return null;

		const callerMembership = await ctx.db
			.query("leagueMembers")
			.withIndex("by_league_user", (q) =>
				q.eq("leagueId", args.leagueId).eq("userId", callerId),
			)
			.unique();
		if (!callerMembership || callerMembership.status !== "ACTIVE") return null;

		const targetMembership = await ctx.db
			.query("leagueMembers")
			.withIndex("by_league_user", (q) =>
				q.eq("leagueId", args.leagueId).eq("userId", args.memberUserId),
			)
			.unique();
		if (!targetMembership || targetMembership.status !== "ACTIVE") return null;

		const predictions = await ctx.db
			.query("predictions")
			.withIndex("by_user", (q) => q.eq("userId", args.memberUserId))
			.take(200);

		const now = Date.now();
		const results = [];

		for (const pred of predictions) {
			const match = await ctx.db.get(pred.matchId);
			if (!match) continue;
			if (match.tournament !== args.tournament) continue;
			const matchTime = new Date(match.utcDate).getTime();
			if (now < matchTime - LOCK_WINDOW_MS) continue;

			const [homeTeam, awayTeam] = await Promise.all([
				ctx.db.get(match.homeTeamId),
				ctx.db.get(match.awayTeamId),
			]);
			results.push({ match: { ...match, homeTeam, awayTeam }, prediction: pred });
		}

		return results.sort(
			(a, b) =>
				new Date(b.match.utcDate).getTime() -
				new Date(a.match.utcDate).getTime(),
		);
	},
});

export const recomputeAll = action({
	args: {},
	handler: async (ctx) => {
		const matches = await ctx.runQuery(internal.matches.getFinishedWithScore);
		let computed = 0;
		for (const match of matches) {
			await ctx.runMutation(internal.predictions.computeForMatch, {
				matchId: match._id,
			});
			computed++;
		}
		console.log(`[recomputeAll] Recomputed points for ${computed} matches`);
		return { computed };
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

		const calculated = allPredictions.filter(
			(p) => p.calculatedAt !== undefined,
		);

		const total = allPredictions.length;
		const exact = calculated.filter((p) => p.points === 10).length;
		const correct = calculated.filter((p) => (p.points ?? 0) > 0).length;
		const totalPoints = calculated.reduce((s, p) => s + (p.points ?? 0), 0);

		return { total, exact, correct, totalPoints };
	},
});
