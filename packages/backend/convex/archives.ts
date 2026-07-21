import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, query } from "./_generated/server";
import { auth } from "./auth";
import { compareByPoints, type RankableMember } from "./lib/ranking";

// Membro pronto pra ser arquivado: métricas de ranking + identidade.
export interface ArchivableMember extends RankableMember {
	userId: string;
	name: string;
}

export interface RankedMember extends ArchivableMember {
	rank: number;
}

/**
 * Ordena membros pelo comparador canônico de ranking (pontos → cravadas →
 * resultados certos) e atribui `rank` 1-based. Função pura — sem I/O — pra
 * ser testável isoladamente do banco.
 */
export function rankMembers(members: ArchivableMember[]): RankedMember[] {
	return [...members]
		.sort(compareByPoints)
		.map((member, idx) => ({ ...member, rank: idx + 1 }));
}

/**
 * Tira uma foto do ranking final de cada liga num torneio (ex.: Copa 2026)
 * e guarda em `seasonArchives`. Idempotente: reexecutar substitui o
 * arquivo anterior da mesma liga/torneio em vez de duplicar.
 */
export const archiveStandings = internalMutation({
	args: { tournament: v.string() },
	handler: async (
		ctx,
		args,
	): Promise<{ archivedLeagues: number; archivedMembers: number }> => {
		const leagues = await ctx.db.query("leagues").collect();

		let archivedLeagues = 0;
		let archivedMembers = 0;

		for (const league of leagues) {
			const members = await ctx.db
				.query("leagueMembers")
				.withIndex("by_league", (q) => q.eq("leagueId", league._id))
				.filter((q) => q.eq(q.field("status"), "ACTIVE"))
				.collect();

			const resolved: ArchivableMember[] = await Promise.all(
				members.map(async (member) => {
					const user = await ctx.db.get(member.userId as Id<"users">);
					return {
						userId: member.userId,
						name: user?.name ?? user?.email?.split("@")[0] ?? "Jogador",
						totalPoints: member.totalPoints,
						exactScores: member.exactScores,
						correctResults: member.correctResults,
					};
				}),
			);

			const standings = rankMembers(resolved);

			// Idempotência: remove qualquer arquivo anterior da mesma liga/torneio
			// antes de inserir o novo, pra reexecutar substituir em vez de duplicar.
			const existing = await ctx.db
				.query("seasonArchives")
				.withIndex("by_tournament_league", (q) =>
					q.eq("tournament", args.tournament).eq("leagueId", league._id),
				)
				.collect();
			for (const row of existing) {
				await ctx.db.delete(row._id);
			}

			await ctx.db.insert("seasonArchives", {
				tournament: args.tournament,
				leagueId: league._id,
				leagueName: league.name,
				capturedAt: Date.now(),
				standings,
			});

			archivedLeagues++;
			archivedMembers += standings.length;
		}

		return { archivedLeagues, archivedMembers };
	},
});

// Wrapper admin-guardado — mesmo formato de guarda usado em
// predictions.adminResetAllPoints: auth.getUserId → getAdminUser → runMutation.
export const adminArchiveStandings = action({
	args: { tournament: v.string() },
	handler: async (
		ctx,
		args,
	): Promise<{ archivedLeagues: number; archivedMembers: number }> => {
		const userId = await auth.getUserId(ctx);
		if (!userId) throw new ConvexError("Unauthorized");
		const adminCheck = await ctx.runQuery(internal.predictions.getAdminUser, {
			userId,
		});
		if (!adminCheck?.isAdmin) throw new ConvexError("Unauthorized");
		return ctx.runMutation(internal.archives.archiveStandings, args);
	},
});

/**
 * Leitura pública do arquivo de um torneio — histórico já visível aos
 * membros das ligas (nomes + pontos), então sem gate de auth.
 */
export const getArchive = query({
	args: { tournament: v.string() },
	handler: async (ctx, args) => {
		const rows = await ctx.db
			.query("seasonArchives")
			.withIndex("by_tournament", (q) => q.eq("tournament", args.tournament))
			.collect();

		return rows
			.sort((a, b) => a.leagueName.localeCompare(b.leagueName))
			.map((row) => ({
				leagueId: row.leagueId,
				leagueName: row.leagueName,
				capturedAt: row.capturedAt,
				standings: row.standings,
			}));
	},
});
