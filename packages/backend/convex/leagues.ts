import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { auth, requireUserId } from "./auth";
import {
	compareByExacts,
	compareByPoints,
	DEFAULT_SCORING,
	pointsFrom,
} from "./lib/ranking";

// Apenas o Brasileirão (torneio ativo, ver lib/tournaments) pontua para o
// ranking das ligas.

async function getActiveMembership(
	ctx: QueryCtx,
	leagueId: Id<"leagues">,
	userId: string,
) {
	return ctx.db
		.query("leagueMembers")
		.withIndex("by_league_user", (q) =>
			q.eq("leagueId", leagueId).eq("userId", userId),
		)
		.unique()
		.then((membership) =>
			membership?.status === "ACTIVE" ? membership : null,
		);
}

function generateInviteCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let code = "";
	for (let i = 0; i < 6; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

function validateScoring(scoring: {
	result: number;
	goal: number;
	exactBonus: number;
}) {
	const values = [scoring.result, scoring.goal, scoring.exactBonus];
	if (
		!values.every(
			(value) => Number.isInteger(value) && value >= 0 && value <= 20,
		)
	) {
		throw new ConvexError("Pesos devem ser inteiros entre 0 e 20");
	}
}

export const create = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		joinType: v.union(v.literal("OPEN"), v.literal("MODERATED")),
		rankingMode: v.optional(v.union(v.literal("POINTS"), v.literal("EXACTS"))),
		scoring: v.optional(
			v.object({
				result: v.number(),
				goal: v.number(),
				exactBonus: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);

		if (args.name.trim().length < 3) {
			throw new ConvexError("League name must be at least 3 characters");
		}
		if (args.scoring) validateScoring(args.scoring);

		let inviteCode: string;
		let attempts = 0;
		do {
			inviteCode = generateInviteCode();
			const existing = await ctx.db
				.query("leagues")
				.withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
				.unique();
			if (!existing) break;
			attempts++;
		} while (attempts < 10);

		const leagueId = await ctx.db.insert("leagues", {
			name: args.name.trim(),
			description: args.description,
			ownerId: userId,
			joinType: args.joinType,
			rankingMode: args.rankingMode ?? "POINTS",
			scoring: args.scoring,
			inviteCode: inviteCode!,
			memberCount: 1,
		});

		await ctx.db.insert("leagueMembers", {
			leagueId,
			userId,
			totalPoints: 0,
			exactScores: 0,
			correctResults: 0,
			status: "ACTIVE",
			joinedAt: Date.now(),
		});

		return leagueId;
	},
});

export const join = mutation({
	args: { inviteCode: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);

		const league = await ctx.db
			.query("leagues")
			.withIndex("by_inviteCode", (q) =>
				q.eq("inviteCode", args.inviteCode.toUpperCase()),
			)
			.unique();
		if (!league) throw new ConvexError("League not found");

		if (league.memberCount >= 50) {
			throw new ConvexError("League is full (50 members max)");
		}

		const existing = await ctx.db
			.query("leagueMembers")
			.withIndex("by_league_user", (q) =>
				q.eq("leagueId", league._id).eq("userId", userId),
			)
			.unique();

		if (existing?.status === "ACTIVE") {
			throw new ConvexError("Already a member of this league");
		}

		if (league.joinType === "MODERATED") {
			const pendingRequest = await ctx.db
				.query("leagueJoinRequests")
				.withIndex("by_league_status", (q) =>
					q.eq("leagueId", league._id).eq("status", "PENDING"),
				)
				.filter((q) => q.eq(q.field("userId"), userId))
				.unique();

			if (pendingRequest) throw new ConvexError("Request already pending");

			await ctx.db.insert("leagueJoinRequests", {
				leagueId: league._id,
				userId,
				requestedAt: Date.now(),
				status: "PENDING",
			});

			return { status: "PENDING" as const, leagueId: league._id };
		}

		if (existing) {
			await ctx.db.patch(existing._id, {
				status: "ACTIVE",
				joinedAt: Date.now(),
			});
		} else {
			await ctx.db.insert("leagueMembers", {
				leagueId: league._id,
				userId,
				totalPoints: 0,
				exactScores: 0,
				correctResults: 0,
				status: "ACTIVE",
				joinedAt: Date.now(),
			});
		}

		await ctx.db.patch(league._id, { memberCount: league.memberCount + 1 });

		return { status: "JOINED" as const, leagueId: league._id };
	},
});

