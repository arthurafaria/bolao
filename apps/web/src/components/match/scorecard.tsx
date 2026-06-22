"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import { cn } from "@bolao/ui/lib/utils";
import { useMutation } from "convex/react";
import { Check, Lock, MapPin } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getCrest } from "@/lib/crest-overrides";
import { getPointsTier } from "@/lib/points-palette";
import { abbreviateTeamName, translateTeamName } from "@/lib/team-translations";
import { LockCountdown } from "./lock-countdown";

type Prediction = {
	_id: Id<"predictions">;
	predictedHome: number;
	predictedAway: number;
	points?: number;
	calculatedAt?: number;
};

type Match = {
	_id: Id<"matches">;
	homeTeam: { name: string; shortName: string; crest: string } | null;
	awayTeam: { name: string; shortName: string; crest: string } | null;
	utcDate: string;
	status: string;
	homeScore?: number;
	awayScore?: number;
	stage: string;
	group?: string;
	matchday?: number;
	venue?: string;
};

interface ScorecardProps {
	match: Match;
	prediction?: Prediction | null;
	readOnly?: boolean;
	compact?: boolean;
	className?: string;
}

function TeamCrest({
	crest,
	name,
	size = 56,
}: {
	crest: string;
	name: string;
	size?: number;
}) {
	const [errored, setErrored] = useState(false);
	if (!errored && crest?.startsWith("http")) {
		return (
			<Image
				src={crest}
				alt={name}
				width={size}
				height={size}
				unoptimized
				className="object-contain drop-shadow-md"
				style={{
					width: size,
					height: size,
					borderRadius: 4,
				}}
				// outline aplicado via CSS para responder ao dark mode
				data-crest="true"
				onError={() => setErrored(true)}
			/>
		);
	}
	return (
		<div
			className="flex items-center justify-center rounded-full font-bold text-sm"
			style={{
				width: size,
				height: size,
				background: "var(--b-brand-12)",
				color: "var(--b-brand)",
			}}
		>
			{name.slice(0, 2).toUpperCase()}
		</div>
	);
}

function ScoreInput({
	value,
	onChange,
	disabled,
	bumpKey,
}: {
	value: number;
	onChange: (v: number) => void;
	disabled: boolean;
	bumpKey: number;
}) {
	const [raw, setRaw] = useState(String(value));

	useEffect(() => {
		setRaw(String(value));
	}, [value]);

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const str = e.target.value.replace(/\D/g, "").slice(0, 2);
		setRaw(str);
		const n = Number.parseInt(str, 10);
		if (!Number.isNaN(n)) onChange(Math.min(20, n));
	};

	const handleBlur = () => {
		const n = Number.parseInt(raw, 10);
		const clamped = Number.isNaN(n) || n < 0 ? 0 : Math.min(20, n);
		setRaw(String(clamped));
		onChange(clamped);
	};

	return (
		<div className="flex items-center gap-1.5">
			<button
				type="button"
				disabled={disabled || value <= 0}
				onClick={() => onChange(Math.max(0, value - 1))}
				className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--b-border-md)] bg-[var(--b-tint-md)] font-bold text-[var(--b-brand)] text-xl leading-none transition-[transform,background-color] duration-[var(--motion-fast)] hover:bg-[var(--b-brand-12)] active:scale-[0.96] disabled:opacity-25 sm:h-11 sm:w-11"
				aria-label="Diminuir placar"
			>
				−
			</button>
			<input
				key={bumpKey}
				type="text"
				inputMode="numeric"
				value={raw}
				onChange={handleInputChange}
				onBlur={handleBlur}
				disabled={disabled}
				className={cn(
					"score-display w-14 bg-transparent text-center text-5xl leading-none outline-none disabled:opacity-40",
					"text-[var(--b-text)]",
					"animate-number-pop",
				)}
				style={{ caretColor: "var(--b-brand)" }}
				aria-label="Placar"
			/>
			<button
				type="button"
				disabled={disabled}
				onClick={() => onChange(Math.min(20, value + 1))}
				className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--b-border-md)] bg-[var(--b-tint-md)] font-bold text-[var(--b-brand)] text-xl leading-none transition-[transform,background-color] duration-[var(--motion-fast)] hover:bg-[var(--b-brand-12)] active:scale-[0.96] disabled:opacity-25 sm:h-11 sm:w-11"
				aria-label="Aumentar placar"
			>
				+
			</button>
		</div>
	);
}

