"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import {
	compareByExacts,
	compareByPoints,
} from "@bolao/backend/convex/lib/ranking";
import { Button } from "@bolao/ui/components/button";
import { PillTabs } from "@bolao/ui/components/pill-tabs";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@bolao/ui/components/sheet";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { Tag } from "@bolao/ui/components/tag";
import { useQuery } from "convex/react";
import {
	ArrowLeft,
	Calendar,
	Check,
	ChevronLeft,
	ChevronRight,
	Copy,
	Crown,
	Globe,
	Settings,
	Share2,
	Star,
	Trophy,
	Users,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Podium, type PodiumEntry } from "@/components/leagues/podium";
import { RankingRow } from "@/components/leagues/ranking-row";
import type { ShareEntry } from "@/components/leagues/share-ranking-card";
import { ShareRankingSheet } from "@/components/leagues/share-ranking-sheet";
import { useTournament } from "@/contexts/tournament-context";

const ROUND_ACCENT = "var(--b-brand)";
const OVERALL_ACCENT = "var(--b-brand)";

export default function LeagueDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const leagueId = id as Id<"leagues">;

	const league = useQuery(api.leagues.getById, { leagueId });
	const ranking = useQuery(api.leagues.getRankingByPhase, { leagueId });
	const currentUser = useQuery(api.auth.getCurrentUser);
	const { tournament } = useTournament();
	const currentRoundQuery = useQuery(api.matches.getCurrentRound, {
		tournament,
	});

	const [rankingTab, setRankingTab] = useState<"POINTS" | "EXACTS">("POINTS");

	// Visão do ranking: geral (por fase, já existente) ou por rodada (plano
	// 005). Suporta deep-link vindo do recap do dashboard
	// (?view=rodada&matchday=N) sem depender de useSearchParams (evita exigir
	// Suspense boundary nesta página client).
	const [view, setView] = useState<"GERAL" | "RODADA">("GERAL");
	const [selectedRound, setSelectedRound] = useState<number | null>(null);
	useEffect(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		if (params.get("view") === "rodada") setView("RODADA");
		const md = params.get("matchday");
		if (md) {
			const parsed = Number(md);
			if (!Number.isNaN(parsed)) setSelectedRound(parsed);
		}
	}, []);

	const minRound = currentRoundQuery?.min ?? null;
	const maxRound = currentRoundQuery?.max ?? null;
	useEffect(() => {
		if (selectedRound === null && currentRoundQuery?.current != null) {
			setSelectedRound(currentRoundQuery.current);
		}
	}, [currentRoundQuery, selectedRound]);
	const activeRound = selectedRound ?? currentRoundQuery?.current ?? null;
	const canGoPrevRound =
		activeRound != null && minRound != null && activeRound > minRound;
	const canGoNextRound =
		activeRound != null && maxRound != null && activeRound < maxRound;

	const roundRanking = useQuery(
		api.leagues.getRoundRanking,
		activeRound != null ? { leagueId, matchday: activeRound } : "skip",
	);

	const roundPodiumEntries: PodiumEntry[] = useMemo(() => {
		if (!roundRanking || roundRanking.length === 0) return [];
		return roundRanking.slice(0, 3).map((m, idx) => ({
			position: (idx + 1) as 1 | 2 | 3,
			name: m.name,
			points: m.totalPoints,
		}));
	}, [roundRanking]);

	const roundShareEntries: ShareEntry[] = useMemo(
		() =>
			(roundRanking ?? []).slice(0, 8).map((m, idx) => ({
				position: idx + 1,
				name: m.name,
				points: m.totalPoints,
				exacts: m.exactScores,
			})),
		[roundRanking],
	);

	const roundHasScores = useMemo(
		() =>
			(roundRanking ?? []).some((m) => m.totalPoints > 0 || m.exactScores > 0),
		[roundRanking],
	);

	const rankingMode = league?.rankingMode ?? "POINTS";
	const activeTab = rankingMode === "EXACTS" ? rankingTab : "POINTS";

	// Ranking geral: sempre lê o bucket "overall" (grupos/mata-mata não existem mais).
	const sortedRanking = useMemo(() => {
		if (!ranking) return [];
		return ranking
			.map((m) => ({
				_id: m._id,
				userId: m.userId,
				name: m.name,
				totalPoints: m.overall.totalPoints,
				exactScores: m.overall.exactScores,
				correctResults: m.overall.correctResults,
			}))
			.sort(activeTab === "EXACTS" ? compareByExacts : compareByPoints);
	}, [ranking, activeTab]);

	const hasScores = useMemo(
		() => sortedRanking.some((m) => m.totalPoints > 0 || m.exactScores > 0),
		[sortedRanking],
	);

	const podiumEntries: PodiumEntry[] = useMemo(() => {
		if (!sortedRanking.length) return [];
		return sortedRanking.slice(0, 3).map((m, idx) => ({
			position: (idx + 1) as 1 | 2 | 3,
			name: m.name,
			points: activeTab === "EXACTS" ? m.exactScores : m.totalPoints,
		}));
	}, [sortedRanking, activeTab]);

	const shareEntries: ShareEntry[] = useMemo(
		() =>
			sortedRanking.slice(0, 8).map((m, idx) => ({
				position: idx + 1,
				name: m.name,
				points: m.totalPoints,
				exacts: m.exactScores,
			})),
		[sortedRanking],
	);

	if (league === undefined) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-12 w-64 rounded-md" />
				<Skeleton className="h-48 rounded-[28px]" />
				<Skeleton className="h-72 rounded-[28px]" />
			</div>
		);
	}

	if (league === null) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-[28px] border border-[var(--b-border-md)] border-dashed bg-[var(--b-card)] p-12 text-center">
				<Trophy className="h-10 w-10 text-[var(--b-text-4)]" />
				<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
					Liga não encontrada
				</p>
				<p className="text-[var(--b-text-3)] text-sm">
					Talvez você não seja mais membro dessa liga.
				</p>
				<Link href="/leagues">
					<Button variant="action" size="default">
						<ArrowLeft className="h-4 w-4" />
						Voltar pras minhas ligas
					</Button>
				</Link>
			</div>
		);
	}

	const isOwner = currentUser?._id === league.ownerId;

	return (
		<div className="animate-fade-in space-y-7">
			{/* Back link */}
			<Link
				href="/leagues"
				className="inline-flex items-center gap-1.5 text-[var(--b-text-3)] text-xs uppercase tracking-wider transition-colors hover:text-[var(--b-brand)]"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				Todas as ligas
			</Link>

			{/* Header da liga */}
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex flex-col gap-2">
					<span className="text-[var(--b-brand)] text-eyebrow">
						Liga · {league.joinType === "OPEN" ? "Aberta" : "Moderada"}
					</span>
					<h1 className="font-black font-display text-4xl text-[var(--b-text)] uppercase leading-[0.9] tracking-tight sm:text-5xl">
						{league.name}
					</h1>
					{league.description && (
						<p className="max-w-2xl text-[var(--b-text-3)] text-sm leading-relaxed">
							{league.description}
						</p>
					)}
					<div className="mt-1 flex items-center gap-3 text-[var(--b-text-3)] text-sm">
						<span className="inline-flex items-center gap-1.5">
							<Users className="h-4 w-4" />
							<span className="font-mono tabular-nums">
								{league.memberCount}
							</span>{" "}
							membros
						</span>
						<Tag variant={rankingMode === "POINTS" ? "brand" : "muted"}>
							Ranking:{" "}
							{rankingMode === "POINTS" ? "mais pontos" : "mais cravadas"}
						</Tag>
						{league.scoring ? (
							<Tag variant="warning">
								Pontuação personalizada: {league.scoring.result} /{" "}
								{league.scoring.goal} / {league.scoring.exactBonus}
							</Tag>
						) : null}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<InviteSheet
						inviteCode={league.inviteCode}
						leagueName={league.name}
					/>
					{isOwner && (
						<Link href={`/leagues/${id}/manage` as Route}>
							<Button variant="outline" size="default">
								<Settings className="h-4 w-4" />
								Gerenciar
							</Button>
						</Link>
					)}
				</div>
			</header>

			{/* Ranking e pódio */}
			{ranking === undefined ? (
				<Skeleton className="h-64 rounded-[28px]" />
			) : ranking.length === 0 ? (
				<div className="flex flex-col items-center gap-3 rounded-[28px] border border-[var(--b-border-md)] border-dashed bg-[var(--b-card)] p-12 text-center">
					<Trophy className="h-10 w-10 text-[var(--b-text-4)]" />
					<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
						Aguardando os primeiros pontos
					</p>
					<p className="max-w-md text-[var(--b-text-3)] text-sm leading-relaxed">
						Quando os palpites começarem a virar pontos, o pódio dessa liga
						aparece aqui.
					</p>
				</div>
			) : (
				<>
					{/* Geral vs Por rodada */}
					<PillTabs
						aria-label="Visão do ranking: geral ou por rodada"
						size="lg"
						fullWidth
						value={view}
						onChange={setView}
						accentColor={view === "RODADA" ? ROUND_ACCENT : OVERALL_ACCENT}
						items={[
							{ value: "GERAL", label: "Geral", icon: Globe },
							{ value: "RODADA", label: "Por rodada", icon: Calendar },
						]}
					/>

					{view === "RODADA" ? (
						<div key="rodada" className="animate-fade-in space-y-7">
							{/* Navegador de rodada */}
							<div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--b-border-sm)] bg-[var(--b-card)] px-3 py-3 sm:px-4">
								<button
									type="button"
									onClick={() =>
										canGoPrevRound && setSelectedRound((activeRound ?? 0) - 1)
									}
									disabled={!canGoPrevRound}
									aria-label="Rodada anterior"
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--b-border-md)] bg-[var(--b-tint-md)] text-[var(--b-brand)] transition-[transform,opacity] duration-[var(--motion-fast)] active:scale-[0.94] disabled:opacity-30"
								>
									<ChevronLeft className="h-5 w-5" />
								</button>

								<div className="flex flex-col items-center gap-0.5">
									<span className="font-black font-display text-[var(--b-text)] text-xl uppercase leading-none tracking-tight sm:text-2xl">
										{activeRound != null
											? `Rodada ${activeRound}`
											: "Sem rodada"}
									</span>
									{activeRound != null && (
										<span className="font-mono text-[10px] text-[var(--b-text-3)] tabular-nums sm:text-xs">
											{roundRanking?.length ?? 0}{" "}
											{(roundRanking?.length ?? 0) === 1 ? "membro" : "membros"}
										</span>
									)}
								</div>

								<button
									type="button"
									onClick={() =>
										canGoNextRound && setSelectedRound((activeRound ?? 0) + 1)
									}
									disabled={!canGoNextRound}
									aria-label="Próxima rodada"
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--b-border-md)] bg-[var(--b-tint-md)] text-[var(--b-brand)] transition-[transform,opacity] duration-[var(--motion-fast)] active:scale-[0.94] disabled:opacity-30"
								>
									<ChevronRight className="h-5 w-5" />
								</button>
							</div>

							{activeRound == null ? (
								<div className="flex flex-col items-center gap-3 rounded-[28px] border border-[var(--b-border-md)] border-dashed bg-[var(--b-card)] p-12 text-center">
									<Calendar className="h-10 w-10 text-[var(--b-text-4)]" />
									<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
										Sem rodada disponível ainda
									</p>
								</div>
							) : roundRanking === undefined ? (
								<Skeleton className="h-64 rounded-[28px]" />
							) : !roundHasScores ? (
								<div className="flex flex-col items-center gap-3 rounded-[28px] border border-[var(--b-border-md)] border-dashed bg-[var(--b-card)] p-12 text-center">
									<Calendar className="h-10 w-10 text-[var(--b-text-4)]" />
									<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
										Sem pontos nessa rodada ainda
									</p>
									<p className="max-w-md text-[var(--b-text-3)] text-sm leading-relaxed">
										Quando os jogos dessa rodada terminarem e os palpites
										virarem pontos, o ranking aparece aqui.
									</p>
								</div>
							) : (
								<>
									<section>
										<header className="mb-4 flex items-end justify-between gap-3">
											<div className="flex flex-col gap-1.5">
												<span className="text-[var(--b-text-3)] text-eyebrow">
													Tabela da rodada
												</span>
												<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
													Ranking — Rodada {activeRound}
												</h2>
											</div>
											<ShareRankingSheet
												leagueName={league.name}
												phaseLabel={`Rodada ${activeRound}`}
												accent={ROUND_ACCENT}
												entries={roundShareEntries}
											/>
										</header>
										<div className="flex flex-col gap-2">
											{(roundRanking ?? []).map((member) => {
												const isYou = currentUser?._id === member.userId;
												return (
													<Link
														key={member.userId}
														href={
															`/leagues/${id}/members/${member.userId}` as Route
														}
														className="block focus-visible:outline-none"
													>
														<RankingRow
															position={member.rank}
															name={member.name}
															points={member.totalPoints}
															exacts={member.exactScores}
															metric="points"
															isYou={isYou}
															accent={ROUND_ACCENT}
														/>
													</Link>
												);
											})}
										</div>
									</section>

									<section
										className="rounded-[32px] border bg-[var(--b-card)] p-6 shadow-[var(--b-shadow-card-soft)]"
										style={{
											borderColor: `color-mix(in oklch, ${ROUND_ACCENT} 28%, var(--b-border-sm))`,
										}}
									>
										<div className="mb-6 flex items-center justify-between gap-3">
											<div className="flex flex-col gap-1.5">
												<span className="text-[var(--b-text-3)] text-eyebrow">
													Melhor da rodada
												</span>
												<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
													Pódio da Rodada {activeRound}
												</h2>
											</div>
											<Crown
												className="h-6 w-6 animate-float"
												style={{ color: "var(--b-gold)" }}
											/>
										</div>
										<Podium entries={roundPodiumEntries} unit="pts" />
									</section>
								</>
							)}
						</div>
					) : (
						<div key="geral" className="animate-fade-in space-y-7">
							{!hasScores ? (
								<div className="flex flex-col items-center gap-3 rounded-[28px] border border-[var(--b-border-md)] border-dashed bg-[var(--b-card)] p-12 text-center">
									<div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--b-tint-md)]">
										<Globe className="h-7 w-7 text-[var(--b-text-4)]" />
									</div>
									<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
										Sem pontos nessa fase ainda
									</p>
									<p className="max-w-md text-[var(--b-text-3)] text-sm leading-relaxed">
										Quando os palpites dessa fase virarem pontos, o ranking
										aparece aqui.
									</p>
								</div>
							) : (
								<>
									{/* Ranking completo */}
									<section>
										<header className="mb-4 flex items-end justify-between gap-3">
											<div className="flex flex-col gap-1.5">
												<span className="text-[var(--b-text-3)] text-eyebrow">
													Tabela completa
												</span>
												<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
													Ranking
												</h2>
											</div>
											<div className="flex flex-wrap items-center justify-end gap-2">
												<ShareRankingSheet
													leagueName={league.name}
													phaseLabel="Geral"
													accent={OVERALL_ACCENT}
													entries={shareEntries}
												/>
												{rankingMode === "POINTS" && (
													<Tag variant="brand">Mais pontos</Tag>
												)}
												<span className="font-mono text-[var(--b-text-3)] text-xs tabular-nums">
													{sortedRanking.length}{" "}
													{sortedRanking.length === 1 ? "membro" : "membros"}
												</span>
											</div>
										</header>
										{rankingMode === "EXACTS" && (
											<PillTabs
												aria-label="Critério do ranking"
												size="sm"
												value={rankingTab}
												onChange={setRankingTab}
												items={[
													{
														value: "POINTS",
														label: "Ranking de pontos",
														icon: Trophy,
													},
													{
														value: "EXACTS",
														label: "Ranking de cravadas",
														icon: Star,
													},
												]}
												className="mb-4"
											/>
										)}
										<div
											key={activeTab}
											className="stagger-children flex flex-col gap-2"
											style={{ ["--d" as string]: "40ms" }}
										>
											{sortedRanking.map((member, idx) => {
												const isYou = currentUser?._id === member.userId;
												return (
													<div
														key={member._id}
														style={{ ["--i" as string]: idx }}
													>
														<Link
															href={
																`/leagues/${id}/members/${member.userId}` as Route
															}
															className="block focus-visible:outline-none"
														>
															<RankingRow
																position={idx + 1}
																name={member.name}
																points={member.totalPoints}
																exacts={member.exactScores}
																metric={
																	activeTab === "EXACTS" ? "exacts" : "points"
																}
																isYou={isYou}
																accent={OVERALL_ACCENT}
															/>
														</Link>
													</div>
												);
											})}
										</div>
									</section>

									{/* Pódio */}
									<section
										className="rounded-[32px] border bg-[var(--b-card)] p-6 shadow-[var(--b-shadow-card-soft)] transition-colors duration-[var(--motion-base)]"
										style={{
											borderColor: `color-mix(in oklch, ${OVERALL_ACCENT} 28%, var(--b-border-sm))`,
										}}
									>
										<div className="mb-6 flex items-center justify-between gap-3">
											<div className="flex flex-col gap-1.5">
												<span className="text-[var(--b-text-3)] text-eyebrow">
													Top 3 da liga
												</span>
												<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
													Pódio
												</h2>
											</div>
											<Crown
												className="h-6 w-6 animate-float"
												style={{ color: "var(--b-gold)" }}
											/>
										</div>
										<Podium
											entries={podiumEntries}
											unit={activeTab === "EXACTS" ? "cravadas" : "pts"}
										/>
									</section>
								</>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
}

