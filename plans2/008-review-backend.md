# Review de Backend (Convex) — Chuta de Bico

> **O que é**: uma revisão de segurança + performance + boas práticas do backend Convex,
> feita com as skills `convex-security-check` e `convex-performance-audit`. Documento de
> **review** (achados + recomendações), não um plano de execução passo a passo — cada
> achado aponta onde o conserto deve entrar (plano existente ou novo). Read-only: nenhum
> código foi alterado.
>
> **Revisado no commit**: `857d0d0`, 2026-07-21. **Escopo**: `packages/backend/convex/**`.
> Não foi possível rodar `npx convex insights` (deployment local aponta pra produção; a
> skill de performance permite auditar por código nesse caso). Signals = leitura de código.

## Veredito

O backend é sólido: autenticação via `@convex-dev/auth` bem aplicada, `requireUserId`
consistente, validadores de `args` em todas as funções, `internalMutation/Query/Action`
usados corretamente para operações sensíveis, e controle de acesso por liga (membro ACTIVE)
nos pontos certos. Três coisas merecem ação: **(1)** dois endpoints HTTP de sync sem
autenticação, **(2)** um padrão de read-amplification no ranking que **piora ao longo da
temporada** (justo o formato pro qual estamos pivotando), e **(3)** o admin por e-mail
hardcoded e duplicado. O resto é higiene (validadores de `returns`).

## Achados (ordenados por alavancagem)

| # | Achado | Categoria | Impacto | Esforço | Risco | Confiança |
|---|--------|-----------|---------|---------|-------|-----------|
| B1 | `getRanking` lê todos os palpites de todos os membros a cada render | performance | Cresce p/ ~19k docs/liga numa temporada cheia; reativo | M | MED | ALTA |
| B2 | Endpoints HTTP `/sync-matches` e `/sync-bsa` sem auth | segurança | Qualquer um dispara sync externo (rate-limit/custo) | S | LOW | ALTA |
| B3 | Admin por e-mail hardcoded, duplicado em 3 lugares | segurança/tech-debt | Frágil; muda e-mail → perde admin | S | LOW | ALTA |
| B4 | `getRankingByPhase` + `getAllByDate` lêem a temporada inteira | performance | Payload/reads crescem com 380 jogos | M | MED | ALTA |
| B5 | Faltam validadores de `returns` em todas as funções | boas práticas | Risco de vazar campos; sem contrato de saída | M | LOW | ALTA |
| B6 | `getAdminUser` filtra por `_id` (full scan) em vez de `db.get` | performance | Micro; scan da tabela users | S | LOW | ALTA |
| B7 | `forceFinishStaleLive` dispara `recomputeAll` (base inteira) dentro do sync | performance | Recompute pesado a cada promoção; raro | S | MED | MED |

---

### B1 — `getRanking` lê todos os palpites de todos os membros (read amplification)

- **Evidência**: `leagues.ts:494-520` — para cada membro, `getRanking` faz
  `query("predictions").withIndex("by_user").collect()` e depois ordena tudo só para achar
  `lastPoints` (os pontos do palpite calculado mais recente).
- **Impacto**: uma liga de 50 membros, numa temporada de 38 rodadas (~380 palpites por
  usuário), lê ~50×380 = **19.000 documentos de predictions a cada abertura do ranking** — e
  é uma query **reativa**, então re-executa a cada atualização de pontos. Numa Copa de 1 mês
  isso era pequeno; no Brasileirão de 8 meses (o alvo do pivot) vira o hot path mais caro do
  app. Este é o achado de maior alavancagem justamente porque escala com o formato novo.
- **Esforço**: M. **Risco**: MED (mexe no cálculo incremental).
- **Fix sketch**: desnormalizar `lastPoints` (e talvez `lastCalculatedAt`) no doc de
  `leagueMembers`, atualizando-o dentro de `computeForMatch` (que já patcha o membership).
  Aí `getRanking` não precisa ler predictions nenhuma. Alternativa mais barata: remover
  `lastPoints` se a UI não depender dele (checar consumidores em `apps/web`).
