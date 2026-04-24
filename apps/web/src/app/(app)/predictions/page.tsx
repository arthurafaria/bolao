"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import { useMemo } from "react";

import { MatchCard } from "@/components/match-card";
import { useTournament } from "@/contexts/tournament-context";

const STAGE_LABELS: Record<string, string> = {
  ROUND_OF_16: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinais",
  FINAL: "Final",
  GROUP_STAGE: "Fase de Grupos",
};

type Match = NonNullable<Awaited<ReturnType<typeof api.matches.getAllByDate>>>[number];

function roundKey(match: NonNullable<Match>): string {
  if (match.matchday != null) return `matchday_${match.matchday}`;
  if (match.group) return `stage_${match.stage}_${match.group}`;
  return `stage_${match.stage}`;
}

function roundLabel(match: NonNullable<Match>): string {
  const groupLetter = match.group?.replace(/^(?:GRUPO|GROUP)[_\s]+/, "");
  if (groupLetter) return `Grupo ${groupLetter}`;
  if (match.matchday != null) return `Rodada ${match.matchday}`;
  return STAGE_LABELS[match.stage] ?? match.stage.replace(/_/g, " ");
}

function groupByRound(
  matches: NonNullable<Match>[],
): [string, string, NonNullable<Match>[]][] {
  const map = new Map<string, { label: string; matches: NonNullable<Match>[] }>();
  for (const m of matches) {
    const key = roundKey(m);
    const entry = map.get(key) ?? { label: roundLabel(m), matches: [] };
    entry.matches.push(m);
    map.set(key, entry);
  }
  return Array.from(map.entries()).map(([key, { label, matches }]) => [key, label, matches]);
}

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
      style={{ background: "var(--b-brand-10)", border: "1px solid var(--b-brand-12)" }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">🏆</span>
        <p className="font-display text-sm font-bold uppercase tracking-widest" style={{ color: "var(--b-brand)" }}>
          Como funciona — Modo Demonstração
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map((s) => (
          <div key={s.icon} className="flex gap-3">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: "var(--b-brand)", color: "var(--b-brand-fg)" }}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--b-text)" }}>
                {s.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--b-text-3)" }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs" style={{ color: "var(--b-text-4)" }}>
        Este é um torneio fictício. Troque para Copa do Mundo 2026 ou Brasileirão no seletor acima para jogar de verdade.
      </p>
    </div>
  );
}

export default function PredictionsPage() {
  const { tournament } = useTournament();
  const matches = useQuery(api.matches.getAllByDate, { tournament });
  const allPredictions = useQuery(api.predictions.getUserPredictions);

  const predMap = useMemo(() => {
    if (!allPredictions) return undefined;
    const m = new Map(allPredictions.map((p) => [p.matchId as string, p]));
    return m;
  }, [allPredictions]);

  const grouped =
    matches === undefined
      ? null
      : groupByRound(
          matches.filter(
            (m): m is NonNullable<Match> => m !== null && m.status !== "FINISHED",
          ),
        ).sort(([, , a], [, , b]) => {
          const aDetermined = a.some((m) => m.status === "TIMED");
          const bDetermined = b.some((m) => m.status === "TIMED");
          if (aDetermined !== bDetermined) return aDetermined ? -1 : 1;
          return new Date(a[0].utcDate).getTime() - new Date(b[0].utcDate).getTime();
        });

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h1
          className="font-display text-3xl font-black uppercase leading-tight tracking-tight"
          style={{ color: "var(--b-text)" }}
        >
          Palpites
        </h1>
        <p className="text-sm" style={{ color: "var(--b-text-3)" }}>
          Palpites se fecham 1 hora antes de cada jogo
        </p>
      </div>

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
          style={{ background: "var(--b-card)", border: "1px solid var(--b-border)" }}
        >
          <p style={{ color: "var(--b-text-3)" }}>Nenhum jogo agendado ainda</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([key, label, roundMatches]) => (
            <div key={key}>
              <div className="mb-3 flex items-center gap-3">
                <h2
                  className="font-display text-sm font-bold uppercase tracking-widest"
                  style={{ color: "var(--b-brand)" }}
                >
                  {label}
                </h2>
                <div className="h-px flex-1" style={{ background: "var(--b-border)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--b-text-4)" }}>
                  {roundMatches.length} {roundMatches.length === 1 ? "jogo" : "jogos"}
                </span>
              </div>

              <div className="space-y-3">
                {roundMatches.map((m) => (
                  <MatchCard
                    key={m._id}
                    match={m}
                    prediction={predMap ? (predMap.get(m._id) ?? null) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
