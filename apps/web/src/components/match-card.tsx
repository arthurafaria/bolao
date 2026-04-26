"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Lock, MapPin } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getCrest } from "@/lib/crest-overrides";
import { getPointsTier } from "@/lib/points-palette";
import { getStadium } from "@/lib/stadiums";
import { translateTeamName } from "@/lib/team-translations";

type Prediction = {
	_id: Id<"predictions">;
	predictedHome: number;
	predictedAway: number;
	points?: number;
	calculatedAt?: number;
};

type MatchWithTeams = {
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

function TeamCrest({ crest, name }: { crest: string; name: string }) {
	const [errored, setErrored] = useState(false);

	if (!errored && crest?.startsWith("http")) {
		return (
			<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
				<Image
					src={crest}
					alt={name}
					width={48}
					height={48}
					unoptimized
					className="h-12 w-12 object-contain drop-shadow-sm"
					onError={() => setErrored(true)}
				/>
			</div>
		);
	}
	return (
		<div
			className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-bold text-xs"
			style={{ background: "var(--b-brand-12)", color: "var(--b-brand)" }}
		>
			{name.slice(0, 2).toUpperCase()}
		</div>
	);
}

function ScoreInput({
	value,
	onChange,
	disabled,
}: {
	value: number;
	onChange: (v: number) => void;
	disabled: boolean;
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

	const decrement = () => {
		const next = Math.max(0, value - 1);
		setRaw(String(next));
		onChange(next);
	};

	const increment = () => {
		const next = Math.min(20, value + 1);
		setRaw(String(next));
		onChange(next);
	};

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				disabled={disabled || value <= 0}
				onClick={decrement}
				className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-lg transition-[opacity,transform] active:scale-[0.96] disabled:opacity-25"
				style={{
					background: "var(--b-tint-md)",
					color: "var(--b-brand)",
					border: "1px solid var(--b-border-md)",
				}}
			>
				−
			</button>
			<input
				type="text"
				inputMode="numeric"
				value={raw}
				onChange={handleInputChange}
				onBlur={handleBlur}
				disabled={disabled}
				className="w-10 bg-transparent text-center font-black font-display text-3xl tabular-nums leading-none outline-none disabled:opacity-40"
				style={{ color: "var(--b-text)", caretColor: "var(--b-brand)" }}
			/>
			<button
				type="button"
				disabled={disabled}
				onClick={increment}
				className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-lg transition-[opacity,transform] active:scale-[0.96] disabled:opacity-25"
				style={{
					background: "var(--b-tint-md)",
					color: "var(--b-brand)",
					border: "1px solid var(--b-border-md)",
				}}
			>
				+
			</button>
		</div>
	);
}

function PointsBadge({ points }: { points: number }) {
	const tier = getPointsTier(points);
	return (
		<span
			className="rounded-full px-2.5 py-0.5 font-bold text-xs tabular-nums"
			style={{ background: tier.bg, color: tier.color }}
		>
			{tier.label}
		</span>
	);
}

function PendingBadge() {
	return (
		<span
			className="rounded-full px-2.5 py-0.5 font-medium text-xs"
			style={{
				background: "var(--b-tint-md)",
				color: "var(--b-text-4)",
			}}
		>
			aguardando…
		</span>
	);
}

export function MatchCard({
	match,
	prediction,
	readOnly = false,
}: {
	match: MatchWithTeams;
	prediction?: Prediction | null;
	readOnly?: boolean;
}) {
	const upsert = useMutation(api.predictions.upsert);

	const lockTime = new Date(match.utcDate).getTime() - 60 * 60 * 1000;
	const isLocked =
		Date.now() >= lockTime ||
		(match.status !== "TIMED" && match.status !== "SCHEDULED");
	const isFinished = match.status === "FINISHED";

	const [home, setHome] = useState(0);
	const [away, setAway] = useState(0);
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (prediction !== undefined) {
			setHome(prediction?.predictedHome ?? 0);
			setAway(prediction?.predictedAway ?? 0);
			setDirty(false);
		}
	}, [prediction]);

	const handleChange = useCallback((side: "home" | "away", val: number) => {
		if (side === "home") setHome(val);
		else setAway(val);
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
	const lockDate = new Date(matchDate.getTime() - 60 * 60 * 1000);
	const lockTimeStr = lockDate.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const lockDateStr = lockDate.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
	});
	const groupLetter = match.group?.replace(/^GROUP_/, "") ?? match.group;
	const stageLabel = match.group
		? `GRUPO ${groupLetter}`
		: match.matchday
			? `RODADA ${match.matchday}`
			: match.stage.replace(/_/g, " ");
	const venue =
		match.venue?.trim() ||
		getStadium(match.homeTeam?.shortName, match.homeTeam?.name);

	const showPointsBadgeAbove = isFinished && prediction?.predictedHome != null;

	return (
		<div
			className="overflow-hidden rounded-[28px]"
			style={{
				background: "var(--b-card)",
				border: "1px solid var(--b-border)",
			}}
		>
			{/* Card header */}
			<div
				className="flex items-center justify-between px-4 py-2.5"
				style={{
					background: "var(--b-tint)",
					borderBottom: "1px solid var(--b-border-sm)",
				}}
			>
				<div className="min-w-0">
					<span
						className="block font-bold font-display text-xs uppercase tracking-widest"
						style={{ color: "var(--b-text-3)" }}
					>
						{stageLabel}
					</span>
					{venue && (
						<span
							className="mt-0.5 flex max-w-[230px] items-center gap-1 truncate text-xs"
							style={{ color: "var(--b-text-4)" }}
						>
							<MapPin className="h-3 w-3 shrink-0" />
							<span className="truncate">{venue}</span>
						</span>
					)}
				</div>
				<div className="flex flex-col items-end gap-0.5">
					<span
						className="font-medium text-xs"
						style={{ color: "var(--b-text-3)" }}
					>
						{timeStr}
					</span>
					{!isLocked && (
						<span className="text-xs" style={{ color: "oklch(0.62 0.14 35)" }}>
							fecha {lockDateStr} às {lockTimeStr}
						</span>
					)}
					{isLocked && !isFinished && (
						<span
							className="font-bold text-xs"
							style={{ color: "var(--b-text-4)" }}
						>
							fechado
						</span>
					)}
					{isFinished && (
						<span
							className="font-bold text-xs"
							style={{ color: "var(--b-text-3)" }}
						>
							Encerrado
						</span>
					)}
				</div>
			</div>

			{/* Match body */}
			<div className="flex items-center justify-between gap-3 px-5 py-5">
				{/* Home team */}
				<div className="flex flex-1 flex-col items-center gap-2">
					<TeamCrest
						crest={getCrest(
							match.homeTeam?.shortName ?? "",
							match.homeTeam?.crest ?? "",
						)}
						name={translateTeamName(match.homeTeam?.shortName ?? "??")}
					/>
					<span
						className="max-w-[80px] text-center font-bold font-display text-sm uppercase leading-tight tracking-wide"
						style={{ color: "var(--b-text)" }}
					>
						{translateTeamName(match.homeTeam?.shortName ?? "") || "TBD"}
					</span>
				</div>

				{/* Score */}
				<div className="flex min-w-[160px] flex-col items-center gap-3">
					{/* Points badge above the score */}
					{showPointsBadgeAbove && (
						<div>
							{prediction.points != null ? (
								<PointsBadge points={prediction.points} />
							) : (
								<PendingBadge />
							)}
						</div>
					)}

					{/* Score display */}
					{readOnly && prediction?.predictedHome != null ? (
						<div className="flex flex-col items-center gap-1">
							<div className="flex items-center gap-3">
								<span
									className="font-black font-display text-5xl tabular-nums leading-none"
									style={{ color: "var(--b-text)" }}
								>
									{prediction.predictedHome}
								</span>
								<span
									className="font-black font-display text-2xl"
									style={{ color: "var(--b-border-md)" }}
								>
									×
								</span>
								<span
									className="font-black font-display text-5xl tabular-nums leading-none"
									style={{ color: "var(--b-text)" }}
								>
									{prediction.predictedAway}
								</span>
							</div>
							{isFinished && (
								<span
									className="font-bold text-xs"
									style={{ color: "var(--b-text-3)" }}
								>
									Resultado: {match.homeScore ?? "–"} × {match.awayScore ?? "–"}
								</span>
							)}
						</div>
					) : isFinished ? (
						<div className="flex items-center gap-3">
							<span
								className="font-black font-display text-5xl tabular-nums leading-none"
								style={{ color: "var(--b-text)" }}
							>
								{match.homeScore ?? "–"}
							</span>
							<span
								className="font-black font-display text-2xl"
								style={{ color: "var(--b-border-md)" }}
							>
								×
							</span>
							<span
								className="font-black font-display text-5xl tabular-nums leading-none"
								style={{ color: "var(--b-text)" }}
							>
								{match.awayScore ?? "–"}
							</span>
						</div>
					) : (
						<div className="flex items-center gap-2">
							<ScoreInput
								value={home}
								onChange={(v) => handleChange("home", v)}
								disabled={isLocked}
							/>
							<span
								className="font-black font-display text-xl"
								style={{ color: "var(--b-border-md)" }}
							>
								×
							</span>
							<ScoreInput
								value={away}
								onChange={(v) => handleChange("away", v)}
								disabled={isLocked}
							/>
						</div>
					)}

					{/* Status / action */}
					<div className="flex items-center gap-2">
						{isLocked && !isFinished && !readOnly && (
							<span
								className="flex items-center gap-1 font-medium text-xs"
								style={{ color: "var(--b-text-3)" }}
							>
								<Lock className="h-3 w-3" /> Bloqueado
							</span>
						)}

						{!isLocked && !readOnly && dirty && (
							<button
								type="button"
								onClick={handleSave}
								disabled={saving}
								className="rounded-xl px-5 py-1.5 font-bold text-sm uppercase tracking-wide transition-[opacity,transform,background-color] active:scale-[0.96] disabled:opacity-50"
								style={{
									background: "var(--b-brand)",
									color: "var(--b-brand-fg)",
								}}
							>
								{saving ? "Salvando..." : "Salvar"}
							</button>
						)}

						{!dirty &&
							!readOnly &&
							prediction?.predictedHome != null &&
							!isFinished && (
								<span
									className="font-semibold text-xs"
									style={{ color: "var(--b-brand)" }}
								>
									✓ Salvo — {prediction.predictedHome} ×{" "}
									{prediction.predictedAway}
								</span>
							)}

						{isFinished && prediction?.predictedHome != null && !readOnly && (
							<span
								className="font-bold text-xs"
								style={{ color: "var(--b-text-3)" }}
							>
								Palpite: {prediction.predictedHome} × {prediction.predictedAway}
							</span>
						)}
					</div>
				</div>

				{/* Away team */}
				<div className="flex flex-1 flex-col items-center gap-2">
					<TeamCrest
						crest={getCrest(
							match.awayTeam?.shortName ?? "",
							match.awayTeam?.crest ?? "",
						)}
						name={translateTeamName(match.awayTeam?.shortName ?? "??")}
					/>
					<span
						className="max-w-[80px] text-center font-bold font-display text-sm uppercase leading-tight tracking-wide"
						style={{ color: "var(--b-text)" }}
					>
						{translateTeamName(match.awayTeam?.shortName ?? "") || "TBD"}
					</span>
				</div>
			</div>
		</div>
	);
}
