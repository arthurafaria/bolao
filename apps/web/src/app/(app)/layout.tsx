"use client";

import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { BookOpen, ChevronDown, LayoutDashboard, LogOut, Shield, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import { ThemeSwitch } from "@bolao/ui/components/theme-switch-button";
import { api } from "@bolao/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import {
  COMPETITIONS,
  TournamentProvider,
  type TournamentCode,
  useTournament,
} from "@/contexts/tournament-context";

const navItems: { href: "/dashboard" | "/predictions" | "/leagues" | "/regras" | "/profile"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/predictions", label: "Palpites", icon: Shield },
  { href: "/leagues", label: "Ligas", icon: Trophy },
  { href: "/regras", label: "Regras", icon: BookOpen },
  { href: "/profile", label: "Perfil", icon: User },
];

function AppNav() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:w-60 md:flex-col md:min-h-screen md:shrink-0"
        style={{
          background: "var(--b-surface)",
          borderRight: "1px solid var(--b-border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: "1px solid var(--b-border)" }}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "var(--b-brand)" }}
          >
            <Trophy className="h-4.5 w-4.5" style={{ color: "var(--b-brand-fg)" }} />
          </div>
          <span className="font-display text-lg font-bold uppercase tracking-wide" style={{ color: "var(--b-text)" }}>
            Bolão 2026
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-[background-color,color]"
                    style={{
                      background: active ? "var(--b-brand-12)" : "transparent",
                      color: active ? "var(--b-brand-hi)" : "var(--b-text-3)",
                    }}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {label}
                    {active && (
                      <span
                        className="ml-auto h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--b-brand)" }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <UserSidebarBottom />
      </aside>

      {/* Mobile bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "color-mix(in oklch, var(--b-surface) 97%, transparent)",
          borderTop: "1px solid var(--b-border-md)",
          backdropFilter: "blur(12px)",
        }}
      >
        <ul className="flex justify-around px-2 py-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex flex-col items-center gap-1 rounded-xl px-5 py-1.5 text-xs font-medium transition-colors"
                  style={{ color: active ? "var(--b-brand-hi)" : "var(--b-text-3)" }}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <MobileSignOut />
          </li>
        </ul>
      </nav>
    </>
  );
}

function UserSidebarBottom() {
  const user = useQuery(api.auth.getCurrentUser);
  const router = useRouter();

  return (
    <div
      className="px-3 py-4"
      style={{ borderTop: "1px solid var(--b-border)" }}
    >
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "var(--b-brand-15)", color: "var(--b-brand)" }}
        >
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" style={{ color: "var(--b-text)" }}>{user?.name ?? "..."}</p>
          <p className="truncate text-xs" style={{ color: "var(--b-text-3)" }}>{user?.email ?? ""}</p>
        </div>
        <button
          type="button"
          onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
          className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: "var(--b-text-3)" }}
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MobileSignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
      className="flex flex-col items-center gap-1 rounded-xl px-5 py-1.5 text-xs font-medium"
      style={{ color: "var(--b-text-3)" }}
    >
      <LogOut className="h-5 w-5" />
      Sair
    </button>
  );
}

function RedirectToSignIn() {
  const router = useRouter();
  useEffect(() => { router.push("/sign-in"); }, [router]);
  return null;
}

function CompetitionSwitcher() {
  const { tournament, setTournament } = useTournament();
  const seedDemo = useMutation(api.demo.seedDemo);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const handleSelect = (code: TournamentCode) => {
    setTournament(code);
    if (code === "DEMO") seedDemo();
    setOpen(false);
  };

  const current = COMPETITIONS[tournament];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
        style={{ background: "var(--b-brand-10)", color: "var(--b-brand)" }}
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden">{current.sublabel}</span>
        <ChevronDown
          className="h-3 w-3 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl"
          style={{
            background: "var(--b-inner)",
            border: "1px solid var(--b-border-md)",
            boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
          }}
        >
          {(Object.values(COMPETITIONS) as typeof COMPETITIONS[TournamentCode][]).map((comp) => {
            const active = tournament === comp.code;
            return (
              <button
                key={comp.code}
                type="button"
                onClick={() => handleSelect(comp.code as TournamentCode)}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-[background]"
                style={{
                  background: active ? "var(--b-brand-10)" : "transparent",
                  color: active ? "var(--b-brand)" : "var(--b-text)",
                }}
              >
                <span className="text-base leading-none">{comp.flag}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium leading-tight">{comp.label}</p>
                  <p className="text-xs leading-tight" style={{ color: "var(--b-text-3)" }}>
                    {comp.sublabel}
                  </p>
                </div>
                {active && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--b-brand)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TournamentProvider>
      <>
        <Authenticated>
          <div className="flex min-h-screen" style={{ background: "var(--b-bg)" }}>
            <AppNav />
            <div className="flex flex-1 flex-col min-w-0">
              {/* Top header */}
              <header
                className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 md:px-6 md:py-4"
                style={{
                  background: "color-mix(in oklch, var(--b-bg) 96%, transparent)",
                  borderBottom: "1px solid var(--b-border)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* Mobile logo */}
                <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: "var(--b-brand)" }}
                  >
                    <Trophy className="h-3.5 w-3.5" style={{ color: "var(--b-brand-fg)" }} />
                  </div>
                  <span className="font-display text-base font-bold uppercase tracking-wide" style={{ color: "var(--b-text)" }}>
                    Bolão 2026
                  </span>
                </Link>
                <div className="hidden md:block" />
                <div className="flex items-center gap-2">
                  <ThemeSwitch className="text-[var(--b-text-3)]" />
                  <CompetitionSwitcher />
                </div>
              </header>

              <main className="flex-1 px-4 py-5 pb-24 md:px-6 md:py-6 md:pb-6">
                <div className="mx-auto max-w-3xl">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Authenticated>

        <AuthLoading>
          <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--b-bg)" }}>
            <div
              className="h-9 w-9 animate-spin rounded-full border-2"
              style={{ borderColor: "var(--b-brand)", borderTopColor: "transparent" }}
            />
          </div>
        </AuthLoading>

        <Unauthenticated>
          <RedirectToSignIn />
        </Unauthenticated>
      </>
    </TournamentProvider>
  );
}
