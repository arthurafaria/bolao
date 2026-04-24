import { buttonVariants } from "@bolao/ui/components/button";
import { ThemeSwitch } from "@bolao/ui/components/theme-switch-button";
import {
	ArrowRight,
	Shield,
	Sparkles,
	Star,
	Timer,
	Trophy,
	Users,
} from "lucide-react";
import Link from "next/link";

const featureCards = [
	{
		icon: Shield,
		title: "Palpite inteligente",
		description:
			"Interface rápida para travar seu placar antes da bola rolar, sem perder contexto do jogo.",
		highlight: "10 pontos no placar exato",
	},
	{
		icon: Users,
		title: "Ligas privadas",
		description:
			"Monte grupos com amigos, família ou trabalho e acompanhe a classificação rodada a rodada.",
		highlight: "Convite por código simples",
	},
	{
		icon: Timer,
		title: "Pontuação ao vivo",
		description:
			"Resultados entram e o ranking se atualiza sozinho, sem planilha manual nem confusão.",
		highlight: "Tudo em tempo real",
	},
];

const storySteps = [
	"Escolha o torneio e faça seus palpites em poucos toques.",
	"Entre em ligas privadas e acompanhe quem está cravando mais.",
	"Veja o ranking virar a cada rodada com um dashboard claro.",
];

