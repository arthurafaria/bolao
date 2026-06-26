"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import { useMemo } from "react";

import { BracketMatch } from "@/components/bracket/bracket-match";
import { resolveBracket } from "@/lib/knockout";
import { STAGE_LABELS } from "@/lib/match-grouping";
import { type BracketStage, STAGE_GAME_COUNT } from "@/lib/wc2026-bracket";

const PHASES: { stage: BracketStage; labelStage: string; gap: string }[] = [
	{ stage: "ROUND_OF_32", labelStage: "ROUND_OF_32", gap: "gap-3" },
	{ stage: "ROUND_OF_16", labelStage: "ROUND_OF_16", gap: "gap-8" },
	{ stage: "QUARTER_FINALS", labelStage: "QUARTER_FINALS", gap: "gap-14" },
	{ stage: "SEMI_FINALS", labelStage: "SEMI_FINALS", gap: "gap-24" },
	{ stage: "THIRD_PLACE", labelStage: "THIRD_PLACE", gap: "gap-3" },
	{ stage: "FINAL", labelStage: "FINAL", gap: "gap-3" },
];

export default function MataMataPage() {
	const matches = useQuery(api.matches.getByStage, { tournament: "WC2026" });

	const games = useMemo(() => {
		if (!matches) return null;
		const clean = matches.filter((m) => m !== null);
		return resolveBracket(clean);
	}, [matches]);

	return (
		<div className="animate-fade-in space-y-6">
			<header className="flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-col">
					<span className="text-[var(--b-brand)] text-eyebrow">
						Caminho até a taça
					</span>
					<h1 className="font-black font-display text-4xl text-[var(--b-text)] uppercase leading-[0.9] tracking-tight sm:text-5xl">
						Mata-mata
					</h1>
					<p className="mt-1 max-w-2xl text-[var(--b-text-3)] text-sm">
						A chave completa da Copa, com datas e estádios. Os confrontos vão se
						preenchendo conforme os grupos terminam — vagas em aberto aparecem
						como o slot do chaveamento (ex.: “3º A/E/F”).
					</p>
				</div>
			</header>

			{games === null ? (
				<BracketSkeleton />
			) : (
				<div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
					<div className="flex min-w-max items-start gap-4">
						{PHASES.map((phase) => {
							const phaseGames = games.filter((g) => g.stage === phase.stage);
							return (
								<section key={phase.stage} className="w-64 shrink-0 space-y-3">
									<div
										className="sticky left-0 z-10 rounded-[16px] px-3 py-2.5"
										style={{
											background: "var(--b-surface)",
											border: "1px solid var(--b-border-sm)",
										}}
									>
										<span className="text-[10px] text-[var(--b-brand)] text-eyebrow">
											Fase
										</span>
										<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase leading-none tracking-tight">
											{STAGE_LABELS[phase.labelStage]}
										</h2>
									</div>
									<div className={`flex flex-col ${phase.gap}`}>
										{phaseGames.map((game) => (
											<BracketMatch key={game.no} game={game} />
										))}
										{Array.from({
											length: Math.max(
												STAGE_GAME_COUNT[phase.stage] - phaseGames.length,
												0,
											),
										}).map((_, index) => (
											<BracketMatch
												key={`${phase.stage}-placeholder-${index}`}
												placeholder
											/>
										))}
									</div>
								</section>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

function BracketSkeleton() {
	return (
		<div className="-mx-4 overflow-hidden px-4 pb-4 md:-mx-6 md:px-6">
			<div className="flex min-w-max items-start gap-4">
				{PHASES.map((phase) => (
					<section key={phase.stage} className="w-64 shrink-0 space-y-3">
						<Skeleton className="h-12 rounded-2xl" />
						<div className={`flex flex-col ${phase.gap}`}>
							{Array.from({
								length: Math.min(STAGE_GAME_COUNT[phase.stage], 4),
							}).map((_, index) => (
								<Skeleton
									key={`${phase.stage}-skeleton-${index}`}
									className="h-28 rounded-2xl"
								/>
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}
