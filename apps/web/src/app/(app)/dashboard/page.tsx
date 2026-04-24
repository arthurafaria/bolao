"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
	ArrowRight,
	CalendarClock,
	Shield,
	Sparkles,
	Target,
	Trophy,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";
import { MatchCard } from "@/components/match-card";
import { COMPETITIONS, useTournament } from "@/contexts/tournament-context";

function StatCard({
	label,
	value,
	sub,
	accent = false,
}: {
	label: string;
	value: string | number;
	sub?: string;
	accent?: boolean;
}) {
	return (
		<div
			className="rounded-[30px] p-5"
			style={{
				background: accent
					? "linear-gradient(180deg, var(--b-brand-12), color-mix(in oklch, var(--b-card) 92%, transparent))"
					: "color-mix(in oklch, var(--b-card) 88%, transparent)",
				boxShadow: "var(--b-shadow-card)",
				outline: `1px solid ${accent ? "var(--b-brand-25)" : "var(--b-border-sm)"}`,
			}}
		>
			<p
				className="mb-2 font-semibold text-xs uppercase tracking-[0.22em]"
				style={{ color: accent ? "var(--b-brand)" : "var(--b-text-3)" }}
			>
				{label}
			</p>
			<p
				className="font-black font-display text-5xl tabular-nums leading-none"
				style={{ color: accent ? "var(--b-brand-hi)" : "var(--b-text)" }}
			>
				{value}
			</p>
			{sub && (
				<p
					className="mt-3 text-sm leading-relaxed"
					style={{ color: "var(--b-text-3)" }}
				>
					{sub}
				</p>
			)}
		</div>
	);
}

function SectionHeader({
	title,
	href,
	linkLabel,
}: {
	title: string;
	href: Route;
	linkLabel: string;
}) {
	return (
		<div className="mb-5 flex items-center justify-between gap-3">
			<h2
				className="font-bold font-display text-2xl uppercase tracking-wide"
				style={{ color: "var(--b-text)" }}
			>
				{title}
			</h2>
			<Link
				href={href}
				className="inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 font-semibold text-sm transition-[transform,opacity] active:scale-[0.96]"
				style={{
					background: "var(--b-tint)",
					color: "var(--b-brand)",
				}}
			>
				{linkLabel}
				<ArrowRight className="h-4 w-4" />
			</Link>
		</div>
	);
}

function SkeletonCard() {
	return (
		<div
			className="h-[164px] animate-pulse rounded-[30px]"
			style={{ background: "var(--b-card)", boxShadow: "var(--b-shadow-card)" }}
		/>
	);
}

