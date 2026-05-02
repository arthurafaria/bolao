import { Tag } from "@bolao/ui/components/tag";
import { ThemeSwitch } from "@bolao/ui/components/theme-switch-button";
import { buttonVariants } from "@bolao/ui/lib/button-variants";
import {
	ArrowRight,
	Shield,
	Sparkles,
	Star,
	Timer,
	Trophy,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { LogoMarquee } from "@/components/landing/logo-marquee";

const featureCards = [
	{
		icon: Shield,
		title: "Palpite inteligente",
		description:
			"Interface rápida pra travar seu placar até 1h antes do apito — sem perder o contexto do jogo.",
		highlight: "10 pts no placar exato",
		color: "var(--b-brand)",
	},
	{
		icon: Users,
		title: "Ligas privadas",
		description:
			"Monte grupos com amigos, família ou trabalho e acompanhe a classificação rodada a rodada.",
		highlight: "Código de 6 dígitos, aberta ou moderada",
		color: "var(--b-accent)",
	},
	{
		icon: Timer,
		title: "Pontuação ao vivo",
		description:
			"Resultados entram e o ranking se atualiza sozinho — sem planilha manual nem confusão.",
		highlight: "Tudo em tempo real",
		color: "var(--b-brand)",
	},
];

const pointsTiers = [
	{
		label: "Placar exato",
		pts: "10 pts",
		color: "var(--b-brand)",
		bg: "var(--b-brand-10)",
	},
	{
		label: "Vencedor + saldo",
		pts: "7 pts",
		color: "var(--b-accent)",
		bg: "var(--b-accent-10)",
	},
	{
		label: "Vencedor + 1 gol",
		pts: "5 pts",
		color: "var(--b-success)",
		bg: "var(--b-success-bg)",
	},
	{
		label: "Só o vencedor",
		pts: "3 pts",
		color: "var(--b-warning)",
		bg: "var(--b-warning-bg)",
	},
	{
		label: "Errou tudo",
		pts: "0 pts",
		color: "var(--b-text-4)",
		bg: "var(--b-tint-md)",
	},
];

const storySteps = [
	{ n: "01", text: "Escolha o torneio e faça seus palpites em poucos toques." },
	{
		n: "02",
		text: "Entre em ligas privadas e acompanhe quem está cravando mais.",
	},
	{
		n: "03",
		text: "Veja o ranking virar a cada rodada com um dashboard claro.",
	},
];

export default function LandingPage() {
	return (
		<div
			className="min-h-screen overflow-x-hidden"
			style={{ background: "var(--b-bg)", color: "var(--b-text)" }}
		>
			{/* ── Ambient gradients ──────────────────────────────────────── */}
			<div
				className="pointer-events-none fixed inset-x-0 top-0 h-[600px]"
				style={{
					background:
						"radial-gradient(circle at 12% 18%, color-mix(in oklch, var(--b-brand) 16%, transparent), transparent 26%), radial-gradient(circle at 82% 14%, color-mix(in oklch, var(--b-accent) 10%, transparent), transparent 24%), radial-gradient(circle at 50% 0%, color-mix(in oklch, var(--b-card) 45%, transparent), transparent 55%)",
				}}
			/>

			{/* ── Header ────────────────────────────────────────────────── */}
			<header
				className="sticky top-0 z-50 border-b"
				style={{
					background: "color-mix(in oklch, var(--b-bg) 88%, transparent)",
					borderColor: "var(--b-border-sm)",
					backdropFilter: "blur(20px)",
					WebkitBackdropFilter: "blur(20px)",
				}}
			>
				<div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-10">
					<div className="flex items-center gap-3">
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
						<div>
							<p
								className="text-base text-display-sm leading-none"
								style={{ color: "var(--b-text)" }}
							>
								Bolão 2026
							</p>
							<p
								className="mt-0.5 text-[10px] text-eyebrow"
								style={{ color: "var(--b-text-4)" }}
							>
								Copa 2026 · Brasileirão
							</p>
						</div>
					</div>

					<div className="flex items-center gap-1.5">
						<ThemeSwitch className="text-[var(--b-text-3)]" />
						<Link
							href="/sign-in"
							className={buttonVariants({ variant: "ghost", size: "sm" })}
							style={{ color: "var(--b-text-3)" }}
						>
							Entrar
						</Link>
						<Link
							href="/sign-up"
							className={buttonVariants({ variant: "brand", size: "sm" })}
						>
							Criar conta
						</Link>
					</div>
				</div>
			</header>

			<main className="relative z-10">
				{/* ── Hero ──────────────────────────────────────────────── */}
				<section className="mx-auto grid max-w-7xl gap-12 px-5 pt-10 pb-16 md:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:pt-16">
					<div className="max-w-3xl">
						{/* Tags */}
						<div className="mb-6 flex flex-wrap gap-2">
							{["Copa 2026", "Brasileirão", "Ligas privadas"].map((tag) => (
								<Tag key={tag} variant="brand">
									{tag}
								</Tag>
							))}
						</div>

						{/* Headline */}
						<h1
							className="text-balance text-display-hero"
							style={{
								fontSize: "clamp(3.8rem, 9.5vw, 8rem)",
								color: "var(--b-text)",
							}}
						>
							Bolão <span style={{ color: "var(--b-brand)" }}>bonito</span>
							<br />
							pra quem
							<br />
							leva futebol
							<br />a sério
						</h1>

						<p
							className="mt-6 max-w-xl text-pretty text-lg leading-relaxed md:text-xl"
							style={{ color: "var(--b-text-2)" }}
						>
							Faça palpites, acompanhe ligas e veja a tabela mudar em tempo real
							com uma experiência mais elegante do que qualquer planilha no
							grupo.
						</p>

						{/* CTAs */}
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link
								href="/sign-up"
								className={`${buttonVariants({ variant: "brand", size: "lg" })} gap-2 px-7 text-sm uppercase tracking-[0.16em]`}
							>
								Começar grátis
								<ArrowRight className="h-4 w-4" />
							</Link>
							<Link
								href="/sign-in"
								className={`${buttonVariants({ variant: "outline", size: "lg" })} px-7 text-sm uppercase tracking-[0.16em]`}
							>
								Já tenho conta
							</Link>
						</div>

						{/* Stats */}
						<div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
							{[
								{ value: "484", label: "Jogos cobertos" },
								{ value: "20+", label: "Clubes e seleções" },
								{ value: "100%", label: "Foco em ranking" },
							].map((item) => (
								<div
									key={item.label}
									className="rounded-[24px] px-5 py-4 transition-[transform,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-out-quart)] hover:-translate-y-0.5 hover:shadow-[var(--b-shadow-brand-sm)]"
									style={{
										background:
											"color-mix(in oklch, var(--b-card) 86%, transparent)",
										boxShadow: "var(--b-shadow-card)",
										outline: "1px solid var(--b-border-sm)",
									}}
								>
									<p
										className="text-4xl text-display-xl text-numeric leading-none"
										style={{ color: "var(--b-brand)" }}
									>
										{item.value}
									</p>
									<p
										className="mt-2 text-sm leading-relaxed"
										style={{ color: "var(--b-text-3)" }}
									>
										{item.label}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Dashboard mockup */}
					<div className="relative">
						<div
							className="pointer-events-none absolute -top-8 -right-6 hidden h-32 w-32 rounded-full blur-3xl lg:block"
							style={{
								background:
									"color-mix(in oklch, var(--b-brand) 30%, transparent)",
							}}
						/>
						<div
							className="relative animate-float overflow-hidden rounded-[40px] p-5 sm:p-6"
							style={{
								background:
									"linear-gradient(180deg, color-mix(in oklch, var(--b-card) 94%, transparent), color-mix(in oklch, var(--b-inner) 92%, transparent))",
								boxShadow: "var(--b-shadow-float)",
								outline: "1px solid var(--b-border-sm)",
							}}
						>
							{/* Grid texture */}
							<div
								className="pointer-events-none absolute inset-0 opacity-[0.06]"
								style={{
									backgroundImage:
										"linear-gradient(var(--b-brand) 1px, transparent 1px), linear-gradient(90deg, var(--b-brand) 1px, transparent 1px)",
									backgroundSize: "74px 74px",
								}}
							/>

							{/* Header do card */}
							<div
								className="relative flex items-center justify-between rounded-[24px] px-4 py-3.5"
								style={{ background: "var(--b-tint)" }}
							>
								<div>
									<p
										className="text-[10px] text-eyebrow"
										style={{ color: "var(--b-text-3)" }}
									>
										Dashboard do bolão
									</p>
									<p
										className="mt-1 text-2xl text-display-lg"
										style={{ color: "var(--b-text)" }}
									>
										Modo decisão
									</p>
								</div>
								<Tag variant="brand" dot>
									Ao vivo
								</Tag>
							</div>

							{/* Conteúdo */}
							<div className="relative mt-4 grid gap-3 sm:grid-cols-[1.05fr_0.95fr]">
								{/* Pontuação */}
								<div
									className="rounded-[28px] p-5"
									style={{
										background: "var(--b-card)",
										boxShadow: "var(--b-shadow-card)",
									}}
								>
									<div className="flex items-center justify-between">
										<div>
											<p
												className="text-[10px] text-eyebrow"
												style={{ color: "var(--b-text-3)" }}
											>
												Sua rodada
											</p>
											<p
												className="mt-2 font-black text-5xl text-numeric leading-none"
												style={{ color: "var(--b-text)" }}
											>
												78
											</p>
										</div>
										<Tag variant="success">+12 hoje</Tag>
									</div>
									<div className="mt-4 space-y-2.5">
										{[
											["Placar exato", "3"],
											["Resultados certos", "7"],
											["Posição na liga", "2º"],
										].map(([label, value]) => (
											<div
												key={label}
												className="flex items-center justify-between text-sm"
											>
												<span style={{ color: "var(--b-text-3)" }}>
													{label}
												</span>
												<span
													className="font-semibold text-numeric"
													style={{ color: "var(--b-text)" }}
												>
													{value}
												</span>
											</div>
										))}
									</div>
								</div>

								<div className="space-y-3">
									{/* Insight */}
									<div
										className="rounded-[28px] p-4"
										style={{
											background:
												"linear-gradient(180deg, var(--b-brand-12), color-mix(in oklch, var(--b-card) 90%, transparent))",
											boxShadow: "var(--b-shadow-card)",
										}}
									>
										<div
											className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-[0.16em]"
											style={{ color: "var(--b-brand)" }}
										>
											<Sparkles className="h-3.5 w-3.5" />
											Visão rápida
										</div>
										<p
											className="mt-3 text-pretty text-xs leading-relaxed"
											style={{ color: "var(--b-text)" }}
										>
											Seu próximo palpite fecha às 17h. Ainda dá pra cravar e
											tomar a ponta.
										</p>
									</div>

									{/* Ranking */}
									<div
										className="rounded-[28px] p-4"
										style={{
											background: "var(--b-card)",
											boxShadow: "var(--b-shadow-card)",
										}}
									>
										<p
											className="text-[10px] text-eyebrow"
											style={{ color: "var(--b-text-3)" }}
										>
											Top da semana
										</p>
										<div className="mt-3 space-y-2">
											{(
												[
													{ name: "Arthur", pts: "94 pts", isYou: false },
													{ name: "Carol", pts: "88 pts", isYou: false },
													{ name: "Você", pts: "78 pts", isYou: true },
												] as { name: string; pts: string; isYou: boolean }[]
											).map(({ name, pts, isYou }) => (
												<div
													key={name}
													className="flex items-center justify-between rounded-[18px] px-3 py-2"
													style={{
														background: isYou
															? "var(--b-brand-10)"
															: "var(--b-tint)",
													}}
												>
													<span
														className="font-medium text-sm"
														style={{ color: "var(--b-text)" }}
													>
														{name}
													</span>
													<span
														className="font-bold text-numeric text-sm"
														style={{ color: "var(--b-brand)" }}
													>
														{pts}
													</span>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* ── Marquee de times ──────────────────────────────────── */}
				<div className="mx-auto max-w-7xl px-5 pb-6 md:px-10">
					<LogoMarquee />
				</div>

				{/* ── Features ──────────────────────────────────────────── */}
				<section className="mx-auto max-w-7xl px-5 pb-20 md:px-10">
					<div className="mb-10 text-center">
						<Tag variant="brand" className="mb-4">
							Como funciona
						</Tag>
						<h2
							className="text-4xl text-display-xl md:text-5xl"
							style={{ color: "var(--b-text)" }}
						>
							Tudo que seu bolão precisa
						</h2>
					</div>
					<div className="grid gap-5 md:grid-cols-3">
						{featureCards.map(
							({ icon: Icon, title, description, highlight, color }) => (
								<div
									key={title}
									className="group rounded-[32px] p-7 transition-[transform,box-shadow] duration-[var(--motion-medium)] ease-[var(--ease-out-quart)] hover:-translate-y-1 hover:shadow-[var(--b-shadow-brand-md)]"
									style={{
										background:
											"color-mix(in oklch, var(--b-card) 90%, transparent)",
										boxShadow: "var(--b-shadow-card)",
										outline: "1px solid var(--b-border-sm)",
									}}
								>
									<div
										className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-[var(--motion-fast)] group-hover:scale-110"
										style={{ background: "var(--b-brand-10)", color }}
									>
										<Icon className="h-5 w-5" />
									</div>
									<h3
										className="mt-5 text-2xl text-display-lg"
										style={{ color: "var(--b-text)" }}
									>
										{title}
									</h3>
									<p
										className="mt-3 text-pretty text-sm leading-relaxed"
										style={{ color: "var(--b-text-2)" }}
									>
										{description}
									</p>
									<p className="mt-5 text-eyebrow text-xs" style={{ color }}>
										{highlight}
									</p>
								</div>
							),
						)}
					</div>
				</section>

				{/* ── Sistema de pontos ─────────────────────────────────── */}
				<section className="mx-auto max-w-7xl px-5 pb-20 md:px-10">
					<div
						className="rounded-[40px] p-8 sm:p-10"
						style={{
							background:
								"linear-gradient(135deg, color-mix(in oklch, var(--b-brand) 8%, var(--b-card)), color-mix(in oklch, var(--b-accent) 5%, var(--b-card)))",
							boxShadow: "var(--b-shadow-float)",
							outline: "1px solid var(--b-border-sm)",
						}}
					>
						<div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<Tag variant="accent" className="mb-3">
									<Zap className="h-3 w-3" />
									Pontuação
								</Tag>
								<h2
									className="text-4xl text-display-xl"
									style={{ color: "var(--b-text)" }}
								>
									Simples e justo.
								</h2>
							</div>
							<p
								className="max-w-xs text-sm leading-relaxed"
								style={{ color: "var(--b-text-3)" }}
							>
								Cada palpite vale pontos diferentes dependendo do quão perto
								você chegou.
							</p>
						</div>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
							{pointsTiers.map((tier) => (
								<div
									key={tier.label}
									className="rounded-[24px] px-5 py-5"
									style={{
										background: tier.bg,
										outline: `1px solid color-mix(in oklch, ${tier.color} 20%, transparent)`,
									}}
								>
									<p
										className="text-3xl text-display-xl text-numeric leading-none"
										style={{ color: tier.color }}
									>
										{tier.pts}
									</p>
									<p
										className="mt-2 font-medium text-sm"
										style={{ color: "var(--b-text-2)" }}
									>
										{tier.label}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* ── Como funciona (stepper) ───────────────────────────── */}
				<section className="mx-auto max-w-7xl px-5 pb-20 md:px-10">
					<div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
						<div>
							<Tag variant="muted" className="mb-4">
								Passo a passo
							</Tag>
							<h2
								className="text-4xl text-display-xl md:text-5xl"
								style={{ color: "var(--b-text)" }}
							>
								Menos fricção.
								<br />
								Mais disputa.
							</h2>
							<p
								className="mt-4 text-pretty leading-relaxed"
								style={{ color: "var(--b-text-3)" }}
							>
								Do cadastro ao pódio em menos de 2 minutos.
							</p>
						</div>
						<div className="relative space-y-4 pl-4">
							{/* Linha conectora */}
							<div
								className="absolute top-8 bottom-8 left-[28px] w-[2px]"
								style={{
									background:
										"linear-gradient(180deg, var(--b-brand-25), var(--b-brand-10), transparent)",
								}}
							/>
							{storySteps.map(({ n, text }) => (
								<div key={n} className="relative flex gap-5">
									<div
										className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-display-lg text-xl"
										style={{
											background: "var(--b-brand-10)",
											color: "var(--b-brand)",
											boxShadow: "var(--b-shadow-brand-sm)",
										}}
									>
										{n}
									</div>
									<div
										className="flex-1 self-center rounded-[24px] px-5 py-4"
										style={{
											background:
												"color-mix(in oklch, var(--b-card) 86%, transparent)",
											boxShadow: "var(--b-shadow-soft)",
											outline: "1px solid var(--b-border-xs)",
										}}
									>
										<p
											className="text-pretty leading-relaxed"
											style={{ color: "var(--b-text)" }}
										>
											{text}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* ── CTA Final ─────────────────────────────────────────── */}
				<section className="px-5 pb-24 md:px-10">
					<div
						className="mx-auto max-w-5xl overflow-hidden rounded-[48px] px-8 py-16 text-center sm:px-12 sm:py-20"
						style={{
							background: "var(--g-brand-diag)",
							boxShadow: "var(--b-shadow-brand-xl)",
							position: "relative",
						}}
					>
						{/* Texture */}
						<div
							className="pointer-events-none absolute inset-0 opacity-[0.08]"
							style={{
								backgroundImage:
									"radial-gradient(circle, white 1px, transparent 1px)",
								backgroundSize: "28px 28px",
							}}
						/>
						<div className="relative">
							<div
								className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-semibold text-xs uppercase tracking-[0.22em]"
								style={{
									background: "oklch(1 0 0 / 18%)",
									color: "oklch(1 0 0 / 95%)",
								}}
							>
								<Star className="h-3.5 w-3.5" />
								Bora subir esse ranking
							</div>
							<h2
								className="text-balance text-display-hero"
								style={{
									fontSize: "clamp(2.8rem, 6vw, 5rem)",
									color: "oklch(1 0 0)",
								}}
							>
								Seu grupo merece
								<br />
								um bolão à altura
							</h2>
							<p
								className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed"
								style={{ color: "oklch(1 0 0 / 85%)" }}
							>
								Cadastre-se em segundos e transforme cada rodada em uma briga
								boa por pontos, posição e moral.
							</p>
							<div className="mt-8 flex justify-center gap-3">
								<Link
									href="/sign-up"
									className={`${buttonVariants({ size: "lg" })} gap-2 bg-white px-8 text-sm uppercase tracking-[0.16em]`}
									style={{ color: "var(--b-brand-lo)" }}
								>
									Criar conta grátis
									<ArrowRight className="h-4 w-4" />
								</Link>
							</div>
						</div>
					</div>
				</section>

				{/* ── Footer ────────────────────────────────────────────── */}
				<footer
					className="border-t px-5 py-10 md:px-10"
					style={{ borderColor: "var(--b-border-sm)" }}
				>
					<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
						<div className="flex items-center gap-2.5">
							<div
								className="flex h-7 w-7 items-center justify-center rounded-lg"
								style={{ background: "var(--g-brand-diag)" }}
							>
								<Trophy
									className="h-3.5 w-3.5"
									style={{ color: "var(--b-brand-fg)" }}
								/>
							</div>
							<span
								className="text-display-sm text-sm"
								style={{ color: "var(--b-text-3)" }}
							>
								Bolão 2026
							</span>
						</div>
						<div className="flex items-center gap-6">
							<Link
								href="/regras"
								className="text-xs transition-colors hover:text-[var(--b-brand)]"
								style={{ color: "var(--b-text-4)" }}
							>
								Regras
							</Link>
							<span className="text-xs" style={{ color: "var(--b-text-4)" }}>
								© 2026 Bolão da Copa
							</span>
						</div>
					</div>
				</footer>
			</main>
		</div>
	);
}
