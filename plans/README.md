# Implementation Plans — "Plano FABLE"

Gerado pela skill improve em 2026-06-10 (commit `e87755c`), a partir do roadmap em `Plano FABLE.txt` (raiz do superprojeto). Execute na ordem abaixo, salvo onde as dependências digam outra coisa. Cada executor: leia o plano inteiro antes de começar, honre as STOP conditions e atualize sua linha ao terminar.

**Contexto de calendário que dita as prioridades**: a Copa do Mundo 2026 começa em **11/06/2026** (um dia após a escrita destes planos) e termina em **19/07/2026**. Os planos P1 são o que precisa estar no ar para a fase de grupos; o 004 precisa estar pronto antes do mata-mata (29/06); 005–009 são melhorias sem prazo duro.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001 | Modo Copa do Mundo por padrão até 19/7 | P1 | S | — | DONE |
| 002 | Dados WC2026: fases do mata-mata, TLA, cron | P1 | S | — | DONE |
| 003 | Palpites por grupo + jogos do dia | P1 | M | 001, 002 | DONE |
| 004 | Bracket visual do mata-mata | P2 | M | 002 | DONE |
| 005 | Repaginação visual brasileira (tokens + botões) | P2 | M | — (ideal após 003) | DONE |
| 006 | Wizard de criação de liga + critério de ranking | P2 | M | — | DONE |
| 010 | Landing em modo Copa (hero, countdown, copy) | P2 | M | 001–005 | DONE |
| 008 | Página de Regras repaginada | P3 | S | — (ideal após 006) | DONE |
| 007 | Pontuação personalizada por liga | P3 | M | 006 | BLOCKED (código aplicado; validação recompute/idempotência exige Convex dashboard/config) |
| 009 | Limpeza do repo (demo.ts, docs históricos) | P3 | S | — (execute por último) | DONE |
| 011 | Redesign "Noite de Jogo" (overhaul visual completo) | P1 | L | 001–006, 010 | DONE |
| 012 | Backend: comparadores de ranking + cravadas expostas | P1 | S | — | DONE |
| 013 | Frontend: painel segmentado Pontos/Cravadas + cravadas no ranking | P1 | M | 012 | DONE |
| 014 | Copy: regras, landing e wizard explicam o desempate | P1 | S | 013 | DONE |
| 015 | Verificação funcional do ranking duplo (roteiro de usuário) | P1 | S | 012–014 | PARCIAL (gates + páginas públicas + revisão de diff: PASS; roteiro autenticado pendente do dono — ver `015-relatorio.md`) |
| 016 | README + commit, push (GitHub) e deploy | P1 | S | 012–015 | DONE |

> **Reescopo 2026-06-10**: o plano 007 foi reescrito (`007-ligas-pontuacao-personalizada.md`) **sem** o fechamento customizado por liga, por decisão do dono. Com 001–006 DONE e prioridade declarada em front-end, a ordem recomendada agora é **010 → 008 → 007 → 009**.

> **Lote 012–016 (2026-06-12, commit `b04a4c0`)**: pedido direto do dono — desempate por cravadas no ranking padrão (`PONTOS | CRAVADAS` na linha) e painel segmentado Pontos/Cravadas em ligas "mais cravadas", com a **aba de pontos como visualização padrão na entrada** (decisão fechada; não reabrir). Executar estritamente em ordem 012 → 013 → 014 → 015 → 016. Os planos 012–015 **não commitam** — o 016 consolida commit, push e deploy (Vercel + `bunx convex deploy`). ⚠️ O deployment Convex local aponta para **produção**: nenhum plano antes do 016 pode rodar `dev:server`, `convex deploy` ou mutations.

Status values: TODO | IN PROGRESS | DONE | BLOCKED (com motivo em uma linha) | REJECTED (com justificativa em uma linha)

## Dependency notes

