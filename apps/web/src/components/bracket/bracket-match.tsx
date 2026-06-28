"use client";

import type { ResolvedGame, ResolvedSide } from "@/lib/knockout";
import { translateTeamName } from "@/lib/team-translations";

type BracketMatchProps = {
	game?: ResolvedGame;
	/** Placeholder de coluna ainda sem jogo (ex.: fase mais à frente). */
	placeholder?: boolean;
};

function isLive(status?: string) {
	return status === "LIVE" || status === "IN_PLAY" || status === "PAUSED";
}

export function BracketMatch({ game, placeholder }: BracketMatchProps) {
	if (!game || placeholder) {
		return (
			<div className="rounded-2xl border border-[var(--b-border-sm)] border-dashed bg-[var(--b-card)] p-3 opacity-70">
				<div className="space-y-1.5">
					<EmptyRow />
					<EmptyRow />
				</div>
				<p className="mt-3 text-[var(--b-text-4)] text-xs">A definir</p>
			</div>
		);
	}

	const showScore =
		game.status === "FINISHED" ||
		(isLive(game.status) && game.homeScore != null);
	const hs = game.homeScore;
	const as = game.awayScore;
	// Em empate de 90 min, quem avança é decidido na prorrogação/pênaltis (winner).
	const homeWon =
		showScore &&
		hs != null &&
		as != null &&
		(hs > as || (hs === as && game.winner === "HOME_TEAM"));
	const awayWon =
		showScore &&
		hs != null &&
		as != null &&
		(as > hs || (hs === as && game.winner === "AWAY_TEAM"));
	const overtimeTag =
		game.status === "FINISHED" && game.duration === "PENALTY_SHOOTOUT"
			? "pên"
			: game.status === "FINISHED" && game.duration === "EXTRA_TIME"
				? "pror"
				: null;

	return (
		<div className="rounded-2xl border border-[var(--b-border-sm)] bg-[var(--b-card)] p-3 shadow-[0_16px_34px_-30px_rgba(0,0,0,0.35)]">
			<div className="space-y-1.5">
				<TeamRow
					side={game.home}
					score={game.homeScore}
					showScore={showScore}
					won={homeWon}
					lost={awayWon}
				/>
				<TeamRow
					side={game.away}
					score={game.awayScore}
					showScore={showScore}
					won={awayWon}
					lost={homeWon}
				/>
			</div>

			<p className="mt-3 flex items-center justify-between gap-2 text-[var(--b-text-3)] text-xs">
				<span className="truncate">
					{formatMatchDate(game.utcDate)}
					{game.venue ? ` · ${game.venue}` : null}
				</span>
				<span className="flex shrink-0 items-center gap-1.5">
					{overtimeTag && (
						<span
							className="rounded-full px-1.5 py-px font-bold text-[9px] uppercase tracking-wide"
							style={{
								background: "var(--b-warning-bg)",
								color: "var(--b-warning-fg)",
							}}
							title="Decidido fora dos 90 min. Palpites contam só os 90 minutos."
						>
							{overtimeTag}
						</span>
					)}
					<span className="font-mono text-[10px] text-[var(--b-text-4)] tabular-nums">
						J{game.no}
					</span>
				</span>
			</p>
		</div>
	);
}

function TeamRow({
	side,
	score,
	showScore,
	won,
	lost,
}: {
	side: ResolvedSide;
	score?: number | null;
	showScore: boolean;
	won?: boolean;
	lost?: boolean;
}) {
	const isTeam = side.type === "team";
	const label = isTeam
		? (side.team.tla ?? side.team.shortName.slice(0, 3).toUpperCase())
		: side.shortLabel;
	const fullName = isTeam ? translateTeamName(side.team.shortName) : side.label;

	return (
		<div
			className="flex min-h-8 items-center gap-2 rounded-xl bg-[var(--b-tint-sm)] px-2 py-1.5"
			title={fullName}
		>
			{isTeam && side.team.crest ? (
				<img
					src={side.team.crest}
					alt={fullName}
					className="h-[14px] w-5 shrink-0 rounded-[2px] object-cover outline outline-1 outline-[rgba(0,0,0,0.1)] dark:outline-[rgba(255,255,255,0.1)]"
				/>
			) : (
				<span className="h-[14px] w-5 shrink-0 rounded-[2px] bg-[var(--b-tint-md)]" />
			)}
			<span
				className={
					isTeam
						? "min-w-0 flex-1 truncate font-bold font-display text-[var(--b-text)] text-sm uppercase leading-none tracking-tight"
						: "min-w-0 flex-1 truncate text-[var(--b-text-4)] text-xs"
				}
			>
				{label}
			</span>
			{showScore ? (
				<span
					className={[
						"font-bold font-mono text-sm tabular-nums",
						won
							? "text-[var(--b-text)]"
							: lost
								? "text-[var(--b-text-3)]"
								: "text-[var(--b-text)]",
					].join(" ")}
				>
					{score ?? "-"}
				</span>
			) : null}
		</div>
	);
}

function EmptyRow() {
	return (
		<div className="flex min-h-8 items-center gap-2 rounded-xl bg-[var(--b-tint-sm)] px-2 py-1.5">
			<span className="h-[14px] w-5 shrink-0 rounded-[2px] bg-[var(--b-tint-md)]" />
			<span className="min-w-0 flex-1 text-[var(--b-text-4)] text-sm">
				A definir
			</span>
		</div>
	);
}

function formatMatchDate(iso: string) {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}
