"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { Spinner } from "@bolao/ui/components/spinner";
import { ThemeSwitch } from "@bolao/ui/components/theme-switch-button";
import { useAuthActions } from "@convex-dev/auth/react";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";
import {
	BookOpen,
	ChevronDown,
	LayoutDashboard,
	LogOut,
	Settings2,
	Shield,
	Trophy,
	User,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	COMPETITIONS,
	type TournamentCode,
	TournamentProvider,
	useTournament,
} from "@/contexts/tournament-context";

const navItems: {
	href: "/dashboard" | "/predictions" | "/leagues" | "/regras";
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}[] = [
	{ href: "/dashboard", label: "Início", icon: LayoutDashboard },
	{ href: "/predictions", label: "Palpites", icon: Shield },
	{ href: "/leagues", label: "Ligas", icon: Trophy },
	{ href: "/regras", label: "Regras", icon: BookOpen },
];

const ADMIN_EMAIL = "arthurdearaujofaria@gmail.com";

function AppNav() {
	const pathname = usePathname();
	const router = useRouter();
	const { signOut } = useAuthActions();
	const currentUser = useQuery(api.auth.getCurrentUser);
	const isAdmin = currentUser?.email === ADMIN_EMAIL;
	const [isSigningOut, setIsSigningOut] = useState(false);

	async function handleSignOut() {
		setIsSigningOut(true);
		await signOut();
		router.push("/");
	}

	const isActive = (href: string) =>
		pathname === href || pathname.startsWith(`${href}/`);

	return (
		<>
			{/* ── Desktop sidebar ────────────────────────────────────── */}
			<aside
				className="hidden md:flex md:min-h-screen md:w-64 md:shrink-0 md:flex-col"
				style={{
					background:
						"linear-gradient(180deg, color-mix(in oklch, var(--b-surface) 92%, var(--b-card)), var(--b-surface))",
					borderRight: "1px solid var(--b-border)",
				}}
			>
				{/* Logo */}
				<div
					className="flex items-center gap-3 px-5 py-5"
					style={{ borderBottom: "1px solid var(--b-border)" }}
				>
					<div
						className="flex h-9 w-9 items-center justify-center rounded-xl"
						style={{
							background: "var(--g-brand-diag)",
							boxShadow: "var(--b-shadow-brand-sm)",
						}}
					>
						<Trophy
							className="h-4 w-4"
							style={{ color: "var(--b-brand-fg)" }}
						/>
					</div>
					<span
						className="text-base text-display-sm"
						style={{ color: "var(--b-text)" }}
					>
						Bolão 2026
					</span>
				</div>

				{/* Nav */}
				<nav className="flex-1 px-3 py-4">
					<ul className="space-y-0.5">
						{navItems.map(({ href, label, icon: Icon }) => {
							const active = isActive(href);
							return (
								<li key={href}>
									<Link
										href={href as Route}
										className="group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-sm transition-[background-color,color] duration-[var(--motion-fast)] ease-[var(--ease-out-quart)] active:scale-[0.97]"
										style={{
											background: active
												? "linear-gradient(135deg, var(--b-brand-12), color-mix(in oklch, var(--b-brand) 16%, transparent))"
												: "transparent",
											color: active ? "var(--b-brand-hi)" : "var(--b-text-3)",
											boxShadow: active ? "var(--b-shadow-brand-sm)" : "none",
										}}
									>
										{/* Barra indicadora esquerda */}
										<span
											className="absolute top-1/2 left-0 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-[var(--motion-medium)] ease-[var(--ease-out-back)]"
											style={{
												background: "var(--b-brand)",
												height: active ? "60%" : "0%",
												opacity: active ? 1 : 0,
											}}
										/>
										<Icon
											className={`h-4 w-4 shrink-0 transition-transform duration-[var(--motion-fast)] ${active ? "scale-105" : ""}`}
										/>
										{label}
									</Link>
								</li>
							);
						})}

						{/* Admin */}
						{isAdmin && (
							<li>
								<Link
									href="/admin"
									className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-sm transition-[background-color,color] duration-[var(--motion-fast)]"
									style={{
										background: isActive("/admin")
											? "linear-gradient(135deg, var(--b-brand-12), color-mix(in oklch, var(--b-brand) 16%, transparent))"
											: "transparent",
										color: isActive("/admin")
											? "var(--b-brand-hi)"
											: "var(--b-text-3)",
									}}
								>
									<Settings2 className="h-4 w-4 shrink-0" />
									Admin
								</Link>
							</li>
						)}

						{/* Divisor */}
						<li
							className="pt-2"
							style={{ borderTop: "1px solid var(--b-border)" }}
						>
							{currentUser === undefined ? (
								<div className="flex items-center gap-3 px-3 py-2.5">
									<Skeleton className="h-8 w-8 shrink-0 rounded-full" />
									<div className="flex-1 space-y-1.5">
										<Skeleton className="h-3 w-24 rounded-md" />
										<Skeleton className="h-3 w-32 rounded-md" />
									</div>
								</div>
							) : (
								<div className="flex items-center gap-1">
									<Link
										href="/profile"
										className="flex min-h-10 flex-1 items-center gap-3 rounded-xl px-3 py-2 transition-[background-color] duration-[var(--motion-fast)]"
										style={{
											background: isActive("/profile")
												? "var(--b-brand-10)"
												: "transparent",
										}}
									>
										<div
											className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs"
											style={{
												background: "var(--b-brand-15)",
												color: "var(--b-brand)",
											}}
										>
											{(currentUser?.name ??
												currentUser?.email)?.[0]?.toUpperCase() ?? "?"}
										</div>
										<div className="min-w-0 flex-1">
											<p
												className="truncate font-medium text-sm"
												style={{ color: "var(--b-text)" }}
											>
												{currentUser?.name ??
													currentUser?.email?.split("@")[0] ??
													"Perfil"}
											</p>
											<p
												className="truncate text-xs"
												style={{ color: "var(--b-text-3)" }}
											>
												{currentUser?.email ?? ""}
											</p>
										</div>
									</Link>
									<button
										type="button"
										onClick={() => void handleSignOut()}
										disabled={isSigningOut}
										className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-[background-color,color] duration-[var(--motion-fast)] hover:bg-[var(--b-danger-bg)] hover:text-[var(--b-danger)] active:scale-[0.95] disabled:opacity-60"
										style={{ color: "var(--b-text-3)" }}
										title="Sair"
									>
										{isSigningOut ? (
											<Spinner size="xs" />
										) : (
											<LogOut className="h-4 w-4" />
										)}
									</button>
								</div>
							)}
						</li>
					</ul>
				</nav>
			</aside>

			{/* ── Mobile bottom nav ──────────────────────────────────── */}
			<nav
				className="fixed right-0 bottom-0 left-0 z-50 md:hidden"
				style={{
					background: "color-mix(in oklch, var(--b-surface) 97%, transparent)",
					borderTop: "1px solid var(--b-border-md)",
					backdropFilter: "blur(16px)",
					WebkitBackdropFilter: "blur(16px)",
					paddingBottom: "env(safe-area-inset-bottom, 0px)",
				}}
			>
				<ul className="flex justify-around px-1 pt-2 pb-2">
					{navItems.map(({ href, label, icon: Icon }) => {
						const active = isActive(href);
						return (
							<li key={href}>
								<Link
									href={href as Route}
									className="relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 font-medium text-xs transition-[color,transform] duration-[var(--motion-fast)] active:scale-[0.93]"
									style={{
										color: active ? "var(--b-brand-hi)" : "var(--b-text-3)",
									}}
								>
									{active && (
										<span
											className="absolute inset-0 rounded-xl"
											style={{
												background: "var(--b-brand-10)",
												animation:
													"scale-in var(--motion-fast) var(--ease-out-back)",
											}}
										/>
									)}
									<Icon
										className={`relative h-5 w-5 transition-transform duration-[var(--motion-fast)] ${active ? "scale-[1.08]" : ""}`}
									/>
									<span className="relative">{label}</span>
								</Link>
							</li>
						);
					})}
					<li>
						<Link
							href="/profile"
							className="relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 font-medium text-xs transition-[color,transform] duration-[var(--motion-fast)] active:scale-[0.93]"
							style={{
								color: isActive("/profile")
									? "var(--b-brand-hi)"
									: "var(--b-text-3)",
							}}
						>
							{isActive("/profile") && (
								<span
									className="absolute inset-0 rounded-xl"
									style={{ background: "var(--b-brand-10)" }}
								/>
							)}
							<User className="relative h-5 w-5" />
							<span className="relative">Perfil</span>
						</Link>
					</li>
					{isAdmin && (
						<li>
							<Link
								href="/admin"
								className="flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 font-medium text-xs transition-colors"
								style={{
									color: isActive("/admin")
										? "var(--b-brand-hi)"
										: "var(--b-text-3)",
								}}
							>
								<Settings2 className="h-5 w-5" />
								Admin
							</Link>
						</li>
					)}
					<li>
						<MobileSignOut />
					</li>
				</ul>
			</nav>
		</>
	);
}

