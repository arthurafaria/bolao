export default function RegrasPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1
          className="font-display text-3xl font-black uppercase leading-tight tracking-tight"
          style={{ color: "oklch(0.94 0 0)" }}
        >
          Regras
        </h1>
        <p className="text-sm" style={{ color: "oklch(0.44 0.05 145)" }}>
          Como funciona o bolão
        </p>
      </div>

      {/* Tabela de pontuação */}
      <section
        className="rounded-2xl p-6"
        style={{ background: "oklch(0.12 0.028 145)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <h2
          className="font-display mb-2 text-xl font-bold uppercase tracking-wide"
          style={{ color: "oklch(0.88 0 0)" }}
        >
          Pontuação por jogo
        </h2>
        <p className="mb-5 text-sm" style={{ color: "oklch(0.44 0.05 145)" }}>
          Cada jogo tem dois componentes independentes: <strong className="text-white">resultado</strong> e{" "}
          <strong className="text-white">placar individual de cada time</strong>.
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
              color: "oklch(0.72 0.20 145)",
              bg: "oklch(0.70 0.22 145 / 0.10)",
              border: "oklch(0.70 0.22 145 / 0.25)",
              prefix: null,
            },
            {
              pts: "5",
              label: "Resultado certo",
              desc: "Acertou quem ganhou (ou empate), mas errou os dois placares individuais",
              color: "oklch(0.60 0.12 145)",
              bg: "oklch(0.70 0.22 145 / 0.05)",
              border: "oklch(1 0 0 / 8%)",
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
              bg: "oklch(0.09 0.02 145)",
              border: "oklch(1 0 0 / 5%)",
              prefix: null,
            },
          ].map(({ pts, label, desc, color, bg, border, prefix }) => (
            <div
              key={pts + label}
              className="flex items-start gap-4 rounded-xl p-4"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div
                className="font-display flex h-12 w-14 shrink-0 items-center justify-center rounded-lg text-xl font-black tabular-nums"
                style={{ color, background: "oklch(0 0 0 / 20%)" }}
              >
                {prefix && <span className="mr-0.5 text-sm">{prefix}</span>}
                {pts}
              </div>
              <div>
                <p className="font-semibold" style={{ color }}>
                  {label}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "oklch(0.52 0.04 145)" }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo da lógica */}
        <div
          className="mt-5 rounded-xl px-4 py-4 text-sm space-y-2"
          style={{ background: "oklch(0.70 0.22 145 / 0.07)", border: "1px solid oklch(0.70 0.22 145 / 0.15)" }}
        >
          <p style={{ color: "oklch(0.56 0.05 145)" }}>
            <span className="font-semibold text-white">Resultado certo</span> vale{" "}
            <span className="font-bold" style={{ color: "oklch(0.72 0.20 145)" }}>5 pts</span> de base.
          </p>
          <p style={{ color: "oklch(0.56 0.05 145)" }}>
            <span className="font-semibold text-white">Gols de um time acertados</span> vale{" "}
            <span className="font-bold" style={{ color: "oklch(0.72 0.20 145)" }}>+2 pts</span>{" "}
            — independente do resultado. Conta para o time da casa e para o visitante separadamente.
          </p>
          <p style={{ color: "oklch(0.56 0.05 145)" }}>
            Os dois bônus se somam: acertou resultado (+5) e gols de um time (+2) = <span className="font-bold text-white">7 pts</span>.
            Acertou os dois placares = <span className="font-bold text-white">10 pts</span>.
          </p>
        </div>
      </section>

      {/* Exemplos — resultado certo */}
      <section
        className="rounded-2xl p-6"
        style={{ background: "oklch(0.12 0.028 145)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <h2
          className="font-display mb-1 text-xl font-bold uppercase tracking-wide"
          style={{ color: "oklch(0.88 0 0)" }}
        >
          Exemplos — resultado certo
        </h2>
        <p className="mb-4 text-sm" style={{ color: "oklch(0.44 0.05 145)" }}>
          Jogo real: <span className="font-semibold text-white">Brasil 2 × 1 Argentina</span>
        </p>

        <div className="space-y-2">
          {[
            {
              guess: "Palpite: 2 × 1",
              pts: 10,
              breakdown: "resultado certo +5, gols do Brasil +2, gols da Argentina +2, mas é placar exato = 10",
              color: "oklch(0.83 0.20 90)",
            },
            {
              guess: "Palpite: 2 × 0",
              pts: 7,
              breakdown: "resultado certo +5, gols do Brasil (2) acertados +2",
              color: "oklch(0.72 0.20 145)",
            },
            {
              guess: "Palpite: 3 × 1",
              pts: 7,
              breakdown: "resultado certo +5, gols da Argentina (1) acertados +2",
              color: "oklch(0.72 0.20 145)",
            },
            {
              guess: "Palpite: 3 × 0",
              pts: 5,
              breakdown: "resultado certo +5, nenhum placar individual acertado",
              color: "oklch(0.60 0.12 145)",
            },
          ].map(({ guess, pts, breakdown, color }) => (
            <div
              key={guess}
              className="flex items-start gap-4 rounded-xl px-4 py-3"
              style={{ background: "oklch(0.10 0.025 145)", border: "1px solid oklch(1 0 0 / 6%)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "oklch(0.80 0 0)" }}>
                  {guess}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "oklch(0.44 0.04 145)" }}>
                  {breakdown}
                </p>
              </div>
              <div
                className="font-display shrink-0 text-2xl font-black tabular-nums"
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
        style={{ background: "oklch(0.12 0.028 145)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <h2
          className="font-display mb-1 text-xl font-bold uppercase tracking-wide"
          style={{ color: "oklch(0.88 0 0)" }}
        >
          Exemplos — resultado errado
        </h2>
        <p className="mb-4 text-sm" style={{ color: "oklch(0.44 0.05 145)" }}>
          Jogo real: <span className="font-semibold text-white">Brasil 2 × 1 Argentina</span> — mas você apostou na Argentina
        </p>

        <div className="space-y-2">
          {[
            {
              guess: "Palpite: 1 × 2",
              pts: 2,
              breakdown: "resultado errado, mas gols do Brasil (2) acertados +2",
              color: "oklch(0.72 0.18 60)",
            },
            {
              guess: "Palpite: 0 × 1",
              pts: 2,
              breakdown: "resultado errado, mas gols da Argentina (1) acertados +2",
              color: "oklch(0.72 0.18 60)",
            },
            {
              guess: "Palpite: 0 × 3",
              pts: 0,
              breakdown: "resultado errado e nenhum placar individual acertado",
              color: "oklch(0.50 0.04 145)",
            },
          ].map(({ guess, pts, breakdown, color }) => (
            <div
              key={guess}
              className="flex items-start gap-4 rounded-xl px-4 py-3"
              style={{ background: "oklch(0.10 0.025 145)", border: "1px solid oklch(1 0 0 / 6%)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "oklch(0.80 0 0)" }}>
                  {guess}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "oklch(0.44 0.04 145)" }}>
                  {breakdown}
                </p>
              </div>
              <div
                className="font-display shrink-0 text-2xl font-black tabular-nums"
                style={{ color }}
              >
                {pts}
              </div>
            </div>
          ))}
        </div>

        {/* Caso especial do exemplo do usuário */}
        <div
          className="mt-4 rounded-xl px-4 py-3"
          style={{ background: "oklch(0.10 0.025 145)", border: "1px solid oklch(0.70 0.18 60 / 0.25)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.72 0.18 60)" }}>
            Outro exemplo
          </p>
          <p className="text-sm" style={{ color: "oklch(0.56 0.05 145)" }}>
            Você apostou <strong className="text-white">Time A 2 × 0 Time B</strong>, mas o jogo terminou{" "}
            <strong className="text-white">Time A 2 × 3 Time B</strong> (vitória do Time B).
            <br />
            <span className="mt-1 block">
              Resultado errado — mas você acertou que o Time A faria <strong className="text-white">2 gols</strong>.{" "}
              <span style={{ color: "oklch(0.72 0.18 60)" }} className="font-bold">+2 pts</span>.
            </span>
          </p>
        </div>
      </section>

      {/* Prazo */}
      <section
        className="rounded-2xl p-6"
        style={{ background: "oklch(0.12 0.028 145)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <h2
          className="font-display mb-4 text-xl font-bold uppercase tracking-wide"
          style={{ color: "oklch(0.88 0 0)" }}
        >
          Prazo para palpitar
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "oklch(0.56 0.05 145)" }}>
          Os palpites ficam abertos até{" "}
          <span className="font-semibold text-white">1 hora antes do início</span> de cada jogo.
          Depois disso, o placar é bloqueado e não pode mais ser alterado.
        </p>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "oklch(0.56 0.05 145)" }}>
          Os pontos são calculados automaticamente assim que o jogo termina.
        </p>
      </section>

      {/* Ligas */}
      <section
        className="rounded-2xl p-6"
        style={{ background: "oklch(0.12 0.028 145)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <h2
          className="font-display mb-4 text-xl font-bold uppercase tracking-wide"
          style={{ color: "oklch(0.88 0 0)" }}
        >
          Ligas privadas
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "oklch(0.56 0.05 145)" }}>
          Crie uma liga, compartilhe o código de 6 letras com seus amigos e dispute um ranking
          exclusivo entre vocês. Cada liga tem até{" "}
          <span className="font-semibold text-white">50 membros</span>.
        </p>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "oklch(0.56 0.05 145)" }}>
          O ranking da liga soma todos os pontos conquistados em cada jogo da Copa do Mundo 2026.
        </p>
      </section>
    </div>
  );
}
