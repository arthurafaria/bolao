"use client";

import { cn } from "@bolao/ui/lib/utils";
import { CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";
import { PointsMeter } from "@/components/regras/points-meter";
import { RuleToc } from "@/components/regras/rule-toc";

const TOC = [
	{ id: "pontuacao", label: "Sistema de pontuação" },
	{ id: "exemplos-certo", label: "Acertou o resultado" },
	{ id: "exemplos-errado", label: "Errou o resultado" },
	{ id: "prazo", label: "Prazo pra palpitar" },
	{ id: "ligas", label: "Ligas privadas" },
];

const SCORING_RULES = [
	{ pts: "+5", desc: "por acertar o resultado (vitória ou empate)" },
	{ pts: "+2", desc: "por acertar os gols do time da casa" },
	{ pts: "+2", desc: "por acertar os gols do time visitante" },
	{
		pts: "+1",
		desc: "bônus de placar exato (quando os dois +2 caem na mesma jogada)",
	},
];

export default function RegrasPage() {
	return (
		<div className="animate-fade-in">
			{/* Header editorial */}
			<header className="mb-8 flex flex-col gap-2">
				<span className="text-eyebrow text-[var(--b-brand)]">
					Manual da casa
				</span>
				<h1 className="font-black font-display text-4xl uppercase leading-[0.9] tracking-tight text-[var(--b-text)] sm:text-6xl">
					Regras do bolão
				</h1>
				<p className="max-w-2xl text-[var(--b-text-3)] text-sm leading-relaxed sm:text-base">
					Tudo que você precisa saber pra somar pontos, fechar palpites no
					prazo e dominar suas ligas.
				</p>
			</header>

			{/* Layout 2 colunas (TOC + conteúdo) */}
			<div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-start">
				{/* TOC sticky */}
				<aside className="lg:sticky lg:top-6">
					<RuleToc items={TOC} />
				</aside>

				{/* Conteúdo */}
				<div className="space-y-12">
					{/* Sistema de pontuação */}
					<section
						id="pontuacao"
						className="scroll-mt-24 animate-slide-up space-y-5"
					>
						<header>
							<span className="text-eyebrow text-[var(--b-text-3)]">
								Como você pontua
							</span>
							<h2 className="font-black font-display text-3xl uppercase tracking-tight text-[var(--b-text)]">
								Sistema de pontuação
							</h2>
							<p className="mt-2 text-[var(--b-text-3)] text-sm leading-relaxed">
								Cada jogo tem dois componentes independentes:{" "}
								<strong className="text-[var(--b-text)]">resultado</strong>{" "}
								(quem ganha ou empate) e{" "}
								<strong className="text-[var(--b-text)]">
									gols individuais de cada time
								</strong>
								.
							</p>
						</header>

						{/* Visualização interativa */}
						<PointsMeter />

						{/* Breakdown da fórmula */}
						<div className="rounded-2xl border border-[var(--b-brand-25)] bg-[var(--b-brand-10)] p-5">
							<p className="mb-3 text-eyebrow text-[var(--b-brand)]">
								A fórmula
							</p>
							<ul className="space-y-2.5">
								{SCORING_RULES.map((r) => (
									<li
										key={r.desc}
										className="flex items-start gap-3 text-[var(--b-text-2)] text-sm"
									>
										<span className="mt-px inline-flex h-7 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--b-card)] font-black font-display text-[var(--b-brand)] text-base tabular-nums">
											{r.pts}
										</span>
										<span className="leading-relaxed">{r.desc}</span>
									</li>
								))}
							</ul>
						</div>
					</section>

					{/* Exemplos resultado certo */}
					<section
						id="exemplos-certo"
						className="scroll-mt-24 space-y-5"
					>
						<header className="flex items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--b-success-bg)] text-[var(--b-success)]">
								<CheckCircle2 className="h-5 w-5" />
							</span>
							<div>
								<span className="text-eyebrow text-[var(--b-text-3)]">
									Caso 1
								</span>
								<h2 className="font-black font-display text-2xl uppercase tracking-tight text-[var(--b-text)] sm:text-3xl">
									Acertou o resultado
								</h2>
							</div>
						</header>

						<RealMatchBox home="Brasil" away="Argentina" hs={2} as={1} winner="Brasil" />

						<div className="space-y-2">
							<ExampleRow
								palpite="2 × 1"
								pts={10}
								breakdown="resultado +5 · gols Brasil ✓ +2 · gols Argentina ✓ +2 · bônus placar exato +1"
							/>
							<ExampleRow
								palpite="2 × 0"
								pts={7}
								breakdown="resultado +5 · gols Brasil (2) ✓ +2"
							/>
							<ExampleRow
								palpite="3 × 1"
								pts={7}
								breakdown="resultado +5 · gols Argentina (1) ✓ +2"
							/>
							<ExampleRow
								palpite="3 × 0"
								pts={5}
								breakdown="resultado +5 · nenhum placar individual acertado"
							/>
						</div>
					</section>

					{/* Exemplos resultado errado */}
					<section
						id="exemplos-errado"
						className="scroll-mt-24 space-y-5"
					>
						<header className="flex items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--b-danger-bg)] text-[var(--b-danger)]">
								<XCircle className="h-5 w-5" />
							</span>
							<div>
								<span className="text-eyebrow text-[var(--b-text-3)]">
									Caso 2
								</span>
								<h2 className="font-black font-display text-2xl uppercase tracking-tight text-[var(--b-text)] sm:text-3xl">
									Errou o resultado
								</h2>
							</div>
						</header>
						<p className="text-[var(--b-text-3)] text-sm leading-relaxed">
							Mesmo errando quem ganhou, você marca{" "}
							<span className="font-bold text-[var(--b-text)]">+2 pts</span> por
							cada time cujo número de gols você acertou.
						</p>

						<RealMatchBox home="Brasil" away="Argentina" hs={2} as={1} winner="Brasil" />

						<div className="space-y-2">
							<ExampleRow
								palpite="2 × 2"
								pts={2}
								breakdown="resultado errado (previu empate) · gols Brasil (2) ✓ +2"
							/>
							<ExampleRow
								palpite="0 × 1"
								pts={2}
								breakdown="resultado errado (previu Argentina ganhando) · gols Argentina (1) ✓ +2"
							/>
							<ExampleRow
								palpite="0 × 3"
								pts={0}
								breakdown="resultado errado · nenhum placar individual acertado"
							/>
						</div>
					</section>

					{/* Prazo */}
					<section id="prazo" className="scroll-mt-24 space-y-4">
						<header className="flex items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--b-warning-bg)] text-[var(--b-warning-fg)]">
								<Clock className="h-5 w-5" />
							</span>
							<div>
								<span className="text-eyebrow text-[var(--b-text-3)]">
									Quando fecha
								</span>
								<h2 className="font-black font-display text-2xl uppercase tracking-tight text-[var(--b-text)] sm:text-3xl">
									Prazo pra palpitar
								</h2>
							</div>
						</header>
						<div className="space-y-3 rounded-2xl border border-[var(--b-border-sm)] bg-[var(--b-card)] p-5 text-[var(--b-text-2)] text-sm leading-relaxed">
							<p>
								Os palpites ficam abertos até{" "}
								<strong className="text-[var(--b-text)]">
									1 hora antes do início
								</strong>{" "}
								de cada jogo. Depois disso, o placar é bloqueado e não pode
								mais ser alterado.
							</p>
							<p>
								Os pontos são calculados automaticamente assim que o jogo
								termina.
							</p>
							<p>
								Seus palpites ficam{" "}
								<strong className="text-[var(--b-text)]">
									visíveis para os outros membros da mesma liga
								</strong>{" "}
								assim que o jogo é bloqueado — os concorrentes só veem o que
								você palpitou depois que a janela fecha.
							</p>
						</div>
					</section>

					{/* Ligas */}
					<section id="ligas" className="scroll-mt-24 space-y-4">
						<header className="flex items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--b-brand-12)] text-[var(--b-brand)]">
								<Trophy className="h-5 w-5" />
							</span>
							<div>
								<span className="text-eyebrow text-[var(--b-text-3)]">
									Compita com amigos
								</span>
								<h2 className="font-black font-display text-2xl uppercase tracking-tight text-[var(--b-text)] sm:text-3xl">
									Ligas privadas
								</h2>
							</div>
						</header>
						<div className="space-y-3 rounded-2xl border border-[var(--b-border-sm)] bg-[var(--b-card)] p-5 text-[var(--b-text-2)] text-sm leading-relaxed">
							<p>
								Crie uma liga, compartilhe o código de 6 letras e dispute um
								ranking exclusivo entre vocês. Cada liga tem até{" "}
								<strong className="text-[var(--b-text)]">50 membros</strong>.
							</p>
							<p>
								O ranking soma todos os pontos conquistados em cada jogo do
								torneio escolhido.
							</p>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}

function RealMatchBox({
	home,
	away,
	hs,
	as,
	winner,
}: {
	home: string;
	away: string;
	hs: number;
	as: number;
	winner: string;
}) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--b-border-sm)] bg-[var(--b-inner)] p-4">
			<span className="text-eyebrow text-[var(--b-text-3)]">Jogo real</span>
			<div className="flex items-center gap-3">
				<span className="font-bold font-display text-base uppercase text-[var(--b-text)]">
					{home}
				</span>
				<span className="font-black font-display text-3xl tabular-nums leading-none text-[var(--b-brand)]">
					{hs}
				</span>
				<span className="text-[var(--b-border-md)] text-xl">×</span>
				<span className="font-black font-display text-3xl tabular-nums leading-none text-[var(--b-brand)]">
					{as}
				</span>
				<span className="font-bold font-display text-base uppercase text-[var(--b-text)]">
					{away}
				</span>
			</div>
			<span className="text-[var(--b-text-3)] text-xs">
				{winner} venceu
			</span>
		</div>
	);
}

