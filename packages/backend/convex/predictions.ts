import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import {
	action,
	internalAction,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { auth, requireUserId } from "./auth";
import {
	DEFAULT_SCORING,
	isKnockoutStage,
	pointsFrom,
	type ScoreComponents,
} from "./lib/ranking";

const LOCK_WINDOW_MS = 60 * 60 * 1000; // 1 hour before match

// Apenas a Copa do Mundo pontua para o ranking das ligas. Jogos de outros
// torneios (ex.: Brasileirão/BSA2026, DEMO) podem existir no banco para
// preencher o calendário, mas NÃO geram pontos.
const SCORABLE_TOURNAMENT = "WC2026";

function calcComponents(
	predHome: number,
	predAway: number,
	actualHome: number,
	actualAway: number,
): ScoreComponents {
	return {
		result:
			Math.sign(predHome - predAway) === Math.sign(actualHome - actualAway),
		homeGoals: predHome === actualHome,
		awayGoals: predAway === actualAway,
	};
}

function calcPoints(
	predHome: number,
	predAway: number,
	actualHome: number,
	actualAway: number,
): {
	points: number;
	isExact: boolean;
	isCorrectResult: boolean;
	components: ScoreComponents;
} {
	const components = calcComponents(predHome, predAway, actualHome, actualAway);
	const isExact =
		components.result && components.homeGoals && components.awayGoals;
	return {
		points: pointsFrom(components, DEFAULT_SCORING),
		isExact,
		isCorrectResult: components.result,
		components,
	};
}

export const upsert = mutation({
	args: {
		matchId: v.id("matches"),
		predictedHome: v.number(),
		predictedAway: v.number(),
		// Palpite de desempate — só é guardado quando o placar palpitado empata
		// e o jogo é de mata-mata; caso contrário é descartado.
		tieWinner: v.optional(v.union(v.literal("HOME"), v.literal("AWAY"))),
		tieMethod: v.optional(v.union(v.literal("ET"), v.literal("PEN"))),
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

		// Desempate só vale quando o palpite empata E o jogo é eliminatório.
		const isTie = args.predictedHome === args.predictedAway;
		const isKnockout = isKnockoutStage(match.stage);
		const tieWinner = isTie && isKnockout ? args.tieWinner : undefined;
		const tieMethod = isTie && isKnockout ? args.tieMethod : undefined;

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
				tieWinner,
				tieMethod,
				points: undefined,
				calculatedAt: undefined,
				components: undefined,
				tieBonus: undefined,
			});
			return existing._id;
		}

		return ctx.db.insert("predictions", {
			userId,
			matchId: args.matchId,
			predictedHome: args.predictedHome,
			predictedAway: args.predictedAway,
			tieWinner,
			tieMethod,
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
			.collect();
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
			.collect();

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
		if (match.tournament !== SCORABLE_TOURNAMENT) return;
		if (match.homeScore == null || match.awayScore == null) return;

		const allPredictions = await ctx.db
			.query("predictions")
			.withIndex("by_match", (q) => q.eq("matchId", args.matchId))
			.collect();
		const predictions = allPredictions;

		const now = Date.now();

		// Desempate do mata-mata: empatou nos 90 (homeScore == awayScore) e a API
		// já definiu quem avançou. O placar guardado é só dos 90 min, então o
		// `winner` é a fonte da verdade de quem passou na prorrogação/pênaltis.
		const ninetyTie = match.homeScore === match.awayScore;
		const tieDecided =
			match.winner === "HOME_TEAM" || match.winner === "AWAY_TEAM";
		const tieAdvancer: "HOME" | "AWAY" | null = !tieDecided
			? null
			: match.winner === "HOME_TEAM"
				? "HOME"
				: "AWAY";
		const bonusEligible =
			isKnockoutStage(match.stage) && ninetyTie && tieAdvancer !== null;

		for (const pred of predictions) {
			const { points, isExact, isCorrectResult, components } = calcPoints(
				pred.predictedHome,
				pred.predictedAway,
				match.homeScore,
				match.awayScore,
			);
			// +2 fixos se o usuário palpitou empate e cravou quem avança (o método
			// — prorrogação/pênaltis — não importa para os pontos).
			const newBonus =
				bonusEligible &&
				pred.predictedHome === pred.predictedAway &&
				pred.tieWinner === tieAdvancer
					? 2
					: 0;
			const oldBonus = pred.tieBonus ?? 0;
			const oldComponents = pred.components;
			const previousPoints = pred.points ?? 0;
			const oldExact = oldComponents
				? oldComponents.result &&
					oldComponents.homeGoals &&
					oldComponents.awayGoals
				: pred.points === 10;
			const oldCorrectResult = oldComponents
				? oldComponents.result
				: previousPoints >= 5;
			const exactDelta = (isExact ? 1 : 0) - (oldExact ? 1 : 0);
			const correctResultDelta =
				(isCorrectResult ? 1 : 0) - (oldCorrectResult ? 1 : 0);

			await ctx.db.patch(pred._id, {
				points,
				calculatedAt: now,
				components,
				tieBonus: newBonus,
			});

			const memberships = await ctx.db
				.query("leagueMembers")
				.withIndex("by_user", (q) => q.eq("userId", pred.userId))
				.filter((q) => q.eq(q.field("status"), "ACTIVE"))
				.collect();

			for (const membership of memberships) {
				const league = await ctx.db.get(membership.leagueId);
				const scoring = league?.scoring ?? DEFAULT_SCORING;
				const oldPts = oldComponents
					? pointsFrom(oldComponents, scoring)
					: previousPoints;
				const newPts = pointsFrom(components, scoring);
				// Bônus de desempate é fixo (+2), somado igual em qualquer liga.
				const leagueDelta = newPts - oldPts + (newBonus - oldBonus);
				if (leagueDelta === 0 && exactDelta === 0 && correctResultDelta === 0) {
					continue;
				}
				await ctx.db.patch(membership._id, {
					totalPoints: membership.totalPoints + leagueDelta,
					exactScores: membership.exactScores + exactDelta,
					correctResults: membership.correctResults + correctResultDelta,
				});
			}
		}
	},
});

