# Planos — Pivot para o Brasileirão ("Chuta de Bico")

Gerados pela skill **improve** em 2026-07-21, no commit `857d0d0`. Contexto: a Copa do
Mundo 2026 acabou; o produto passa a ser um bolão de **campeonato longo focado no
Brasileirão Série A**, rebatizado **"Chuta de Bico"**. Decisões do dono (2026-07-21):
snapshot + reaproveitar as ligas, esconder a Copa da UI (código genérico por baixo), pacote
de usabilidade focado (rodada atual + recap), e rebrand.

Cada executor: **leia o plano inteiro antes de começar**, rode o drift check, honre as STOP
conditions e atualize sua linha nesta tabela ao terminar. Os planos são autossuficientes —
o executor não viu esta conversa nem os outros planos.

> `000` é o **esquema de usabilidade** (documento de design), não um plano de execução.
> Leia-o antes de `004` e `005`.

## Ordem de execução & status

Executados via `execute <plano>` em 2026-07-21: cada um rodou num subagente executor, em
worktree isolada própria, e foi revisado (critérios reexecutados, escopo conferido, diff lido)
antes do veredito. **Nenhuma branch foi mesclada na `master`** — mesclar é decisão do dono. Ver
"Branches para revisão/merge" abaixo para os nomes e a ordem de merge recomendada.

| Plano | Título | Prioridade | Esforço | Depende de | Status |
|------|--------|-----------|---------|-----------|--------|
| 000 | Esquema de usabilidade (Brasileirão) | — (ref) | — | — | REFERÊNCIA |
| 007 | Segurança: rotacionar chave football-data | P1 | S | — | DONE (APPROVE) |
| 001 | Encerrar a Copa: arquivar ranking + zerar pontos | P1 | M | — | DONE (APPROVE) |
| 002 | Registry de torneios + Brasileirão pontua | P1 | M | 001 (execução) | DONE (APPROVE) |
| 003 | Remover desempate de mata-mata | P1 | M | 002 | DONE (APPROVE) |
| 004 | Frontend só-Brasileirão, navegação por rodada | P1 | L | 002, 003 | DONE (APPROVE) |
| 005 | Recap de rodada + ranking por rodada | P2 | L | 002, 004 | DONE (APPROVE) |
| 006 | Rebrand → "Chuta de Bico" | P2 | M | — (ideal após 004) | DONE (APPROVE) |

Status: TODO | IN PROGRESS | DONE | BLOCKED (motivo em 1 linha) | REJECTED (justificativa em 1 linha)

## Branches para revisão/merge (nenhuma foi mesclada — decisão do dono)

Cadeia de branches (cada uma contém as anteriores na cadeia, via fast-forward): `advisor/007-…`
e `advisor/001-…` partem de `master` (857d0d0/9d12cb8) de forma independente; `advisor/002-…`
também parte de `master` independente; `advisor/003-…` = 002 + desempate removido;
`advisor/004-…` = 003 + frontend só-BSA; `advisor/005-…` e `advisor/006-…` = 004 + suas
respectivas mudanças (irmãs entre si — testei um merge das duas e combinam sem conflito).

| Branch | Contém | Commit |
|---|---|---|
| `advisor/007-seguranca-chave-football-data` | 007 (independente) | `838cb0c` |
| `advisor/001-encerrar-copa-arquivar-e-zerar` | 001 (independente) | `72ed50c` |
| `advisor/002-registry-torneios-brasileirao-pontua` | 002 (independente) | `6dd4a56` |
| `advisor/003-remover-desempate-mata-mata` | 002 + 003 | `6848b9a` |
| `advisor/004-frontend-so-brasileirao-por-rodada` | 002 + 003 + 004 | `6b830d1` |
| `advisor/005-recap-rodada-ranking-por-rodada` | 002+003+004 + 005 | `5e8a30b` |
| `advisor/006-rebrand-chuta-de-bico` | 002+003+004 + 006 | `4197eb9` |

**Ordem de merge recomendada para `master`**: `007` → `001` → (`003`, que já inclui `002`) →
`004` → `005` e `006` (podem entrar em qualquer ordem entre si — testado, sem conflito). Depois
do merge, rode `bun run check-types && bun run check && bun test packages/backend/tests` na
`master` real antes de fazer deploy — as worktrees isoladas não têm `.env.local`, então
`bun run build` só pôde ser validado via `check-types` (ver nota abaixo).

