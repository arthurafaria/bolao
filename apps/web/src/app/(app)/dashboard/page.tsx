"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Shield, Trophy } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

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
        background: accent ? "oklch(0.70 0.22 145 / 0.10)" : "oklch(0.12 0.028 145)",
        border: `1px solid ${accent ? "oklch(0.70 0.22 145 / 0.25)" : "oklch(1 0 0 / 8%)"}`,
      }}
    >
      <p
        className="mb-1 text-xs font-semibold uppercase tracking-widest"
        style={{ color: accent ? "oklch(0.62 0.16 145)" : "oklch(0.44 0.05 145)" }}
      >
        {label}
      </p>
      <p
        className="font-display text-4xl font-black leading-none tabular-nums"
        style={{ color: accent ? "oklch(0.78 0.22 145)" : "oklch(0.92 0 0)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs" style={{ color: "oklch(0.42 0.04 145)" }}>
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
        style={{ color: "oklch(0.88 0 0)" }}
      >
        {title}
      </h2>
      <Link
        href={href}
        className="text-sm font-semibold transition-colors"
        style={{ color: "oklch(0.64 0.18 145)" }}
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
      style={{ background: "oklch(0.12 0.028 145)" }}
    />
  );
}

export default function DashboardPage() {
  const upcoming = useQuery(api.matches.getUpcoming, { limit: 5 });
  const stats = useQuery(api.predictions.getStats);
  const leagues = useQuery(api.leagues.getUserLeagues);

  return (
    <div className="space-y-8">

      {/* Page title */}
      <div>
        <h1
          className="font-display text-3xl font-black uppercase leading-tight tracking-tight"
          style={{ color: "oklch(0.94 0 0)" }}
        >
          Início
        </h1>
        <p className="text-sm" style={{ color: "oklch(0.44 0.05 145)" }}>
          Copa do Mundo 2026
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Pontos"
          value={stats?.totalPoints ?? 0}
          sub="total acumulado"
          accent
        />
        <StatCard
          label="Palpites"
          value={stats?.total ?? 0}
          sub="feitos até agora"
        />
        <StatCard
          label="Exatos"
          value={stats?.exact ?? 0}
          sub="placares certos"
        />
        <StatCard
          label="Ligas"
          value={leagues?.length ?? 0}
          sub="participando"
        />
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
            style={{ background: "oklch(0.12 0.028 145)", border: "1px solid oklch(1 0 0 / 8%)" }}
          >
            <Shield
              className="mx-auto mb-3 h-8 w-8 opacity-30"
              style={{ color: "oklch(0.70 0.22 145)" }}
            />
            <p style={{ color: "oklch(0.44 0.05 145)" }}>Nenhum jogo agendado ainda</p>
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
                    className="flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all hover:brightness-110"
                    style={{
                      background: "oklch(0.12 0.028 145)",
                      border: "1px solid oklch(1 0 0 / 8%)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: "oklch(0.70 0.22 145 / 0.10)" }}
                      >
                        <Trophy className="h-4 w-4" style={{ color: "oklch(0.70 0.22 145)" }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: "oklch(0.90 0 0)" }}>
                          {league.name}
                        </p>
                        <p className="text-xs" style={{ color: "oklch(0.44 0.05 145)" }}>
                          {league.memberCount} membros
                        </p>
                      </div>
                    </div>
                    <span
                      className="font-display text-lg font-bold tabular-nums"
                      style={{ color: "oklch(0.70 0.22 145)" }}
                    >
                      {league.myPoints} <span className="text-sm font-medium" style={{ color: "oklch(0.44 0.05 145)" }}>pts</span>
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