export const resetComputedPoints = internalMutation({
	args: {},
	handler: async (ctx) => {
		const [memberships, predictions] = await Promise.all([
			ctx.db.query("leagueMembers").collect(),
			ctx.db.query("predictions").collect(),
		]);

		for (const membership of memberships) {
			await ctx.db.patch(membership._id, {
				totalPoints: 0,
				exactScores: 0,
				correctResults: 0,
			});
		}

		for (const prediction of predictions) {
			await ctx.db.patch(prediction._id, {
				points: undefined,
				calculatedAt: undefined,
				components: undefined,
			});
		}

		return {
			resetMemberships: memberships.length,
			resetPredictions: predictions.length,
		};
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

		const [callerMembership, targetMembership, predictions] = await Promise.all(
			[
				ctx.db
					.query("leagueMembers")
					.withIndex("by_league_user", (q) =>
						q.eq("leagueId", args.leagueId).eq("userId", callerId),
					)
					.unique(),
				ctx.db
					.query("leagueMembers")
					.withIndex("by_league_user", (q) =>
						q.eq("leagueId", args.leagueId).eq("userId", args.memberUserId),
					)
					.unique(),
				ctx.db
					.query("predictions")
					.withIndex("by_user", (q) => q.eq("userId", args.memberUserId))
					.collect(),
			],
		);

		if (!callerMembership || callerMembership.status !== "ACTIVE") return null;
		if (!targetMembership || targetMembership.status !== "ACTIVE") return null;

		const now = Date.now();

		// Fetch all matches in parallel to avoid sequential DB reads
		const matches = await Promise.all(
			predictions.map((p) => ctx.db.get(p.matchId)),
		);

		type MatchDoc = NonNullable<(typeof matches)[number]>;
		const pairs: Array<{
			match: MatchDoc;
			prediction: (typeof predictions)[number];
		}> = [];
		for (let i = 0; i < predictions.length; i++) {
			const match = matches[i];
			if (!match) continue;
			if (match.tournament !== args.tournament) continue;
			if (now < new Date(match.utcDate).getTime() - LOCK_WINDOW_MS) continue;
			pairs.push({ match, prediction: predictions[i] });
		}

		// Deduplicate team IDs and fetch all teams in parallel
		const teamIdSet = new Set<string>();
		for (const { match } of pairs) {
			teamIdSet.add(match.homeTeamId as string);
			teamIdSet.add(match.awayTeamId as string);
		}
		const teamIdList = [...teamIdSet];
		const teamDocs = await Promise.all(
			teamIdList.map((id) => ctx.db.get(id as MatchDoc["homeTeamId"])),
		);
		const teamMap = new Map(teamIdList.map((id, i) => [id, teamDocs[i]]));

		return pairs
			.map(({ match, prediction }) => ({
				match: {
					...match,
					homeTeam: teamMap.get(match.homeTeamId as string) ?? null,
					awayTeam: teamMap.get(match.awayTeamId as string) ?? null,
				},
				prediction,
			}))
			.sort(
				(a, b) =>
					new Date(b.match.utcDate).getTime() -
					new Date(a.match.utcDate).getTime(),
			);
	},
});

