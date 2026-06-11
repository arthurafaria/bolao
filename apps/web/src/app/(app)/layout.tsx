"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@bolao/ui/components/dropdown-menu";
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
	Check,
	ChevronDown,
	GitBranch,
	LayoutDashboard,
	LogOut,
	Settings2,
	Shield,
	Trophy,
	User,
	Zap,
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

type NavHref =
	| "/dashboard"
	| "/predictions"
	| "/leagues"
	| "/mata-mata"
	| "/regras";
const navItems: {
	href: NavHref;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}[] = [
	{ href: "/dashboard", label: "Início", icon: LayoutDashboard },
	{ href: "/predictions", label: "Palpites", icon: Shield },
	{ href: "/leagues", label: "Ligas", icon: Trophy },
	{ href: "/mata-mata", label: "Mata-mata", icon: GitBranch },
	{ href: "/regras", label: "Regras", icon: BookOpen },
];

// Mobile bottom-nav: 4 itens flanqueando o FAB central (Regras fica só no sidebar)
const mobileNavItems: {
	href: NavHref;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}[] = [
	{ href: "/dashboard", label: "Início", icon: LayoutDashboard },
	{ href: "/predictions", label: "Palpites", icon: Shield },
	{ href: "/leagues", label: "Ligas", icon: Trophy },
	{ href: "/mata-mata", label: "Mata-mata", icon: GitBranch },
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
											background: active ? "var(--b-action)" : "transparent",
											color: active ? "var(--b-action-fg)" : "var(--b-text-3)",
											boxShadow: active
												? "0 2px 8px oklch(0.55 0.14 95 / 0.35)"
												: "none",
										}}
									>
										{/* Barra indicadora esquerda */}
										<span
											className="absolute top-1/2 left-0 w-[3px] -translate-y-1/2 rounded-r-full transition-[height,opacity] duration-[var(--motion-medium)] ease-[var(--ease-out-back)]"
											style={{
												background: "var(--b-action-fg)",
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
											? "var(--b-action)"
											: "transparent",
										color: isActive("/admin")
											? "var(--b-action-fg)"
											: "var(--b-text-3)",
										boxShadow: isActive("/admin")
											? "0 2px 8px oklch(0.55 0.14 95 / 0.35)"
											: "none",
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
			{/* ── Mobile bottom nav — 5 slots com FAB central ──────── */}
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
				<ul className="relative flex items-end justify-around px-1 pt-3 pb-2">
					{/* Itens esquerdos (2) */}
					{mobileNavItems.slice(0, 2).map(({ href, label, icon: Icon }) => {
						const active = isActive(href);
						return (
							<li key={href}>
								<Link
									href={href as Route}
									className="relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 font-medium text-xs transition-[color,transform] duration-[var(--motion-fast)] active:scale-[0.93]"
									style={{
										color: active ? "var(--b-action)" : "var(--b-text-3)",
									}}
								>
									{active && (
										<span
											className="absolute inset-0 rounded-xl"
											style={{
												background:
													"color-mix(in oklch, var(--b-action) 12%, transparent)",
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

					{/* FAB central elevado */}
					<li className="relative -mt-5 flex flex-col items-center">
						<Link
							href="/predictions"
							className="flex h-14 w-14 items-center justify-center rounded-full transition-[transform,box-shadow] duration-[var(--motion-fast)] active:scale-[0.96]"
							style={{
								background: "var(--b-action)",
								boxShadow:
									"0 4px 0 oklch(0.55 0.14 95), 0 8px 24px oklch(0.55 0.14 95 / 0.45)",
								color: "var(--b-action-fg)",
							}}
						>
							<Zap className="h-6 w-6" strokeWidth={2.5} />
						</Link>
						<span
							className="mt-1 font-medium text-[10px]"
							style={{ color: "var(--b-text-4)" }}
						>
							Palpitar
						</span>
					</li>

					{/* Itens direitos (2) */}
					{mobileNavItems.slice(2, 4).map(({ href, label, icon: Icon }) => {
						const active = isActive(href);
						return (
							<li key={href}>
								<Link
									href={href as Route}
									className="relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 font-medium text-xs transition-[color,transform] duration-[var(--motion-fast)] active:scale-[0.93]"
									style={{
										color: active ? "var(--b-action)" : "var(--b-text-3)",
									}}
								>
									{active && (
										<span
											className="absolute inset-0 rounded-xl"
											style={{
												background:
													"color-mix(in oklch, var(--b-action) 12%, transparent)",
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
				</ul>
			</nav>
		</>
	);
}

function HeaderAvatar() {
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

	const initial =
		(currentUser?.name ?? currentUser?.email)?.[0]?.toUpperCase() ?? "?";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs outline-none transition-[transform,opacity] duration-[var(--motion-fast)] hover:opacity-80 active:scale-[0.96]"
				style={{ background: "var(--b-action)", color: "var(--b-action-fg)" }}
			>
				{currentUser === undefined ? <Spinner size="xs" /> : initial}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem
					onClick={() => router.push("/profile")}
					className="flex cursor-pointer items-center gap-2"
				>
					<User className="h-4 w-4" />
					Perfil
				</DropdownMenuItem>
				{isAdmin && (
					<DropdownMenuItem
						onClick={() => router.push("/admin")}
						className="flex cursor-pointer items-center gap-2"
					>
						<Settings2 className="h-4 w-4" />
						Admin
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => void handleSignOut()}
					disabled={isSigningOut}
					className="flex cursor-pointer items-center gap-2"
					style={{ color: "var(--b-danger)" }}
				>
					{isSigningOut ? (
						<Spinner size="xs" />
					) : (
						<LogOut className="h-4 w-4" />
					)}
					Sair
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function RedirectToSignIn() {
	const router = useRouter();
	useEffect(() => {
		router.push("/sign-in");
	}, [router]);
	return null;
}

function WcFlag({ size }: { size: number }) {
	return (
		<svg
			viewBox="0 0 20 20"
			width={size}
			height={size}
			aria-hidden
			role="img"
			aria-label="Copa do Mundo"
			style={{ flexShrink: 0, display: "block" }}
		>
			<title>Copa do Mundo</title>
			{/* Globo */}
			<circle cx="10" cy="10" r="8" fill="currentColor" opacity="0.15" />
			<circle
				cx="10"
				cy="10"
				r="8"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			{/* Meridianos */}
			<ellipse
				cx="10"
				cy="10"
				rx="3.5"
				ry="8"
				fill="none"
				stroke="currentColor"
				strokeWidth="1"
				opacity="0.6"
			/>
			<line
				x1="2"
				y1="10"
				x2="18"
				y2="10"
				stroke="currentColor"
				strokeWidth="1"
				opacity="0.6"
			/>
			{/* Taça estilizada */}
			<path
				d="M7.5 4.5 L12.5 4.5 L11.5 7.5 Q10 9 8.5 7.5 Z"
				fill="var(--b-action)"
			/>
			<rect x="9.2" y="7.5" width="1.6" height="2" fill="var(--b-action)" />
			<rect
				x="8"
				y="9.5"
				width="4"
				height="1"
				rx="0.4"
				fill="var(--b-action)"
			/>
		</svg>
	);
}

function BrazilFlag({ size }: { size: number }) {
	return (
		<svg
			viewBox="0 0 20 14"
			width={size}
			height={size * 0.7}
			aria-hidden
			role="img"
			aria-label="Bandeira do Brasil"
			style={{ flexShrink: 0, borderRadius: 2, display: "block" }}
		>
			<title>Bandeira do Brasil</title>
			<rect width="20" height="14" fill="#009C3B" />
			<polygon points="10,1.2 19,7 10,12.8 1,7" fill="#FFDF00" />
			<circle cx="10" cy="7" r="3.4" fill="#002776" />
			<path
				d="M7 7.4 Q10 6.2 13 7.4"
				stroke="#fff"
				strokeWidth="0.7"
				fill="none"
				opacity="0.7"
			/>
		</svg>
	);
}

function CompetitionFlag({
	code,
	size,
}: {
	code: string;
	flag?: string;
	size: number;
}) {
	if (code === "BSA2026") return <BrazilFlag size={size} />;
	return <WcFlag size={size} />;
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
				className="flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 font-semibold text-sm transition-[opacity,scale] duration-[var(--motion-fast)] hover:opacity-85 active:scale-[0.96]"
				style={{ background: "var(--b-brand-10)", color: "var(--b-brand)" }}
			>
				<CompetitionFlag code={current.code} size={20} />
				<span className="hidden sm:inline">{current.label}</span>
				<span className="sm:hidden">{current.sublabel}</span>
				<ChevronDown
					className="h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-[var(--motion-base)]"
					style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
				/>
			</button>

			{open && (
				<div
					className="absolute top-full right-0 z-50 mt-2 w-56 animate-scale-in overflow-hidden rounded-2xl"
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
								className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-[background,transform] duration-[var(--motion-fast)] active:scale-[0.98] ${
									active
										? "bg-[var(--b-brand-10)] text-[var(--b-brand)]"
										: "text-[var(--b-text)] hover:bg-[var(--b-brand-10)]/50"
								}`}
							>
								<CompetitionFlag code={comp.code} size={22} />
								<div className="flex-1 text-left">
									<p className="font-medium leading-tight">{comp.label}</p>
									<p
										className="text-xs leading-tight"
										style={{ color: "var(--b-text-3)" }}
									>
										{comp.sublabel}
									</p>
								</div>
								<Check
									className="h-3.5 w-3.5 shrink-0 transition-[opacity,transform] duration-[var(--motion-fast)]"
									style={{
										opacity: active ? 1 : 0,
										scale: active ? "1" : "0.5",
										color: "var(--b-brand)",
									}}
								/>
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
								<HeaderAvatar />
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
