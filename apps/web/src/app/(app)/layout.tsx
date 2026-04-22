"use client";

import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { LayoutDashboard, LogOut, Shield, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect } from "react";

import { api } from "@bolao/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

const navItems: { href: "/dashboard" | "/predictions" | "/leagues" | "/profile"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/predictions", label: "Palpites", icon: Shield },
  { href: "/leagues", label: "Ligas", icon: Trophy },
];

function AppNav() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:w-60 md:flex-col md:min-h-screen md:shrink-0"
        style={{
          background: "oklch(0.10 0.028 145)",
          borderRight: "1px solid oklch(1 0 0 / 8%)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: "1px solid oklch(1 0 0 / 8%)" }}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "oklch(0.70 0.22 145)" }}
          >
            <Trophy className="h-4.5 w-4.5" style={{ color: "oklch(0.07 0.025 145)" }} />
          </div>
          <span className="font-display text-lg font-bold uppercase tracking-wide text-white">
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
                    className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                    style={{
                      background: active ? "oklch(0.70 0.22 145 / 0.12)" : "transparent",
                      color: active ? "oklch(0.78 0.20 145)" : "oklch(0.54 0.05 145)",
                    }}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {label}
                    {active && (
                      <span
                        className="ml-auto h-1.5 w-1.5 rounded-full"
                        style={{ background: "oklch(0.70 0.22 145)" }}
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
          background: "oklch(0.10 0.028 145 / 0.97)",
          borderTop: "1px solid oklch(1 0 0 / 10%)",
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
                  style={{ color: active ? "oklch(0.78 0.20 145)" : "oklch(0.46 0.04 145)" }}
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
      style={{ borderTop: "1px solid oklch(1 0 0 / 8%)" }}
    >
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "oklch(0.70 0.22 145 / 0.15)", color: "oklch(0.70 0.22 145)" }}
        >
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user?.name ?? "..."}</p>
          <p className="truncate text-xs" style={{ color: "oklch(0.46 0.04 145)" }}>{user?.email ?? ""}</p>
        </div>
        <button
          type="button"
          onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
          className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-white/5"
          style={{ color: "oklch(0.46 0.04 145)" }}
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
      style={{ color: "oklch(0.46 0.04 145)" }}
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Authenticated>
        <div className="flex min-h-screen">
          <AppNav />
          <div className="flex flex-1 flex-col min-w-0">
            {/* Top header (mobile only shows logo; desktop shows page context) */}
            <header
              className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 md:px-6 md:py-4"
              style={{
                background: "oklch(0.09 0.028 145 / 0.96)",
                borderBottom: "1px solid oklch(1 0 0 / 8%)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Mobile logo */}
              <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "oklch(0.70 0.22 145)" }}
                >
                  <Trophy className="h-3.5 w-3.5" style={{ color: "oklch(0.07 0.025 145)" }} />
                </div>
                <span className="font-display text-base font-bold uppercase tracking-wide text-white">
                  Bolão 2026
                </span>
              </Link>
              <div className="hidden md:block" />
              <UsersOnlineIndicator />
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
        <div className="flex min-h-screen items-center justify-center" style={{ background: "oklch(0.09 0.028 145)" }}>
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "oklch(0.70 0.22 145)", borderTopColor: "transparent" }}
          />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
    </>
  );
}

function UsersOnlineIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: "oklch(0.70 0.22 145 / 0.10)", color: "oklch(0.70 0.22 145)" }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "oklch(0.70 0.22 145)" }}
      />
      Copa 2026
    </div>
  );
}
