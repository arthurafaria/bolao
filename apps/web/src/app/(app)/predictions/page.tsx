"use client";

import { api } from "@bolao/backend/convex/_generated/api";
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
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { CalendarOff, History, HelpCircle, Target, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import { DayHeader } from "@/components/match/day-header";
import { Scorecard } from "@/components/match/scorecard";
import { useTournament } from "@/contexts/tournament-context";

type Match = NonNullable<FunctionReturnType<typeof api.matches.getAllByDate>[number]>;

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
			(a, b) =>
				new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
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
			(m) =>
				m.stage === first.stage && m.matchday === first.matchday,
		);
	}

	return sorted.filter((m) => dayKey(m.utcDate) === dayKey(first.utcDate));
}

function DemoBanner() {
	return (
		<div className="flex items-center gap-3 rounded-2xl border border-[var(--b-warning-fg)]/20 bg-[var(--b-warning-bg)] px-4 py-2.5 text-[var(--b-warning-fg)]">
			<span className="text-base">🎮</span>
			<div className="flex-1 text-xs leading-snug">
				<span className="font-bold uppercase tracking-wider">
					Modo Demonstração
				</span>{" "}
				— torneio fictício pra você testar. Troque pra Copa ou Brasileirão no
				seletor acima.
			</div>
		</div>
	);
}

function DemoTutorialSheet() {
	const steps = [
		{
			n: 1,
			title: "Escolha um placar",
			desc: "Use os botões + e − para definir o resultado que você acha que vai acontecer em cada jogo.",
		},
		{
			n: 2,
			title: "Salve seu palpite",
			desc: "Clique em \"Salvar palpite\" para confirmar. Você pode alterar até 1 hora antes do jogo começar.",
		},
		{
			n: 3,
			title: "Ganhe pontos",
			desc: "Acertou o placar exato? 10 pts. Acertou o resultado? Até 7 pts. Errou? 0 pts.",
		},
		{
			n: 4,
			title: "Dispute em ligas",
			desc: "Crie ou entre em uma liga em \"Ligas\" para competir com seus amigos em tempo real.",
		},
	];
	return (
		<Sheet>
			<SheetTrigger
				render={
					<button
						type="button"
						className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--b-border-md)] bg-[var(--b-card)] text-[var(--b-brand)] transition-[transform,background] duration-[var(--motion-fast)] hover:bg-[var(--b-brand-12)] active:scale-[0.94]"
						aria-label="Como funciona"
					/>
				}
			>
				<HelpCircle className="h-4 w-4" />
			</SheetTrigger>
			<SheetContent side="right" className="bg-[var(--b-card)]">
				<SheetHeader className="px-6 pt-6">
					<SheetTitle className="font-black font-display text-2xl uppercase tracking-tight text-[var(--b-text)]">
						Como funciona
					</SheetTitle>
					<SheetDescription className="text-[var(--b-text-3)] text-sm">
						Quatro passos pra dominar o bolão.
					</SheetDescription>
				</SheetHeader>
				<div className="flex flex-col gap-4 px-6 py-4">
					{steps.map((s, i) => (
						<div
							key={s.n}
							className="flex animate-slide-up gap-3"
							style={{ animationDelay: `${i * 60}ms` }}
						>
							<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--b-brand)] font-black font-display text-[var(--b-brand-fg)] text-base">
								{s.n}
							</span>
							<div className="flex flex-col gap-0.5">
								<p className="font-bold font-display text-[var(--b-text)] text-sm uppercase tracking-tight">
									{s.title}
								</p>
								<p className="text-[var(--b-text-3)] text-xs leading-relaxed">
									{s.desc}
								</p>
							</div>
						</div>
					))}
				</div>
			</SheetContent>
		</Sheet>
	);
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
			(a, b) =>
				new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
		);
		if (tab === "history") list.reverse();
		return list;
	}, [activeMatches, tab]);

	const grouped = useMemo(
		() => (sortedActive.length === 0 ? [] : groupByDay(sortedActive)),
		[sortedActive],
	);

	const isLoading = matches === undefined || predMap === undefined;

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Header */}
			<header className="flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-col">
					<span className="text-eyebrow text-[var(--b-brand)]">
						Sua mesa de palpites
					</span>
					<h1 className="font-black font-display text-4xl uppercase leading-[0.9] tracking-tight text-[var(--b-text)] sm:text-5xl">
						Palpites
					</h1>
					<p className="mt-1 text-[var(--b-text-3)] text-sm">
						Palpites se fecham 1h antes de cada jogo. Boa sorte.
					</p>
				</div>
				{tournament === "DEMO" && <DemoTutorialSheet />}
			</header>

			{tournament === "DEMO" && <DemoBanner />}

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
			) : grouped.length === 0 ? (
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
		<div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-[var(--b-border-md)] bg-[var(--b-card)] p-12 text-center">
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
