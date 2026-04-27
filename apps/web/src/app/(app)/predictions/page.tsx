"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useMemo, useState } from "react";

import { MatchCard } from "@/components/match-card";
import { useTournament } from "@/contexts/tournament-context";
import { groupByRound } from "@/lib/match-grouping";

type Match = FunctionReturnType<typeof api.matches.getAllByDate>[number];

function DemoTutorial() {
	const steps = [
		{
			icon: "1",
			title: "Escolha um placar",
			desc: "Use os botões + e − para definir o resultado que você acha que vai acontecer em cada jogo.",
		},
		{
			icon: "2",
			title: "Salve seu palpite",
			desc: 'Clique em "Salvar" para confirmar. Você pode alterar o palpite até 1 hora antes do jogo começar.',
		},
		{
			icon: "3",
			title: "Ganhe pontos",
			desc: "Acertou o placar exato? 10 pts. Acertou o resultado (vitória/empate)? Até 7 pts. Errou? 0 pts.",
		},
		{
			icon: "4",
			title: "Dispute em ligas",
			desc: 'Crie ou entre em uma liga na aba "Ligas" para competir com seus amigos em tempo real.',
		},
	];

	return (
		<div
			className="mb-6 rounded-2xl p-5"
			style={{
				background: "var(--b-brand-10)",
				border: "1px solid var(--b-brand-12)",
			}}
		>
			<div className="mb-4 flex items-center gap-2">
				<span className="text-lg">🏆</span>
				<p
					className="font-bold font-display text-sm uppercase tracking-widest"
					style={{ color: "var(--b-brand)" }}
				>
					Como funciona — Modo Demonstração
				</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				{steps.map((s) => (
					<div key={s.icon} className="flex gap-3">
						<div
							className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-xs"
							style={{
								background: "var(--b-brand)",
								color: "var(--b-brand-fg)",
							}}
						>
							{s.icon}
						</div>
						<div>
							<p
								className="font-semibold text-sm"
								style={{ color: "var(--b-text)" }}
							>
								{s.title}
							</p>
							<p
								className="text-xs leading-relaxed"
								style={{ color: "var(--b-text-3)" }}
							>
								{s.desc}
							</p>
						</div>
					</div>
				))}
			</div>
			<p className="mt-4 text-xs" style={{ color: "var(--b-text-4)" }}>
				Este é um torneio fictício. Troque para Copa do Mundo 2026 ou
				Brasileirão no seletor acima para jogar de verdade.
			</p>
		</div>
	);
}