- **003 depende de 002** (rótulos de fase `Pré-oitavas`/`3º lugar` em `STAGE_LABELS`) e de **001** (a página assume Copa como modo padrão).
- **004 depende de 002** (campo `teams.tla` e os valores reais de `stage` validados contra a API).
- **007 depende de 006** (o wizard de 3 passos criado no 006 é onde as opções do 007 entram; e `rankingMode` estabelece o padrão de settings opcionais na liga).
- **008** escreve copy condicional ao que 006/007 tiverem entregue — executá-lo depois de 006 evita copy hipotética.
- **005** muda apenas tokens/botões e não conflita com nada, mas revisar o visual já com a UI de grupos (003) no ar dá um resultado melhor.
- **010 depende de 001–005 (DONE)**: herda os tokens repaginados e a copy só é verdadeira com modo Copa, grupos e bracket no ar. É o próximo passo natural do foco em front-end.
- **009 por último**: os outros planos citam caminhos de arquivos que o 009 move/deleta… na verdade não (escopo do 009 não toca código citado pelos outros), mas executá-lo por último elimina qualquer chance de drift-check falso.
- **Aviso sobre 007**: mesmo reescopado (só pontuação), altera o motor de pontos no meio do torneio (risco HIGH). Recomendação do advisor: só executar durante a Copa se a feature for prioridade real; caso contrário, depois de 19/07.
- **Planos 001–006 foram aplicados na working tree em 2026-06-10** (ainda sobre o commit `e87755c`). Os drift checks dos planos restantes devem comparar contra o código vivo, não contra o SHA.
- **013 depende de 012**: importa `compareByPoints`/`compareByExacts` de `@bolao/backend/convex/lib/ranking` (fonte única da regra de desempate — não duplicar no web).
- **014 depende de 013**: a copy de regras/landing descreve a UI entregue (abas, `pontos | cravadas`); escrever antes seria copy hipotética.
- **015 depende de 012–014**: é o teste de funcionalidade do usuário do lote inteiro; 100% read-only (prod ao vivo com a Copa em andamento).
- **016 por último**: único plano autorizado a commitar, pushar e deployar; também atualiza o README e o ponteiro do submódulo no superprojeto.
- **Nota sobre o desempate**: a cadeia pontos → cravadas → resultados certos **já existia** no sort de `getRanking` (leagues.ts); o lote 012–016 a formaliza, exibe, documenta e testa — nenhuma pontuação muda, por isso é seguro durante o torneio.

## Findings considered and rejected

- **Migrar de football-data.org para TheSportsDB** (pedido "avalia se é melhor"): rejeitado. Free tier do TheSportsDB tem dados comunitários e livescores apenas no tier pago; a integração atual com football-data.org cobre a Copa no plano gratuito e já tem mitigações maduras (`forceFinishStaleLive`). Migrar na véspera do torneio = risco alto, benefício nulo. Detalhes no plano 002.
- **Palpites por liga** (`predictions` com `leagueId`), que permitiria fechamento por liga de verdade: rejeitado — remodelagem grande de schema + migração de dados no meio do torneio.
- **Fechamento customizado por liga** (`lockPolicy`, qualquer variante — inclusive "lock mais restritivo entre as ligas do usuário"): rejeitado pelo dono do produto em 2026-06-10. O fechamento segue global (1h antes do jogo) para todos. Não reabrir sem pedido explícito.
- ~~**Reescrever o front-end**: interpretado como repaginação via tokens (plano 005).~~ **Superado em 2026-06-10**: o dono rejeitou o resultado do 005 ("o front-end não foi mudado") e pediu overhaul profundo — vira o plano **011** (Noite de Jogo), que substitui esta rejeição.
- **Refatoração ampla de código** ("refatorar de forma menos bagunçada"): reduzido à limpeza de resíduos (plano 009). Split da landing (729 linhas) e do layout (571 linhas) avaliados e deferidos para depois da Copa — risco sem retorno agora; candidatos documentados nas maintenance notes do 009.
- **Mudar o nome/branding "Bolão 2026"**: não pedido; fora de escopo.
