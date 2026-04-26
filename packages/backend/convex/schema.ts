import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	...authTables,

	teams: defineTable({
		name: v.string(),
		shortName: v.string(),
		crest: v.string(),
		nationality: v.string(),
		apiId: v.number(),
	}).index("by_apiId", ["apiId"]),

	matches: defineTable({
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
		apiId: v.number(),
		tournament: v.string(),
	})
		.index("by_apiId", ["apiId"])
		.index("by_status", ["status"])
		.index("by_utcDate", ["utcDate"])
		.index("by_tournament_stage", ["tournament", "stage"])
		.index("by_tournament_date", ["tournament", "utcDate"]),

	predictions: defineTable({
		userId: v.string(),
		matchId: v.id("matches"),
		predictedHome: v.number(),
		predictedAway: v.number(),
		points: v.optional(v.number()),
		calculatedAt: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_match", ["matchId"])
		.index("by_user_match", ["userId", "matchId"]),

	leagues: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		ownerId: v.string(),
		joinType: v.union(v.literal("OPEN"), v.literal("MODERATED")),
		inviteCode: v.string(),
		memberCount: v.number(),
	})
		.index("by_inviteCode", ["inviteCode"])
		.index("by_owner", ["ownerId"]),

	leagueMembers: defineTable({
		leagueId: v.id("leagues"),
		userId: v.string(),
		totalPoints: v.number(),
		exactScores: v.number(),
		correctResults: v.number(),
		status: v.union(
			v.literal("ACTIVE"),
			v.literal("PENDING"),
			v.literal("REMOVED"),
		),
		joinedAt: v.number(),
	})
		.index("by_league", ["leagueId"])
		.index("by_user", ["userId"])
		.index("by_league_user", ["leagueId", "userId"])
		.index("by_league_points", ["leagueId", "totalPoints"]),

	leagueJoinRequests: defineTable({
		leagueId: v.id("leagues"),
		userId: v.string(),
		requestedAt: v.number(),
		status: v.union(
			v.literal("PENDING"),
			v.literal("APPROVED"),
			v.literal("REJECTED"),
		),
	})
		.index("by_league_status", ["leagueId", "status"])
		.index("by_user", ["userId"]),
});