- **Onde entra**: novo plano ou fold no plano 005 (que já mexe em ranking por rodada). Não
  colocar no 002/003 pra não misturar com a mudança de motor de pontos.

### B2 — Endpoints HTTP de sync sem autenticação

- **Evidência**: `http.ts:11-39` — as rotas `POST /sync-matches` (chama
  `internal.footballData.syncAll`, Copa) e `POST /sync-bsa` (chama `syncAllBSA`) não checam
  nenhuma credencial. O `NEXT_PUBLIC_CONVEX_SITE_URL` é público (vai no frontend), então as
  rotas são descobríveis.
- **Impacto**: qualquer pessoa pode disparar um sync completo contra a football-data.org.
  Isso queima o rate limit do plano free (10 req/min) — podendo travar os syncs legítimos —
  e força escritas (upserts) em massa. É um gatilho não autenticado de operação cara com
  dependência externa (defensivo: trate como um vetor de abuso/DoS de amplificação).
- **Esforço**: S. **Risco**: LOW.
- **Fix sketch**: como os crons já chamam os `internal.*` actions diretamente e o `/admin`
  tem botões de resync, essas rotas HTTP são redundantes → **removê-las** é o mais simples.
  Se quiser manter um gatilho externo, exigir um header secreto
  (`req.headers.get("x-sync-secret") === process.env.SYNC_SECRET`) e responder 401 caso
  contrário. Nunca reproduzir o segredo em logs. Obs.: pós-pivot, `/sync-matches` (Copa) é
  código morto de qualquer forma.
- **Onde entra**: novo plano curto (segurança), ou fold no plano 002 (que já aposenta o
  cron da Copa) — a rota `/sync-matches` sai junto com o resto da Copa.

### B3 — Admin por e-mail hardcoded e duplicado

- **Evidência**: `predictions.ts:491` (`const ADMIN_EMAIL = "arthurdearaujofaria@gmail.com"`
  dentro de `getAdminUser`), repetido em `apps/web/src/app/(app)/admin/page.tsx:19` e
  `apps/web/src/app/(app)/layout.tsx:76`.
- **Impacto**: se o dono trocar de e-mail, perde acesso de admin silenciosamente; e a regra
  vive em 3 fontes que podem divergir. Não é uma brecha (o e-mail é verificado via OTP/Google),
  mas é frágil e não escala pra >1 admin.
- **Esforço**: S. **Risco**: LOW.
- **Fix sketch**: mover pra env var (`process.env.ADMIN_EMAILS`, lista separada por vírgula)
  lida no backend, ou um campo `role` no user. Backend vira a fonte única; o frontend
  consulta `api.auth.getCurrentUser` + uma flag `isAdmin` derivada no backend em vez de
  comparar string no cliente.
- **Onde entra**: novo plano curto (tech-debt/segurança).

### B4 — Ranking por fase e lista de jogos lêem a temporada inteira

- **Evidência**: `leagues.ts:542-554` (`getRankingByPhase` lê todas as matches do torneio +
  todos os palpites de cada membro) e `matches.ts:88-100` (`getAllByDate` retorna **todos**
  os jogos do torneio, com 2 `db.get` por jogo em `enrichMatch`).
- **Impacto**: com 380 jogos + 50 membros, ambos ficam caros; `getAllByDate` manda a
  temporada inteira pro cliente a cada load de `/predictions` e `/dashboard`. A UI por rodada
  (plano 004) deriva a rodada no cliente **a partir dessa lista completa** — ou seja, ainda
  busca os 380.
- **Esforço**: M. **Risco**: MED.
- **Fix sketch**: adicionar índice `by_tournament_matchday` na tabela `matches` e uma query
  `getByRound({ tournament, matchday })` que retorna só a rodada. `getCurrentRound` (plano
  005) usa o índice. `getRankingByPhase` deve ser reduzido a "geral" (plano 003 já sinaliza).
- **Onde entra**: plano 005 (adiciona `getCurrentRound`/`getRoundRanking` — adicionar o
  índice lá) e plano 004 (consumir a query por rodada em vez de derivar de `getAllByDate`).

