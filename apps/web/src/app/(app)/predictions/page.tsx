"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { PillTabs } from "@bolao/ui/components/pill-tabs";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { CalendarOff, History, Target, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import { DayHeader } from "@/components/match/day-header";
import { Scorecard } from "@/components/match/scorecard";
import { useTournament } from "@/contexts/tournament-context";
import { groupByGroup, roundLabel } from "@/lib/match-grouping";

type Match = NonNullable<
	FunctionReturnType<typeof api.matches.getAllByDate>[number]
>;

type FilterTab = "pending" | "upcoming" | "history";

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

function getNextRoundMatches(matches: Match[]): Match[] {
	const sorted = [...matches].sort(
		(a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
	);
	const first = sorted[0];
	if (!first) return [];

	if (first.matchday != null) {
		return sorted.filter(
			(m) => m.stage === first.stage && m.matchday === first.matchday,
		);
	}

	return sorted.filter((m) => dayKey(m.utcDate) === dayKey(first.utcDate));
}

export default function PredictionsPage() {
	const { tournament } = useTournament();
	const matches = useQuery(api.matches.getAllByDate, { tournament });
	const allPredictions = useQuery(api.predictions.getUserPredictions);
	const [tab, setTab] = useState<FilterTab>("upcoming");

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

	const upcomingMatches = useMemo(
		() => getNextRoundMatches(allUpcomingMatches),
		[allUpcomingMatches],
	);

	const pendingMatches = useMemo(
		() =>
			allUpcomingMatches.filter((m) => {
				if (!predMap) return false;
				const lockTime = new Date(m.utcDate).getTime() - LOCK_MS;
				return now < lockTime && !predMap.has(m._id);
			}),
		[allUpcomingMatches, predMap, now],
	);

	const historyMatches = useMemo(
		() =>
			cleanedMatches.filter(
				(m) => m.status === "FINISHED" && predMap?.has(m._id),
			),
		[cleanedMatches, predMap],
	);

	const activeMatches =
		tab === "pending"
			? pendingMatches
			: tab === "history"
				? historyMatches
				: upcomingMatches;

	const sortedActive = useMemo(() => {
		const list = [...activeMatches];
		list.sort(
			(a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
		);
		if (tab === "history") list.reverse();
		return list;
	}, [activeMatches, tab]);

	const grouped = useMemo(
		() => (sortedActive.length === 0 ? [] : groupByDay(sortedActive)),
		[sortedActive],
	);

	const showWorldCupGroups =
		tournament === "WC2026" &&
		tab === "upcoming" &&
		sortedActive.length > 0 &&
		sortedActive.every((m) => Boolean(m.group));

	const groupedByGroup = useMemo(
		() => (showWorldCupGroups ? groupByGroup(sortedActive) : []),
		[showWorldCupGroups, sortedActive],
	);

	const roundTitle =
		showWorldCupGroups && sortedActive[0] ? roundLabel(sortedActive[0]) : null;

	const todayMatches = useMemo(() => {
		if (tournament !== "WC2026" || tab !== "upcoming") return [];
		const today = dayKey(new Date().toISOString());
		return cleanedMatches
			.filter((m) => dayKey(m.utcDate) === today && m.status !== "FINISHED")
			.sort(
				(a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
			);
	}, [cleanedMatches, tab, tournament]);

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
						count: upcomingMatches.length,
					},
					{
						value: "pending",
						label: "Pendentes",
						icon: Target,
						count: pendingMatches.length,
					},
					{
						value: "history",
						label: "Histórico",
						icon: History,
						count: historyMatches.length,
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
			) : sortedActive.length === 0 ? (
				<EmptyByTab tab={tab} />
			) : showWorldCupGroups ? (
				<div className="space-y-8">
					{todayMatches.length > 0 ? (
						<section className="space-y-3">
							<div className="flex flex-wrap items-end justify-between gap-3">
								<div className="flex flex-col">
									<span className="text-[var(--b-brand)] text-eyebrow">
										Hoje no gramado
									</span>
									<h2 className="text-balance font-black font-display text-2xl text-[var(--b-text)] uppercase leading-none tracking-tight sm:text-3xl">
										Jogos do dia
									</h2>
								</div>
								<span className="font-mono font-semibold text-[var(--b-text-3)] text-xs tabular-nums">
									{todayMatches.length} jogos
								</span>
							</div>
							<div
								className="field-texture rounded-[28px] p-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]"
								style={{ background: "var(--g-hero-match)" }}
							>
								<div
									className="stagger-children space-y-3"
									style={{ ["--d" as string]: "60ms" }}
								>
									{todayMatches.map((m, i) => (
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
							</div>
						</section>
					) : null}

					<div className="flex flex-wrap items-end justify-between gap-3">
						<div className="flex flex-col">
							<span className="text-[var(--b-brand)] text-eyebrow">
								Fase de grupos
							</span>
							<h2 className="text-balance font-black font-display text-2xl text-[var(--b-text)] uppercase leading-none tracking-tight sm:text-3xl">
								{roundTitle}
							</h2>
						</div>
						<span className="font-mono font-semibold text-[var(--b-text-3)] text-xs tabular-nums">
							{sortedActive.length} jogos
						</span>
					</div>

					<div className="space-y-6">
						{groupedByGroup.map(([group, groupMatches]) => {
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
												readOnly={tab === "history"}
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
				className="pointer-events-none absolute -right-3 -top-2 font-black font-display leading-none uppercase select-none"
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
		pending: {
			icon: Target,
			title: "Tudo em dia!",
			desc: "Você palpitou em todos os jogos abertos. Volte quando entrarem novos jogos na agenda.",
		},
		upcoming: {
			icon: CalendarOff,
			title: "Sem jogos por enquanto",
			desc: "Quando a próxima janela do torneio entrar no ar, os jogos aparecem aqui.",
		},
		history: {
			icon: History,
			title: "Sem histórico ainda",
			desc: "Seus palpites de jogos encerrados aparecerão aqui depois que o resultado sair.",
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
