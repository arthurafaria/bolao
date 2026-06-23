"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { PillTabs } from "@bolao/ui/components/pill-tabs";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
	CalendarDays,
	CalendarOff,
	LayoutGrid,
	ListChecks,
	Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";

import { DayHeader } from "@/components/match/day-header";
import { Scorecard } from "@/components/match/scorecard";
import { useTournament } from "@/contexts/tournament-context";
import { groupByGroup } from "@/lib/match-grouping";

type Match = NonNullable<
	FunctionReturnType<typeof api.matches.getAllByDate>[number]
>;

type FilterTab = "upcoming" | "mine";
type UpcomingMode = "consecutivos" | "grupo";

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

export default function PredictionsPage() {
	const { tournament } = useTournament();
	const matches = useQuery(api.matches.getAllByDate, { tournament });
	const allPredictions = useQuery(api.predictions.getUserPredictions);
	const [tab, setTab] = useState<FilterTab>("upcoming");
	const [upcomingMode, setUpcomingMode] =
		useState<UpcomingMode>("consecutivos");

	const predMap = useMemo(() => {
		if (!allPredictions) return undefined;
		return new Map(allPredictions.map((p) => [p.matchId as string, p]));
	}, [allPredictions]);

	const cleanedMatches = useMemo(
		() => matches?.filter((m): m is Match => m !== null) ?? [],
		[matches],
	);

	const now = Date.now();

	const allUpcomingMatches = useMemo(
		() =>
			cleanedMatches.filter(
				(m) =>
					m.status !== "FINISHED" &&
					(m.status === "TIMED" || m.status === "SCHEDULED"),
			),
		[cleanedMatches],
	);

	const sortedUpcoming = useMemo(
		() =>
			[...allUpcomingMatches].sort(
				(a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
			),
		[allUpcomingMatches],
	);

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

	// Próximos: dois modos — jogos consecutivos (por dia) ou por grupo.
	const upcomingByDay = useMemo(
		() => groupByDay(sortedUpcoming),
		[sortedUpcoming],
	);

	const groupStageUpcoming = useMemo(
		() => sortedUpcoming.filter((m) => Boolean(m.group)),
		[sortedUpcoming],
	);

	const canGroupView = tournament === "WC2026" && groupStageUpcoming.length > 0;

	const effectiveMode: UpcomingMode =
		upcomingMode === "grupo" && canGroupView ? "grupo" : "consecutivos";

	const upcomingByGroup = useMemo(
		() => (canGroupView ? groupByGroup(groupStageUpcoming) : []),
		[canGroupView, groupStageUpcoming],
	);

	const isLoading = matches === undefined || predMap === undefined;

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
						value: "upcoming",
						label: "Próximos",
						icon: Trophy,
						count: sortedUpcoming.length,
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

			{/* Sub-toggle de visualização (apenas em "Próximos", com fase de grupos) */}
			{tab === "upcoming" && canGroupView && !isLoading ? (
				<PillTabs
					size="sm"
					items={[
						{
							value: "consecutivos",
							label: "Jogos consecutivos",
							icon: CalendarDays,
						},
						{ value: "grupo", label: "Por grupo", icon: LayoutGrid },
					]}
					value={effectiveMode}
					onChange={(v) => setUpcomingMode(v)}
					aria-label="Modo de visualização dos próximos jogos"
				/>
			) : null}

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
			) : tab === "upcoming" ? (
				sortedUpcoming.length === 0 ? (
					<EmptyByTab tab="upcoming" />
				) : effectiveMode === "grupo" ? (
					<div className="space-y-8">
						<div className="flex flex-wrap items-end justify-between gap-3">
							<div className="flex flex-col">
								<span className="text-[var(--b-brand)] text-eyebrow">
									Fase de grupos
								</span>
								<h2 className="text-balance font-black font-display text-2xl text-[var(--b-text)] uppercase leading-none tracking-tight sm:text-3xl">
									Palpite por grupo
								</h2>
							</div>
							<span className="font-mono font-semibold text-[var(--b-text-4)] text-xs tabular-nums">
								{groupStageUpcoming.length} jogos
							</span>
						</div>

						<div className="space-y-6">
							{upcomingByGroup.map(([group, groupMatches]) => {
								const predictedCount = groupMatches.filter((m) =>
									predMap?.has(m._id),
								).length;
								return (
									<section key={group} className="space-y-3">
										<GroupHeader
											group={group}
											totalMatches={groupMatches.length}
											predictedMatches={predictedCount}
										/>
										<div
											className="stagger-children space-y-3"
											style={{ ["--d" as string]: "60ms" }}
										>
											{groupMatches.map((m, i) => (
												<div key={m._id} style={{ ["--i" as string]: i }}>
													<Scorecard
														match={m}
														prediction={
															predMap ? (predMap.get(m._id) ?? null) : undefined
														}
													/>
												</div>
											))}
										</div>
									</section>
								);
							})}
						</div>
					</div>
				) : (
					<div className="space-y-8">
						{upcomingByDay.map(([key, date, dayMatches]) => {
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
												/>
											</div>
										))}
									</div>
								</section>
							);
						})}
					</div>
				)
			) : sortedActive.length === 0 ? (
				<EmptyByTab tab={tab} />
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

function GroupHeader({
	group,
	totalMatches,
	predictedMatches,
}: {
	group: string;
	totalMatches: number;
	predictedMatches: number;
}) {
	const allDone = predictedMatches >= totalMatches;
	const anyDone = predictedMatches > 0;
	const pct = totalMatches > 0 ? (predictedMatches / totalMatches) * 100 : 0;

	return (
		<div className="relative flex flex-col gap-2 overflow-hidden rounded-[20px] bg-[var(--b-card)] px-4 py-3 shadow-[0_14px_34px_-28px_rgba(0,0,0,0.35)]">
			{/* Marca d'água do grupo */}
			<span
				aria-hidden
				className="pointer-events-none absolute -top-2 -right-3 select-none font-black font-display uppercase leading-none"
				style={{
					fontSize: "clamp(3rem, 10vw, 4.5rem)",
					color: "var(--b-text)",
					opacity: 0.04,
					letterSpacing: "-0.04em",
				}}
			>
				{group}
			</span>
			<div className="flex items-end justify-between gap-3">
				<div className="flex items-baseline gap-2">
					<span className="text-[var(--b-brand)] text-eyebrow">Grupo</span>
					<span className="font-black font-display text-3xl text-[var(--b-text)] uppercase leading-none tracking-tight">
						{group}
					</span>
				</div>
				<span
					className={[
						"font-mono font-semibold text-xs tabular-nums",
						allDone
							? "text-[var(--b-success)]"
							: anyDone
								? "text-[var(--b-warning-fg)]"
								: "text-[var(--b-text-3)]",
					].join(" ")}
				>
					{predictedMatches}/{totalMatches} palpitados
				</span>
			</div>
			<div
				aria-hidden
				className="h-0.5 w-full overflow-hidden rounded-full bg-[var(--b-tint-md)]"
			>
				<div
					className="h-full rounded-full transition-[width] duration-[var(--motion-medium)] ease-[var(--ease-out-expo)]"
					style={{
						width: `${pct}%`,
						background: allDone
							? "var(--b-success)"
							: anyDone
								? "var(--b-warning)"
								: "var(--b-brand)",
					}}
				/>
			</div>
		</div>
	);
}

function EmptyByTab({ tab }: { tab: FilterTab }) {
	const config: Record<
		FilterTab,
		{ icon: React.ElementType; title: string; desc: string }
	> = {
		upcoming: {
			icon: CalendarOff,
			title: "Sem jogos por enquanto",
			desc: "Quando a próxima janela do torneio entrar no ar, os jogos aparecem aqui.",
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
