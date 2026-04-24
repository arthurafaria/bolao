"use client";

import { ThemeSwitch } from "@bolao/ui/components/theme-switch-button";
import { Authenticated } from "convex/react";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => { router.push("/dashboard"); }, [router]);
  return null;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Authenticated>
        <RedirectToDashboard />
      </Authenticated>

      <div className="flex min-h-screen" style={{ background: "var(--b-bg)" }}>

        {/* Left panel — branding (hidden on mobile) */}
        <div
          className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[46%]"
          style={{
            background: "var(--b-auth-panel-bg)",
            borderRight: "1px solid var(--b-border)",
          }}
        >
          {/* Grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(var(--b-brand) 1px, transparent 1px), linear-gradient(90deg, var(--b-brand) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "var(--b-brand)" }}
            >
              <Trophy className="h-5 w-5" style={{ color: "var(--b-brand-fg)" }} />
            </div>
            <span className="font-display text-2xl font-bold uppercase tracking-wide" style={{ color: "var(--b-text)" }}>
              Bolão 2026
            </span>
          </div>

          {/* Center hero text */}
          <div className="relative">
            <div
              className="font-display mb-4 uppercase leading-none [text-wrap:balance]"
              style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)", fontWeight: 900, color: "var(--b-brand)" }}
            >
              Copa do<br />Mundo
            </div>
            <p className="text-lg leading-relaxed" style={{ color: "var(--b-text-2)" }}>
              Preveja os placares.<br />Dispute com amigos.<br />Seja o campeão do bolão.
            </p>
          </div>

          {/* Stats */}
          <div className="relative flex gap-8">
            {[{ n: "+400", l: "Jogos" }, { n: "50", l: "Membros" }, { n: "1", l: "Campeão" }].map(({ n, l }) => (
              <div key={l}>
                <div className="font-display text-3xl font-black leading-none tabular-nums" style={{ color: "var(--b-text)" }}>{n}</div>
                <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--b-text-3)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--b-brand)" }}
            >
              <Trophy className="h-4 w-4" style={{ color: "var(--b-brand-fg)" }} />
            </div>
            <span className="font-display text-xl font-bold uppercase tracking-wide" style={{ color: "var(--b-text)" }}>
              Bolão 2026
            </span>
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-6 flex justify-end">
              <ThemeSwitch className="text-[var(--b-text-3)]" />
            </div>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
