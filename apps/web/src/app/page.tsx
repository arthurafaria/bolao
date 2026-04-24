import { buttonVariants } from "@bolao/ui/components/button";
import { ThemeSwitch } from "@bolao/ui/components/theme-switch-button";
import { Shield, Star, Trophy, Users } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
	return (
		<div
			className="min-h-screen"
			style={{ background: "var(--b-bg)", color: "var(--b-text)" }}
		>
			{/* Header */}
			<header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
				<div className="flex items-center gap-2.5">
					<div
						className="flex h-8 w-8 items-center justify-center rounded-md"
						style={{ background: "var(--b-brand)" }}
					>
						<Trophy
							className="h-4.5 w-4.5"
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
				<div className="flex items-center gap-2">
					<ThemeSwitch className="text-[var(--b-text-3)]" />
					<Link
						href="/sign-in"
						className={buttonVariants({ variant: "ghost", size: "sm" })}
						style={{ color: "var(--b-text-3)" }}
					>
						Entrar
					</Link>
					<Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
						Criar conta
					</Link>
				</div>
			</header>

			{/* Hero */}
			<section
				className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 text-center"
				style={{ background: "var(--b-hero-bg)" }}
			>
				{/* Subtle grid overlay */}
				<div
					className="pointer-events-none absolute inset-0 opacity-[0.04]"
					style={{
						backgroundImage:
							"linear-gradient(var(--b-brand) 1px, transparent 1px), linear-gradient(90deg, var(--b-brand) 1px, transparent 1px)",
						backgroundSize: "80px 80px",
					}}
				/>

				{/* Badges */}
				<div className="relative mb-6 flex flex-wrap justify-center gap-2">
					<div
						className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-medium text-sm"
						style={{
							borderColor: "var(--b-brand-40)",
							background: "var(--b-brand-10)",
							color: "var(--b-brand-hi)",
						}}
					>
						<span className="relative flex h-2 w-2">
							<span
								className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
								style={{ background: "var(--b-brand)" }}
							/>
							<span
								className="relative inline-flex h-2 w-2 rounded-full"
								style={{ background: "var(--b-brand)" }}
							/>
						</span>
						Copa do Mundo — Junho 2026
					</div>
					<div
						className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-medium text-sm"
						style={{
							borderColor: "oklch(0.83 0.20 90 / 0.40)",
							background: "oklch(0.83 0.20 90 / 0.10)",
							color: "oklch(0.70 0.18 90)",
						}}
					>
						<span className="relative flex h-2 w-2">
							<span
								className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
								style={{ background: "oklch(0.83 0.20 90)" }}
							/>
							<span
								className="relative inline-flex h-2 w-2 rounded-full"
								style={{ background: "oklch(0.83 0.20 90)" }}
							/>
						</span>
						Brasileirão — Série A 2025
					</div>
				</div>

				{/* Headline */}
				<h1
					className="relative mb-6 text-balance font-display uppercase leading-[0.88] tracking-tight"
					style={{
						fontSize: "clamp(3.8rem, 12vw, 9.5rem)",
						fontWeight: 900,
						color: "var(--b-text)",
					}}
				>
					<span className="block">Bolão</span>
					<span
						className="block"
						style={{
							background:
								"linear-gradient(135deg, var(--b-brand-hi), oklch(0.88 0.20 90))",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
							backgroundClip: "text",
						}}
					>
						Copa &amp;
					</span>
					<span className="block">Brasileirão</span>
				</h1>

				<p
					className="relative mb-10 max-w-md text-pretty text-lg leading-relaxed"
					style={{ color: "var(--b-text-2)" }}
				>
					Preveja o placar dos jogos da Copa do Mundo 2026 e do Brasileirão.
					Dispute com amigos. Comprove que você entende de futebol.
				</p>

				<div className="relative flex flex-col gap-3 sm:flex-row">
					<Link
						href="/sign-up"
						className={`${buttonVariants({ size: "lg" })} transition-transform active:scale-[0.96]`}
						style={{
							paddingLeft: "2rem",
							paddingRight: "2rem",
							fontSize: "1rem",
							fontWeight: 700,
						}}
					>
						Começar agora — é grátis
					</Link>
					<Link
						href="/sign-in"
						className={`${buttonVariants({ variant: "outline", size: "lg" })} transition-transform active:scale-[0.96]`}
						style={{
							borderColor: "var(--b-border-md)",
							background: "var(--b-tint)",
							color: "var(--b-text)",
							paddingLeft: "2rem",
							paddingRight: "2rem",
							fontSize: "1rem",
						}}
					>
						Já tenho conta
					</Link>
				</div>

				{/* Stats strip */}
				<div
					className="relative mt-4 flex flex-wrap justify-center gap-x-12 gap-y-4"
					style={{ borderTop: "1px solid var(--b-border)", paddingTop: "1rem" }}
				>
					{[
						{ num: "484", label: "Jogos" },
						{ num: "20+", label: "Times" },
						{ num: "2", label: "Torneios" },
					].map(({ num, label }) => (
						<div key={label} className="text-center">
							<div
								className="font-black font-display text-5xl tabular-nums leading-none"
								style={{ color: "var(--b-brand)" }}
							>
								{num}
							</div>
							<div
								className="mt-1 font-medium text-sm uppercase tracking-widest"
								style={{ color: "var(--b-text-3)" }}
							>
								{label}
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Features */}
			<section className="px-6 pt-16 pb-24 md:px-10">
				<div className="mx-auto max-w-5xl">
					<h2
						className="mb-12 text-balance text-center font-bold font-display text-4xl uppercase tracking-tight md:text-5xl"
						style={{ color: "var(--b-text)" }}
					>
						Como funciona
					</h2>

					<div className="grid gap-6 md:grid-cols-3">
						{[
							{
								icon: Shield,
								title: "Palpite de placar",
								desc: (
									<span style={{ lineHeight: "1.4" }}>
										Acertou o placar? 10 pontos.
										<br />
										Acertou o resultado? 5 pontos.
									</span>
								),
								note: "Errou tudo? Leva nada!",
								color: "var(--b-brand)",
								bg: "var(--b-brand-10)",
							},
							{
								icon: Users,
								title: "Ligas privadas",
								desc: "Crie uma liga, convide amigos pelo código e dispute o ranking entre vocês.",
								note: "Ligas até 50 membros.",
								color: "oklch(0.83 0.20 90)",
								bg: "oklch(0.83 0.20 90 / 0.10)",
							},
							{
								icon: Star,
								title: "Tempo real",
								desc: (
									<>
										Placar e pontuação atualizados automaticamente assim que os{" "}
										<strong style={{ color: "var(--b-text)" }}>
											jogos acabarem
										</strong>
										.
									</>
								),
								note: null,
								color: "var(--b-brand)",
								bg: "var(--b-brand-10)",
							},
						].map(({ icon: Icon, title, desc, note, color, bg }) => (
							<div
								key={title}
								className="rounded-[36px] p-6"
								style={{
									background: "var(--b-card)",
									border: "1px solid var(--b-border)",
								}}
							>
								<div
									className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
									style={{ background: bg }}
								>
									<Icon className="h-5 w-5" style={{ color }} />
								</div>
								<h3
									className="mb-2 font-bold font-display text-xl uppercase tracking-tight"
									style={{ color: "var(--b-text)" }}
								>
									{title}
								</h3>
								<p
									className="text-pretty"
									style={{ color: "var(--b-text-2)", lineHeight: "1.65" }}
								>
									{desc}
									{note && (
										<>
											<br />
											<strong style={{ color: "var(--b-text)" }}>{note}</strong>
										</>
									)}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA bottom */}
			<section
				className="px-6 py-20 text-center"
				style={{
					background: "var(--b-card)",
					borderTop: "1px solid var(--b-border)",
				}}
			>
				<h2
					className="mb-4 text-balance font-black font-display text-4xl uppercase leading-tight md:text-6xl"
					style={{ color: "var(--b-text)" }}
				>
					Pronto para{" "}
					<span
						style={{
							background:
								"linear-gradient(135deg, var(--b-brand-hi), oklch(0.88 0.20 90))",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
							backgroundClip: "text",
						}}
					>
						dominar?
					</span>
				</h2>
				<p className="mb-8 text-lg" style={{ color: "var(--b-text-2)" }}>
					Cadastre-se em segundos e comece a fazer seus palpites.
				</p>
				<Link
					href="/sign-up"
					className={`${buttonVariants({ size: "lg" })} transition-transform active:scale-[0.96]`}
					style={{
						paddingLeft: "2.5rem",
						paddingRight: "2.5rem",
						fontSize: "1.05rem",
						fontWeight: 700,
					}}
				>
					Criar conta grátis
				</Link>
			</section>

			<footer
				className="px-6 py-6 text-center text-sm"
				style={{
					color: "var(--b-text-4)",
					borderTop: "1px solid var(--b-border-sm)",
				}}
			>
				Bolão · Copa do Mundo 2026 &amp; Brasileirão — feito pra quem entende de
				futebol
			</footer>
		</div>
	);
}