export default function PredictionsPage() {
	const { tournament } = useTournament();
	const matches = useQuery(api.matches.getAllByDate, { tournament });
	const allPredictions = useQuery(api.predictions.getUserPredictions);
	const [tab, setTab] = useState<"upcoming" | "history">("upcoming");

	const predMap = useMemo(() => {
		if (!allPredictions) return undefined;
		return new Map(allPredictions.map((p) => [p.matchId as string, p]));
	}, [allPredictions]);

	const grouped =
		matches === undefined
			? null
			: groupByRound(matches.filter((m): m is NonNullable<Match> => m !== null))
					.filter(
						([, , roundMatches]) =>
							!roundMatches.every((m) => m.status === "FINISHED"),
					)
					.sort(([, , a], [, , b]) => {
						const aFinished = a.every((m) => m.status === "FINISHED");
						const bFinished = b.every((m) => m.status === "FINISHED");
						if (aFinished !== bFinished) return aFinished ? 1 : -1;
						const aDetermined = a.some((m) => m.status === "TIMED");
						const bDetermined = b.some((m) => m.status === "TIMED");
						if (aDetermined !== bDetermined) return aDetermined ? -1 : 1;
						const timeA = new Date(a[0].utcDate).getTime();
						const timeB = new Date(b[0].utcDate).getTime();
						return aFinished ? timeB - timeA : timeA - timeB;
					});

	const pastGrouped = useMemo(() => {
		if (matches === undefined || predMap === undefined) return null;
		const finishedWithPrediction = matches
			.filter((m): m is NonNullable<Match> => m !== null)
			.filter((m) => m.status === "FINISHED" && predMap.has(m._id));
		return groupByRound(finishedWithPrediction).sort(
			([, , a], [, , b]) =>
				new Date(b[0].utcDate).getTime() - new Date(a[0].utcDate).getTime(),
		);
	}, [matches, predMap]);

	const tabStyle = (active: boolean): React.CSSProperties => ({
		flex: 1,
		borderRadius: "14px",
		padding: "8px 16px",
		fontWeight: 700,
		fontSize: "11px",
		textTransform: "uppercase",
		letterSpacing: "0.1em",
		transition: "color 0.15s, background 0.15s",
		background: active ? "var(--b-card)" : "transparent",
		color: active ? "var(--b-brand)" : "var(--b-text-4)",
		border: "none",
		cursor: "pointer",
	});

	return (
		<div className="space-y-2">
			<div className="mb-4">
				<h1
					className="font-black font-display text-3xl uppercase leading-tight tracking-tight"
					style={{ color: "var(--b-text)" }}
				>
					Palpites
				</h1>
				<p className="text-sm" style={{ color: "var(--b-text-3)" }}>
					Palpites se fecham 1 hora antes de cada jogo
				</p>
			</div>

			<div
				className="mb-4 flex gap-1 rounded-2xl p-1"
				style={{ background: "var(--b-inner)" }}
			>
				<button
					type="button"
					style={tabStyle(tab === "upcoming")}
					onClick={() => setTab("upcoming")}
				>
					Palpites
				</button>
				<button
					type="button"
					style={tabStyle(tab === "history")}
					onClick={() => setTab("history")}
				>
					Meus Palpites
				</button>
			</div>

			{tab === "upcoming" && (
				<>
					{tournament === "DEMO" && <DemoTutorial />}

					{grouped === null ? (
						<div className="space-y-6">
							{[1, 2, 3].map((i) => (
								<div key={i} className="space-y-3">
									<Skeleton className="h-5 w-40 rounded-md" />
									<Skeleton className="h-36 rounded-2xl" />
									<Skeleton className="h-36 rounded-2xl" />
								</div>
							))}
						</div>
					) : grouped.length === 0 ? (
						<div
							className="rounded-2xl p-12 text-center"
							style={{
								background: "var(--b-card)",
								border: "1px solid var(--b-border)",
							}}
						>
							<p style={{ color: "var(--b-text-3)" }}>
								Nenhum jogo agendado ainda
							</p>
						</div>
					) : (
						<div className="space-y-8">
							{grouped.map(([key, label, roundMatches]) => (
								<div key={key}>
									<div className="mb-3 flex items-center gap-3">
										<h2
											className="font-bold font-display text-sm uppercase tracking-widest"
											style={{ color: "var(--b-brand)" }}
										>
											{label}
										</h2>
										<div
											className="h-px flex-1"
											style={{ background: "var(--b-border)" }}
										/>
										<span
											className="font-medium text-xs"
											style={{ color: "var(--b-text-4)" }}
										>
											{roundMatches.length}{" "}
											{roundMatches.length === 1 ? "jogo" : "jogos"}
										</span>
									</div>
									<div className="space-y-3">
										{roundMatches.map((m) => (
											<MatchCard
												key={m._id}
												match={m}
												prediction={
													predMap ? (predMap.get(m._id) ?? null) : undefined
												}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}

			{tab === "history" && (
				<>
					{pastGrouped === null ? (
						<div className="space-y-6">
							{[1, 2].map((i) => (
								<div key={i} className="space-y-3">
									<Skeleton className="h-5 w-40 rounded-md" />
									<Skeleton className="h-36 rounded-2xl" />
									<Skeleton className="h-36 rounded-2xl" />
								</div>
							))}
						</div>
					) : pastGrouped.length === 0 ? (
						<div
							className="rounded-2xl p-12 text-center"
							style={{
								background: "var(--b-card)",
								border: "1px solid var(--b-border)",
							}}
						>
							<p
								className="font-semibold text-sm"
								style={{ color: "var(--b-text-3)" }}
							>
								Nenhum palpite registrado ainda
							</p>
							<p className="mt-1 text-xs" style={{ color: "var(--b-text-4)" }}>
								Seus palpites de jogos encerrados aparecerão aqui.
							</p>
						</div>
					) : (
						<div className="space-y-8">
							{pastGrouped.map(([key, label, roundMatches]) => (
								<div key={key}>
									<div className="mb-3 flex items-center gap-3">
										<h2
											className="font-bold font-display text-sm uppercase tracking-widest"
											style={{ color: "var(--b-brand)" }}
										>
											{label}
										</h2>
										<div
											className="h-px flex-1"
											style={{ background: "var(--b-border)" }}
										/>
										<span
											className="font-medium text-xs"
											style={{ color: "var(--b-text-4)" }}
										>
											{roundMatches.length}{" "}
											{roundMatches.length === 1 ? "palpite" : "palpites"}
										</span>
									</div>
									<div className="space-y-3">
										{roundMatches.map((m) => (
											<MatchCard
												key={m._id}
												match={m}
												prediction={predMap?.get(m._id) ?? null}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