export default function LandingPage() {
	return (
		<div
			className="min-h-screen overflow-hidden"
			style={{ background: "var(--b-bg)", color: "var(--b-text)" }}
		>
			<div
				className="absolute inset-x-0 top-0 h-[540px]"
				style={{
					background:
						"radial-gradient(circle at 12% 18%, color-mix(in oklch, var(--b-brand) 18%, transparent), transparent 24%), radial-gradient(circle at 82% 16%, oklch(0.83 0.2 90 / 0.12), transparent 22%), radial-gradient(circle at 50% 0%, color-mix(in oklch, var(--b-card) 38%, transparent), transparent 60%)",
				}}
			/>

			<header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
				<div className="flex items-center gap-3">
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
					<div>
						<p
							className="font-display text-2xl uppercase tracking-wide"
							style={{ color: "var(--b-text)" }}
						>
							Bolão 2026
						</p>
						<p
							className="text-xs uppercase tracking-[0.24em]"
							style={{ color: "var(--b-text-3)" }}
						>
							Copa e Brasileirão
						</p>
					</div>
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

			<main className="relative z-10">
				<section className="mx-auto grid max-w-7xl gap-10 px-6 pt-8 pb-20 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-12">
					<div className="max-w-3xl">
						<div className="mb-6 flex flex-wrap gap-2">
							{["Copa 2026", "Brasileirão", "Ligas privadas"].map((tag) => (
								<span
									key={tag}
									className="rounded-full px-4 py-1.5 font-semibold text-xs uppercase tracking-[0.22em]"
									style={{
										background:
											"color-mix(in oklch, var(--b-card) 76%, transparent)",
										color: "var(--b-brand)",
										boxShadow: "var(--b-shadow-soft)",
									}}
								>
									{tag}
								</span>
							))}
						</div>

						<h1
							className="text-balance font-display uppercase leading-[0.9] tracking-tight"
							style={{
								fontSize: "clamp(4rem, 10vw, 8.5rem)",
								fontWeight: 900,
								color: "var(--b-text)",
							}}
						>
							Bolão bonito
							<br />
							para quem
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

						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link
								href="/sign-up"
								className={`${buttonVariants({ size: "lg" })} min-h-12 gap-2 px-7 text-sm uppercase tracking-[0.18em]`}
							>
								Começar grátis
								<ArrowRight className="h-4 w-4" />
							</Link>
							<Link
								href="/sign-in"
								className={`${buttonVariants({ variant: "outline", size: "lg" })} min-h-12 px-7 text-sm uppercase tracking-[0.18em]`}
								style={{
									background:
										"color-mix(in oklch, var(--b-card) 84%, transparent)",
									borderColor: "var(--b-border-md)",
									boxShadow: "var(--b-shadow-soft)",
								}}
							>
								Já tenho conta
							</Link>
						</div>

						<div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
							{[
								{ value: "484", label: "Jogos cobertos" },
								{ value: "20+", label: "Clubes e seleções" },
								{ value: "100%", label: "Foco em ranking" },
							].map((item) => (
								<div
									key={item.label}
									className="rounded-[28px] px-5 py-5"
									style={{
										background:
											"color-mix(in oklch, var(--b-card) 84%, transparent)",
										boxShadow: "var(--b-shadow-card)",
										outline: "1px solid var(--b-border-sm)",
									}}
								>
									<p
										className="font-display text-4xl tabular-nums leading-none"
										style={{ color: "var(--b-brand)", fontWeight: 900 }}
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

					<div className="relative">
						<div
							className="absolute -top-6 -right-4 hidden h-24 w-24 rounded-full blur-3xl lg:block"
							style={{
								background:
									"color-mix(in oklch, var(--b-brand) 36%, transparent)",
							}}
						/>
						<div
							className="relative overflow-hidden rounded-[40px] p-5 sm:p-6"
							style={{
								background:
									"linear-gradient(180deg, color-mix(in oklch, var(--b-card) 94%, transparent), color-mix(in oklch, var(--b-inner) 92%, transparent))",
								boxShadow: "var(--b-shadow-float)",
								outline: "1px solid var(--b-border-sm)",
							}}
						>
							<div
								className="absolute inset-0 opacity-[0.08]"
								style={{
									backgroundImage:
										"linear-gradient(var(--b-brand) 1px, transparent 1px), linear-gradient(90deg, var(--b-brand) 1px, transparent 1px)",
									backgroundSize: "74px 74px",
								}}
							/>

							<div
								className="relative flex items-center justify-between rounded-[28px] px-4 py-4"
								style={{ background: "var(--b-tint)" }}
							>
								<div>
									<p
										className="text-xs uppercase tracking-[0.24em]"
										style={{ color: "var(--b-text-3)" }}
									>
										Dashboard do bolão
									</p>
									<p
										className="mt-1 font-display text-3xl uppercase"
										style={{ color: "var(--b-text)", fontWeight: 800 }}
									>
										Modo decisão
									</p>
								</div>
								<div
									className="rounded-full px-3 py-1 font-semibold text-xs uppercase tracking-[0.18em]"
									style={{
										background: "var(--b-brand-10)",
										color: "var(--b-brand)",
									}}
								>
									Ao vivo
								</div>
							</div>

							<div className="relative mt-5 grid gap-4 sm:grid-cols-[1.05fr_0.95fr]">
								<div
									className="rounded-[30px] p-5"
									style={{
										background: "var(--b-card)",
										boxShadow: "var(--b-shadow-card)",
									}}
								>
									<div className="flex items-center justify-between">
										<div>
											<p
												className="text-xs uppercase tracking-[0.24em]"
												style={{ color: "var(--b-text-3)" }}
											>
												Sua rodada
											</p>
											<p
												className="mt-2 font-display text-5xl tabular-nums leading-none"
												style={{ color: "var(--b-text)", fontWeight: 900 }}
											>
												78
											</p>
										</div>
										<div
											className="rounded-2xl px-3 py-2 font-semibold text-sm"
											style={{
												background: "var(--b-brand-10)",
												color: "var(--b-brand)",
											}}
										>
											+12 hoje
										</div>
									</div>
									<div className="mt-5 space-y-3">
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
													className="font-semibold tabular-nums"
													style={{ color: "var(--b-text)" }}
												>
													{value}
												</span>
											</div>
										))}
									</div>
								</div>

								<div className="space-y-4">
									<div
										className="rounded-[30px] p-5"
										style={{
											background:
												"linear-gradient(180deg, var(--b-brand-12), color-mix(in oklch, var(--b-card) 90%, transparent))",
											boxShadow: "var(--b-shadow-card)",
										}}
									>
										<div
											className="flex items-center gap-2 font-semibold text-sm uppercase tracking-[0.18em]"
											style={{ color: "var(--b-brand)" }}
										>
											<Sparkles className="h-4 w-4" />
											Visão rápida
										</div>
										<p
											className="mt-4 text-pretty text-sm leading-relaxed"
											style={{ color: "var(--b-text)" }}
										>
											Seu próximo palpite fecha às 17:00. Ainda dá tempo de
											cravar o placar e tomar a ponta da liga.
										</p>
									</div>

									<div
										className="rounded-[30px] p-5"
										style={{
											background: "var(--b-card)",
											boxShadow: "var(--b-shadow-card)",
										}}
									>
										<p
											className="text-xs uppercase tracking-[0.24em]"
											style={{ color: "var(--b-text-3)" }}
										>
											Top da semana
										</p>
										<div className="mt-4 space-y-3">
											{[
												["Arthur", "94 pts"],
												["Carol", "88 pts"],
												["Você", "78 pts"],
											].map(([name, points], index) => (
												<div
													key={name}
													className="flex items-center justify-between rounded-[22px] px-4 py-3"
													style={{
														background:
															index === 2
																? "var(--b-brand-10)"
																: "var(--b-tint)",
													}}
												>
													<div className="flex items-center gap-3">
														<div
															className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs"
															style={{
																background: "var(--b-card)",
																color: "var(--b-text)",
															}}
														>
															{index + 1}
														</div>
														<span
															className="font-medium"
															style={{ color: "var(--b-text)" }}
														>
															{name}
														</span>
													</div>
													<span
														className="font-display text-xl tabular-nums"
														style={{ color: "var(--b-brand)", fontWeight: 800 }}
													>
														{points}
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

				<section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
					<div className="grid gap-5 lg:grid-cols-3">
						{featureCards.map(
							({ icon: Icon, title, description, highlight }) => (
								<div
									key={title}
									className="rounded-[34px] p-7"
									style={{
										background:
											"color-mix(in oklch, var(--b-card) 90%, transparent)",
										boxShadow: "var(--b-shadow-card)",
										outline: "1px solid var(--b-border-sm)",
									}}
								>
									<div
										className="flex h-12 w-12 items-center justify-center rounded-2xl"
										style={{
											background: "var(--b-brand-10)",
											color: "var(--b-brand)",
										}}
									>
										<Icon className="h-5 w-5" />
									</div>
									<h2
										className="mt-5 font-display text-3xl uppercase leading-none"
										style={{ color: "var(--b-text)", fontWeight: 800 }}
									>
										{title}
									</h2>
									<p
										className="mt-4 text-pretty leading-relaxed"
										style={{ color: "var(--b-text-2)" }}
									>
										{description}
									</p>
									<p
										className="mt-5 font-semibold text-sm uppercase tracking-[0.18em]"
										style={{ color: "var(--b-brand)" }}
									>
										{highlight}
									</p>
								</div>
							),
						)}
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-6 pb-24 md:px-10">
					<div
						className="grid gap-8 overflow-hidden rounded-[42px] px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.9fr_1.1fr]"
						style={{
							background:
								"linear-gradient(135deg, color-mix(in oklch, var(--b-brand) 10%, var(--b-card)), color-mix(in oklch, oklch(0.83 0.2 90) 8%, var(--b-card)))",
							boxShadow: "var(--b-shadow-float)",
							outline: "1px solid var(--b-border-sm)",
						}}
					>
						<div>
							<p
								className="font-semibold text-xs uppercase tracking-[0.24em]"
								style={{ color: "var(--b-brand)" }}
							>
								Como funciona
							</p>
							<h2
								className="mt-4 text-balance font-display text-5xl uppercase leading-none"
								style={{ color: "var(--b-text)", fontWeight: 900 }}
							>
								Menos fricção.
								<br />
								Mais disputa.
							</h2>
						</div>

						<div className="grid gap-4">
							{storySteps.map((step, index) => (
								<div
									key={step}
									className="flex gap-4 rounded-[28px] px-5 py-5"
									style={{
										background:
											"color-mix(in oklch, var(--b-card) 84%, transparent)",
										boxShadow: "var(--b-shadow-soft)",
									}}
								>
									<div
										className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-xl"
										style={{
											background: "var(--b-brand-10)",
											color: "var(--b-brand)",
											fontWeight: 800,
										}}
									>
										{index + 1}
									</div>
									<p
										className="self-center text-pretty leading-relaxed"
										style={{ color: "var(--b-text)" }}
									>
										{step}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="px-6 pb-24 md:px-10">
					<div className="mx-auto max-w-5xl text-center">
						<div
							className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-semibold text-xs uppercase tracking-[0.22em]"
							style={{
								background: "var(--b-brand-10)",
								color: "var(--b-brand)",
							}}
						>
							<Star className="h-4 w-4" />
							Bora subir esse ranking
						</div>
						<h2
							className="text-balance font-display text-5xl uppercase leading-none md:text-7xl"
							style={{ color: "var(--b-text)", fontWeight: 900 }}
						>
							Seu grupo merece
							<br />
							um bolão à altura
						</h2>
						<p
							className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed"
							style={{ color: "var(--b-text-2)" }}
						>
							Cadastre-se em segundos e transforme cada rodada em uma briga boa
							por pontos, posição e moral.
						</p>
						<div className="mt-8 flex justify-center">
							<Link
								href="/sign-up"
								className={`${buttonVariants({ size: "lg" })} min-h-12 gap-2 px-8 text-sm uppercase tracking-[0.18em]`}
							>
								Criar conta grátis
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