## Pendências que nenhum plano cobriu (achados durante a revisão)

- **Suposição não verificada**: toda a navegação por rodada (planos 004/005) assume que os
  jogos do Brasileirão têm `matchday` preenchido pela football-data.org. Não pude confirmar
  contra dados reais (sem acesso a `convex run`/prod). Se `matchday` vier vazio, a UI cai em
  estados vazios (não quebra), mas a rodada fica inutilizável. **Confira isso antes do deploy.**
- **Copy obsoleta em `/regras`**: a página ainda descreve o protocolo de prorrogação/pênaltis
  ("+2 pts de desempate") que os planos 003/004 removeram do backend e da UI de palpite. Nenhum
  plano tinha esse texto no escopo. Candidato a um plano de conteúdo (ou dobrar no 006 da
  próxima vez).
- **Abas "Grupos"/"Mata-mata" mortas em `/leagues/[id]`**: `getRankingByPhase` (plano 003)
  passou a retornar essas fases sempre vazias, mas a UI (plano 004/005, que preservaram
  explicitamente esse painel por estar fora do escopo de ambos) ainda mostra as três abas
  Geral/Mata-mata/Grupos. Um usuário clicando em "Mata-mata" ou "Grupos" hoje só vê o estado
  vazio "ainda não começou" — confuso num produto só-Brasileirão. Ninguém no plano assumiu essa
  limpeza; recomendo um plano curto pra reduzir a página a só "Geral" + "Por rodada".
- **`bun run build` não pôde ser validado de ponta a ponta**: todas as worktrees isoladas não
  têm `.env.local` (gitignored, nunca existiram ali), então o build do Next.js falha só na
  validação de env vars (`NEXT_PUBLIC_CONVEX_URL`/`SITE_URL`), nunca por erro de código.
  `bun run check-types` (que não exige env vars) foi usado como sinal de correção de compilação
  em cada plano — mas vale rodar `bun run build` de verdade na sua máquina (com `.env.local`)
  antes do deploy.
- **`bun run check` (Biome, repo inteiro) falha em toda worktree criada sob `.claude/worktrees/`**
  — `biome.json` ignora caminhos `.claude`, e a própria worktree vive nesse caminho. Todo
  executor substituiu por `bunx biome check <arquivos tocados>`, que passou limpo em todos os
  planos. Isso é uma característica do ambiente de execução isolado, não um bug do repo.

## Reviews (documentos de análise, não planos de execução)

Feitos com as skills do projeto (`convex-security-check`, `convex-performance-audit`,
`web-design-guidelines`). São achados + recomendações; cada um aponta onde o conserto entra.

| Doc | Escopo | Skills | Achados |
|-----|--------|--------|---------|
| [008](008-review-backend.md) | Backend Convex | convex-security-check, convex-performance-audit | 7 (B1–B7) |
| [009](009-review-frontend.md) | Frontend/UI | web-design-guidelines | 8 (F1–F8) |

**Achados de maior prioridade que ainda NÃO têm plano dedicado** (candidatos a planos `010`+):
- **B1** — `getRanking` lê todos os palpites de todos os membros a cada render; escala mal na
  temporada longa (justo o formato do pivot). Desnormalizar `lastPoints` no membership.
- **B2** — endpoints HTTP `/sync-matches` e `/sync-bsa` sem auth; remover ou exigir segredo
  (o `/sync-matches` da Copa sai junto do plano 002).
- **B3** — admin por e-mail hardcoded/duplicado em 3 lugares; mover pra env/`role`.
- **F1** — motion sem `prefers-reduced-motion` global; **F3** — `outline-none` sem substituto
  de foco. Juntar F1/F2/F3/F7/F8 num plano único "Acessibilidade & plataforma".

Achados que já caem dentro dos planos existentes: **B4/F5** (payload da temporada → plano
004/005), **F4** (estado na URL → plano 004).

**Ordem recomendada**: `007` (rápido, independente, segurança — faça já) → `001` → `002`
→ `003` → `004` → `005`. O `006` (rebrand) pode entrar em paralelo, idealmente depois do
`004` para não editar arquivos que o `004` apaga.

