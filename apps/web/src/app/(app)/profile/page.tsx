"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Loader2, LogOut, Shield, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilePage() {
  const user = useQuery(api.auth.getCurrentUser);
  const stats = useQuery(api.predictions.getStats);
  const leagues = useQuery(api.leagues.getUserLeagues);
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const accuracy =
    stats && stats.total > 0
      ? Math.round((stats.correct / stats.total) * 100)
      : 0;

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-display text-3xl font-black uppercase leading-tight tracking-tight"
          style={{ color: "var(--b-text)" }}
        >
          Perfil
        </h1>
      </div>

      {/* User card */}
      <div
        className="flex items-center gap-4 rounded-2xl p-5"
        style={{ background: "var(--b-card)", border: "1px solid var(--b-border)" }}
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-black"
          style={{ background: "var(--b-brand-15)", color: "var(--b-brand)" }}
        >
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold" style={{ color: "var(--b-text)" }}>
            {user?.name ?? "..."}
          </p>
          <p className="truncate text-sm" style={{ color: "var(--b-text-3)" }}>
            {user?.email ?? ""}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Pontos",
            value: stats?.totalPoints ?? 0,
            icon: Trophy,
            accent: true,
          },
          {
            label: "Palpites",
            value: stats?.total ?? 0,
            icon: Shield,
            accent: false,
          },
          {
            label: "Exatos",
            value: stats?.exact ?? 0,
            icon: Star,
            accent: false,
          },
          {
            label: "Ligas",
            value: leagues?.length ?? 0,
            icon: Trophy,
            accent: false,
          },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
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
          </div>
        ))}
      </div>

      {/* Accuracy bar */}
      {stats && stats.total > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--b-card)", border: "1px solid var(--b-border)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p
              className="font-display text-sm font-bold uppercase tracking-wide"
              style={{ color: "var(--b-text)" }}
            >
              Taxa de acerto
            </p>
            <span
              className="font-display text-2xl font-black tabular-nums"
              style={{ color: "var(--b-brand)" }}
            >
              {accuracy}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ background: "var(--b-tint-md)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${accuracy}%`,
                background: "linear-gradient(90deg, var(--b-brand-40), var(--b-brand))",
              }}
            />
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--b-text-3)" }}>
            {stats.correct} acertos de {stats.total} palpites computados
          </p>
        </div>
      )}

      {/* Leagues */}
      {leagues && leagues.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--b-card)", border: "1px solid var(--b-border)" }}
        >
          <p
            className="font-display mb-4 text-sm font-bold uppercase tracking-wide"
            style={{ color: "var(--b-text)" }}
          >
            Minhas ligas
          </p>
          <div className="space-y-2">
            {leagues.map(
              (league) =>
                league && (
                  <Link key={league._id} href={`/leagues/${league._id}` as `/leagues/${string}`}>
                    <div
                      className="flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:brightness-110"
                      style={{
                        background: "var(--b-inner)",
                        border: "1px solid var(--b-border-sm)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ background: "var(--b-brand-10)" }}
                        >
                          <Trophy className="h-4 w-4" style={{ color: "var(--b-brand)" }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "var(--b-text)" }}>{league.name}</span>
                      </div>
                      <span
                        className="font-display text-sm font-bold tabular-nums"
                        style={{ color: "var(--b-brand)" }}
                      >
                        {league.myPoints} pts
                      </span>
                    </div>
                  </Link>
                ),
            )}
          </div>
        </div>
      )}

      {/* Sign out */}
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-[filter,opacity,transform] hover:brightness-110 active:scale-[0.96] disabled:opacity-60"
        style={{
          background: "oklch(0.67 0.22 22 / 0.10)",
          border: "1px solid oklch(0.67 0.22 22 / 0.25)",
          color: "oklch(0.67 0.22 22)",
        }}
      >
        {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        {isSigningOut ? "Saindo..." : "Sair da conta"}
      </button>
    </div>
  );
}
