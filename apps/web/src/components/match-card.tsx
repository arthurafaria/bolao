"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Lock } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { translateTeamName } from "@/lib/team-translations";

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
};

function TeamCrest({ crest, name }: { crest: string; name: string }) {
  if (crest?.startsWith("http")) {
    return (
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
        <Image
          src={crest}
          alt={name}
          width={48}
          height={48}
          className="h-12 w-12 object-contain drop-shadow-sm"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
    );
  }
  return (
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ background: "var(--b-brand-12)", color: "var(--b-brand)" }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ScoreInput({ value, onChange, disabled }: {
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
    const n = parseInt(str, 10);
    if (!isNaN(n)) onChange(Math.min(20, n));
  };

  const handleBlur = () => {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) || n < 0 ? 0 : Math.min(20, n);
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
        className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold transition-[opacity,transform] active:scale-[0.96] disabled:opacity-25"
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
        className="font-display w-10 bg-transparent text-center text-3xl font-black leading-none tabular-nums outline-none disabled:opacity-40"
        style={{ color: "var(--b-text)", caretColor: "var(--b-brand)" }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={increment}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold transition-[opacity,transform] active:scale-[0.96] disabled:opacity-25"
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
  const { bg, color, label } = points === 10
    ? { bg: "oklch(0.83 0.20 90 / 0.15)", color: "oklch(0.83 0.20 90)", label: `⭐ ${points} pts` }
    : points >= 7
    ? { bg: "var(--b-brand-10)", color: "var(--b-brand-hi)", label: `${points} pts` }
    : points >= 5
    ? { bg: "var(--b-tint-md)", color: "var(--b-text-3)", label: `${points} pts` }
    : points > 0
    ? { bg: "oklch(0.70 0.18 60 / 0.12)", color: "oklch(0.72 0.18 60)", label: `${points} pts` }
    : { bg: "oklch(0.67 0.22 22 / 0.12)", color: "oklch(0.67 0.22 22)", label: "0 pts" };

  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

export function MatchCard({ match }: { match: MatchWithTeams }) {
  const prediction = useQuery(api.predictions.getForMatch, { matchId: match._id });
  const upsert = useMutation(api.predictions.upsert);

  const lockTime = new Date(match.utcDate).getTime() - 60 * 60 * 1000;
  const isLocked = Date.now() >= lockTime || (match.status !== "TIMED" && match.status !== "SCHEDULED");
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
      await upsert({ matchId: match._id, predictedHome: home, predictedAway: away });
      setDirty(false);
      toast.success("Palpite salvo!");
    } catch (err) {
      toast.error((err as Error).message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [dirty, upsert, match._id, home, away]);

  const matchDate = new Date(match.utcDate);
  const timeStr = matchDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const lockDate = new Date(matchDate.getTime() - 60 * 60 * 1000);
  const lockTimeStr = lockDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const lockDateStr = lockDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const groupLetter = match.group?.replace(/^GROUP_/, "") ?? match.group;
  const stageLabel = match.group ? `GRUPO ${groupLetter}` : match.stage.replace(/_/g, " ");

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
        <span
          className="font-display text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--b-text-3)" }}
        >
          {stageLabel}
        </span>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs font-medium" style={{ color: "var(--b-text-3)" }}>
            {timeStr}
          </span>
          {!isLocked && (
            <span className="text-xs" style={{ color: "oklch(0.62 0.14 35)" }}>
              fecha {lockDateStr} às {lockTimeStr}
            </span>
          )}
          {isLocked && !isFinished && (
            <span className="text-xs" style={{ color: "var(--b-text-4)" }}>
              fechado
            </span>
          )}
        </div>
      </div>

      {/* Match body */}
      <div className="flex items-center justify-between gap-3 px-5 py-5">
        {/* Home team */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamCrest crest={match.homeTeam?.crest ?? ""} name={translateTeamName(match.homeTeam?.shortName ?? "??")} />
          <span
            className="font-display max-w-[80px] text-center text-sm font-bold uppercase leading-tight tracking-wide"
            style={{ color: "var(--b-text)" }}
          >
            {translateTeamName(match.homeTeam?.shortName ?? "") || "TBD"}
          </span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-3 min-w-[160px]">
          {isFinished ? (
            <div className="flex items-center gap-3">
              <span
                className="font-display text-5xl font-black tabular-nums leading-none"
                style={{ color: "var(--b-text)" }}
              >
                {match.homeScore ?? "–"}
              </span>
              <span
                className="font-display text-2xl font-black"
                style={{ color: "var(--b-border-md)" }}
              >
                ×
              </span>
              <span
                className="font-display text-5xl font-black tabular-nums leading-none"
                style={{ color: "var(--b-text)" }}
              >
                {match.awayScore ?? "–"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ScoreInput value={home} onChange={(v) => handleChange("home", v)} disabled={isLocked} />
              <span
                className="font-display text-xl font-black"
                style={{ color: "var(--b-border-md)" }}
              >
                ×
              </span>
              <ScoreInput value={away} onChange={(v) => handleChange("away", v)} disabled={isLocked} />
            </div>
          )}

          {/* Status / action */}
          <div className="flex items-center gap-2">
            {isLocked && !isFinished && (
              <span
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: "var(--b-text-3)" }}
              >
                <Lock className="h-3 w-3" /> Bloqueado
              </span>
            )}

            {!isLocked && dirty && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl px-5 py-1.5 text-sm font-bold uppercase tracking-wide transition-[opacity,transform,background-color] active:scale-[0.96] disabled:opacity-50"
                style={{
                  background: "var(--b-brand)",
                  color: "var(--b-brand-fg)",
                }}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            )}

            {!dirty && prediction?.predictedHome != null && !isFinished && (
              <span className="text-xs font-semibold" style={{ color: "var(--b-brand)" }}>
                ✓ Salvo — {prediction.predictedHome} × {prediction.predictedAway}
              </span>
            )}

            {isFinished && prediction?.points != null && (
              <PointsBadge points={prediction.points} />
            )}
          </div>
        </div>

        {/* Away team */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamCrest crest={match.awayTeam?.crest ?? ""} name={translateTeamName(match.awayTeam?.shortName ?? "??")} />
          <span
            className="font-display max-w-[80px] text-center text-sm font-bold uppercase leading-tight tracking-wide"
            style={{ color: "var(--b-text)" }}
          >
            {translateTeamName(match.awayTeam?.shortName ?? "") || "TBD"}
          </span>
        </div>
      </div>
    </div>
  );
}
