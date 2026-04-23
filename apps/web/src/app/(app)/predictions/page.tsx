"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";

import { MatchCard } from "@/components/match-card";
import { useTournament } from "@/contexts/tournament-context";

type Match = NonNullable<Awaited<ReturnType<typeof api.matches.getAllByDate>>>[number];

function formatDateHeader(utcDate: string): string {
  const d = new Date(utcDate);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function dateKey(utcDate: string): string {
  const d = new Date(utcDate);
  return d.toISOString().slice(0, 10);
}

function groupByDate(matches: NonNullable<Match>[]): [string, NonNullable<Match>[]][] {
  const map = new Map<string, NonNullable<Match>[]>();
  for (const m of matches) {
    const key = dateKey(m.utcDate);
    const group = map.get(key) ?? [];
    group.push(m);
    map.set(key, group);
  }
  return Array.from(map.entries());
}

export default function PredictionsPage() {
  const { tournament } = useTournament();
  const matches = useQuery(api.matches.getAllByDate, { tournament });

  const grouped =
    matches === undefined
      ? null
      : groupByDate(matches.filter((m): m is NonNullable<Match> => m !== null));

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black uppercase leading-tight tracking-tight"
          style={{ color: "var(--b-text)" }}>
          Palpites
        </h1>
        <p className="text-sm" style={{ color: "var(--b-text-3)" }}>
          Palpites se fecham 1 hora antes de cada jogo
        </p>
      </div>

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
          style={{ background: "var(--b-card)", border: "1px solid var(--b-border)" }}
        >
          <p style={{ color: "var(--b-text-3)" }}>Nenhum jogo agendado ainda</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([key, dayMatches]) => (
            <div key={key}>
              {/* Date header */}
              <div className="mb-3 flex items-center gap-3">
                <h2
                  className="font-display text-sm font-bold uppercase tracking-widest capitalize"
                  style={{ color: "var(--b-brand)" }}
                >
                  {formatDateHeader(dayMatches[0].utcDate)}
                </h2>
                <div
                  className="h-px flex-1"
                  style={{ background: "var(--b-border)" }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--b-text-4)" }}
                >
                  {dayMatches.length} {dayMatches.length === 1 ? "jogo" : "jogos"}
                </span>
              </div>

              <div className="space-y-3">
                {dayMatches.map((m) => (
                  <MatchCard key={m._id} match={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