## Grafo de dependências

- **001 antes de 002** (ordem de *execução*, não de código): 001 arquiva o ranking da Copa e
  zera os pontos. Se 002 (que faz o Brasileirão pontuar) rodar antes, jogos do BSA já
  encerrados entrariam pontos no mesmo `totalPoints` e o reset do 001 os apagaria junto.
- **002 antes de 003**: ambos editam `predictions.ts`. 002 troca só o gate de torneio
  (`SCORABLE_TOURNAMENT` → registry); 003 remove a lógica de bônus de desempate. Fazer 002
  primeiro evita conflito de linhas.
- **003 antes/junto de 004**: 003 remove o desempate no backend; 004 remove o
  `TiebreakerPicker` no frontend. Se 004 rodar antes, o backend ainda escreve `tieBonus` (sem
  efeito visível) — não quebra, mas fica meio-caminho. Preferir 003 → 004.
- **004 depende de 002 e 003**: a UI por rodada assume que o BSA pontua (002) e que não há
  mais desempate (003). Também remove a aba mata-mata/bracket/seletor.
- **005 depende de 002 e 004**: usa `matchday` confiável (002) e a navegação por rodada (004);
  adiciona `getCurrentRound` e `getRoundRanking` e substitui a derivação client-side do 004.
- **006 e 007 são independentes** do resto; 007 é segurança e deve vir primeiro.

## Operações manuais do dono (fora do código — os planos NÃO as executam)

O deployment Convex local aponta para **produção**, então nenhum plano roda `dev:server`,
`convex deploy` ou mutations. As ações de uma vez são do dono, via `/admin` ou CLI:
1. Após **001** deployado: `/admin` → "Arquivar ranking da Copa" → conferir `/copa-2026` →
   **depois** "Zerar pontos".
2. Após **002** deployado (e reset feito): `/admin` → "Recomputar todos os pontos" (idempotente)
   para pontuar jogos do Brasileirão já encerrados.
3. **007**: rotacionar a chave football-data.org e `bunx convex env set --prod FOOTBALL_DATA_API_KEY`.

## Verificação (gates que todo plano usa)

- `bun run check-types` — TypeScript em todos os workspaces (exit 0).
- `bun run check` — Biome lint + format (exit 0).
- `bun test packages/backend/tests` — testes unitários do backend (todos passam).
- `bun run build` — build de todos os workspaces (exit 0) — usado pelos planos de frontend.

## Findings considerados e rejeitados (para não reauditar)

- **Arquivar de verdade (schema de temporada + ligas novas por torneio)**: rejeitado pelo
  dono em favor de "snapshot + reaproveitar" (2026-07-21). As ligas continuam sem vínculo de
  torneio; só guardamos a foto da Copa (`seasonArchives`) e zeramos. Não reabrir sem pedido.
- **Manter a Copa como histórico navegável na UI**: rejeitado — o dono escolheu "esconder a
  Copa, só BSA". A memória da Copa vive na página estática `/copa-2026` (plano 001), não no
  seletor de torneio.
- **Remover já os campos `tieWinner`/`tieMethod`/`tieBonus` do schema**: adiado. Exige
  migração widen-migrate-narrow (`convex-migration-helper`); os planos 003/001 param de
  escrever e limpam os valores, mas os campos `v.optional` ficam para não arriscar uma
  mudança de validador no mesmo PR. Ver "Maintenance notes" do 003.
- **Reescrever a git history para purgar a chave vazada**: fora do escopo automatizado —
  operação destrutiva com force-push, decisão do dono. Rotação (plano 007) já torna a chave
  antiga inútil.
- **Charts de evolução na temporada / streaks / recap mensal**: adiados para depois do 005 —
  dependem dos dados por rodada que o 005 expõe. Escopo próprio quando pedido.
- **Redesenhar a landing (`app/page.tsx`) para o Brasileirão**: não incluído como plano
  próprio. O 006 troca só as strings de marca; a landing tem copy pesada de Copa ("104 jogos
  da Copa", countdown) que, se virar landing de Brasileirão, é um redesign à parte (ver STOP
  do 006). Sinalizado, não planejado — aguardando decisão do dono.
