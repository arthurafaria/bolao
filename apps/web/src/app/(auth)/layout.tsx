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

			<div
				className="relative flex min-h-screen overflow-hidden"
				style={{ background: "var(--b-bg)" }}
			>
				{/* Ambient gradients */}
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(circle at 12% 18%, color-mix(in oklch, var(--b-brand) 14%, transparent), transparent 26%), radial-gradient(circle at 88% 12%, color-mix(in oklch, var(--b-accent) 8%, transparent), transparent 24%)",
					}}
				/>

				{/* Painel esquerdo — branding (desktop only) */}
				<div
					className="relative hidden flex-col justify-between overflow-hidden border-r p-12 animate-fade-in lg:flex lg:w-[48%] xl:p-14"
					style={{
						background: "var(--b-auth-panel-bg)",
						borderColor: "var(--b-border)",
					}}
				>
					{/* Grid texture */}
					<div
						className="pointer-events-none absolute inset-0 opacity-[0.04]"
						style={{
							backgroundImage:
								"linear-gradient(var(--b-brand) 1px, transparent 1px), linear-gradient(90deg, var(--b-brand) 1px, transparent 1px)",
							backgroundSize: "64px 64px",
						}}
					/>

					{/* Dot pattern decoration */}
					<div
						className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 opacity-[0.04]"
						style={{
							backgroundImage: "radial-gradient(circle, var(--b-brand) 1px, transparent 1px)",
							backgroundSize: "20px 20px",
						}}
					/>

					{/* Logo */}
					<div className="relative flex items-center gap-3">
						<div
							className="flex h-11 w-11 items-center justify-center rounded-2xl"
							style={{
								background: "var(--g-brand-diag)",
								boxShadow: "var(--b-shadow-brand-md)",
							}}
						>
							<Trophy className="h-5 w-5" style={{ color: "var(--b-brand-fg)" }} />
						</div>
						<span
							className="text-display-sm text-xl"
							style={{ color: "var(--b-text)" }}
						>
							Bolão 2026
						</span>
					</div>

					{/* Hero text */}
					<div className="relative max-w-xl animate-slide-up">
						<div
							className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
							style={{
								background: "color-mix(in oklch, var(--b-card) 78%, transparent)",
								boxShadow: "var(--b-shadow-soft)",
							}}
						>
							<span className="h-2 w-2 rounded-full bg-[var(--b-brand)] animate-pulse-glow" />
							<span className="text-eyebrow text-[10px]" style={{ color: "var(--b-brand)" }}>
								Seu bolão com cara de final
							</span>
						</div>
						<h2
							className="text-display-hero mb-5 text-balance"
							style={{
								fontSize: "clamp(3rem, 4.5vw, 4.8rem)",
								color: "var(--b-text)",
							}}
						>
							Palpites da
							<br />
							<span style={{ color: "var(--b-brand)" }}>arquibancada</span>
						</h2>
						<p
							className="max-w-md text-pretty text-lg leading-relaxed"
							style={{ color: "var(--b-text-2)" }}
						>
							Crie sua conta, acompanhe os torneios e transforme cada rodada em
							uma disputa bonita, rápida e organizada com a galera.
						</p>

						<div className="mt-10 grid max-w-lg gap-3">
							{[
								"Palpites rápidos com atualização em tempo real",
								"Ligas privadas para valendo entre amigos",
								"Dashboard com visão clara do seu desempenho",
							].map((item) => (
								<div
									key={item}
									className="rounded-[22px] px-5 py-4"
									style={{
										background: "color-mix(in oklch, var(--b-card) 72%, transparent)",
										boxShadow: "var(--b-shadow-soft)",
										outline: "1px solid var(--b-border-xs)",
									}}
								>
									<p className="font-medium text-sm leading-relaxed" style={{ color: "var(--b-text)" }}>
										{item}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Stats */}
					<div className="relative grid grid-cols-3 gap-3">
						{[
							{ n: "+400", l: "Jogos" },
							{ n: "50", l: "Membros" },
							{ n: "1", l: "Campeão" },
						].map(({ n, l }) => (
							<div
								key={l}
								className="rounded-[22px] px-4 py-4"
								style={{
									background: "color-mix(in oklch, var(--b-card) 72%, transparent)",
									boxShadow: "var(--b-shadow-soft)",
									outline: "1px solid var(--b-border-xs)",
								}}
							>
								<div
									className="text-numeric text-display-xl text-3xl leading-none"
									style={{ color: "var(--b-text)" }}
								>
									{n}
								</div>
								<div
									className="text-eyebrow mt-1 text-[10px]"
									style={{ color: "var(--b-text-3)" }}
								>
									{l}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Painel direito — formulário */}
				<div className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 lg:px-10">
					{/* Logo mobile */}
					<div className="mb-8 flex items-center gap-2.5 lg:hidden">
						<div
							className="flex h-9 w-9 items-center justify-center rounded-xl"
							style={{
								background: "var(--g-brand-diag)",
								boxShadow: "var(--b-shadow-brand-sm)",
							}}
						>
							<Trophy className="h-4 w-4" style={{ color: "var(--b-brand-fg)" }} />
						</div>
						<span className="text-display-sm text-xl" style={{ color: "var(--b-text)" }}>
							Bolão 2026
						</span>
					</div>

					{/* Card do formulário */}
					<div
						className="w-full max-w-md rounded-[32px] p-6 sm:p-8 animate-scale-in"
						style={{
							background: "color-mix(in oklch, var(--b-card) 88%, transparent)",
							boxShadow: "var(--b-shadow-float)",
							outline: "1px solid var(--b-border-sm)",
						}}
					>
						<div className="mb-5 flex justify-end">
							<ThemeSwitch className="text-[var(--b-text-3)]" />
						</div>
						{children}
					</div>
				</div>
			</div>
		</>
	);
}