export const approveRequest = mutation({
	args: { requestId: v.id("leagueJoinRequests") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);

		const request = await ctx.db.get(args.requestId);
		if (!request || request.status !== "PENDING") {
			throw new ConvexError("Request not found");
		}

		const league = await ctx.db.get(request.leagueId);
		if (!league || league.ownerId !== userId) {
			throw new ConvexError("Not authorized");
		}

		if (league.memberCount >= 50) {
			throw new ConvexError("League is full");
		}

		await ctx.db.patch(args.requestId, { status: "APPROVED" });

		const existing = await ctx.db
			.query("leagueMembers")
			.withIndex("by_league_user", (q) =>
				q.eq("leagueId", request.leagueId).eq("userId", request.userId),
			)
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				status: "ACTIVE",
				joinedAt: Date.now(),
			});
		} else {
			await ctx.db.insert("leagueMembers", {
				leagueId: request.leagueId,
				userId: request.userId,
				totalPoints: 0,
				exactScores: 0,
				correctResults: 0,
				status: "ACTIVE",
				joinedAt: Date.now(),
			});
		}

		await ctx.db.patch(league._id, { memberCount: league.memberCount + 1 });
	},
});

export const rejectRequest = mutation({
	args: { requestId: v.id("leagueJoinRequests") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);

		const request = await ctx.db.get(args.requestId);
		if (!request) throw new ConvexError("Request not found");

		const league = await ctx.db.get(request.leagueId);
		if (!league || league.ownerId !== userId) {
			throw new ConvexError("Not authorized");
		}

		await ctx.db.patch(args.requestId, { status: "REJECTED" });
	},
});

export const removeMember = mutation({
	args: { leagueId: v.id("leagues"), targetUserId: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);

		const league = await ctx.db.get(args.leagueId);
		if (!league || league.ownerId !== userId) {
			throw new ConvexError("Not authorized");
		}

		if (args.targetUserId === userId) {
			throw new ConvexError("Owner cannot remove themselves");
		}

		const membership = await ctx.db
			.query("leagueMembers")
			.withIndex("by_league_user", (q) =>
				q.eq("leagueId", args.leagueId).eq("userId", args.targetUserId),
			)
			.unique();

		if (!membership || membership.status !== "ACTIVE") {
			throw new ConvexError("Member not found");
		}

		await ctx.db.patch(membership._id, { status: "REMOVED" });
		await ctx.db.patch(league._id, {
			memberCount: Math.max(0, league.memberCount - 1),
		});
	},
});

export const leave = mutation({
	args: { leagueId: v.id("leagues") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);

		const league = await ctx.db.get(args.leagueId);
		if (!league) throw new ConvexError("League not found");

		if (league.ownerId === userId) {
			throw new ConvexError("Owner cannot leave the league");
		}

		const membership = await ctx.db
			.query("leagueMembers")
			.withIndex("by_league_user", (q) =>
				q.eq("leagueId", args.leagueId).eq("userId", userId),
			)
			.unique();

		if (!membership || membership.status !== "ACTIVE") {
			throw new ConvexError("Not a member of this league");
		}

		await ctx.db.patch(membership._id, { status: "REMOVED" });
		await ctx.db.patch(league._id, {
			memberCount: Math.max(0, league.memberCount - 1),
		});
	},
});

