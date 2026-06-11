"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

import { BracketMatch } from "@/components/bracket/bracket-match";
import { STAGE_LABELS } from "@/lib/match-grouping";

type Match = NonNullable<
	FunctionReturnType<typeof api.matches.getByStage>[number]
>;

const BRACKET_PHASES = [
	{
		key: "round32",
		stages: ["LAST_32", "ROUND_OF_32", "PLAYOFF_ROUND_OF_32"],
		labelStage: "LAST_32",
		slots: 16,
		gap: "gap-3",
	},
	{
		key: "round16",
		stages: ["LAST_16", "ROUND_OF_16"],
		labelStage: "LAST_16",
		slots: 8,
		gap: "gap-8",
	},
	{
		key: "quarters",
		stages: ["QUARTER_FINALS"],
		labelStage: "QUARTER_FINALS",
		slots: 4,
		gap: "gap-14",
	},
	{
		key: "semis",
		stages: ["SEMI_FINALS"],
		labelStage: "SEMI_FINALS",
		slots: 2,
		gap: "gap-24",
	},
	{
		key: "third",
		stages: ["THIRD_PLACE"],
		labelStage: "THIRD_PLACE",
		slots: 1,
		gap: "gap-3",
	},
	{
		key: "final",
		stages: ["FINAL"],
		labelStage: "FINAL",
		slots: 1,
		gap: "gap-3",
	},
] as const;

export default function MataMataPage() {
	const matches = useQuery(api.matches.getByStage, { tournament: "WC2026" });
	const knockoutMatches =
		matches
			?.filter((m): m is Match => m !== null && m.stage !== "GROUP_STAGE")
			.sort(
				(a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
			) ?? [];

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
						A chave da Copa aparece completa assim que os confrontos forem
						definidos.
					</p>
				</div>
			</header>

			{matches === undefined ? (
				<BracketSkeleton />
			) : (
				<div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
					<div className="flex min-w-max items-start gap-4">
						{BRACKET_PHASES.map((phase) => {
							const phaseMatches = knockoutMatches.filter((match) =>
								(phase.stages as readonly string[]).includes(match.stage),
							);
							const placeholders = Math.max(
								phase.slots - phaseMatches.length,
								0,
							);

							return (
								<section key={phase.key} className="w-64 shrink-0 space-y-3">
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
										{phaseMatches.map((match) => (
											<BracketMatch key={match._id} match={match} />
										))}
										{Array.from({ length: placeholders }).map((_, index) => (
											<BracketMatch key={`${phase.key}-placeholder-${index}`} />
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
				{BRACKET_PHASES.map((phase) => (
					<section key={phase.key} className="w-64 shrink-0 space-y-3">
						<Skeleton className="h-12 rounded-2xl" />
						<div className={`flex flex-col ${phase.gap}`}>
							{Array.from({ length: Math.min(phase.slots, 4) }).map(
								(_, index) => (
									<Skeleton
										key={`${phase.key}-skeleton-${index}`}
										className="h-28 rounded-2xl"
									/>
								),
							)}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}