function InviteSheet({
	inviteCode,
	leagueName,
}: {
	inviteCode: string;
	leagueName: string;
}) {
	const [copiedLink, setCopiedLink] = useState(false);
	const [copiedCode, setCopiedCode] = useState(false);

	function getInviteUrl() {
		return `${window.location.origin}/convite/${inviteCode}`;
	}

	function copyLink() {
		navigator.clipboard.writeText(getInviteUrl());
		setCopiedLink(true);
		toast.success("Link copiado! Cole no WhatsApp para convidar.");
		setTimeout(() => setCopiedLink(false), 2000);
	}

	function copyCode() {
		navigator.clipboard.writeText(inviteCode);
		setCopiedCode(true);
		toast.success("Código copiado!");
		setTimeout(() => setCopiedCode(false), 2000);
	}

	function shareNative() {
		if (typeof navigator !== "undefined" && "share" in navigator) {
			navigator
				.share({
					title: `Liga ${leagueName} — Chuta de Bico`,
					text: `⚽ Vem palpitar comigo! Entre na minha liga "${leagueName}" no Chuta de Bico. É só tocar no link:`,
					url: getInviteUrl(),
				})
				.catch(() => {
					// Cancelado pelo user
				});
		} else {
			copyLink();
		}
	}

	return (
		<Sheet>
			<SheetTrigger render={<Button variant="action" size="default" />}>
				<Share2 className="h-4 w-4" />
				Convidar
			</SheetTrigger>
			<SheetContent side="right" className="bg-[var(--b-card)]">
				<SheetHeader className="px-6 pt-6">
					<SheetTitle className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
						Convidar amigos
					</SheetTitle>
					<SheetDescription className="text-[var(--b-text-3)] text-sm">
						Mande o link de convite. Quem abrir entra (ou pede pra entrar) na
						liga {leagueName} com um toque.
					</SheetDescription>
				</SheetHeader>
				<div className="flex flex-col gap-4 px-6 py-4">
					<div className="flex flex-col gap-2">
						<Button onClick={shareNative} variant="action" size="lg">
							<Share2 className="h-4 w-4" />
							Compartilhar convite
						</Button>
						<Button onClick={copyLink} variant="outline" size="lg">
							{copiedLink ? (
								<>
									<Check className="h-4 w-4" />
									Link copiado!
								</>
							) : (
								<>
									<Copy className="h-4 w-4" />
									Copiar link
								</>
							)}
						</Button>
					</div>
					<div className="flex animate-scale-in flex-col items-center gap-2 rounded-2xl border border-[var(--b-brand-25)] bg-[var(--b-brand-10)] py-5 text-center">
						<span className="text-[var(--b-brand)] text-eyebrow">
							Ou compartilhe o código
						</span>
						<span className="font-black font-mono text-4xl text-[var(--b-brand)] tabular-nums tracking-[0.4em]">
							{inviteCode}
						</span>
						<button
							type="button"
							onClick={copyCode}
							className="inline-flex cursor-pointer items-center gap-1.5 text-[var(--b-text-3)] text-xs transition-colors hover:text-[var(--b-brand)]"
						>
							{copiedCode ? (
								<>
									<Check className="h-3.5 w-3.5" />
									Copiado!
								</>
							) : (
								<>
									<Copy className="h-3.5 w-3.5" />
									Copiar código
								</>
							)}
						</button>
					</div>
					<div className="rounded-2xl bg-[var(--b-tint)] p-4 text-[var(--b-text-3)] text-xs leading-relaxed">
						<strong className="font-bold text-[var(--b-text-2)]">Dica:</strong>{" "}
						quem abrir o link entra direto na liga. O código também funciona em{" "}
						<em>Ligas → Entrar por código</em>.
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