export const update = mutation({
	args: {
		leagueId: v.id("leagues"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		joinType: v.optional(v.union(v.literal("OPEN"), v.literal("MODERATED"))),
		rankingMode: v.optional(v.union(v.literal("POINTS"), v.literal("EXACTS"))),
		scoring: v.optional(
			v.union(
				v.null(),
				v.object({
					result: v.number(),
					goal: v.number(),
					exactBonus: v.number(),
				}),
			),
		),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);

		const league = await ctx.db.get(args.leagueId);
		if (!league || league.ownerId !== userId) {
			throw new ConvexError("Not authorized");
		}

		const patch: Record<string, unknown> = {};
		if (args.scoring) validateScoring(args.scoring);
		if (args.name) patch.name = args.name.trim();
		if (args.description !== undefined) patch.description = args.description;
		if (args.joinType) patch.joinType = args.joinType;
		if (args.rankingMode) patch.rankingMode = args.rankingMode;
		if (args.scoring === null) patch.scoring = undefined;
		else if (args.scoring) patch.scoring = args.scoring;

		await ctx.db.patch(args.leagueId, patch);

		// Liga moderada virou aberta: aprova quem já estava na fila (até o limite)
		let approvedRequests = 0;
		if (args.joinType === "OPEN" && league.joinType === "MODERATED") {
			const pending = await ctx.db
				.query("leagueJoinRequests")
				.withIndex("by_league_status", (q) =>
					q.eq("leagueId", args.leagueId).eq("status", "PENDING"),
				)
				.collect();

			let memberCount = league.memberCount;
			for (const request of pending) {
				if (memberCount >= 50) break;

				const existing = await ctx.db
					.query("leagueMembers")
					.withIndex("by_league_user", (q) =>
						q.eq("leagueId", args.leagueId).eq("userId", request.userId),
					)
					.unique();

				if (existing?.status === "ACTIVE") {
					await ctx.db.patch(request._id, { status: "APPROVED" });
					continue;
				}

				if (existing) {
					await ctx.db.patch(existing._id, {
						status: "ACTIVE",
						joinedAt: Date.now(),
					});
				} else {
					await ctx.db.insert("leagueMembers", {
						leagueId: args.leagueId,
						userId: request.userId,
						totalPoints: 0,
						exactScores: 0,
						correctResults: 0,
						status: "ACTIVE",
						joinedAt: Date.now(),
					});
				}
				await ctx.db.patch(request._id, { status: "APPROVED" });
				memberCount++;
				approvedRequests++;
			}
			if (approvedRequests > 0) {
				await ctx.db.patch(args.leagueId, { memberCount });
			}
		}

		return { approvedRequests };
	},
});

export const getById = query({
	args: { leagueId: v.id("leagues") },
	handler: async (ctx, args) => {
		const userId = await auth.getUserId(ctx);
		if (!userId) return null;
		const membership = await getActiveMembership(ctx, args.leagueId, userId);
		if (!membership) return null;
		return ctx.db.get(args.leagueId);
	},
});

export const getByInviteCode = query({
	args: { inviteCode: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("leagues")
			.withIndex("by_inviteCode", (q) =>
				q.eq("inviteCode", args.inviteCode.toUpperCase()),
			)
			.unique();
	},
});

export const getInvitePreview = query({
	args: { inviteCode: v.string() },
	handler: async (ctx, args) => {
		const league = await ctx.db
			.query("leagues")
			.withIndex("by_inviteCode", (q) =>
				q.eq("inviteCode", args.inviteCode.toUpperCase()),
			)
			.unique();
		if (!league) return null;

		const owner = await ctx.db.get(league.ownerId as Id<"users">);

		const userId = await auth.getUserId(ctx);
		let viewerStatus: "MEMBER" | "PENDING_REQUEST" | null = null;
		if (userId) {
			const membership = await getActiveMembership(ctx, league._id, userId);
			if (membership) {
				viewerStatus = "MEMBER";
			} else {
				const pendingRequest = await ctx.db
					.query("leagueJoinRequests")
					.withIndex("by_league_status", (q) =>
						q.eq("leagueId", league._id).eq("status", "PENDING"),
					)
					.filter((q) => q.eq(q.field("userId"), userId))
					.unique();
				if (pendingRequest) viewerStatus = "PENDING_REQUEST";
			}
		}

		return {
			leagueId: league._id,
			name: league.name,
			description: league.description ?? null,
			memberCount: league.memberCount,
			joinType: league.joinType,
			isFull: league.memberCount >= 50,
			ownerName: owner?.name ?? null,
			viewerStatus,
		};
	},
});

