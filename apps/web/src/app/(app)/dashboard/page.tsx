"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import {
	BentoTile,
	BentoTileBody,
	BentoTileEyebrow,
	BentoTileFooter,
	BentoTileHeader,
} from "@bolao/ui/components/bento-tile";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import {
	ArrowRight,
	CalendarClock,
	Crosshair,
	Flame,
	Shield,
	Target,
	Trophy,
	Users,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";

import { StatTile } from "@/components/dashboard/stat-tile";
import { HeroMatch } from "@/components/match/hero-match";
import { Scorecard } from "@/components/match/scorecard";
import { COMPETITIONS, useTournament } from "@/contexts/tournament-context";

function SectionTitle({
	title,
	href,
	linkLabel,
	eyebrow,
}: {
	title: string;
	href?: Route;
	linkLabel?: string;
	eyebrow?: string;
}) {
	return (
		<div className="mb-4 flex items-end justify-between gap-3">
			<div>
				{eyebrow && (
					<span className="text-[var(--b-text-3)] text-eyebrow">{eyebrow}</span>
				)}
				<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight sm:text-3xl">
					{title}
				</h2>
			</div>
			{href && linkLabel && (
				<Link
					href={href}
					className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--b-tint)] px-3 font-bold text-[var(--b-brand)] text-xs uppercase tracking-wider transition-[transform,background] duration-[var(--motion-fast)] hover:bg-[var(--b-brand-12)] active:scale-[0.96]"
				>
					{linkLabel}
					<ArrowRight className="h-3.5 w-3.5" />
				</Link>
			)}
		</div>
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

	const heroMatch = upcoming?.find(Boolean) ?? null;
	const heroHasPrediction = heroMatch ? predMap?.has(heroMatch._id) : false;
	const restMatches =
		upcoming?.filter((m) => m && m._id !== heroMatch?._id) ?? [];

	const totalPoints = stats?.totalPoints ?? 0;
	const totalPredictions = stats?.total ?? 0;
	const exact = stats?.exact ?? 0;
	const correct = stats?.correct ?? 0;
	const accuracy =
		totalPredictions > 0 ? Math.round((correct / totalPredictions) * 100) : 0;

	// Top liga (maior pontuação do usuário)
	const topLeague = useMemo(() => {
		if (!leagues || leagues.length === 0) return null;
		return [...leagues].sort(
			(a, b) => (b?.myPoints ?? 0) - (a?.myPoints ?? 0),
		)[0];
	}, [leagues]);

	return (
		<div className="animate-fade-in space-y-8">
			{/* Header editorial */}
			<header className="flex flex-col gap-2">
				<span className="text-[var(--b-brand)] text-eyebrow">
					{COMPETITIONS[tournament].label} · {COMPETITIONS[tournament].sublabel}
				</span>
				<h1 className="font-black font-display text-5xl text-[var(--b-text)] uppercase leading-[0.9] tracking-tight sm:text-6xl">
					Bem-vindo
					<br />
					<span className="text-[var(--b-brand)]">ao seu painel</span>
				</h1>
			</header>

			{/* Hero match */}
			{heroMatch ? (
				<HeroMatch match={heroMatch} hasPrediction={!!heroHasPrediction} />
			) : upcoming === undefined ? (
				<Skeleton className="h-[280px] w-full rounded-[32px]" />
			) : (
				<div className="flex flex-col items-center gap-3 rounded-[32px] border border-[var(--b-border-md)] border-dashed p-12 text-center">
					<Shield className="h-10 w-10 text-[var(--b-text-4)]" />
					<p className="font-bold font-display text-[var(--b-text-3)] text-lg uppercase tracking-tight">
						Sem jogos agendados
					</p>
					<p className="max-w-md text-[var(--b-text-3)] text-sm">
						Quando a próxima janela do {COMPETITIONS[tournament].label} entrar
						no ar, ela aparece aqui.
					</p>
				</div>
			)}

			{/* Stats — bento grid */}
			<section>
				<SectionTitle eyebrow="Você no bolão" title="Seus números" />
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<StatTile
						label="Pontos"
						value={totalPoints}
						icon={Trophy}
						variant="accent"
						footer={<span>Total acumulado</span>}
					/>
					<StatTile
						label="Palpites"
						value={totalPredictions}
						icon={Target}
						footer={<span>Jogos com placar dado</span>}
					/>
					<StatTile
						label="Exatos"
						value={exact}
						icon={Crosshair}
						variant={exact > 0 ? "gold" : "default"}
						footer={<span>Cravadas (10 pts)</span>}
					/>
					<StatTile
						label="Precisão"
						value={accuracy}
						suffix="%"
						icon={Flame}
						footer={<span>Palpites com pontos</span>}
					/>
				</div>
			</section>

			{/* Próximos jogos + sidebar */}
			<div className="grid gap-6 lg:grid-cols-[1fr_360px]">
				{/* Coluna principal: próximos jogos */}
				<section>
					<SectionTitle
						eyebrow="Em breve"
						title="Próximos jogos"
						href="/predictions"
						linkLabel="Ver todos"
					/>

					{upcoming === undefined ? (
						<div className="space-y-3">
							<Skeleton className="h-[140px] w-full rounded-[24px]" />
							<Skeleton className="h-[140px] w-full rounded-[24px]" />
							<Skeleton className="h-[140px] w-full rounded-[24px]" />
						</div>
					) : restMatches.length === 0 ? (
						<div className="flex flex-col items-center gap-2 rounded-[24px] border border-[var(--b-border-md)] border-dashed p-8 text-center">
							<CalendarClock className="h-8 w-8 text-[var(--b-text-4)]" />
							<p className="text-[var(--b-text-3)] text-sm">
								Sem outros jogos agendados no momento
							</p>
						</div>
					) : (
						<div
							className="stagger-children space-y-3"
							style={{ ["--d" as string]: "70ms" }}
						>
							{restMatches.map((m, i) =>
								m ? (
									<div key={m._id} style={{ ["--i" as string]: i }}>
										<Scorecard
											match={m}
											prediction={
												predMap ? (predMap.get(m._id) ?? null) : undefined
											}
											compact
										/>
									</div>
								) : null,
							)}
						</div>
					)}
				</section>

				{/* Sidebar */}
				<aside className="flex flex-col gap-6">
					{/* Top liga */}
					{topLeague && (
						<section>
							<SectionTitle
								eyebrow="Sua melhor liga"
								title={topLeague.name}
								href={`/leagues/${topLeague._id}` as Route}
								linkLabel="Abrir"
							/>
							<BentoTile variant="dark">
								<BentoTileHeader>
									<BentoTileEyebrow>Pontos na liga</BentoTileEyebrow>
									<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
										<Trophy className="h-4 w-4 text-[var(--b-gold)]" />
									</span>
								</BentoTileHeader>
								<BentoTileBody>
									<span className="font-black font-display text-6xl text-white tabular-nums leading-none">
										{topLeague.myPoints}
									</span>
								</BentoTileBody>
								<BentoTileFooter>
									<span className="inline-flex items-center gap-1.5 text-white/70">
										<Users className="h-3.5 w-3.5" />
										{topLeague.memberCount} membros
									</span>
								</BentoTileFooter>
							</BentoTile>
						</section>
					)}

					{/* Lista de ligas (resto) */}
					{leagues && leagues.length > 1 && (
						<section>
							<SectionTitle
								eyebrow="Outras ligas"
								title="Suas disputas"
								href="/leagues"
								linkLabel="Ver todas"
							/>
							<div className="space-y-2">
								{leagues
									.filter((l) => l && l._id !== topLeague?._id)
									.map((league) =>
										league ? (
											<Link
												key={league._id}
												href={`/leagues/${league._id}` as Route}
												className="group flex items-center gap-3 rounded-2xl border border-[var(--b-border-sm)] bg-[var(--b-card)] p-3 transition-[transform,box-shadow] duration-[var(--motion-base)] hover:-translate-y-0.5 hover:shadow-[var(--b-shadow-brand-sm)]"
											>
												<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--b-brand-10)] text-[var(--b-brand)]">
													<Trophy className="h-4 w-4" />
												</span>
												<div className="flex min-w-0 flex-1 flex-col">
													<span className="truncate font-semibold text-[var(--b-text)] text-sm">
														{league.name}
													</span>
													<span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
														{league.memberCount} membros
													</span>
												</div>
												<span className="font-black font-display text-2xl text-[var(--b-text)] tabular-nums">
													{league.myPoints}
												</span>
											</Link>
										) : null,
									)}
							</div>
						</section>
					)}

					{/* CTA criar liga (se não tem nenhuma) */}
					{leagues && leagues.length === 0 && (
						<BentoTile variant="accent">
							<BentoTileHeader>
								<BentoTileEyebrow>Comece agora</BentoTileEyebrow>
								<Trophy className="h-5 w-5 text-[var(--b-brand)]" />
							</BentoTileHeader>
							<BentoTileBody>
								<p className="font-bold font-display text-[var(--b-text)] text-xl uppercase tracking-tight">
									Sem liga ainda?
								</p>
								<p className="text-[var(--b-text-3)] text-sm leading-relaxed">
									Crie ou entre numa liga pra disputar com seus amigos.
								</p>
							</BentoTileBody>
							<BentoTileFooter>
								<Link
									href="/leagues"
									className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--b-brand)] px-4 font-bold text-[var(--b-brand-fg)] text-xs uppercase tracking-wider transition-transform hover:scale-[1.04] active:scale-[0.96]"
								>
									Criar liga
									<ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</BentoTileFooter>
						</BentoTile>
					)}
				</aside>
			</div>
		</div>
	);
}