function ExampleRow({
	palpite,
	pts,
	breakdown,
}: {
	palpite: string;
	pts: number;
	breakdown: string;
}) {
	const tone =
		pts === 10
			? { color: "var(--b-gold)", bg: "var(--b-gold-bg)" }
			: pts >= 7
				? { color: "var(--b-brand-hi)", bg: "var(--b-brand-10)" }
				: pts >= 5
					? { color: "var(--b-brand)", bg: "var(--b-brand-5)" }
					: pts >= 2
						? { color: "var(--b-warning-fg)", bg: "var(--b-warning-bg)" }
						: { color: "var(--b-text-4)", bg: "var(--b-tint-md)" };

	return (
		<div
			className={cn(
				"flex items-center gap-4 rounded-2xl border p-4",
				"transition-[transform,box-shadow] duration-[var(--motion-base)]",
				"hover:-translate-y-0.5 hover:shadow-[var(--b-shadow-brand-sm)]",
			)}
			style={{
				background: tone.bg,
				borderColor: `color-mix(in oklch, ${tone.color} 25%, transparent)`,
			}}
		>
			<div
				className="flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--b-card)]"
				style={{ color: tone.color }}
			>
				<span className="font-black font-display text-2xl tabular-nums leading-none">
					{pts}
				</span>
				<span className="text-[9px] uppercase tracking-wider opacity-70">
					pts
				</span>
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="font-bold font-display text-[var(--b-text)] text-base uppercase tracking-tight">
					Palpite {palpite}
				</span>
				<span className="text-[var(--b-text-3)] text-xs leading-relaxed">
					{breakdown}
				</span>
			</div>
		</div>
	);
}
