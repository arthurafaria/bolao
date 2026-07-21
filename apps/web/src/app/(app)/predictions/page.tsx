"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { PillTabs } from "@bolao/ui/components/pill-tabs";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
	CalendarOff,
	ChevronLeft,
	ChevronRight,
	ListChecks,
	Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DayHeader } from "@/components/match/day-header";
import { Scorecard } from "@/components/match/scorecard";
import { useTournament } from "@/contexts/tournament-context";
import { currentRound } from "@/lib/match-grouping";

type Match = NonNullable<
	FunctionReturnType<typeof api.matches.getAllByDate>[number]
>;

type FilterTab = "rodada" | "mine";

const LOCK_MS = 60 * 60 * 1000;

function dayKey(iso: string): string {
	const d = new Date(iso);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function groupByDay(matches: Match[]): [string, Date, Match[]][] {
	const map = new Map<string, { date: Date; matches: Match[] }>();
	for (const m of matches) {
		const key = dayKey(m.utcDate);
		const entry = map.get(key) ?? {
			date: new Date(m.utcDate),
			matches: [],
		};
		entry.matches.push(m);
		map.set(key, entry);
	}
	return Array.from(map.entries()).map(([key, { date, matches }]) => {
		const sorted = [...matches].sort(
			(a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
		);
		return [key, date, sorted];
	});
}

function formatCloseTime(ms: number): string {
	return new Date(ms)
		.toLocaleString("pt-BR", {
			weekday: "short",
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		})
		.replace(/\./g, "");
}

export default function PredictionsPage() {
	const { tournament } = useTournament();
	const matches = useQuery(api.matches.getAllByDate, { tournament });
	const allPredictions = useQuery(api.predictions.getUserPredictions);
	const currentRoundQuery = useQuery(api.matches.getCurrentRound, {
		tournament,
	});
	const [tab, setTab] = useState<FilterTab>("rodada");
	const [selectedRound, setSelectedRound] = useState<number | null>(null);

	const predMap = useMemo(() => {
		if (!allPredictions) return undefined;
		return new Map(allPredictions.map((p) => [p.matchId as string, p]));
	}, [allPredictions]);

	const cleanedMatches = useMemo(
		() => matches?.filter((m): m is Match => m !== null) ?? [],
		[matches],
	);

	const now = Date.now();

	// Rodadas disponíveis (jogos com matchday definido), em ordem.
	const roundNumbers = useMemo(() => {
		const set = new Set<number>();
		for (const m of cleanedMatches) {
			if (m.matchday != null) set.add(m.matchday);
		}
		return Array.from(set).sort((a, b) => a - b);
	}, [cleanedMatches]);

	const minRound = roundNumbers[0] ?? null;
	const maxRound = roundNumbers[roundNumbers.length - 1] ?? null;

	// Rodada atual vem de matches.getCurrentRound (fonte única de verdade,
	// ver plano 005); cai para a derivação client-side enquanto a query
	// ainda está carregando.
	const derivedCurrentRound = useMemo(() => {
		if (currentRoundQuery !== undefined) return currentRoundQuery.current;
		return currentRound(cleanedMatches);
	}, [currentRoundQuery, cleanedMatches]);

	// Rodada selecionada por padrão é a atual; o usuário pode navegar a partir
	// dela com os botões ◀ ▶ (clampado aos limites disponíveis).
	useEffect(() => {
		if (selectedRound === null && derivedCurrentRound !== null) {
			setSelectedRound(derivedCurrentRound);
		}
	}, [derivedCurrentRound, selectedRound]);

	const activeRound = selectedRound ?? derivedCurrentRound;

	const roundMatches = useMemo(
		() =>
			activeRound == null
				? []
				: cleanedMatches.filter((m) => m.matchday === activeRound),
		[cleanedMatches, activeRound],
	);

	const sortedRoundMatches = useMemo(
		() =>
			[...roundMatches].sort(
				(a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
			),
		[roundMatches],
	);

	const roundByDay = useMemo(
		() => groupByDay(sortedRoundMatches),
		[sortedRoundMatches],
	);

	const predictedInRound = useMemo(
		() => sortedRoundMatches.filter((m) => predMap?.has(m._id)).length,
		[sortedRoundMatches, predMap],
	);

	// Fechamento da rodada: 1h antes do próximo jogo ainda não bloqueado.
	const roundCloseTime = useMemo(() => {
		const upcoming = sortedRoundMatches
			.map((m) => new Date(m.utcDate).getTime() - LOCK_MS)
			.filter((lockTime) => lockTime > now)
			.sort((a, b) => a - b);
		return upcoming[0] ?? null;
	}, [sortedRoundMatches, now]);

	// Meus palpites: todo jogo já bloqueado (faltando começar, ao vivo ou
	// encerrado) em que o usuário palpitou. Permite acompanhar o que jogou
	// assim que o palpite fecha, sem poder editar.
	const mineMatches = useMemo(
		() =>
			cleanedMatches.filter((m) => {
				if (!predMap?.has(m._id)) return false;
				const lockTime = new Date(m.utcDate).getTime() - LOCK_MS;
				return now >= lockTime;
			}),
		[cleanedMatches, predMap, now],
	);

	// Meus palpites: lista simples agrupada por dia, do mais recente
	// (a começar / ao vivo) ao mais antigo já encerrado.
	const sortedActive = useMemo(() => {
		const list = [...mineMatches];
		list.sort(
			(a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime(),
		);
		return list;
	}, [mineMatches]);

	const grouped = useMemo(
		() => (sortedActive.length === 0 ? [] : groupByDay(sortedActive)),
		[sortedActive],
	);

	const isLoading = matches === undefined || predMap === undefined;

	const canGoPrev =
		activeRound != null && minRound != null && activeRound > minRound;
	const canGoNext =
		activeRound != null && maxRound != null && activeRound < maxRound;

	return (
		<div className="animate-fade-in space-y-6">
			{/* Header */}
			<header className="flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-col">
					<span className="text-[var(--b-brand)] text-eyebrow">
						Sua mesa de palpites
					</span>
					<h1 className="font-black font-display text-4xl text-[var(--b-text)] uppercase leading-[0.9] tracking-tight sm:text-5xl">
						Palpites
					</h1>
					<p className="mt-1 text-[var(--b-text-3)] text-sm">
						Palpites se fecham 1h antes de cada jogo. Boa sorte.
					</p>
				</div>
			</header>

			{/* Filter tabs */}
			<PillTabs
				items={[
					{
						value: "rodada",
						label: "Rodada",
						icon: Trophy,
						count: sortedRoundMatches.length,
					},
					{
						value: "mine",
						label: "Meus palpites",
						icon: ListChecks,
						count: mineMatches.length,
					},
				]}
				value={tab}
				onChange={(v) => setTab(v)}
				aria-label="Filtrar palpites"
			/>

			{/* Lista */}
			{isLoading ? (
				<div className="space-y-6">
					{[1, 2, 3].map((i) => (
						<div key={i} className="space-y-3">
							<Skeleton className="h-6 w-40 rounded-md" />
							<Skeleton className="h-32 rounded-2xl" />
							<Skeleton className="h-32 rounded-2xl" />
						</div>
					))}
				</div>
			) : tab === "rodada" ? (
				activeRound == null ? (
					<EmptyByTab tab="rodada" />
				) : (
					<div className="space-y-6">
						{/* Navegador de rodada */}
						<div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--b-border-sm)] bg-[var(--b-card)] px-3 py-3 sm:px-4">
							<button
								type="button"
								onClick={() =>
									canGoPrev && setSelectedRound((activeRound ?? 0) - 1)
								}
								disabled={!canGoPrev}
								aria-label="Rodada anterior"
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--b-border-md)] bg-[var(--b-tint-md)] text-[var(--b-brand)] transition-[transform,opacity] duration-[var(--motion-fast)] active:scale-[0.94] disabled:opacity-30"
							>
								<ChevronLeft className="h-5 w-5" />
							</button>

							<div className="flex flex-col items-center gap-0.5">
								<span className="font-black font-display text-[var(--b-text)] text-xl uppercase leading-none tracking-tight sm:text-2xl">
									Rodada {activeRound}
								</span>
								<span className="font-mono text-[10px] text-[var(--b-text-3)] tabular-nums sm:text-xs">
									{predictedInRound}/{sortedRoundMatches.length} palpitados
									{roundCloseTime != null &&
										` · fecha ${formatCloseTime(roundCloseTime)}`}
								</span>
							</div>

							<button
								type="button"
								onClick={() =>
									canGoNext && setSelectedRound((activeRound ?? 0) + 1)
								}
								disabled={!canGoNext}
								aria-label="Próxima rodada"
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--b-border-md)] bg-[var(--b-tint-md)] text-[var(--b-brand)] transition-[transform,opacity] duration-[var(--motion-fast)] active:scale-[0.94] disabled:opacity-30"
							>
								<ChevronRight className="h-5 w-5" />
							</button>
						</div>

						{sortedRoundMatches.length === 0 ? (
							<EmptyByTab tab="rodada" />
						) : (
							<div className="space-y-8">
								{roundByDay.map(([key, date, dayMatches]) => {
									const predictedCount = dayMatches.filter((m) =>
										predMap?.has(m._id),
									).length;
									return (
										<section key={key} className="space-y-3">
											<DayHeader
												date={date}
												totalMatches={dayMatches.length}
												predictedMatches={predictedCount}
											/>
											<div
												className="stagger-children space-y-3"
												style={{ ["--d" as string]: "60ms" }}
											>
												{dayMatches.map((m, i) => (
													<div key={m._id} style={{ ["--i" as string]: i }}>
														<Scorecard
															match={m}
															prediction={
																predMap
																	? (predMap.get(m._id) ?? null)
																	: undefined
															}
														/>
													</div>
												))}
											</div>
										</section>
									);
								})}
							</div>
						)}
					</div>
				)
			) : sortedActive.length === 0 ? (
				<EmptyByTab tab="mine" />
			) : (
				<div className="space-y-8">
					{grouped.map(([key, date, dayMatches]) => {
						const predictedCount = dayMatches.filter((m) =>
							predMap?.has(m._id),
						).length;
						return (
							<section key={key} className="space-y-3">
								<DayHeader
									date={date}
									totalMatches={dayMatches.length}
									predictedMatches={predictedCount}
								/>
								<div
									className="stagger-children space-y-3"
									style={{ ["--d" as string]: "60ms" }}
								>
									{dayMatches.map((m, i) => (
										<div key={m._id} style={{ ["--i" as string]: i }}>
											<Scorecard
												match={m}
												prediction={
													predMap ? (predMap.get(m._id) ?? null) : undefined
												}
												readOnly={tab === "mine"}
											/>
										</div>
									))}
								</div>
							</section>
						);
					})}
				</div>
			)}
		</div>
	);
}

function EmptyByTab({ tab }: { tab: "rodada" | "mine" }) {
	const config: Record<
		"rodada" | "mine",
		{ icon: React.ElementType; title: string; desc: string }
	> = {
		rodada: {
			icon: CalendarOff,
			title: "Sem jogos nesta rodada",
			desc: "Quando a tabela do Brasileirão trouxer os próximos jogos, eles aparecem aqui.",
		},
		mine: {
			icon: ListChecks,
			title: "Nenhum palpite em jogo ainda",
			desc: "Assim que um palpite fecha (1h antes do jogo), ele aparece aqui fixo para você conferir — e o resultado quando o jogo encerra.",
		},
	};
	const { icon: Icon, title, desc } = config[tab];
	return (
		<div className="flex flex-col items-center gap-3 rounded-[28px] border border-[var(--b-border-md)] border-dashed bg-[var(--b-card)] p-12 text-center">
			<Icon className="h-10 w-10 text-[var(--b-text-4)]" />
			<p className="font-bold font-display text-[var(--b-text)] text-lg uppercase tracking-tight">
				{title}
			</p>
			<p className="max-w-md text-[var(--b-text-3)] text-sm leading-relaxed">
				{desc}
			</p>
		</div>
	);
}
