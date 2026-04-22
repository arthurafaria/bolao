"use client";

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

      <div className="dark flex min-h-screen bg-[oklch(0.09_0.028_145)]">

        {/* Left panel — branding (hidden on mobile) */}
        <div
          className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[46%]"
          style={{
            background: `
              radial-gradient(ellipse 120% 70% at 10% 110%, oklch(0.30 0.20 145 / 0.7) 0%, transparent 55%),
              radial-gradient(ellipse 80% 60% at 90% -10%, oklch(0.22 0.15 90 / 0.25) 0%, transparent 50%),
              oklch(0.11 0.030 145)
            `,
            borderRight: "1px solid oklch(1 0 0 / 7%)",
          }}
        >
          {/* Grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.70 0.22 145) 1px, transparent 1px), linear-gradient(90deg, oklch(0.70 0.22 145) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "oklch(0.70 0.22 145)" }}
            >
              <Trophy className="h-5 w-5" style={{ color: "oklch(0.07 0.025 145)" }} />
            </div>
            <span className="font-display text-2xl font-bold uppercase tracking-wide text-white">
              Bolão 2026
            </span>
          </div>

          {/* Center hero text */}
          <div className="relative">
            <div
              className="font-display mb-4 uppercase leading-none"
              style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)", fontWeight: 900, color: "oklch(0.70 0.22 145)" }}
            >
              Copa do<br />Mundo
            </div>
            <p className="text-lg leading-relaxed" style={{ color: "oklch(0.55 0.05 145)" }}>
              Preveja os placares.<br />Dispute com amigos.<br />Seja o campeão do bolão.
            </p>
          </div>

          {/* Stats */}
          <div className="relative flex gap-8">
            {[{ n: "64", l: "Jogos" }, { n: "48", l: "Países" }, { n: "1", l: "Campeão" }].map(({ n, l }) => (
              <div key={l}>
                <div className="font-display text-3xl font-black leading-none text-white">{n}</div>
                <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.48 0.05 145)" }}>{l}</div>
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
              style={{ background: "oklch(0.70 0.22 145)" }}
            >
              <Trophy className="h-4 w-4" style={{ color: "oklch(0.07 0.025 145)" }} />
            </div>
            <span className="font-display text-xl font-bold uppercase tracking-wide text-white">
              Bolão 2026
            </span>
          </div>

          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
