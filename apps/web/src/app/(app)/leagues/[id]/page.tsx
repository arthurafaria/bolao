"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import { Button } from "@bolao/ui/components/button";
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
import { cn } from "@bolao/ui/lib/utils";
import { useQuery } from "convex/react";
import {
	ArrowLeft,
	Check,
	Copy,
	Crown,
	Settings,
	Share2,
	Trophy,
	Users,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";

import { Podium, type PodiumEntry } from "@/components/leagues/podium";
import { RankingRow } from "@/components/leagues/ranking-row";

export default function LeagueDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const leagueId = id as Id<"leagues">;

	const league = useQuery(api.leagues.getById, { leagueId });
	const ranking = useQuery(api.leagues.getRanking, { leagueId });
	const currentUser = useQuery(api.auth.getCurrentUser);

	const podiumEntries: PodiumEntry[] = useMemo(() => {
		if (!ranking) return [];
		return ranking.slice(0, 3).map((m, idx) => ({
			position: (idx + 1) as 1 | 2 | 3,
			name: m.name,
			points: m.totalPoints,
		}));
	}, [ranking]);

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
			<div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-[var(--b-border-md)] bg-[var(--b-card)] p-12 text-center">
				<Trophy className="h-10 w-10 text-[var(--b-text-4)]" />
				<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
					Liga não encontrada
				</p>
				<p className="text-[var(--b-text-3)] text-sm">
					Talvez você não seja mais membro dessa liga.
				</p>
				<Link href="/leagues">
					<Button variant="brand" size="default">
						<ArrowLeft className="h-4 w-4" />
						Voltar pras minhas ligas
					</Button>
				</Link>
			</div>
		);
	}

	const isOwner = currentUser?._id === league.ownerId;

	return (
		<div className="space-y-7 animate-fade-in">
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
					<span className="text-eyebrow text-[var(--b-brand)]">
						Liga · {league.joinType === "OPEN" ? "Aberta" : "Moderada"}
					</span>
					<h1 className="font-black font-display text-4xl uppercase leading-[0.9] tracking-tight text-[var(--b-text)] sm:text-5xl">
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
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<InviteSheet inviteCode={league.inviteCode} leagueName={league.name} />
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
				<div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-[var(--b-border-md)] bg-[var(--b-card)] p-12 text-center">
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
					{/* Ranking completo */}
					{ranking.length > 0 && (
						<section>
							<header className="mb-4 flex items-end justify-between gap-3">
								<div>
									<span className="text-eyebrow text-[var(--b-text-3)]">
										Tabela completa
									</span>
									<h2 className="font-black font-display text-2xl uppercase tracking-tight text-[var(--b-text)]">
										Ranking
									</h2>
								</div>
								<span className="font-mono text-[var(--b-text-3)] text-xs tabular-nums">
									{ranking.length} {ranking.length === 1 ? "membro" : "membros"}
								</span>
							</header>
							<div
								className="stagger-children flex flex-col gap-2"
								style={{ ["--d" as string]: "40ms" }}
							>
								{ranking.map((member, idx) => (
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
												isYou={currentUser?._id === member.userId}
											/>
										</Link>
									</div>
								))}
							</div>
						</section>
					)}

					{/* Pódio */}
					<section className="rounded-[32px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-6 shadow-[var(--b-shadow-card-soft)]">
						<div className="mb-6 flex items-center justify-between gap-3">
							<div>
								<span className="text-eyebrow text-[var(--b-text-3)]">
									Top 3 da liga
								</span>
								<h2 className="font-black font-display text-2xl uppercase tracking-tight text-[var(--b-text)]">
									Pódio
								</h2>
							</div>
							<Crown
								className="h-6 w-6 animate-float"
								style={{ color: "var(--b-gold)" }}
							/>
						</div>
						<Podium entries={podiumEntries} />
					</section>
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
	const [copied, setCopied] = useState(false);

	function copy() {
		navigator.clipboard.writeText(inviteCode);
		setCopied(true);
		toast.success("Código copiado!");
		setTimeout(() => setCopied(false), 2000);
	}

	function shareNative() {
		if (typeof navigator !== "undefined" && "share" in navigator) {
			navigator
				.share({
					title: `Liga ${leagueName}`,
					text: `Entre na minha liga "${leagueName}" no Bolão. Código: ${inviteCode}`,
				})
				.catch(() => {
					// Cancelado pelo user
				});
		} else {
			copy();
		}
	}

	return (
		<Sheet>
			<SheetTrigger render={<Button variant="brand" size="default" />}>
				<Share2 className="h-4 w-4" />
				Convidar
			</SheetTrigger>
			<SheetContent side="right" className="bg-[var(--b-card)]">
				<SheetHeader className="px-6 pt-6">
					<SheetTitle className="font-black font-display text-2xl uppercase tracking-tight text-[var(--b-text)]">
						Convidar amigos
					</SheetTitle>
					<SheetDescription className="text-[var(--b-text-3)] text-sm">
						Compartilhe o código abaixo. Quem usar entra (ou pede pra entrar)
						na liga {leagueName}.
					</SheetDescription>
				</SheetHeader>
				<div className="flex flex-col gap-4 px-6 py-4">
					<div className="flex animate-scale-in flex-col items-center gap-3 rounded-2xl border border-[var(--b-brand-25)] bg-[var(--b-brand-10)] py-6 text-center">
						<span className="text-eyebrow text-[var(--b-brand)]">
							Código de convite
						</span>
						<span className="font-black font-mono text-5xl tabular-nums tracking-[0.4em] text-[var(--b-brand)]">
							{inviteCode}
						</span>
					</div>
					<div className="flex gap-2">
						<Button
							onClick={copy}
							variant="outline"
							className={cn("flex-1")}
							size="lg"
						>
							{copied ? (
								<>
									<Check className="h-4 w-4" />
									Copiado!
								</>
							) : (
								<>
									<Copy className="h-4 w-4" />
									Copiar código
								</>
							)}
						</Button>
						<Button onClick={shareNative} variant="brand" size="lg">
							<Share2 className="h-4 w-4" />
							Compartilhar
						</Button>
					</div>
					<div className="rounded-2xl bg-[var(--b-tint)] p-4 text-[var(--b-text-3)] text-xs leading-relaxed">
						<strong className="font-bold text-[var(--b-text-2)]">Dica:</strong>{" "}
						quem receber o código pode entrar acessando{" "}
						<span className="font-mono">/leagues</span> e digitando em{" "}
						<em>"Entrar por código"</em>.
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
