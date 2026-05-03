"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Button } from "@bolao/ui/components/button";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import {
	Check,
	Crosshair,
	Flame,
	Loader2,
	LogOut,
	Pencil,
	Target,
	Trophy,
	X,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { StatTile } from "@/components/dashboard/stat-tile";

function avatarColor(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = seed.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash) % 360;
	return `oklch(0.62 0.16 ${hue})`;
}

export default function ProfilePage() {
	const user = useQuery(api.auth.getCurrentUser);
	const stats = useQuery(api.predictions.getStats);
	const leagues = useQuery(api.leagues.getUserLeagues);
	const router = useRouter();
	const { signOut } = useAuthActions();

	const [isSigningOut, setIsSigningOut] = useState(false);
	const [editingName, setEditingName] = useState(false);
	const [nameInput, setNameInput] = useState("");
	const [isSavingName, setIsSavingName] = useState(false);
	const setCurrentUserName = useMutation(api.auth.setCurrentUserName);
	const nameInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editingName) nameInputRef.current?.focus();
	}, [editingName]);

	async function handleSaveName() {
		const trimmed = nameInput.trim();
		if (!trimmed || trimmed.length < 2) return;
		setIsSavingName(true);
		try {
			await setCurrentUserName({ name: trimmed });
			setEditingName(false);
		} finally {
			setIsSavingName(false);
		}
	}

	async function handleSignOut() {
		setIsSigningOut(true);
		await signOut();
		router.push("/");
	}

	const accuracy =
		stats && stats.total > 0
			? Math.round((stats.correct / stats.total) * 100)
			: 0;

	const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Usuário";
	const initial = (user?.name ?? user?.email)?.[0]?.toUpperCase() ?? "?";

	if (user === undefined) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-64 rounded-[32px]" />
				<Skeleton className="h-32 rounded-[28px]" />
			</div>
		);
	}

	return (
		<div className="animate-fade-in space-y-7">
			{/* Hero — carteirinha */}
			<section
				className="relative overflow-hidden rounded-[32px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-6 shadow-[var(--b-shadow-card-soft)] sm:p-8"
				style={{
					background:
						"linear-gradient(135deg, color-mix(in oklch, var(--b-brand) 14%, var(--b-card)) 0%, var(--b-card) 60%)",
				}}
			>
				{/* Textura dots no fundo */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 -z-0 opacity-30"
					style={{
						backgroundImage:
							"radial-gradient(circle, oklch(0.46 0.22 145 / 0.18) 1px, transparent 1.5px)",
						backgroundSize: "24px 24px",
					}}
				/>

				<div className="relative z-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
					{/* Avatar */}
					<div
						className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full font-black font-display text-3xl text-white shadow-[var(--b-shadow-brand-md)] sm:h-24 sm:w-24 sm:text-4xl"
						style={{ background: avatarColor(displayName) }}
					>
						{initial}
					</div>

					{/* Nome / email */}
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<span className="text-[var(--b-brand)] text-eyebrow">
							Sua carteirinha
						</span>
						{editingName ? (
							<div className="flex items-center gap-2">
								<input
									ref={nameInputRef}
									type="text"
									value={nameInput}
									onChange={(e) => setNameInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") void handleSaveName();
										if (e.key === "Escape") setEditingName(false);
									}}
									className="min-w-0 flex-1 rounded-xl border border-[var(--b-brand-25)] bg-[var(--b-input-bg)] px-3 py-2 font-bold font-display text-2xl text-[var(--b-text)] outline-none focus:border-[var(--b-brand)] focus:ring-2 focus:ring-[var(--b-brand-25)] sm:text-3xl"
								/>
								<button
									type="button"
									onClick={() => void handleSaveName()}
									disabled={isSavingName || nameInput.trim().length < 2}
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--b-brand)] text-[var(--b-brand-fg)] transition-transform duration-[var(--motion-fast)] active:scale-[0.94] disabled:opacity-40"
									aria-label="Salvar"
								>
									{isSavingName ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Check className="h-4 w-4" />
									)}
								</button>
								<button
									type="button"
									onClick={() => setEditingName(false)}
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--b-tint-md)] text-[var(--b-text-3)] transition-transform duration-[var(--motion-fast)] active:scale-[0.94]"
									aria-label="Cancelar"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						) : (
							<div className="flex items-center gap-2">
								<h1 className="line-clamp-1 font-black font-display text-3xl text-[var(--b-text)] uppercase leading-[0.95] tracking-tight sm:text-5xl">
									{displayName}
								</h1>
								<button
									type="button"
									onClick={() => {
										setNameInput(user?.name ?? "");
										setEditingName(true);
									}}
									className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--b-tint-md)] text-[var(--b-text-3)] transition-[transform,background] duration-[var(--motion-fast)] hover:bg-[var(--b-brand-12)] hover:text-[var(--b-brand)] active:scale-[0.94]"
									aria-label="Editar nome"
								>
									<Pencil className="h-3.5 w-3.5" />
								</button>
							</div>
						)}
						<p className="truncate font-mono text-[var(--b-text-3)] text-sm">
							{user?.email ?? ""}
						</p>
					</div>
				</div>

				{/* Stats inline (resumo bem grande) */}
				<div className="relative z-10 mt-6 grid grid-cols-3 gap-3 border-[var(--b-border-sm)] border-t pt-5">
					<HeroStat label="Pontos" value={stats?.totalPoints ?? 0} accent />
					<HeroStat label="Palpites" value={stats?.total ?? 0} />
					<HeroStat label="Ligas" value={leagues?.length ?? 0} />
				</div>
			</section>

			{/* Bento de stats detalhados */}
			<section>
				<header className="mb-4 flex items-end justify-between gap-3">
					<div>
						<span className="text-[var(--b-text-3)] text-eyebrow">
							Sua performance
						</span>
						<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
							Números frios
						</h2>
					</div>
				</header>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<StatTile
						label="Total de pontos"
						value={stats?.totalPoints ?? 0}
						icon={Trophy}
						variant="accent"
					/>
					<StatTile label="Palpites" value={stats?.total ?? 0} icon={Target} />
					<StatTile
						label="Exatos"
						value={stats?.exact ?? 0}
						icon={Crosshair}
						variant={(stats?.exact ?? 0) > 0 ? "gold" : "default"}
					/>
					<StatTile label="Precisão" value={accuracy} suffix="%" icon={Flame} />
				</div>
			</section>

			{/* Taxa de acerto detalhada */}
			{stats && stats.total > 0 && (
				<section className="rounded-[28px] border border-[var(--b-border-sm)] bg-[var(--b-card)] p-6 shadow-[var(--b-shadow-card-soft)]">
					<header className="mb-4 flex items-end justify-between gap-3">
						<div>
							<span className="text-[var(--b-text-3)] text-eyebrow">
								Acertos / Palpites
							</span>
							<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
								Taxa de acerto
							</h2>
						</div>
						<span className="font-black font-display text-5xl text-[var(--b-brand)] tabular-nums leading-none sm:text-6xl">
							{accuracy}%
						</span>
					</header>
					<div className="h-3 w-full overflow-hidden rounded-full bg-[var(--b-tint-md)]">
						<div
							className="h-full rounded-full transition-[width] duration-[var(--motion-slow)] ease-[var(--ease-out-expo)]"
							style={{
								width: `${accuracy}%`,
								background:
									"linear-gradient(90deg, var(--b-brand), var(--b-brand-hi))",
							}}
						/>
					</div>
					<p className="mt-3 text-[var(--b-text-3)] text-xs">
						<span className="font-bold text-[var(--b-text)]">
							{stats.correct}
						</span>{" "}
						acertos em{" "}
						<span className="font-bold text-[var(--b-text)]">
							{stats.total}
						</span>{" "}
						palpites computados.
					</p>
				</section>
			)}

			{/* Minhas ligas (compacto) */}
			{leagues && leagues.length > 0 && (
				<section>
					<header className="mb-4 flex items-end justify-between gap-3">
						<div>
							<span className="text-[var(--b-text-3)] text-eyebrow">
								Onde você compete
							</span>
							<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
								Minhas ligas
							</h2>
						</div>
						<Link
							href="/leagues"
							className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--b-tint)] px-3 font-bold text-[var(--b-brand)] text-xs uppercase tracking-wider transition-[transform,background] duration-[var(--motion-fast)] hover:bg-[var(--b-brand-12)] active:scale-[0.96]"
						>
							Ver todas
						</Link>
					</header>
					<div className="grid gap-2 sm:grid-cols-2">
						{leagues.map((league) =>
							league ? (
								<Link
									key={league._id}
									href={`/leagues/${league._id}` as Route}
									className="group flex items-center gap-3 rounded-2xl border border-[var(--b-border-sm)] bg-[var(--b-card)] p-3 transition-[transform,box-shadow] duration-[var(--motion-base)] hover:-translate-y-0.5 hover:shadow-[var(--b-shadow-brand-sm)]"
								>
									<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--b-brand-10)] text-[var(--b-brand)]">
										<Trophy className="h-4 w-4" />
									</span>
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="truncate font-bold font-display text-[var(--b-text)] text-sm uppercase tracking-tight">
											{league.name}
										</span>
										<span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
											{league.memberCount} membros
										</span>
									</div>
									<span className="font-black font-display text-2xl text-[var(--b-brand)] tabular-nums">
										{league.myPoints}
									</span>
								</Link>
							) : null,
						)}
					</div>
				</section>
			)}

			{/* Sair */}
			<section>
				<header className="mb-4">
					<span className="text-[var(--b-text-3)] text-eyebrow">Conta</span>
					<h2 className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
						Sessão
					</h2>
				</header>
				<Button
					type="button"
					variant="danger"
					size="lg"
					className="w-full"
					onClick={() => void handleSignOut()}
					loading={isSigningOut}
				>
					<LogOut className="h-4 w-4" />
					{isSigningOut ? "Saindo…" : "Sair da conta"}
				</Button>
			</section>
		</div>
	);
}

function HeroStat({
	label,
	value,
	accent = false,
}: {
	label: string;
	value: number;
	accent?: boolean;
}) {
	return (
		<div className="flex flex-col items-start gap-0.5">
			<span className="text-[10px] text-[var(--b-text-3)] uppercase tracking-wider">
				{label}
			</span>
			<span
				className={`font-black font-display text-3xl tabular-nums leading-none sm:text-4xl ${
					accent ? "text-[var(--b-brand)]" : "text-[var(--b-text)]"
				}`}
			>
				{value}
			</span>
		</div>
	);
}
