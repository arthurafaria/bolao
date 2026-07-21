"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import {
	BentoTile,
	BentoTileBody,
	BentoTileEyebrow,
	BentoTileFooter,
	BentoTileHeader,
} from "@bolao/ui/components/bento-tile";
import { useQuery } from "convex/react";
import { ArrowRight, Trophy } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";

import type { ShareEntry } from "@/components/leagues/share-ranking-card";
import { ShareRankingSheet } from "@/components/leagues/share-ranking-sheet";

interface RoundRecapProps {
	leagueId: Id<"leagues">;
	leagueName: string;
	matchday: number;
	currentUserId?: string;
}

/**
 * Card "Recap da última rodada" do dashboard: quanto o usuário fez de pontos
 * na última rodada encerrada e quem foi o melhor da liga naquela rodada.
 * Lê leagues.getRoundRanking (ver plano 005) — só renderiza quando existe
 * uma rodada encerrada com ranking calculado, sem card vazio.
 */
export function RoundRecap({
	leagueId,
	leagueName,
	matchday,
	currentUserId,
}: RoundRecapProps) {
	const ranking = useQuery(api.leagues.getRoundRanking, {
		leagueId,
		matchday,
	});

	const shareEntries: ShareEntry[] = useMemo(
		() =>
			(ranking ?? []).slice(0, 8).map((m) => ({
				position: m.rank,
				name: m.name,
				points: m.totalPoints,
				exacts: m.exactScores,
			})),
		[ranking],
	);

	if (ranking === undefined || ranking.length === 0) return null;

	const top = ranking[0];
	const mine = currentUserId
		? ranking.find((m) => m.userId === currentUserId)
		: undefined;

	if (!top) return null;

	return (
		<section>
			<BentoTile variant="gold">
				<BentoTileHeader>
					<BentoTileEyebrow>Recap da última rodada</BentoTileEyebrow>
					<span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--b-gold-bg)]">
						<Trophy className="h-4 w-4 text-[var(--b-gold)]" />
					</span>
				</BentoTileHeader>
				<BentoTileBody className="gap-3">
					<h3 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
						Rodada {matchday}
					</h3>
					<div className="flex flex-col gap-1.5">
						{mine ? (
							<p className="text-[var(--b-text-2)] text-sm">
								Você fez{" "}
								<span className="font-black font-display text-[var(--b-text)] text-lg tabular-nums">
									{mine.totalPoints}
								</span>{" "}
								pts nessa rodada.
							</p>
						) : null}
						<p className="text-[var(--b-text-3)] text-sm">
							Melhor da liga:{" "}
							<span className="font-bold text-[var(--b-text)]">{top.name}</span>{" "}
							<span className="font-mono tabular-nums">
								({top.totalPoints} pts)
							</span>
						</p>
					</div>
				</BentoTileBody>
				<BentoTileFooter className="flex-wrap gap-2">
					<Link
						href={
							`/leagues/${leagueId}?view=rodada&matchday=${matchday}` as Route
						}
						className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--b-gold)] px-3.5 font-bold text-[10px] text-black uppercase tracking-wider transition-transform hover:scale-[1.03] active:scale-[0.96]"
					>
						Ver ranking da rodada
						<ArrowRight className="h-3.5 w-3.5" />
					</Link>
					<ShareRankingSheet
						leagueName={leagueName}
						phaseLabel={`Rodada ${matchday}`}
						accent="var(--b-gold)"
						entries={shareEntries}
					/>
				</BentoTileFooter>
			</BentoTile>
		</section>
	);
}