### B5 — Faltam validadores de `returns`

- **Evidência**: nenhuma função em `predictions.ts`/`leagues.ts`/`matches.ts`/`auth.ts` tem
  `returns:`. Ex.: `auth.ts:30-36` `getCurrentUser` retorna `ctx.db.get(userId)` (doc inteiro
  do usuário).
- **Impacto**: sem contrato de saída, é fácil um refactor passar a vazar campos novos; a
  skill de segurança do Convex lista isso como item de checklist. Baixo risco hoje (o usuário
  só vê o próprio doc), mas é higiene que previne vazamento futuro.
- **Esforço**: M (muitas funções). **Risco**: LOW.
- **Fix sketch**: adicionar `returns:` gradualmente, começando pelas que expõem dados de
  outros usuários (`getRanking`, `getInvitePreview`, `getMemberLockedPredictions`). Projetar
  explicitamente só os campos necessários.
- **Onde entra**: melhoria em lote, sem plano dedicado (baixa prioridade); pode ir junto de
  qualquer plano que já toque a função.

### B6 — `getAdminUser` filtra por `_id` em vez de `db.get`

- **Evidência**: `predictions.ts:485-493` — `query("users").filter(q => q.eq(q.field("_id"), args.userId)).unique()`.
- **Impacto**: `.filter` por `_id` faz varredura da tabela `users`; `ctx.db.get(args.userId as Id<"users">)`
  é O(1). Micro-otimização, mas roda em toda ação de admin.
- **Esforço**: S. **Risco**: LOW.
- **Fix sketch**: `const user = await ctx.db.get(args.userId as Id<"users">)`. Juntar com B3.

### B7 — `forceFinishStaleLive` dispara `recomputeAll` da base inteira dentro do sync

- **Evidência**: `footballData.ts:499-505` — se `forceFinishStaleLive` promove ≥1 jogo, o
  sync chama `internal.predictions.recomputeAll` (reset + recompute de **todos** os jogos
  finalizados).
- **Impacto**: uma promoção de jogo travado dispara um recompute de base completa no meio de
  um cron de 10 min. Raro, mas numa temporada com 380 jogos o recompute fica pesado (custo de
  ação/transação). `recomputeAll` também é idempotente e correto — o problema é o gatilho amplo.
- **Esforço**: S. **Risco**: MED (mudar pra recompute pontual pode perder um caso de borda).
- **Fix sketch**: em vez de `recomputeAll`, computar só os jogos recém-promovidos
  (`promotedIds` já é retornado por `forceFinishStaleLive` em `matches.ts:384`) via
  `computeForMatch` por id. Validar contra o motivo original do recompute amplo antes de trocar.
- **Onde entra**: novo plano curto (performance), baixa prioridade.

## O que já está bom (não mexer)

- **Auth**: `requireUserId`/`auth.getUserId` aplicados de forma consistente; providers
  Password+OTP e Google configurados corretamente (`auth.ts`).
- **Controle de acesso por liga**: `getLeagueMemberPredictions`/`getMemberLockedPredictions`
  checam membership ACTIVE antes de revelar palpites (`predictions.ts:166-172, 354-355`).
- **`getMemberLockedPredictions` já é otimizada**: gets paralelos + dedup de teams
  (`predictions.ts:359-387`) — alguém já fez o dever de casa de performance aqui.
- **Idempotência**: `computeForMatch` pula palpites com `calculatedAt` — recomputar nunca
  duplica pontos.
- **`internalQuery listEmails`** (`users.ts`) corretamente interno (usado no disparo de email).
- **Segredos em env** (exceto a chave commitada em SETUP.md — ver plano 007).

## Como isto se conecta aos planos

- **B2** e **B4** têm sobreposição natural com os planos 002 (aposenta Copa/cron) e 004/005
  (por rodada) — trate-os lá.
- **B1**, **B3**, **B6**, **B7** são melhorias independentes; se quiser, viram planos curtos
  (`010`+). Recomendo priorizar **B1** (escala com a temporada) e **B2** (segurança).
- **B5** é higiene contínua, sem plano dedicado.
