"use client";

import { ThemeSwitch } from "@bolao/ui/components/theme-switch-button";
import { Authenticated } from "convex/react";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function RedirectToDashboard() {
	const router = useRouter();
	useEffect(() => {
		router.push("/dashboard");
	}, [router]);
	return null;
}

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Authenticated>
				<RedirectToDashboard />
			</Authenticated>

			<div
				className="relative flex min-h-screen overflow-hidden"
				style={{ background: "var(--b-bg)" }}
			>
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(circle at 12% 18%, color-mix(in oklch, var(--b-brand) 12%, transparent), transparent 24%), radial-gradient(circle at 88% 12%, oklch(0.82 0.18 90 / 0.08), transparent 22%)",
					}}
				/>
				{/* Left panel — branding (hidden on mobile) */}
				<div
					className="relative hidden flex-col justify-between overflow-hidden border-r p-12 lg:flex lg:w-[48%] xl:p-14"
					style={{
						background: "var(--b-auth-panel-bg)",
						borderColor: "var(--b-border)",
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
							className="flex h-11 w-11 items-center justify-center rounded-2xl"
							style={{
								background:
									"linear-gradient(135deg, var(--b-brand), oklch(0.72 0.22 155))",
								boxShadow: "var(--b-shadow-soft)",
							}}
						>
							<Trophy
								className="h-5 w-5"
								style={{ color: "var(--b-brand-fg)" }}
							/>
						</div>
						<span
							className="font-bold font-display text-2xl uppercase tracking-wide"
							style={{ color: "var(--b-text)" }}
						>
							Bolão 2026
						</span>
					</div>

					{/* Center hero text */}
					<div className="relative max-w-xl">
						<div
							className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-semibold text-xs uppercase tracking-[0.22em]"
							style={{
								background: "color-mix(in oklch, var(--b-card) 78%, transparent)",
								color: "var(--b-brand)",
								boxShadow: "var(--b-shadow-soft)",
							}}
						>
							<span className="h-2 w-2 rounded-full bg-[var(--b-brand)]" />
							Seu bolão com cara de final
						</div>
						<div
							className="mb-5 font-display uppercase leading-none text-balance"
							style={{
								fontSize: "clamp(3.4rem, 5vw, 5rem)",
								fontWeight: 900,
								color: "var(--b-text)",
							}}
						>
							Palpites da
							<br />
							arquibancada
						</div>
						<p
							className="max-w-md text-lg leading-relaxed text-pretty"
							style={{ color: "var(--b-text-2)" }}
						>
							Crie sua conta, acompanhe os torneios e transforme cada rodada
							em uma disputa bonita, rápida e organizada com a galera.
						</p>

						<div className="mt-10 grid max-w-lg gap-4">
							{[
								"Palpites rápidos com atualização em tempo real",
								"Ligas privadas para valendo entre amigos",
								"Dashboard com visão clara do seu desempenho",
							].map((item) => (
								<div
									key={item}
									className="rounded-[26px] px-5 py-4"
									style={{
										background:
											"color-mix(in oklch, var(--b-card) 72%, transparent)",
										boxShadow: "var(--b-shadow-soft)",
										outline: "1px solid var(--b-border-xs)",
									}}
								>
									<p
										className="font-medium text-sm leading-relaxed"
										style={{ color: "var(--b-text)" }}
									>
										{item}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Stats */}
					<div className="relative grid grid-cols-3 gap-4">
						{[
							{ n: "+400", l: "Jogos" },
							{ n: "50", l: "Membros" },
							{ n: "1", l: "Campeão" },
						].map(({ n, l }) => (
							<div
								key={l}
								className="rounded-[26px] px-4 py-4"
								style={{
									background:
										"color-mix(in oklch, var(--b-card) 72%, transparent)",
									boxShadow: "var(--b-shadow-soft)",
									outline: "1px solid var(--b-border-xs)",
								}}
							>
								<div
									className="font-black font-display text-3xl tabular-nums leading-none"
									style={{ color: "var(--b-text)" }}
								>
									{n}
								</div>
								<div
									className="mt-0.5 font-semibold text-xs uppercase tracking-widest"
									style={{ color: "var(--b-text-3)" }}
								>
									{l}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Right panel — form */}
				<div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10 lg:px-10">
					{/* Mobile logo */}
					<div className="mb-10 flex items-center gap-2.5 lg:hidden">
						<div
							className="flex h-9 w-9 items-center justify-center rounded-xl"
							style={{
								background:
									"linear-gradient(135deg, var(--b-brand), oklch(0.72 0.22 155))",
								boxShadow: "var(--b-shadow-soft)",
							}}
						>
							<Trophy
								className="h-4 w-4"
								style={{ color: "var(--b-brand-fg)" }}
							/>
						</div>
						<span
							className="font-bold font-display text-xl uppercase tracking-wide"
							style={{ color: "var(--b-text)" }}
						>
							Bolão 2026
						</span>
					</div>

					<div
						className="w-full max-w-md rounded-[32px] p-6 sm:p-8"
						style={{
							background: "color-mix(in oklch, var(--b-card) 84%, transparent)",
							boxShadow: "var(--b-shadow-float)",
							outline: "1px solid var(--b-border-sm)",
						}}
					>
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
