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
	Check,
	Copy,
	Crown,
	Globe,
	Settings,
	Share2,
	Star,
	Swords,
	Trophy,
	Users,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";

import { Podium, type PodiumEntry } from "@/components/leagues/podium";
import { RankingRow } from "@/components/leagues/ranking-row";
import type { ShareEntry } from "@/components/leagues/share-ranking-card";
import { ShareRankingSheet } from "@/components/leagues/share-ranking-sheet";

type Phase = "OVERALL" | "GROUP" | "KNOCKOUT";

// Ordem das abas (mata-mata no meio): geral → mata-mata → grupos.
const PHASE_ORDER: Phase[] = ["OVERALL", "KNOCKOUT", "GROUP"];

const PHASE_META: Record<
	Phase,
	{
		label: string;
		icon: typeof Trophy;
		blurb: string;
		/** Cor de destaque da fase. */
		accent: string;
		/** Tint suave da cor (fundo de chips/cards). */
		accentSoft: string;
	}
> = {
	GROUP: {
		label: "Grupos",
		icon: Users,
		blurb: "Só os pontos conquistados na fase de grupos.",
		accent: "oklch(0.6 0.14 240)",
		accentSoft: "color-mix(in oklch, oklch(0.6 0.14 240) 14%, var(--b-card))",
	},
	KNOCKOUT: {
		label: "Mata-mata",
		icon: Swords,
		blurb: "Mata-mata: começa do zero, a partir dos jogos eliminatórios.",
		accent: "oklch(0.57 0.21 25)",
		accentSoft: "color-mix(in oklch, oklch(0.57 0.21 25) 16%, var(--b-card))",
	},
	OVERALL: {
		label: "Geral",
		icon: Globe,
		blurb: "Tudo somado: fase de grupos + mata-mata.",
		accent: "var(--b-brand)",
		accentSoft: "var(--b-brand-10)",
	},
};

