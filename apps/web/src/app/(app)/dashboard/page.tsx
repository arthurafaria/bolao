"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Shield, Trophy } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

import { COMPETITIONS, useTournament } from "@/contexts/tournament-context";

import { MatchCard } from "@/components/match-card";

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: accent ? "var(--b-brand-10)" : "var(--b-card)",
        border: `1px solid ${accent ? "var(--b-brand-25)" : "var(--b-border)"}`,
      }}
    >
      <p
        className="mb-1 text-xs font-semibold uppercase tracking-widest"
        style={{ color: accent ? "var(--b-brand)" : "var(--b-text-3)" }}
      >
        {label}
      </p>
      <p
        className="font-display text-4xl font-black leading-none tabular-nums"
        style={{ color: accent ? "var(--b-brand-hi)" : "var(--b-text)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs" style={{ color: "var(--b-text-3)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href: Route; linkLabel: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2
        className="font-display text-lg font-bold uppercase tracking-wide"
        style={{ color: "var(--b-text)" }}
      >
        {title}
      </h2>
      <Link
        href={href}
        className="text-sm font-semibold transition-colors"
        style={{ color: "var(--b-brand)" }}
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="h-[140px] animate-pulse rounded-2xl"
      style={{ background: "var(--b-card)" }}
    />
  );
}

export default function DashboardPage() {
  const { tournament } = useTournament();
  const upcoming = useQuery(api.matches.getUpcoming, { limit: 5, tournament });
  const stats = useQuery(api.predictions.getStats);
  const leagues = useQuery(api.leagues.getUserLeagues);

  return (
    <div className="space-y-8">

      {/* Page title */}
      <div>
        <h1
          className="font-display text-3xl font-black uppercase leading-tight tracking-tight text-balance"
          style={{ color: "var(--b-text)" }}
        >
          Início
        </h1>
        <p className="text-sm" style={{ color: "var(--b-text-3)" }}>
          {COMPETITIONS[tournament].label} {COMPETITIONS[tournament].sublabel}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pontos" value={stats?.totalPoints ?? 0} sub="total acumulado" accent />
        <StatCard label="Palpites" value={stats?.total ?? 0} sub="feitos até agora" />
        <StatCard label="Exatos" value={stats?.exact ?? 0} sub="placares certos" />
        <StatCard label="Ligas" value={leagues?.length ?? 0} sub="participando" />
      </div>

      {/* Upcoming matches */}
      <div>
        <SectionHeader title="Próximos jogos" href="/predictions" linkLabel="Ver todos" />

        {upcoming === undefined ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : upcoming.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "var(--b-card)", border: "1px solid var(--b-border)" }}
          >
            <Shield
              className="mx-auto mb-3 h-8 w-8 opacity-30"
              style={{ color: "var(--b-brand)" }}
            />
            <p style={{ color: "var(--b-text-3)" }}>Nenhum jogo agendado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((m) => m && <MatchCard key={m._id} match={m} />)}
          </div>
        )}
      </div>

      {/* Leagues */}
      {leagues && leagues.length > 0 && (
        <div>
          <SectionHeader title="Minhas ligas" href="/leagues" linkLabel="Ver todas" />
          <div className="space-y-2">
            {leagues.map((league) =>
              league && (
                <Link key={league._id} href={`/leagues/${league._id}` as `/leagues/${string}`}>
                  <div
                    className="flex items-center justify-between rounded-[28px] px-4 py-3.5 transition-[filter] hover:brightness-110"
                    style={{
                      background: "var(--b-card)",
                      border: "1px solid var(--b-border)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: "var(--b-brand-10)" }}
                      >
                        <Trophy className="h-4 w-4" style={{ color: "var(--b-brand)" }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: "var(--b-text)" }}>
                          {league.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--b-text-3)" }}>
                          {league.memberCount} membros
                        </p>
                      </div>
                    </div>
                    <span
                      className="font-display text-lg font-bold tabular-nums"
                      style={{ color: "var(--b-brand)" }}
                    >
                      {league.myPoints} <span className="text-sm font-medium" style={{ color: "var(--b-text-3)" }}>pts</span>
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
