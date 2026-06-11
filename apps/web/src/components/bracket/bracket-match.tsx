"use client";

type BracketTeam = {
	name: string;
	shortName: string;
	crest: string;
	tla?: string;
} | null;

type BracketMatchData = {
	homeTeam?: BracketTeam;
	awayTeam?: BracketTeam;
	homeScore?: number;
	awayScore?: number;
	status: string;
	utcDate?: string;
	venue?: string;
};

type BracketMatchProps = {
	match?: BracketMatchData;
};

export function BracketMatch({ match }: BracketMatchProps) {
	const showScore =
		match?.status === "FINISHED" ||
		match?.status === "LIVE" ||
		match?.status === "IN_PLAY" ||
		match?.status === "PAUSED";
	const homeWon =
		showScore &&
		match?.homeScore != null &&
		match.awayScore != null &&
		match.homeScore > match.awayScore;
	const awayWon =
		showScore &&
		match?.homeScore != null &&
		match.awayScore != null &&
		match.awayScore > match.homeScore;

	return (
		<div className="rounded-2xl border border-[var(--b-border-sm)] bg-[var(--b-card)] p-3 shadow-[0_16px_34px_-30px_rgba(0,0,0,0.35)]">
			<div className="space-y-1.5">
				<TeamRow
					team={match?.homeTeam ?? null}
					score={match?.homeScore}
					showScore={showScore}
					won={homeWon}
					lost={awayWon}
				/>
				<TeamRow
					team={match?.awayTeam ?? null}
					score={match?.awayScore}
					showScore={showScore}
					won={awayWon}
					lost={homeWon}
				/>
			</div>

			{match?.utcDate || match?.venue ? (
				<p className="mt-3 truncate text-[var(--b-text-3)] text-xs">
					{match.utcDate ? formatMatchDate(match.utcDate) : null}
					{match.utcDate && match.venue ? " · " : null}
					{match.venue}
				</p>
			) : (
				<p className="mt-3 text-[var(--b-text-4)] text-xs">A definir</p>
			)}
		</div>
	);
}

function TeamRow({
	team,
	score,
	showScore,
	won,
	lost,
}: {
	team: BracketTeam;
	score?: number;
	showScore: boolean;
	won?: boolean;
	lost?: boolean;
}) {
	const label = team?.tla ?? team?.shortName.slice(0, 3).toUpperCase();

	return (
		<div className="flex min-h-8 items-center gap-2 rounded-xl bg-[var(--b-tint-sm)] px-2 py-1.5">
			{team?.crest ? (
				<img
					src={team.crest}
					alt={team.name}
					className="h-[14px] w-5 shrink-0 rounded-[2px] object-cover outline outline-1 outline-[rgba(0,0,0,0.1)] dark:outline-[rgba(255,255,255,0.1)]"
				/>
			) : (
				<span className="h-[14px] w-5 shrink-0 rounded-[2px] bg-[var(--b-tint-md)]" />
			)}
			<span
				className={
					team
						? "min-w-0 flex-1 font-bold font-display text-[var(--b-text)] text-sm uppercase leading-none tracking-tight"
						: "min-w-0 flex-1 text-[var(--b-text-4)] text-sm"
				}
			>
				{team ? label : "A definir"}
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

function formatMatchDate(iso: string) {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}