export const recomputeAll = internalAction({
	args: {},
	handler: async (
		ctx,
	): Promise<{
		computed: number;
		resetMemberships: number;
		resetPredictions: number;
	}> => {
		const reset: { resetMemberships: number; resetPredictions: number } =
			await ctx.runMutation(internal.predictions.resetComputedPoints, {});
		const matches = await ctx.runQuery(internal.matches.getFinishedWithScore);
		let computed = 0;
		for (const match of matches) {
			await ctx.runMutation(internal.predictions.computeForMatch, {
				matchId: match._id,
			});
			computed++;
		}
		console.log(
			`[recomputeAll] Recomputed points for ${computed} matches after resetting ${reset.resetMemberships} memberships and ${reset.resetPredictions} predictions`,
		);
		return { computed, ...reset };
	},
});

// Zera todos os pontos sem recalcular — para reiniciar o placar do zero.
export const adminResetAllPoints = action({
	args: {},
	handler: async (
		ctx,
	): Promise<{ resetMemberships: number; resetPredictions: number }> => {
		const userId = await auth.getUserId(ctx);
		if (!userId) throw new ConvexError("Unauthorized");
		const adminCheck = await ctx.runQuery(internal.predictions.getAdminUser, {
			userId,
		});
		if (!adminCheck?.isAdmin) throw new ConvexError("Unauthorized");
		return ctx.runMutation(internal.predictions.resetComputedPoints, {});
	},
});

// Public wrapper for admin use — guards by email, inlines recomputeAll logic
// to avoid circular type-inference from self-referencing internal.predictions.
export const adminRecomputeAll = action({
	args: {},
	handler: async (
		ctx,
	): Promise<{
		computed: number;
		resetMemberships: number;
		resetPredictions: number;
	}> => {
		const userId = await auth.getUserId(ctx);
		if (!userId) throw new ConvexError("Unauthorized");
		const adminCheck = await ctx.runQuery(internal.predictions.getAdminUser, {
			userId,
		});
		if (!adminCheck?.isAdmin) throw new ConvexError("Unauthorized");
		const reset = await ctx.runMutation(
			internal.predictions.resetComputedPoints,
			{},
		);
		const matches = await ctx.runQuery(internal.matches.getFinishedWithScore);
		let computed = 0;
		for (const match of matches) {
			await ctx.runMutation(internal.predictions.computeForMatch, {
				matchId: match._id,
			});
			computed++;
		}
		console.log(
			`[adminRecomputeAll] Recomputed points for ${computed} matches after resetting ${reset.resetMemberships} memberships and ${reset.resetPredictions} predictions`,
		);
		return { computed, ...reset };
	},
});

export const getAdminUser = internalQuery({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("_id"), args.userId))
			.unique();
		const ADMIN_EMAIL = "arthurdearaujofaria@gmail.com";
		return user ? { isAdmin: user.email === ADMIN_EMAIL } : null;
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
			.collect();

		const calculated = allPredictions.filter(
			(p) => p.calculatedAt !== undefined,
		);

		const total = allPredictions.length;
		const exact = calculated.filter((p) => p.points === 10).length;
		const correct = calculated.filter((p) => (p.points ?? 0) > 0).length;
		const totalPoints = calculated.reduce(
			(s, p) => s + (p.points ?? 0) + (p.tieBonus ?? 0),
			0,
		);

		return { total, exact, correct, totalPoints };
	},
});