export function Scorecard({
	match,
	prediction,
	readOnly = false,
	compact = false,
	className,
}: ScorecardProps) {
	const upsert = useMutation(api.predictions.upsert);

	const lockTime = new Date(match.utcDate).getTime() - 60 * 60 * 1000;
	const isLocked =
		Date.now() >= lockTime ||
		(match.status !== "TIMED" && match.status !== "SCHEDULED");
	const isFinished = match.status === "FINISHED";
	const isLive =
		match.status === "LIVE" ||
		match.status === "IN_PLAY" ||
		match.status === "PAUSED";

	const [home, setHome] = useState(0);
	const [away, setAway] = useState(0);
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);
	const [justSaved, setJustSaved] = useState(false);
	const [bumpHome, setBumpHome] = useState(0);
	const [bumpAway, setBumpAway] = useState(0);

	useEffect(() => {
		if (prediction !== undefined) {
			setHome(prediction?.predictedHome ?? 0);
			setAway(prediction?.predictedAway ?? 0);
			setDirty(false);
		}
	}, [prediction]);

	const handleChange = useCallback((side: "home" | "away", val: number) => {
		if (side === "home") {
			setHome(val);
			setBumpHome((k) => k + 1);
		} else {
			setAway(val);
			setBumpAway((k) => k + 1);
		}
		setDirty(true);
	}, []);

	const handleSave = useCallback(async () => {
		if (!dirty) return;
		setSaving(true);
		try {
			await upsert({
				matchId: match._id,
				predictedHome: home,
				predictedAway: away,
			});
			setDirty(false);
			setJustSaved(true);
			setTimeout(() => setJustSaved(false), 1200);
			toast.success("Palpite salvo!");
		} catch (err) {
			toast.error((err as Error).message ?? "Erro ao salvar");
		} finally {
			setSaving(false);
		}
	}, [dirty, upsert, match._id, home, away]);

	const matchDate = new Date(match.utcDate);
	const timeStr = matchDate.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const dateStr = matchDate
		.toLocaleDateString("pt-BR", {
			weekday: "short",
			day: "2-digit",
			month: "short",
		})
		.replace(/\./g, "")
		.toUpperCase();
	const groupLetter = match.group?.replace(/^GROUP_/, "") ?? match.group;
	const stageLabel = match.group
		? `GRUPO ${groupLetter}`
		: match.matchday
			? `RODADA ${match.matchday}`
			: match.stage.replace(/_/g, " ");

	const formatName = compact ? abbreviateTeamName : translateTeamName;
	const homeName = formatName(match.homeTeam?.shortName ?? "") || "TBD";
	const awayName = formatName(match.awayTeam?.shortName ?? "") || "TBD";

	const showPredictionScore =
		(readOnly || isFinished) && prediction?.predictedHome != null;

	const tier =
		isFinished && prediction?.points != null
			? getPointsTier(prediction.points)
			: null;

	return (
		<article
			data-just-saved={justSaved || undefined}
			className={cn(
				"group/card relative overflow-hidden rounded-[24px] border border-[var(--b-border-sm)] bg-[var(--b-card)] shadow-[var(--b-shadow-card-soft)]",
				"transition-[transform,box-shadow,filter,opacity] duration-[var(--motion-base)] ease-[var(--ease-out-quart)]",
				!isLocked &&
					"hover:-translate-y-0.5 hover:shadow-[var(--b-shadow-brand-md)]",
				isLocked && !isFinished && !isLive && "opacity-75 saturate-50",
				"data-[just-saved=true]:animate-ring-success",
				className,
			)}
		>
			{/* Top strip — grid 1fr/auto/1fr centraliza a data no eixo do "×" */}
			<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-[var(--b-border-sm)] border-b bg-[var(--b-tint)] px-4 py-2">
				<span className="min-w-0 truncate text-[var(--b-text-3)] text-eyebrow">
					{stageLabel}
				</span>
				<span className="whitespace-nowrap text-center font-medium font-mono text-[10px] text-[var(--b-text-4)] uppercase tabular-nums tracking-wide sm:text-xs">
					{dateStr}
				</span>
				<div className="flex min-w-0 items-center justify-end gap-2">
					<span className="font-mono font-semibold text-[var(--b-text-3)] text-xs tabular-nums">
						{timeStr}
					</span>
					{!isLocked && !isFinished && <LockCountdown kickoff={matchDate} />}
					{isLive && (
						<span className="flex items-center gap-1 font-bold text-[var(--b-danger)] text-eyebrow">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--b-danger)]" />
							Ao vivo
						</span>
					)}
					{isLocked && !isFinished && !isLive && (
						<span className="text-[var(--b-text-4)] text-eyebrow">Fechado</span>
					)}
					{isFinished && (
						<span className="text-[var(--b-success)] text-eyebrow">
							Encerrado
						</span>
					)}
				</div>
			</div>

			{/* Body */}
			<div className="grid grid-cols-2 items-center gap-x-3 gap-y-4 px-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4 sm:gap-y-0 sm:px-6">
				{/* Home team — row 1 col 1 (mobile) | col 1 (desktop) */}
				<div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:gap-3">
					<TeamCrest
						crest={getCrest(
							match.homeTeam?.shortName ?? "",
							match.homeTeam?.crest ?? "",
						)}
						name={homeName}
						size={48}
					/>
					<span
						className="min-w-0 truncate font-bold font-display text-sm uppercase leading-tight tracking-wide sm:text-base"
						style={{ color: "var(--b-text)" }}
					>
						{homeName}
					</span>
				</div>

				{/* Away team — row 1 col 2 (mobile) | col 3 (desktop) */}
				<div className="col-start-2 row-start-1 flex min-w-0 flex-row-reverse items-center gap-2 sm:col-start-3 sm:gap-3">
					<TeamCrest
						crest={getCrest(
							match.awayTeam?.shortName ?? "",
							match.awayTeam?.crest ?? "",
						)}
						name={awayName}
						size={48}
					/>
					<span
						className="min-w-0 truncate text-right font-bold font-display text-sm uppercase leading-tight tracking-wide sm:text-base"
						style={{ color: "var(--b-text)" }}
					>
						{awayName}
					</span>
				</div>

				{/* Center: scores — row 2 col-span-2 (mobile) | col 2 (desktop) */}
				<div className="col-span-2 row-start-2 flex shrink-0 flex-col items-center justify-center gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
					{showPredictionScore && prediction ? (
						<div className="flex items-center gap-3">
							<span className="font-black font-display text-5xl tabular-nums leading-none">
								{prediction.predictedHome}
							</span>
							<span className="text-2xl text-[var(--b-border-md)]">×</span>
							<span className="font-black font-display text-5xl tabular-nums leading-none">
								{prediction.predictedAway}
							</span>
						</div>
					) : isFinished ? (
						<div className="flex items-center gap-3">
							<span className="font-black font-display text-5xl tabular-nums leading-none">
								{match.homeScore ?? "–"}
							</span>
							<span className="text-2xl text-[var(--b-border-md)]">×</span>
							<span className="font-black font-display text-5xl tabular-nums leading-none">
								{match.awayScore ?? "–"}
							</span>
						</div>
					) : (
						<div className="flex items-center gap-1 sm:gap-2">
							<ScoreInput
								value={home}
								onChange={(v) => handleChange("home", v)}
								disabled={isLocked}
								bumpKey={bumpHome}
							/>
							<span className="font-black font-display text-2xl text-[var(--b-border-md)]">
								×
							</span>
							<ScoreInput
								value={away}
								onChange={(v) => handleChange("away", v)}
								disabled={isLocked}
								bumpKey={bumpAway}
							/>
						</div>
					)}
					{isFinished && prediction?.predictedHome != null && (
						<span className="font-medium text-[var(--b-text-3)] text-xs">
							Resultado: {match.homeScore ?? "–"} × {match.awayScore ?? "–"}
						</span>
					)}
					{isLive && (
						<span className="font-bold text-[var(--b-danger)] text-xs">
							Parcial: {match.homeScore ?? 0} × {match.awayScore ?? 0}
						</span>
					)}
				</div>
			</div>

			{/* Footer: action / status */}
			<div className="flex items-center justify-between gap-3 border-[var(--b-border-sm)] border-t bg-[var(--b-tint)] px-4 py-2.5">
				<div className="flex min-w-0 items-center gap-1.5 text-[var(--b-text-3)] text-xs">
					{match.venue && (
						<>
							<MapPin className="h-3 w-3 shrink-0" />
							<span className="truncate">{match.venue}</span>
						</>
					)}
				</div>
				<div className="flex flex-col items-end gap-1">
					<div className="flex items-center gap-2">
						{tier && (
							<span
								className="rounded-full px-2.5 py-1 font-bold text-xs tabular-nums"
								style={{ background: tier.bg, color: tier.color }}
							>
								{tier.label}
							</span>
						)}
						{!isLocked && !readOnly && dirty && (
							<button
								type="button"
								onClick={handleSave}
								disabled={saving}
								className={cn(
									"flex h-10 items-center gap-2 overflow-hidden rounded-full bg-[var(--b-action)] px-5 font-bold text-[var(--b-action-fg)] text-sm uppercase tracking-wider",
									"shadow-[0_4px_0_oklch(0.55_0.14_95)] transition-[transform,box-shadow,filter] duration-[var(--motion-fast)]",
									"hover:brightness-105 active:translate-y-[2px] active:scale-[0.96] active:shadow-none disabled:opacity-50",
								)}
							>
								{saving ? "Salvando…" : "Salvar palpite"}
							</button>
						)}
						{!dirty &&
							!readOnly &&
							prediction?.predictedHome != null &&
							!isFinished && (
								<span className="flex animate-slide-up items-center gap-1.5 font-bold text-[var(--b-success)] text-xs uppercase tracking-wider">
									<Check className="h-3.5 w-3.5" strokeWidth={3} />
									Palpite salvo
								</span>
							)}
					</div>
					{isLocked && !isFinished && (
						<span className="flex items-center gap-1.5 font-bold text-[var(--b-danger)] text-xs uppercase tracking-wider">
							<Lock className="h-3.5 w-3.5" strokeWidth={3} />
							Palpite bloqueado
						</span>
					)}
				</div>
			</div>
		</article>
	);
}
