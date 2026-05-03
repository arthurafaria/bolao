"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { Tag } from "@bolao/ui/components/tag";
import { useQuery } from "convex/react";
import { ArrowLeft, Crown, Trophy } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { use, useMemo } from "react";

import { Scorecard } from "@/components/match/scorecard";
import { useTournament } from "@/contexts/tournament-context";
import { groupByRound } from "@/lib/match-grouping";
import { getPointsTier } from "@/lib/points-palette";

function avatarColor(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = seed.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash) % 360;
	return `oklch(0.62 0.16 ${hue})`;
}

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
	const position = ranking
		? ranking.findIndex((m) => m.userId === userId) + 1
		: 0;
	const isCurrentUser = currentUser?._id === userId;

	const isLoading =
		lockedPredictions === undefined ||
		ranking === undefined ||
		currentUser === undefined;

	const grouped = useMemo(() => {
		if (!lockedPredictions) return [];
		return groupByRound(lockedPredictions.map((lp) => lp.match))
			.filter(([, , matches]) => matches.length > 0)
			.sort(
				([, , a], [, , b]) =>
					new Date(b[0].utcDate).getTime() - new Date(a[0].utcDate).getTime(),
			);
	}, [lockedPredictions]);

	const predMap = useMemo(() => {
		if (!lockedPredictions) return new Map();
		return new Map(
			lockedPredictions.map((lp) => [lp.match._id as string, lp.prediction]),
		);
	}, [lockedPredictions]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-32 rounded-[28px]" />
				<Skeleton className="h-40 rounded-[24px]" />
				<Skeleton className="h-40 rounded-[24px]" />
			</div>
		);
	}

	if (lockedPredictions === null) {
		return (
			<div className="space-y-5">
				<BackLink href={`/leagues/${id}` as Route} label={league?.name ?? "Voltar"} />
				<div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-[var(--b-border-md)] bg-[var(--b-card)] p-12 text-center">
					<p className="text-[var(--b-text-3)] text-sm">
						Você precisa ser membro ativo desta liga pra ver os palpites.
					</p>
				</div>
			</div>
		);
	}

	if (!member) {
		return (
			<div className="space-y-5">
				<BackLink href={`/leagues/${id}` as Route} label={league?.name ?? "Voltar"} />
				<div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-[var(--b-border-md)] bg-[var(--b-card)] p-12 text-center">
					<p className="text-[var(--b-text-3)] text-sm">
						Membro não encontrado nessa liga.
					</p>
				</div>
			</div>
		);
	}

	const podiumColor =
		position === 1
			? "var(--b-gold)"
			: position === 2
				? "var(--b-silver)"
				: position === 3
					? "var(--b-bronze)"
					: undefined;

	return (
		<div className="space-y-7 animate-fade-in">
			<BackLink href={`/leagues/${id}` as Route} label={league?.name ?? "Liga"} />

			{/* Member hero */}
			<section className="rounded-[28px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-5 shadow-[var(--b-shadow-card-soft)] sm:p-6">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
					{/* Avatar + position */}
					<div className="relative">
						<div
							className="flex h-20 w-20 items-center justify-center rounded-full font-black font-display text-2xl text-white shadow-[var(--b-shadow-brand-md)]"
							style={{ background: avatarColor(member.name) }}
						>
							{member.name.slice(0, 2).toUpperCase()}
						</div>
						{position === 1 && (
							<Crown
								className="-top-3 -right-2 absolute h-6 w-6 animate-float"
								style={{
									color: "var(--b-gold)",
									filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
								}}
							/>
						)}
					</div>

					{/* Identidade */}
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<span className="text-eyebrow text-[var(--b-brand)]">
							{position}º lugar na {league?.name ?? "liga"}
						</span>
						<div className="flex items-center gap-2">
							<h1 className="line-clamp-1 font-black font-display text-3xl uppercase leading-[0.95] tracking-tight text-[var(--b-text)] sm:text-4xl">
								{member.name}
							</h1>
							{isCurrentUser && (
								<Tag variant="brand">você</Tag>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-3 text-[var(--b-text-3)] text-xs">
							<span>
								<strong className="font-bold text-[var(--b-text)]">
									{member.exactScores}
								</strong>{" "}
								exatos
							</span>
							<span>·</span>
							<span>
								<strong className="font-bold text-[var(--b-text)]">
									{member.correctResults}
								</strong>{" "}
								acertos
							</span>
							{member.lastPoints != null && (
								<>
									<span>·</span>
									<span
										className="rounded-full px-2 py-0.5 font-bold text-[10px] tabular-nums"
										style={{
											background: getPointsTier(member.lastPoints).bg,
											color: getPointsTier(member.lastPoints).color,
										}}
									>
										{getPointsTier(member.lastPoints).label} no último
									</span>
								</>
							)}
						</div>
					</div>

					{/* Pontos grandes */}
					<div
						className="flex flex-col items-end self-start sm:self-auto"
						style={
							podiumColor
								? { borderRight: `3px solid ${podiumColor}`, paddingRight: 12 }
								: undefined
						}
					>
						<span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
							Pontos
						</span>
						<span
							className="font-black font-display text-5xl tabular-nums leading-none sm:text-6xl"
							style={{ color: podiumColor ?? "var(--b-text)" }}
						>
							{member.totalPoints}
						</span>
					</div>
				</div>
			</section>

			{/* Lista de palpites bloqueados */}
			<section>
				<header className="mb-4 flex items-end justify-between gap-3">
					<div>
						<span className="text-eyebrow text-[var(--b-text-3)]">
							Palpites bloqueados
						</span>
						<h2 className="font-black font-display text-2xl uppercase tracking-tight text-[var(--b-text)]">
							Histórico
						</h2>
					</div>
				</header>

				{lockedPredictions.length === 0 ? (
					<div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-[var(--b-border-md)] bg-[var(--b-card)] p-12 text-center">
						<Trophy className="h-10 w-10 text-[var(--b-text-4)]" />
						<p className="font-bold font-display text-[var(--b-text)] text-base uppercase tracking-tight">
							Sem palpites bloqueados
						</p>
						<p className="max-w-md text-[var(--b-text-3)] text-sm leading-relaxed">
							Quando os jogos começarem a fechar, os palpites desse membro
							aparecem aqui.
						</p>
					</div>
				) : (
					<div className="space-y-8">
						{grouped.map(([key, label, roundMatches]) => (
							<div key={key} className="space-y-3">
								<header className="flex items-center gap-3">
									<h3 className="font-black font-display text-sm uppercase tracking-widest text-[var(--b-brand)]">
										{label}
									</h3>
									<div
										aria-hidden
										className="h-px flex-1"
										style={{ background: "var(--b-border)" }}
									/>
									<span className="font-mono text-[var(--b-text-3)] text-xs tabular-nums">
										{roundMatches.length}{" "}
										{roundMatches.length === 1 ? "jogo" : "jogos"}
									</span>
								</header>
								<div
									className="stagger-children space-y-3"
									style={{ ["--d" as string]: "50ms" }}
								>
									{roundMatches.map((m, i) => (
										<div key={m._id} style={{ ["--i" as string]: i }}>
											<Scorecard
												match={m}
												prediction={predMap.get(m._id as string) ?? null}
												readOnly
											/>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}

function BackLink({ href, label }: { href: Route; label: string }) {
	return (
		<Link
			href={href}
			className="inline-flex items-center gap-1.5 text-[var(--b-text-3)] text-xs uppercase tracking-wider transition-colors hover:text-[var(--b-brand)]"
		>
			<ArrowLeft className="h-3.5 w-3.5" />
			{label}
		</Link>
	);
}
