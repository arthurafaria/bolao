"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import {
	Check,
	Loader2,
	LogOut,
	Pencil,
	Shield,
	Star,
	Trophy,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
					className="font-black font-display text-3xl uppercase leading-tight tracking-tight"
					style={{ color: "var(--b-text)" }}
				>
					Perfil
				</h1>
			</div>

			{/* User card */}
			<div
				className="flex items-center gap-4 rounded-2xl p-5"
				style={{
					background: "var(--b-card)",
					border: "1px solid var(--b-border)",
				}}
			>
				<div
					className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-black text-xl"
					style={{ background: "var(--b-brand-15)", color: "var(--b-brand)" }}
				>
					{(user?.name ?? user?.email)?.[0]?.toUpperCase() ?? "?"}
				</div>
				<div className="min-w-0 flex-1">
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
								className="min-w-0 flex-1 rounded-lg px-2 py-1 font-bold font-display text-base outline-none"
								style={{
									background: "var(--b-inner)",
									border: "1px solid var(--b-brand-25)",
									color: "var(--b-text)",
								}}
							/>
							<button
								type="button"
								onClick={() => void handleSaveName()}
								disabled={isSavingName || nameInput.trim().length < 2}
								style={{ color: "var(--b-brand)" }}
								className="shrink-0 disabled:opacity-40"
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
								style={{ color: "var(--b-text-3)" }}
								className="shrink-0"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					) : (
						<div className="flex items-center gap-2">
							<p
								className="truncate font-bold font-display text-lg"
								style={{ color: "var(--b-text)" }}
							>
								{user?.name ?? user?.email?.split("@")[0] ?? "Usuário"}
							</p>
							<button
								type="button"
								onClick={() => {
									setNameInput(user?.name ?? "");
									setEditingName(true);
								}}
								style={{ color: "var(--b-text-3)" }}
								className="shrink-0 transition-colors hover:text-[var(--b-brand)]"
							>
								<Pencil className="h-3.5 w-3.5" />
							</button>
						</div>
					)}
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
							className="mb-1 font-semibold text-xs uppercase tracking-widest"
							style={{ color: accent ? "var(--b-brand)" : "var(--b-text-3)" }}
						>
							{label}
						</p>
						<p
							className="font-black font-display text-4xl tabular-nums leading-none"
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
					style={{
						background: "var(--b-card)",
						border: "1px solid var(--b-border)",
					}}
				>
					<div className="mb-3 flex items-center justify-between">
						<p
							className="font-bold font-display text-sm uppercase tracking-wide"
							style={{ color: "var(--b-text)" }}
						>
							Taxa de acerto
						</p>
						<span
							className="font-black font-display text-2xl tabular-nums"
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
								background:
									"linear-gradient(90deg, var(--b-brand-40), var(--b-brand))",
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
					style={{
						background: "var(--b-card)",
						border: "1px solid var(--b-border)",
					}}
				>
					<p
						className="mb-4 font-bold font-display text-sm uppercase tracking-wide"
						style={{ color: "var(--b-text)" }}
					>
						Minhas ligas
					</p>
					<div className="space-y-2">
						{leagues.map(
							(league) =>
								league && (
									<Link
										key={league._id}
										href={`/leagues/${league._id}` as `/leagues/${string}`}
									>
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
													<Trophy
														className="h-4 w-4"
														style={{ color: "var(--b-brand)" }}
													/>
												</div>
												<span
													className="font-semibold text-sm"
													style={{ color: "var(--b-text)" }}
												>
													{league.name}
												</span>
											</div>
											<span
												className="font-bold font-display text-sm tabular-nums"
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
				className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-sm transition-[filter,opacity,transform] hover:brightness-110 active:scale-[0.96] disabled:opacity-60"
				style={{
					background: "oklch(0.67 0.22 22 / 0.10)",
					border: "1px solid oklch(0.67 0.22 22 / 0.25)",
					color: "oklch(0.67 0.22 22)",
				}}
			>
				{isSigningOut ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<LogOut className="h-4 w-4" />
				)}
				{isSigningOut ? "Saindo..." : "Sair da conta"}
			</button>
		</div>
	);
}
