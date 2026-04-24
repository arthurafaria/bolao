export default function RegrasPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1
					className="font-black font-display text-3xl uppercase leading-tight tracking-tight"
					style={{ color: "var(--b-text)" }}
				>
					Regras
				</h1>
				<p className="text-sm" style={{ color: "var(--b-text-3)" }}>
					Como funciona o bolão
				</p>
			</div>

			{/* Tabela de pontuação */}
			<section
				className="rounded-2xl p-6"
				style={{
					background: "var(--b-card)",
					border: "1px solid var(--b-border)",
				}}
			>
				<h2
					className="mb-2 font-bold font-display text-xl uppercase tracking-wide"
					style={{ color: "var(--b-text)" }}
				>
					Pontuação por jogo
				</h2>
				<p className="mb-5 text-sm" style={{ color: "var(--b-text-3)" }}>
					Cada jogo tem dois componentes independentes:{" "}
					<strong style={{ color: "var(--b-text)" }}>resultado</strong> e{" "}
					<strong style={{ color: "var(--b-text)" }}>
						placar individual de cada time
					</strong>
					.
				</p>

				<div className="space-y-3">
					{[
						{
							pts: "10",
							label: "Placar exato",
							desc: "Acertou os dois placares — resultado e quantidade de gols de cada time",
							color: "oklch(0.83 0.20 90)",
							bg: "oklch(0.83 0.20 90 / 0.12)",
							border: "oklch(0.83 0.20 90 / 0.30)",
							prefix: "⭐",
						},
						{
							pts: "7",
							label: "Resultado certo + gols de um time acertados",
							desc: "Acertou quem ganhou e acertou exatamente quantos gols um dos times fez",
							color: "var(--b-brand-hi)",
							bg: "var(--b-brand-10)",
							border: "var(--b-brand-25)",
							prefix: null,
						},
						{
							pts: "5",
							label: "Resultado certo",
							desc: "Acertou quem ganhou (ou empate), mas errou os dois placares individuais",
							color: "oklch(0.60 0.12 145)",
							bg: "var(--b-brand-5)",
							border: "var(--b-border)",
							prefix: null,
						},
						{
							pts: "2",
							label: "Gols de um time acertados (resultado errado)",
							desc: "Errou quem ganhou, mas acertou exatamente quantos gols um dos times fez",
							color: "oklch(0.72 0.18 60)",
							bg: "oklch(0.70 0.18 60 / 0.08)",
							border: "oklch(0.70 0.18 60 / 0.20)",
							prefix: null,
						},
						{
							pts: "0",
							label: "Errou tudo",
							desc: "Resultado errado e nenhum placar individual acertado",
							color: "oklch(0.50 0.04 145)",
							bg: "var(--b-bg)",
							border: "var(--b-border-xs)",
							prefix: null,
						},
					].map(({ pts, label, desc, color, bg, border, prefix }) => (
						<div
							key={pts + label}
							className="flex items-start gap-4 rounded-xl p-4"
							style={{ background: bg, border: `1px solid ${border}` }}
						>
							<div
								className="flex h-12 w-14 shrink-0 items-center justify-center rounded-lg font-black font-display text-xl tabular-nums"
								style={{ color, background: "var(--b-tint-md)" }}
							>
								{prefix && <span className="mr-0.5 text-sm">{prefix}</span>}
								{pts}
							</div>
							<div>
								<p className="font-semibold" style={{ color }}>
									{label}
								</p>
								<p
									className="mt-0.5 text-sm leading-relaxed"
									style={{ color: "var(--b-text-3)" }}
								>
									{desc}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* Resumo da lógica */}
				<div
					className="mt-5 space-y-2 rounded-xl px-4 py-4 text-sm"
					style={{
						background: "var(--b-brand-10)",
						border: "1px solid var(--b-brand-15)",
					}}
				>
					<p style={{ color: "var(--b-text-2)" }}>
						<span className="font-semibold" style={{ color: "var(--b-text)" }}>
							Resultado certo
						</span>{" "}
						vale{" "}
						<span className="font-bold" style={{ color: "var(--b-brand-hi)" }}>
							5 pts
						</span>{" "}
						de base.
					</p>
					<p style={{ color: "var(--b-text-2)" }}>
						<span className="font-semibold" style={{ color: "var(--b-text)" }}>
							Gols de um time acertados
						</span>{" "}
						vale{" "}
						<span className="font-bold" style={{ color: "var(--b-brand-hi)" }}>
							+2 pts
						</span>{" "}
						— independente do resultado. Conta para o time da casa e para o
						visitante separadamente.
					</p>
					<p style={{ color: "var(--b-text-2)" }}>
						Os dois bônus se somam: acertou resultado (+5) e gols de um time
						(+2) ={" "}
						<span className="font-bold" style={{ color: "var(--b-text)" }}>
							7 pts
						</span>
						. Acertou os dois placares ={" "}
						<span className="font-bold" style={{ color: "var(--b-text)" }}>
							10 pts
						</span>
						.
					</p>
				</div>
			</section>

			{/* Exemplos — resultado certo */}
			<section
				className="rounded-2xl p-6"
				style={{
					background: "var(--b-card)",
					border: "1px solid var(--b-border)",
				}}
			>
				<h2
					className="mb-1 font-bold font-display text-xl uppercase tracking-wide"
					style={{ color: "var(--b-text)" }}
				>
					Exemplos — resultado certo
				</h2>
				<p className="mb-4 text-sm" style={{ color: "var(--b-text-3)" }}>
					Jogo real:{" "}
					<span className="font-semibold" style={{ color: "var(--b-text)" }}>
						Brasil 2 × 1 Argentina
					</span>
				</p>

				<div className="space-y-2">
					{[
						{
							guess: "Palpite: 2 × 1",
							pts: 10,
							breakdown:
								"resultado certo +5, gols do Brasil +2, gols da Argentina +2, mas é placar exato = 10",
							color: "oklch(0.83 0.20 90)",
						},
						{
							guess: "Palpite: 2 × 0",
							pts: 7,
							breakdown: "resultado certo +5, gols do Brasil (2) acertados +2",
							color: "var(--b-brand-hi)",
						},
						{
							guess: "Palpite: 3 × 1",
							pts: 7,
							breakdown:
								"resultado certo +5, gols da Argentina (1) acertados +2",
							color: "var(--b-brand-hi)",
						},
						{
							guess: "Palpite: 3 × 0",
							pts: 5,
							breakdown:
								"resultado certo +5, nenhum placar individual acertado",
							color: "oklch(0.60 0.12 145)",
						},
					].map(({ guess, pts, breakdown, color }) => (
						<div
							key={guess}
							className="flex items-start gap-4 rounded-xl px-4 py-3"
							style={{
								background: "var(--b-inner)",
								border: "1px solid var(--b-border-sm)",
							}}
						>
							<div className="min-w-0 flex-1">
								<p
									className="font-semibold text-sm"
									style={{ color: "var(--b-text)" }}
								>
									{guess}
								</p>
								<p
									className="mt-0.5 text-xs"
									style={{ color: "var(--b-text-3)" }}
								>
									{breakdown}
								</p>
							</div>
							<div
								className="shrink-0 font-black font-display text-2xl tabular-nums"
								style={{ color }}
							>
								{pts}
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Exemplos — resultado errado */}
			<section
				className="rounded-2xl p-6"
				style={{
					background: "var(--b-card)",
					border: "1px solid var(--b-border)",
				}}
			>
				<h2
					className="mb-1 font-bold font-display text-xl uppercase tracking-wide"
					style={{ color: "var(--b-text)" }}
				>
					Errou o resultado — ainda dá pra pontuar
				</h2>
				<p
					className="mb-4 text-sm leading-relaxed"
					style={{ color: "var(--b-text-3)" }}
				>
					Mesmo errando quem ganhou, você marca{" "}
					<span className="font-semibold" style={{ color: "var(--b-text)" }}>
						+2 pts
					</span>{" "}
					por cada time cujo número de gols você acertou.
				</p>

				<div
					className="mb-4 rounded-xl px-4 py-3 text-sm"
					style={{
						background: "var(--b-inner)",
						border: "1px solid var(--b-border)",
					}}
				>
					<span style={{ color: "var(--b-text-3)" }}>Jogo real: </span>
					<span className="font-bold" style={{ color: "var(--b-text)" }}>
						Brasil 2 × 1 Argentina
					</span>
					<span style={{ color: "var(--b-text-3)" }}> — Brasil venceu</span>
				</div>

				<div className="space-y-2">
					{[
						{
							guess: "Palpite: 2 × 2",
							pts: 2,
							hit: "Gols do Brasil: você previu 2, aconteceu 2 ✓",
							miss: "Resultado errado — previu empate",
							color: "oklch(0.72 0.18 60)",
						},
						{
							guess: "Palpite: 0 × 1",
							pts: 2,
							hit: "Gols da Argentina: você previu 1, aconteceu 1 ✓",
							miss: "Resultado errado — previu Argentina ganhando",
							color: "oklch(0.72 0.18 60)",
						},
						{
							guess: "Palpite: 0 × 3",
							pts: 0,
							hit: null,
							miss: "Resultado errado. Brasil: previu 0, aconteceu 2. Argentina: previu 3, aconteceu 1.",
							color: "oklch(0.50 0.04 145)",
						},
					].map(({ guess, pts, hit, miss, color }) => (
						<div
							key={guess}
							className="flex items-start gap-4 rounded-xl px-4 py-3"
							style={{
								background: "var(--b-inner)",
								border: "1px solid var(--b-border-sm)",
							}}
						>
							<div className="min-w-0 flex-1">
								<p
									className="font-semibold text-sm"
									style={{ color: "var(--b-text)" }}
								>
									{guess}
								</p>
								<p
									className="mt-0.5 text-xs"
									style={{ color: "var(--b-text-3)" }}
								>
									{miss}
								</p>
								{hit && (
									<p className="mt-0.5 font-medium text-xs" style={{ color }}>
										{hit}
									</p>
								)}
							</div>
							<div
								className="shrink-0 font-black font-display text-2xl tabular-nums"
								style={{ color }}
							>
								{pts}
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Prazo */}
			<section
				className="rounded-2xl p-6"
				style={{
					background: "var(--b-card)",
					border: "1px solid var(--b-border)",
				}}
			>
				<h2
					className="mb-4 font-bold font-display text-xl uppercase tracking-wide"
					style={{ color: "var(--b-text)" }}
				>
					Prazo para palpitar
				</h2>
				<p
					className="text-sm leading-relaxed"
					style={{ color: "var(--b-text-2)" }}
				>
					Os palpites ficam abertos até{" "}
					<span className="font-semibold" style={{ color: "var(--b-text)" }}>
						1 hora antes do início
					</span>{" "}
					de cada jogo. Depois disso, o placar é bloqueado e não pode mais ser
					alterado.
				</p>
				<p
					className="mt-3 text-sm leading-relaxed"
					style={{ color: "var(--b-text-2)" }}
				>
					Os pontos são calculados automaticamente assim que o jogo termina.
				</p>
			</section>

			{/* Ligas */}
			<section
				className="rounded-2xl p-6"
				style={{
					background: "var(--b-card)",
					border: "1px solid var(--b-border)",
				}}
			>
				<h2
					className="mb-4 font-bold font-display text-xl uppercase tracking-wide"
					style={{ color: "var(--b-text)" }}
				>
					Ligas privadas
				</h2>
				<p
					className="text-sm leading-relaxed"
					style={{ color: "var(--b-text-2)" }}
				>
					Crie uma liga, compartilhe o código de 6 letras com seus amigos e
					dispute um ranking exclusivo entre vocês. Cada liga tem até{" "}
					<span className="font-semibold" style={{ color: "var(--b-text)" }}>
						50 membros
					</span>
					.
				</p>
				<p
					className="mt-3 text-sm leading-relaxed"
					style={{ color: "var(--b-text-2)" }}
				>
					O ranking da liga soma todos os pontos conquistados em cada jogo da
					Copa do Mundo 2026.
				</p>
			</section>
		</div>
	);
}