export default function DashboardPage() {
	const { tournament } = useTournament();
	const upcoming = useQuery(api.matches.getUpcoming, { limit: 5, tournament });
	const stats = useQuery(api.predictions.getStats);
	const leagues = useQuery(api.leagues.getUserLeagues);
	const allPredictions = useQuery(api.predictions.getUserPredictions);

	const predMap = useMemo(() => {
		if (!allPredictions) return undefined;
		return new Map(allPredictions.map((p) => [p.matchId as string, p]));
	}, [allPredictions]);

	const nextMatch = upcoming?.find(Boolean);
	const pendingPredictions =
		upcoming?.filter((match) => {
			if (!match) return false;
			return !predMap?.has(match._id);
		}).length ?? 0;

	return (
		<div className="space-y-8">
			<section
				className="overflow-hidden rounded-[38px] p-6 sm:p-7"
				style={{
					background:
						"linear-gradient(135deg, color-mix(in oklch, var(--b-brand) 12%, var(--b-card)), color-mix(in oklch, oklch(0.83 0.2 90) 7%, var(--b-card)))",
					boxShadow: "var(--b-shadow-float)",
					outline: "1px solid var(--b-border-sm)",
				}}
			>
				<div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
					<div>
						<div
							className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-semibold text-xs uppercase tracking-[0.22em]"
							style={{ background: "var(--b-card)", color: "var(--b-brand)" }}
						>
							<Sparkles className="h-4 w-4" />
							Painel principal
						</div>
						<h1
							className="mt-5 text-balance font-black font-display text-5xl uppercase leading-none tracking-tight sm:text-6xl"
							style={{ color: "var(--b-text)" }}
						>
							Início
						</h1>
						<p
							className="mt-3 text-sm uppercase tracking-[0.22em]"
							style={{ color: "var(--b-text-3)" }}
						>
							{COMPETITIONS[tournament].label}{" "}
							{COMPETITIONS[tournament].sublabel}
						</p>
						<p
							className="mt-5 max-w-2xl text-pretty text-base leading-relaxed sm:text-lg"
							style={{ color: "var(--b-text-2)" }}
						>
							Veja rapidamente seu momento no bolão, o que ainda falta palpitar
							e onde estão as melhores chances de somar pontos hoje.
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
						<div
							className="rounded-[30px] p-5"
							style={{
								background:
									"color-mix(in oklch, var(--b-card) 84%, transparent)",
								boxShadow: "var(--b-shadow-card)",
							}}
						>
							<div className="flex items-center gap-3">
								<div
									className="flex h-11 w-11 items-center justify-center rounded-2xl"
									style={{
										background: "var(--b-brand-10)",
										color: "var(--b-brand)",
									}}
								>
									<CalendarClock className="h-5 w-5" />
								</div>
								<div>
									<p
										className="text-xs uppercase tracking-[0.22em]"
										style={{ color: "var(--b-text-3)" }}
									>
										Próxima janela
									</p>
									<p
										className="mt-1 font-semibold"
										style={{ color: "var(--b-text)" }}
									>
										{nextMatch
											? new Date(nextMatch.utcDate).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													hour: "2-digit",
													minute: "2-digit",
												})
											: "Sem jogo agendado"}
									</p>
								</div>
							</div>
							<p
								className="mt-4 text-sm leading-relaxed"
								style={{ color: "var(--b-text-3)" }}
							>
								{nextMatch
									? `${pendingPredictions} jogo${pendingPredictions === 1 ? "" : "s"} dessa lista ainda sem palpite salvo.`
									: "Quando a agenda sair, seus próximos jogos aparecem aqui."}
							</p>
						</div>

						<div
							className="rounded-[30px] p-5"
							style={{
								background:
									"color-mix(in oklch, var(--b-card) 84%, transparent)",
								boxShadow: "var(--b-shadow-card)",
							}}
						>
							<div className="flex items-center gap-3">
								<div
									className="flex h-11 w-11 items-center justify-center rounded-2xl"
									style={{
										background: "var(--b-brand-10)",
										color: "var(--b-brand)",
									}}
								>
									<Target className="h-5 w-5" />
								</div>
								<div>
									<p
										className="text-xs uppercase tracking-[0.22em]"
										style={{ color: "var(--b-text-3)" }}
									>
										Status da rodada
									</p>
									<p
										className="mt-1 font-semibold"
										style={{ color: "var(--b-text)" }}
									>
										{(stats?.exact ?? 0) > 0
											? "Você já cravou placares"
											: "Hora de buscar os exatos"}
									</p>
								</div>
							</div>
							<p
								className="mt-4 text-sm leading-relaxed"
								style={{ color: "var(--b-text-3)" }}
							>
								{(stats?.total ?? 0) > 0
									? `Você já registrou ${stats?.total ?? 0} palpites até agora.`
									: "Seu primeiro palpite ainda está esperando por você."}
							</p>
						</div>
					</div>
				</div>
			</section>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Pontos"
					value={stats?.totalPoints ?? 0}
					sub="Total acumulado nas ligas e torneios"
					accent
				/>
				<StatCard
					label="Palpites"
					value={stats?.total ?? 0}
					sub="Jogos que ja receberam seu placar"
				/>
				<StatCard
					label="Exatos"
					value={stats?.exact ?? 0}
					sub="Placar cravado com pontuação máxima"
				/>
				<StatCard
					label="Ligas"
					value={leagues?.length ?? 0}
					sub="Grupos em que você está competindo"
				/>
			</div>

			<div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
				<div>
					<SectionHeader
						title="Próximos jogos"
						href="/predictions"
						linkLabel="Ver todos"
					/>

					{upcoming === undefined ? (
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<SkeletonCard key={i} />
							))}
						</div>
					) : upcoming.length === 0 ? (
						<div
							className="rounded-[32px] p-10 text-center"
							style={{
								background: "var(--b-card)",
								boxShadow: "var(--b-shadow-card)",
								outline: "1px solid var(--b-border-sm)",
							}}
						>
							<Shield
								className="mx-auto mb-3 h-9 w-9 opacity-40"
								style={{ color: "var(--b-brand)" }}
							/>
							<p style={{ color: "var(--b-text-3)" }}>
								Nenhum jogo agendado ainda
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{upcoming.map(
								(m) =>
									m && (
										<MatchCard
											key={m._id}
											match={m}
											prediction={
												predMap ? (predMap.get(m._id) ?? null) : undefined
											}
										/>
									),
							)}
						</div>
					)}
				</div>

				<div className="space-y-8">
					<section>
						<SectionHeader
							title="Leitura rápida"
							href="/profile"
							linkLabel="Ver perfil"
						/>
						<div className="grid gap-4">
							{[
								{
									icon: Trophy,
									title: "Total de pontos",
									value: `${stats?.totalPoints ?? 0} pts`,
									copy: "Seu saldo geral no bolão até aqui.",
								},
								{
									icon: Target,
									title: "Precisão",
									value:
										(stats?.total ?? 0) > 0
											? `${Math.round(((stats?.exact ?? 0) / (stats?.total ?? 1)) * 100)}%`
											: "0%",
									copy: "Percentual de palpites com placar exato.",
								},
							].map(({ icon: Icon, title, value, copy }) => (
								<div
									key={title}
									className="rounded-[30px] p-5"
									style={{
										background: "var(--b-card)",
										boxShadow: "var(--b-shadow-card)",
										outline: "1px solid var(--b-border-sm)",
									}}
								>
									<div className="flex items-center gap-3">
										<div
											className="flex h-11 w-11 items-center justify-center rounded-2xl"
											style={{
												background: "var(--b-brand-10)",
												color: "var(--b-brand)",
											}}
										>
											<Icon className="h-5 w-5" />
										</div>
										<div>
											<p
												className="text-xs uppercase tracking-[0.22em]"
												style={{ color: "var(--b-text-3)" }}
											>
												{title}
											</p>
											<p
												className="mt-1 font-display text-3xl tabular-nums"
												style={{ color: "var(--b-text)", fontWeight: 800 }}
											>
												{value}
											</p>
										</div>
									</div>
									<p
										className="mt-4 text-sm leading-relaxed"
										style={{ color: "var(--b-text-3)" }}
									>
										{copy}
									</p>
								</div>
							))}
						</div>
					</section>

					{leagues && leagues.length > 0 && (
						<section>
							<SectionHeader
								title="Minhas ligas"
								href="/leagues"
								linkLabel="Ver todas"
							/>
							<div className="space-y-3">
								{leagues.map(
									(league) =>
										league && (
											<Link
												key={league._id}
												href={`/leagues/${league._id}` as `/leagues/${string}`}
											>
												<div
													className="flex items-center justify-between rounded-[30px] px-5 py-4 transition-[transform,filter] hover:brightness-105 active:scale-[0.99]"
													style={{
														background:
															"color-mix(in oklch, var(--b-card) 90%, transparent)",
														boxShadow: "var(--b-shadow-card)",
														outline: "1px solid var(--b-border-sm)",
													}}
												>
													<div className="flex min-w-0 items-center gap-4">
														<div
															className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
															style={{ background: "var(--b-brand-10)" }}
														>
															<Trophy
																className="h-5 w-5"
																style={{ color: "var(--b-brand)" }}
															/>
														</div>
														<div className="min-w-0">
															<p
																className="truncate font-semibold"
																style={{ color: "var(--b-text)" }}
															>
																{league.name}
															</p>
															<p
																className="text-xs uppercase tracking-[0.18em]"
																style={{ color: "var(--b-text-3)" }}
															>
																{league.memberCount} membros
															</p>
														</div>
													</div>
													<div className="text-right">
														<p
															className="font-display text-3xl tabular-nums leading-none"
															style={{
																color: "var(--b-brand)",
																fontWeight: 800,
															}}
														>
															{league.myPoints}
														</p>
														<p
															className="mt-1 text-xs uppercase tracking-[0.18em]"
															style={{ color: "var(--b-text-3)" }}
														>
															pontos
														</p>
													</div>
												</div>
											</Link>
										),
								)}
							</div>
						</section>
					)}
				</div>
			</div>
		</div>
	);
}