function MobileSignOut() {
	const router = useRouter();
	const { signOut } = useAuthActions();
	const [isSigningOut, setIsSigningOut] = useState(false);

	async function handleSignOut() {
		setIsSigningOut(true);
		await signOut();
		router.push("/");
	}

	return (
		<button
			type="button"
			onClick={() => void handleSignOut()}
			disabled={isSigningOut}
			className="flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 font-medium text-xs transition-[color,transform] active:scale-[0.93] disabled:opacity-60"
			style={{ color: "var(--b-text-3)" }}
		>
			{isSigningOut ? <Spinner size="xs" /> : <LogOut className="h-5 w-5" />}
			Sair
		</button>
	);
}

function RedirectToSignIn() {
	const router = useRouter();
	useEffect(() => {
		router.push("/sign-in");
	}, [router]);
	return null;
}

function CompetitionSwitcher() {
	const { tournament, setTournament } = useTournament();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onMouseDown(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node))
				setOpen(false);
		}
		document.addEventListener("mousedown", onMouseDown);
		return () => document.removeEventListener("mousedown", onMouseDown);
	}, [open]);

	const handleSelect = (code: TournamentCode) => {
		setTournament(code);
		setOpen(false);
	};

	const current = COMPETITIONS[tournament];

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-xs transition-[opacity,background,scale] duration-[var(--motion-fast)] hover:opacity-90 active:scale-[0.96]"
				style={{ background: "var(--b-brand-10)", color: "var(--b-brand)" }}
			>
				<span>{current.flag}</span>
				<span className="hidden sm:inline">{current.label}</span>
				<span className="sm:hidden">{current.sublabel}</span>
				<ChevronDown
					className="h-3 w-3 transition-transform duration-[var(--motion-base)]"
					style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
				/>
			</button>

			{open && (
				<div
					className="absolute top-full right-0 z-50 mt-2 w-52 animate-scale-in overflow-hidden rounded-2xl"
					style={{
						background: "var(--b-card)",
						border: "1px solid var(--b-border-md)",
						boxShadow: "var(--b-shadow-float)",
					}}
				>
					{(
						Object.values(
							COMPETITIONS,
						) as (typeof COMPETITIONS)[TournamentCode][]
					).map((comp) => {
						const active = tournament === comp.code;
						return (
							<button
								key={comp.code}
								type="button"
								onClick={() => handleSelect(comp.code as TournamentCode)}
								className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-[background] duration-[var(--motion-fast)]"
								style={{
									background: active ? "var(--b-brand-10)" : "transparent",
									color: active ? "var(--b-brand)" : "var(--b-text)",
								}}
							>
								<span className="text-base leading-none">{comp.flag}</span>
								<div className="flex-1 text-left">
									<p className="font-medium leading-tight">{comp.label}</p>
									<p
										className="text-xs leading-tight"
										style={{ color: "var(--b-text-3)" }}
									>
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
			<Authenticated>
				<div
					className="flex min-h-screen"
					style={{ background: "var(--b-bg)" }}
				>
					<AppNav />
					<div className="flex min-w-0 flex-1 flex-col">
						{/* Top header */}
						<header
							className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 md:px-6"
							style={{
								background: "color-mix(in oklch, var(--b-bg) 92%, transparent)",
								borderBottom: "1px solid var(--b-border)",
								backdropFilter: "blur(20px)",
								WebkitBackdropFilter: "blur(20px)",
							}}
						>
							{/* Mobile logo */}
							<Link
								href="/dashboard"
								className="flex items-center gap-2 md:hidden"
							>
								<div
									className="flex h-8 w-8 items-center justify-center rounded-xl"
									style={{
										background: "var(--g-brand-diag)",
										boxShadow: "var(--b-shadow-brand-sm)",
									}}
								>
									<Trophy
										className="h-3.5 w-3.5"
										style={{ color: "var(--b-brand-fg)" }}
									/>
								</div>
								<span
									className="text-display-sm text-sm"
									style={{ color: "var(--b-text)" }}
								>
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
							<div className="mx-auto max-w-5xl">{children}</div>
						</main>
					</div>
				</div>
			</Authenticated>

			<AuthLoading>
				<div
					className="flex min-h-screen flex-col items-center justify-center gap-4"
					style={{ background: "var(--b-bg)" }}
				>
					<div
						className="flex h-14 w-14 animate-pulse-glow items-center justify-center rounded-2xl"
						style={{
							background: "var(--g-brand-diag)",
							boxShadow: "var(--b-glow-brand)",
						}}
					>
						<Trophy
							className="h-6 w-6"
							style={{ color: "var(--b-brand-fg)" }}
						/>
					</div>
					<p
						className="text-eyebrow text-xs"
						style={{ color: "var(--b-text-4)" }}
					>
						Preparando o gramado…
					</p>
				</div>
			</AuthLoading>

			<Unauthenticated>
				<RedirectToSignIn />
			</Unauthenticated>
		</TournamentProvider>
	);
}
