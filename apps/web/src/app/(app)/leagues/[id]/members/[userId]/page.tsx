"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

import { MatchCard } from "@/components/match-card";
import { useTournament } from "@/contexts/tournament-context";
import { groupByRound } from "@/lib/match-grouping";
import { getPointsTier } from "@/lib/points-palette";

export default function MemberProfilePage({
	params,
}: {
	params: Promise<{ id: string; userId: string }>;
}) {
	const { id, userId } = use(params);
	const leagueId = id as Id<"leagues">;
	const { tournament } = useTournament();

	const ranking = useQuery(api.leagues.getRanking, { leagueId });
	const league = useQuery(api.leagues.getById, { leagueId });
	const lockedPredictions = useQuery(
		api.predictions.getMemberLockedPredictions,
		{ leagueId, memberUserId: userId, tournament },
	);
	const currentUser = useQuery(api.auth.getCurrentUser);

	const member = ranking?.find((m) => m.userId === userId);
	const position = ranking ? ranking.findIndex((m) => m.userId === userId) + 1 : 0;
	const isCurrentUser = currentUser?._id === userId;

	if (lockedPredictions === undefined || ranking === undefined) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-24 rounded-2xl" />
				<Skeleton className="h-40 rounded-2xl" />
				<Skeleton className="h-40 rounded-2xl" />
			</div>
		);
	}

	if (lockedPredictions === null || !member) {
		return (
			<div className="space-y-4">
				<Link
					href={`/leagues/${id}`}
					className="inline-flex items-center gap-1.5 text-sm"
					style={{ color: "var(--b-text-3)" }}
				>
					<ArrowLeft className="h-4 w-4" />
					Voltar para a liga
				</Link>
				<div
					className="rounded-2xl p-12 text-center"
					style={{
						background: "var(--b-card)",
						border: "1px solid var(--b-border)",
					}}
				>
					<p style={{ color: "var(--b-text-3)" }}>
						Membro não encontrado ou sem acesso
					</p>
				</div>
			</div>
		);
	}

	const grouped = groupByRound(lockedPredictions.map((lp) => lp.match)).sort(
		([, , a], [, , b]) =>
			new Date(b[0].utcDate).getTime() - new Date(a[0].utcDate).getTime(),
	);

	const predMap = new Map(
		lockedPredictions.map((lp) => [lp.match._id as string, lp.prediction]),
	);

	return (
		<div className="space-y-5">
			<Link
				href={`/leagues/${id}`}
				className="inline-flex items-center gap-1.5 text-sm"
				style={{ color: "var(--b-text-3)" }}
			>
				<ArrowLeft className="h-4 w-4" />
				{league?.name ?? "Ranking"}
			</Link>

			{/* Member header */}
			<div
				className="rounded-2xl p-5"
				style={{
					background: "var(--b-card)",
					border: "1px solid var(--b-border)",
				}}
			>
				<div className="flex items-center gap-4">
					<div
						className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-black font-display text-xl"
						style={{ background: "var(--b-brand-12)", color: "var(--b-brand)" }}
					>
						{member.name.slice(0, 2).toUpperCase()}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h1
								className="truncate font-black font-display text-xl uppercase"
								style={{ color: "var(--b-text)" }}
							>
								{member.name}
							</h1>
							{isCurrentUser && (
								<span
									className="shrink-0 rounded-full px-2 py-0.5 font-bold text-xs"
									style={{
										background: "var(--b-brand-10)",
										color: "var(--b-brand)",
									}}
								>
									você
								</span>
							)}
						</div>
						<p className="text-sm" style={{ color: "var(--b-text-3)" }}>
							{position}º lugar · {member.exactScores} exatos ·{" "}
							{member.correctResults} acertos
						</p>
					</div>
					<div className="shrink-0 text-right">
						<p
							className="font-black font-display text-2xl tabular-nums"
							style={{ color: "var(--b-text)" }}
						>
							{member.totalPoints}
						</p>
						<p className="text-xs" style={{ color: "var(--b-text-3)" }}>
							pontos
						</p>
						{member.lastPoints != null && (
							<span
								className="mt-1 inline-block rounded-full px-1.5 py-px font-bold text-[10px] tabular-nums"
								style={{
									background: getPointsTier(member.lastPoints).bg,
									color: getPointsTier(member.lastPoints).color,
								}}
							>
								{getPointsTier(member.lastPoints).label} último
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Locked predictions */}
			{lockedPredictions.length === 0 ? (
				<div
					className="rounded-2xl p-12 text-center"
					style={{
						background: "var(--b-card)",
						border: "1px solid var(--b-border)",
					}}
				>
					<p style={{ color: "var(--b-text-3)" }}>
						Esse membro ainda não tem palpites bloqueados nesse torneio.
					</p>
				</div>
			) : (
				<div className="space-y-8">
					{grouped.map(([key, label, roundMatches]) => (
						<div key={key}>
							<div className="mb-3 flex items-center gap-3">
								<h2
									className="font-bold font-display text-sm uppercase tracking-widest"
									style={{ color: "var(--b-brand)" }}
								>
									{label}
								</h2>
								<div
									className="h-px flex-1"
									style={{ background: "var(--b-border)" }}
								/>
								<span
									className="font-medium text-xs"
									style={{ color: "var(--b-text-4)" }}
								>
									{roundMatches.length}{" "}
									{roundMatches.length === 1 ? "jogo" : "jogos"}
								</span>
							</div>
							<div className="space-y-3">
								{roundMatches.map((m) => (
									<MatchCard
										key={m._id}
										match={m}
										prediction={predMap.get(m._id as string) ?? null}
										readOnly
									/>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
