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
		tla: v.optional(v.string()),
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
		// Placar dos 90 minutos (regular time). É o que pontua os palpites —
		// no mata-mata, prorrogação e pênaltis NÃO contam.
		homeScore: v.optional(v.number()),
		awayScore: v.optional(v.number()),
		// Como o jogo terminou: REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT.
		// Usado só para exibir uma etiqueta no card (não afeta a pontuação).
		duration: v.optional(v.string()),
		// Vencedor segundo a API: HOME_TEAM | AWAY_TEAM | DRAW. Usado para
		// rotular quem passou na prorrogação/pênaltis.
		winner: v.optional(v.string()),
		stage: v.string(),
		group: v.optional(v.string()),
		matchday: v.optional(v.number()),
		venue: v.optional(v.string()),
		apiId: v.number(),
		tournament: v.string(),
		reminderScheduledAt: v.optional(v.number()),
		scoreAlertSentAt: v.optional(v.number()),
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
		components: v.optional(
			v.object({
				result: v.boolean(),
				homeGoals: v.boolean(),
				awayGoals: v.boolean(),
			}),
		),
		// Palpite de desempate (só mata-mata, só quando o placar palpitado empata):
		// quem o usuário acha que avança e como. O método é sabor visual — só o
		// vencedor pontua. Vale +2 pts se tieWinner == match.winner.
		tieWinner: v.optional(v.union(v.literal("HOME"), v.literal("AWAY"))),
		tieMethod: v.optional(v.union(v.literal("ET"), v.literal("PEN"))),
		// Bônus concedido (0 ou 2). Guardado separado de `points` para não poluir
		// a detecção de cravada (points === 10) usada no app.
		tieBonus: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_match", ["matchId"])
		.index("by_user_match", ["userId", "matchId"]),

	leagues: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		ownerId: v.string(),
		joinType: v.union(v.literal("OPEN"), v.literal("MODERATED")),
		rankingMode: v.optional(v.union(v.literal("POINTS"), v.literal("EXACTS"))),
		scoring: v.optional(
			v.object({
				result: v.number(),
				goal: v.number(),
				exactBonus: v.number(),
			}),
		),
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