export const getRanking = query({
	args: { leagueId: v.id("leagues") },
	handler: async (ctx, args) => {
		const userId = await auth.getUserId(ctx);
		if (!userId) return [];
		const membership = await getActiveMembership(ctx, args.leagueId, userId);
		if (!membership) return [];

		const members = await ctx.db
			.query("leagueMembers")
			.withIndex("by_league_points", (q) => q.eq("leagueId", args.leagueId))
			.order("desc")
			.filter((q) => q.eq(q.field("status"), "ACTIVE"))
			.collect();

		const league = await ctx.db.get(args.leagueId);
		const mode = league?.rankingMode ?? "POINTS";
		members.sort(mode === "EXACTS" ? compareByExacts : compareByPoints);

		return Promise.all(
			members.map(async (member) => {
				const [user, recentPreds] = await Promise.all([
					ctx.db.get(member.userId as Id<"users">),
					ctx.db
						.query("predictions")
						.withIndex("by_user", (q) => q.eq("userId", member.userId))
						.collect(),
				]);

				const calculatedPreds = recentPreds.filter(
					(p) => p.calculatedAt !== undefined,
				);
				const lastPoints =
					calculatedPreds.length > 0
						? calculatedPreds.sort(
								(a, b) => (b.calculatedAt ?? 0) - (a.calculatedAt ?? 0),
							)[0]?.points
						: undefined;

				return {
					...member,
					name: user?.name ?? user?.email?.split("@")[0] ?? "Jogador",
					lastPoints,
				};
			}),
		);
	},
});

/**
 * Ranking do torneio ativo (liga de pontos corridos, sem mata-mata). Mantém
 * o formato de resposta (`overall`/`group`/`knockout`) por compatibilidade
 * com o front, mas `group` e `knockout` ficam sempre vazios — todos os
 * pontos entram em `overall`, recalculados com a pontuação da liga (mesma
 * fórmula do cálculo incremental) para respeitar pontuações personalizadas.
 */
export const getRankingByPhase = query({
	args: { leagueId: v.id("leagues") },
	handler: async (ctx, args) => {
		const userId = await auth.getUserId(ctx);
		if (!userId) return [];
		const membership = await getActiveMembership(ctx, args.leagueId, userId);
		if (!membership) return [];

		const league = await ctx.db.get(args.leagueId);
		const scoring = league?.scoring ?? DEFAULT_SCORING;

		const members = await ctx.db
			.query("leagueMembers")
			.withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
			.filter((q) => q.eq(q.field("status"), "ACTIVE"))
			.collect();

		function emptyBucket() {
			return { totalPoints: 0, exactScores: 0, correctResults: 0 };
		}

		const rows = await Promise.all(
			members.map(async (member) => {
				const [user, predictions] = await Promise.all([
					ctx.db.get(member.userId as Id<"users">),
					ctx.db
						.query("predictions")
						.withIndex("by_user", (q) => q.eq("userId", member.userId))
						.collect(),
				]);

				const overall = emptyBucket();

				for (const pred of predictions) {
					if (!pred.components || pred.calculatedAt === undefined) continue;
					const c = pred.components;
					const isExact = c.result && c.homeGoals && c.awayGoals;
					overall.totalPoints += pointsFrom(c, scoring);
					if (isExact) overall.exactScores += 1;
					if (c.result) overall.correctResults += 1;
				}

				return {
					_id: member._id,
					userId: member.userId,
					name: user?.name ?? user?.email?.split("@")[0] ?? "Jogador",
					overall,
					group: emptyBucket(),
					knockout: emptyBucket(),
				};
			}),
		);

		return rows;
	},
});

export const getUserLeagues = query({
	args: {},
	handler: async (ctx) => {
		const userId = await auth.getUserId(ctx);
		if (!userId) return [];

		const memberships = await ctx.db
			.query("leagueMembers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("status"), "ACTIVE"))
			.collect();

		const leagues = await Promise.all(
			memberships.map(async (m) => {
				const league = await ctx.db.get(m.leagueId);
				return league
					? { ...league, myPoints: m.totalPoints, myExacts: m.exactScores }
					: null;
			}),
		);

		return leagues.filter(Boolean);
	},
});

export const getPendingRequests = query({
	args: { leagueId: v.id("leagues") },
	handler: async (ctx, args) => {
		const userId = await auth.getUserId(ctx);
		if (!userId) return [];

		const league = await ctx.db.get(args.leagueId);
		if (!league || league.ownerId !== userId) return [];

		const requests = await ctx.db
			.query("leagueJoinRequests")
			.withIndex("by_league_status", (q) =>
				q.eq("leagueId", args.leagueId).eq("status", "PENDING"),
			)
			.collect();

		return Promise.all(
			requests.map(async (req) => {
				const user = await ctx.db.get(req.userId as Id<"users">);
				return {
					...req,
					name: user?.name ?? user?.email?.split("@")[0] ?? "Jogador",
				};
			}),
		);
	},
});