function PhaseChip({ phase }: { phase: Phase }) {
	const meta = PHASE_META[phase];
	const Icon = meta.icon;
	return (
		<span
			className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold text-[10px] uppercase tracking-wider"
			style={{
				color: meta.accent,
				background: `color-mix(in oklch, ${meta.accent} 14%, transparent)`,
				border: `1px solid color-mix(in oklch, ${meta.accent} 35%, transparent)`,
			}}
		>
			<Icon className="h-3 w-3" />
			{meta.label}
		</span>
	);
}

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

	const [phase, setPhase] = useState<Phase>("OVERALL");
	const [rankingTab, setRankingTab] = useState<"POINTS" | "EXACTS">("POINTS");

	const rankingMode = league?.rankingMode ?? "POINTS";
	const activeTab = rankingMode === "EXACTS" ? rankingTab : "POINTS";

	// Achata o bucket da fase ativa para o shape usado por sort/RankingRow.
	const sortedRanking = useMemo(() => {
		if (!ranking) return [];
		const bucketKey =
			phase === "GROUP"
				? "group"
				: phase === "KNOCKOUT"
					? "knockout"
					: "overall";
		return ranking
			.map((m) => {
				const b = m[bucketKey];
				return {
					_id: m._id,
					userId: m.userId,
					name: m.name,
					totalPoints: b.totalPoints,
					exactScores: b.exactScores,
					correctResults: b.correctResults,
				};
			})
			.sort(activeTab === "EXACTS" ? compareByExacts : compareByPoints);
	}, [ranking, phase, activeTab]);

	const phaseHasScores = useMemo(
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

	// Mini-resumo: minha posição + pontos em cada fase (Grupos / Mata-mata / Geral).
	const myStandings = useMemo(() => {
		if (!ranking || !currentUser) return null;
		const comparator =
			activeTab === "EXACTS" ? compareByExacts : compareByPoints;
		const buckets = {
			GROUP: "group",
			KNOCKOUT: "knockout",
			OVERALL: "overall",
		} as const;
		return PHASE_ORDER.map((p) => {
			const key = buckets[p];
			const sorted = [...ranking].sort((a, b) => comparator(a[key], b[key]));
			const idx = sorted.findIndex((m) => m.userId === currentUser._id);
			const mine = idx >= 0 ? sorted[idx][key] : null;
			const hasScores = sorted.some(
				(m) => m[key].totalPoints > 0 || m[key].exactScores > 0,
			);
			return {
				phase: p,
				position: idx >= 0 ? idx + 1 : null,
				value:
					mine == null
						? 0
						: activeTab === "EXACTS"
							? mine.exactScores
							: mine.totalPoints,
				total: ranking.length,
				hasScores,
			};
		});
	}, [ranking, currentUser, activeTab]);

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
					{/* Seletor de fases */}
					<section
						className="overflow-hidden rounded-[28px] border bg-[var(--b-card)] p-4 shadow-[var(--b-shadow-card-soft)] transition-colors duration-[var(--motion-base)] sm:p-5"
						style={{
							borderColor: `color-mix(in oklch, ${PHASE_META[phase].accent} 35%, var(--b-border-sm))`,
						}}
					>
						<div className="mb-3 flex items-center justify-between gap-3">
							<span className="inline-flex items-center gap-2 text-[var(--b-text-3)] text-eyebrow">
								<span
									aria-hidden
									className="h-2 w-2 rounded-full transition-colors duration-[var(--motion-base)]"
									style={{ background: PHASE_META[phase].accent }}
								/>
								Visão do ranking
							</span>
							<span
								key={phase}
								className="hidden animate-fade-in items-center gap-1.5 text-[var(--b-text-3)] text-xs sm:inline-flex"
							>
								{PHASE_META[phase].blurb}
							</span>
						</div>
						<PillTabs
							aria-label="Fase do ranking"
							size="lg"
							fullWidth
							value={phase}
							onChange={setPhase}
							accentColor={PHASE_META[phase].accent}
							items={PHASE_ORDER.map((p) => ({
								value: p,
								label: PHASE_META[p].label,
								icon: PHASE_META[p].icon,
							}))}
						/>
						<p
							key={`blurb-${phase}`}
							className="mt-3 animate-fade-in text-[var(--b-text-3)] text-xs leading-relaxed sm:hidden"
						>
							{PHASE_META[phase].blurb}
						</p>
					</section>

					{/* Mini-resumo: sua posição em cada fase */}
					{myStandings && (
						<section aria-label="Sua posição em cada fase">
							<div className="grid grid-cols-3 gap-2 sm:gap-3">
								{myStandings.map((s) => {
									const meta = PHASE_META[s.phase];
									const Icon = meta.icon;
									const active = s.phase === phase;
									return (
										<button
											key={s.phase}
											type="button"
											onClick={() => setPhase(s.phase)}
											className="group flex flex-col gap-1.5 rounded-2xl border p-3 text-left transition-[transform,box-shadow,border-color] duration-[var(--motion-base)] ease-[var(--ease-out-quart)] hover:-translate-y-0.5 sm:p-4"
											style={{
												borderColor: active
													? meta.accent
													: "var(--b-border-sm)",
												background: active ? meta.accentSoft : "var(--b-card)",
												boxShadow: active
													? `0 6px 18px color-mix(in oklch, ${meta.accent} 22%, transparent)`
													: undefined,
											}}
										>
											<span className="inline-flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider">
												<Icon
													className="h-3.5 w-3.5"
													style={{ color: meta.accent }}
												/>
												<span
													className="truncate"
													style={{
														color: active ? meta.accent : "var(--b-text-3)",
													}}
												>
													{meta.label}
												</span>
											</span>
											{s.hasScores && s.position != null ? (
												<div className="flex items-baseline gap-1">
													<span
														className="font-black font-display text-2xl tabular-nums leading-none sm:text-3xl"
														style={{ color: "var(--b-text)" }}
													>
														{s.position}º
													</span>
													<span className="font-mono text-[10px] text-[var(--b-text-4)] tabular-nums">
														/{s.total}
													</span>
												</div>
											) : (
												<span className="font-black font-display text-[var(--b-text-4)] text-xl leading-none">
													—
												</span>
											)}
											<span className="font-mono text-[11px] text-[var(--b-text-3)] tabular-nums">
												{s.hasScores
													? `${s.value} ${activeTab === "EXACTS" ? "cravadas" : "pts"}`
													: "a começar"}
											</span>
										</button>
									);
								})}
							</div>
						</section>
					)}

					{/* Conteúdo da fase ativa — re-keyed para reanimar na troca */}
					<div key={phase} className="animate-fade-in space-y-7">
						{!phaseHasScores ? (
							<div className="flex flex-col items-center gap-3 rounded-[28px] border border-[var(--b-border-md)] border-dashed bg-[var(--b-card)] p-12 text-center">
								<div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--b-tint-md)]">
									{(() => {
										const Icon = PHASE_META[phase].icon;
										return <Icon className="h-7 w-7 text-[var(--b-text-4)]" />;
									})()}
								</div>
								<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
									{phase === "KNOCKOUT"
										? "O mata-mata ainda não começou"
										: "Sem pontos nessa fase ainda"}
								</p>
								<p className="max-w-md text-[var(--b-text-3)] text-sm leading-relaxed">
									{phase === "KNOCKOUT"
										? "Assim que os jogos eliminatórios terminarem, o ranking ganha vida aqui — todo mundo parte do zero."
										: "Quando os palpites dessa fase virarem pontos, o ranking aparece aqui."}
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
											<div className="flex items-center gap-2.5">
												<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
													Ranking
												</h2>
												<span key={phase} className="animate-scale-in">
													<PhaseChip phase={phase} />
												</span>
											</div>
										</div>
										<div className="flex flex-wrap items-center justify-end gap-2">
											<ShareRankingSheet
												leagueName={league.name}
												phaseLabel={PHASE_META[phase].label}
												accent={PHASE_META[phase].accent}
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
										key={`${phase}-${activeTab}`}
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
															accent={PHASE_META[phase].accent}
															selo={
																isYou ? <PhaseChip phase={phase} /> : undefined
															}
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
										borderColor: `color-mix(in oklch, ${PHASE_META[phase].accent} 28%, var(--b-border-sm))`,
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
										<div className="flex items-center gap-2">
											<span key={phase} className="animate-scale-in">
												<PhaseChip phase={phase} />
											</span>
											<Crown
												className="h-6 w-6 animate-float"
												style={{ color: "var(--b-gold)" }}
											/>
										</div>
									</div>
									<Podium
										entries={podiumEntries}
										unit={activeTab === "EXACTS" ? "cravadas" : "pts"}
									/>
								</section>
							</>
						)}
					</div>
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
					title: `Liga ${leagueName} — Bolão da Copa 2026`,
					text: `⚽ Vem palpitar comigo! Entre na minha liga "${leagueName}" no Bolão da Copa 2026. É só tocar no link:`,
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
