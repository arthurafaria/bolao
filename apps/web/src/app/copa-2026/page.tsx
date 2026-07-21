"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import { Archive, Trophy, Users } from "lucide-react";
import Link from "next/link";

import { Podium, type PodiumEntry } from "@/components/leagues/podium";
import { RankingRow } from "@/components/leagues/ranking-row";

const TOURNAMENT = "WC2026";

function formatCapturedAt(ms: number): string {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(ms));
}

export default function Copa2026ArchivePage() {
	const archive = useQuery(api.archives.getArchive, {
		tournament: TOURNAMENT,
	});

	return (
		<div
			className="relative min-h-screen overflow-hidden px-4 py-10 md:px-6"
			style={{ background: "var(--b-bg)" }}
		>
			{/* Ambient gradients */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(circle at 12% 10%, color-mix(in oklch, var(--b-brand) 12%, transparent), transparent 26%), radial-gradient(circle at 88% 6%, color-mix(in oklch, var(--b-accent) 8%, transparent), transparent 24%)",
				}}
			/>

			<div className="relative mx-auto max-w-5xl space-y-7">
				{/* Header */}
				<header className="flex flex-col gap-2">
					<span className="text-[var(--b-brand)] text-eyebrow">Arquivo</span>
					<h1 className="font-black font-display text-4xl text-[var(--b-text)] uppercase leading-[0.9] tracking-tight sm:text-5xl">
						Copa do Mundo 2026
					</h1>
					<p className="max-w-2xl text-[var(--b-text-3)] text-sm leading-relaxed">
						O ranking final do nosso bolão da Copa. Guardado para a posteridade.
					</p>
				</header>

				{archive === undefined ? (
					<div className="space-y-6">
						<Skeleton className="h-64 rounded-[28px]" />
						<Skeleton className="h-64 rounded-[28px]" />
					</div>
				) : archive.length === 0 ? (
					<div className="flex flex-col items-center gap-3 rounded-[28px] border border-[var(--b-border-md)] border-dashed bg-[var(--b-card)] p-12 text-center">
						<Archive className="h-10 w-10 text-[var(--b-text-4)]" />
						<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
							Ainda sem arquivo
						</p>
						<p className="max-w-md text-[var(--b-text-3)] text-sm leading-relaxed">
							O ranking final da Copa ainda não foi arquivado. Volte em breve.
						</p>
						<Link
							href="/"
							className="mt-2 text-[var(--b-brand)] text-sm underline-offset-4 hover:underline"
						>
							Ir para o Bolão
						</Link>
					</div>
				) : (
					<div className="space-y-10">
						{archive.map((league) => {
							const podiumEntries: PodiumEntry[] = league.standings
								.slice(0, 3)
								.map((member) => ({
									position: member.rank as 1 | 2 | 3,
									name: member.name,
									points: member.totalPoints,
								}));

							return (
								<section
									key={league.leagueId}
									className="rounded-[32px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-6 shadow-[var(--b-shadow-card-soft)] sm:p-7"
								>
									<header className="mb-6 flex flex-wrap items-end justify-between gap-3">
										<div className="flex flex-col gap-1.5">
											<span className="inline-flex items-center gap-1.5 text-[var(--b-text-3)] text-eyebrow">
												<Trophy className="h-3.5 w-3.5" />
												Ranking final
											</span>
											<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight sm:text-3xl">
												{league.leagueName}
											</h2>
											<span className="inline-flex items-center gap-1.5 text-[var(--b-text-4)] text-xs">
												<Users className="h-3.5 w-3.5" />
												Arquivado em {formatCapturedAt(league.capturedAt)}
											</span>
										</div>
									</header>

									{league.standings.length === 0 ? (
										<p className="text-[var(--b-text-3)] text-sm">
											Essa liga não tinha membros ativos quando o ranking foi
											arquivado.
										</p>
									) : (
										<div className="space-y-8">
											<Podium entries={podiumEntries} unit="pts" />

											<div className="flex flex-col gap-2">
												{league.standings.map((member) => (
													<RankingRow
														key={member.userId}
														position={member.rank}
														name={member.name}
														points={member.totalPoints}
														exacts={member.exactScores}
														metric="points"
													/>
												))}
											</div>
										</div>
									)}
								</section>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
