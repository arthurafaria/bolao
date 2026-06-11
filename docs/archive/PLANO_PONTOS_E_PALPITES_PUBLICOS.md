# Plano — pontos visíveis e palpites públicos pós-bloqueio

> Data do plano: 2026-04-25
> Estado: pendente de execução (apenas diagnóstico + plano)
> Prioridade: alta — afeta percepção de “está rolando” e a graça de competir em liga

## Contexto reportado pelo usuário

1. Já são 21:10 e o cron parece não ter atualizado nada do Brasileirão.
2. Na aba **Palpites**, em cima do resultado de cada jogo encerrado, mostrar quantos pontos o usuário fez, usando as mesmas cores da aba **Regras**.
3. No **ranking das ligas**, mostrar pontos de forma alinhada com a paleta de Regras.
4. Tornar **palpites públicos a partir do bloqueio** (1h antes do início). No fluxo `Ligas → liga → ranking`, clicar no membro deve abrir o perfil dele com os palpites já bloqueados (visíveis para qualquer membro ativo daquela liga).

---

## 1. Diagnóstico — por que “o cron não atualizou às 21:10”

### O que o código faz hoje

Cron jobs em [`packages/backend/convex/crons.ts:7-14`](packages/backend/convex/crons.ts):

```ts
crons.cron("sync WC today",  "0 * * * *",  internal.footballData.syncToday,    {});
crons.cron("sync BSA today", "30 * * * *", internal.footballData.syncTodayBSA, {});
```

Ou seja:

- **WC2026** roda no minuto `:00` de cada hora (próxima execução às 22:00, última às 21:00).
- **BSA2026** roda no minuto `:30` de cada hora (última execução às 20:30, próxima às 21:30).

Às **21:10 não passa cron nenhum** — então a janela do Brasileirão entre 20:30 e 21:30 não é nenhuma anomalia: é o intervalo natural. Cadência de 1h é grossa para jogo ao vivo.

### Bugs reais que podem ter mascarado a atualização mesmo quando o cron rodou

Analisando o caminho `syncToday → upsertMatch → computeForMatch`:

#### Bug A — `justFinished` perde a transição se o status já vier `FINISHED` da primeira vez

[`packages/backend/convex/matches.ts:158-169`](packages/backend/convex/matches.ts):

```ts
const wasFinished = existing.status === "FINISHED";
await ctx.db.patch(existing._id, { status, homeScore, awayScore, utcDate });
return { id: existing._id, justFinished: !wasFinished && args.status === "FINISHED" };
```

Se a primeira sincronização do jogo já chega com `status=FINISHED` (ex.: jogo terminou antes do primeiro cron pegá-lo, ou foi ingerido por `syncAll` retroativo), `wasFinished` continua `true` na próxima sync e `justFinished` nunca dispara. O `computeForMatch` só é chamado em `footballData.ts:121` quando `justFinished === true`, então **os pontos nunca são calculados**.

#### Bug B — placar atrasado em jogo já marcado como FINISHED

A football-data.org ocasionalmente publica o `FINISHED` antes de preencher `score.fullTime.home/away` (especialmente em prorrogação/pênaltis). No tick 1 do cron: `status=FINISHED` mas score `null`. `justFinished=true` é detectado e `computeForMatch` roda — mas em [`predictions.ts:160-162`](packages/backend/convex/predictions.ts) há early return:

```ts
if (!match || match.status !== "FINISHED") return;
if (match.homeScore == null || match.awayScore == null) return;
```

No tick 2 (uma hora depois): `status` continua `FINISHED`, agora com score, mas `wasFinished=true` → `justFinished=false` → **`computeForMatch` nunca mais é chamado**.

Esse caso e o A levam ao mesmo sintoma: placar visível na tela, palpite cravado, mas zero pts mostrados.

#### Bug C — jogo `LIVE`/`IN_PLAY`/`PAUSED` não tem path para “virar pontos” em si

Não é bug, mas para feedback ao usuário durante o jogo: atualmente o card só mostra `Encerrado` ou `Bloqueado` ([`match-card.tsx:295-310`](apps/web/src/components/match-card.tsx)). Ao vivo, o usuário não vê placar parcial nem nada que indique “está rolando agora”. Reforça a sensação de “o cron não atualizou”.

#### Possíveis causas externas (não-bug)

- `FOOTBALL_DATA_API_KEY` não configurada na deployment de produção do Convex — `footballData.ts:55` joga `Error` e o cron falha silenciosamente (só vai aparecer no log do dashboard Convex).
- Rate limit de 10 req/min da API gratuita: cada cron faz 1 GET, então não há risco normal. Mas se rodar `syncAll` em paralelo manualmente, pode estourar.
- Deployment Convex pausada/dormindo (free tier dorme após inatividade longa) — crons só rodam quando a deployment está ativa.

### O que verificar antes de mexer no código

Comandos diretos no monorepo (`packages/backend`):

```bash
npx convex run footballData:syncTodayBSA '{}'   # força sync agora
npx convex logs --tail                          # observa o resultado em tempo real
```

No dashboard do Convex (Production), checar:

1. Aba **Crons** → última execução de `sync BSA today`. Se vermelho, abrir o erro.
2. Aba **Logs** → buscar `[BSA2026] Synced` (linha em `footballData.ts:130`). Confere quantos jogos foram tocados e quantos tiveram pontuação calculada.
3. Aba **Data → matches** → procurar o jogo de hoje, conferir `status`, `homeScore`, `awayScore`.
4. Aba **Data → predictions** → conferir se as predictions desse `matchId` têm `points` e `calculatedAt`.

Se o `match` está `FINISHED` com score correto e as `predictions` não têm `points`, é o **Bug A ou B** acima. Solução de emergência: rodar manualmente

```bash
npx convex run predictions:computeForMatch '{"matchId":"<ID>"}'
```

(precisa expor `computeForMatch` como `internalMutation` chamável via CLI, ou criar uma versão `mutation` interna restrita a admin — ver §5).

---

## 2. Mostrar pontos na aba Palpites, em cima do resultado, com cores de Regras

### Estado atual

- Em [`match-card.tsx:188-449`](apps/web/src/components/match-card.tsx) já existe um `PointsBadge` que aparece **depois do placar**, abaixo dos botões/saving, dentro do bloco `isFinished && prediction?.predictedHome != null` (linha 413).
- O `PointsBadge` usa cores próprias que **não batem** com a tabela de Regras:

| Pontos | Regras                                              | PointsBadge atual                                |
| ------ | --------------------------------------------------- | ------------------------------------------------ |
| 10     | `oklch(0.83 0.20 90)` (dourado/⭐)                  | igual ✓                                          |
| 7      | `var(--b-brand-hi)` em `var(--b-brand-10)`          | igual ✓                                          |
| 5      | **`oklch(0.60 0.12 145)`** (verde) em `var(--b-brand-5)` | usa `var(--b-text-3)` em `var(--b-tint-md)` ✗  |
| 2      | `oklch(0.72 0.18 60)` em `oklch(0.70 0.18 60 / 0.08)` | usa `oklch(0.72 0.18 60)` em `… / 0.12` ≈ ✓     |
| 0      | `oklch(0.50 0.04 145)` em `var(--b-bg)`             | usa vermelho `oklch(0.67 0.22 22)` ✗             |

### Plano

1. **Centralizar paleta** — criar `apps/web/src/lib/points-palette.ts` exportando `getPointsTier(points: number)` que devolve `{ color, bg, border, label, prefix }` exatamente igual à tabela em [`regras/page.tsx:40-86`](apps/web/src/app/\(app\)/regras/page.tsx).
2. **Refatorar `PointsBadge`** em `match-card.tsx` para consumir `getPointsTier` — vira o único lugar com cor/label de pontos.
3. **Refatorar `regras/page.tsx`** para também consumir `getPointsTier` em vez de duplicar literais — garante que “mexeu na regra, mudou em todo lugar”.
4. **Reposicionar a badge para “em cima do resultado”** dentro do `MatchCard`:
   - Hoje, em `isFinished`, o placar está em `match-card.tsx:336-355` e a badge aparece depois (linha 414).
   - Mover o `PointsBadge` para **acima** do bloco do placar (entre o header do card e o `<div className="flex items-center gap-3">` do score), centralizado, só quando `isFinished && prediction?.points != null`.
   - Manter o resumo `Palpite: X × Y` onde está (abaixo do placar).
5. **Edge case**: jogo `FINISHED` com placar mas `prediction.points` indefinido (Bug A/B, ainda não recomputado). Mostrar uma badge cinza neutra com texto `aguardando…` para sinalizar que houve palpite mas o cálculo está pendente — assim o usuário tem feedback de que não é “zero”, é “a apurar”.

### Arquivos tocados

- novo: `apps/web/src/lib/points-palette.ts`
- editado: `apps/web/src/components/match-card.tsx`
- editado: `apps/web/src/app/(app)/regras/page.tsx`

---

## 3. Mostrar pontos no ranking da liga com a paleta de Regras

### Estado atual

[`apps/web/src/app/(app)/leagues/[id]/page.tsx:15-81`](apps/web/src/app/\(app\)/leagues/[id]/page.tsx) já mostra `member.totalPoints` puro à direita da linha. O sub-texto é `{exactScores} exatos · {correctResults} acertos`.

### Plano (interpretando “com as cores que estabelecemos em Regras”)

Os pontos no ranking são **soma** (totalPoints), não a tier de um único jogo — não cabe colorir por tier (10/7/5/2/0). Mas dá para usar a paleta de Regras em três lugares discretos:

1. **Ícone do líder** (1º lugar) com a cor `oklch(0.83 0.20 90)` (dourado, mesma do tier 10) em vez do `text-accent` genérico.
2. **Última pontuação**: ao lado do `{totalPoints} pts`, mostrar uma micro-badge com a pontuação do **último jogo computado** do membro, colorida pela tier de Regras (`getPointsTier`). Ex.: `123 pts · ⭐10 último`.
   - Backend: `getRanking` precisa devolver, para cada membro, a `prediction` mais recente com `calculatedAt != null`. Adicionar essa busca em [`leagues.ts:306-326`](packages/backend/convex/leagues.ts) — uma query extra `by_user` ordenada por `calculatedAt` desc, take 1.
3. **Detalhamento de tiers** (opcional, se couber): substituir `{exactScores} exatos · {correctResults} acertos` por um mini-histograma `10 ⭐ 3  ·  7 ●● 5  ·  5 ● 8  ·  2 ● 2  ·  0 — 1`. Exige adicionar contadores no `leagueMembers` (`tier10`, `tier7`, `tier5`, `tier2`, `tier0`) — mais invasivo. **Decisão pendente**: ficar só no item 2, ou ampliar o schema?

### Arquivos tocados (mínimo)

- editado: `packages/backend/convex/leagues.ts` (`getRanking` retorna `lastPoints?: number`)
- editado: `apps/web/src/app/(app)/leagues/[id]/page.tsx` (`RankingRow` mostra micro-badge usando `getPointsTier`)

---

## 4. Palpites públicos a partir do bloqueio (perfil do membro pelo ranking)

### Estado atual

- [`predictions.getLeagueMemberPredictions`](packages/backend/convex/predictions.ts:114-155) **já existe** e já implementa exatamente a regra: só devolve palpites depois do `lockTime` (1h antes do jogo). Mas é por `matchId` único, e exige caller seja membro `ACTIVE` da liga.
- O frontend não usa essa query em lugar nenhum hoje. Não há rota de “perfil do membro X dentro da liga Y”.
- A linha do ranking não é clicável.

### Plano de backend

Criar uma query irmã em `predictions.ts`:

```ts
// devolve TODOS os palpites bloqueados de um membro, dentro de um torneio,
// só se o caller for membro ACTIVE da mesma liga.
export const getMemberLockedPredictions = query({
    args: {
        leagueId: v.id("leagues"),
        memberUserId: v.string(),
        tournament: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. valida membership do caller (ACTIVE)
        // 2. valida que memberUserId também é ACTIVE na liga (não vaza ex-membros)
        // 3. busca predictions by_user → memberUserId, take 200
        // 4. para cada predictions, ctx.db.get(matchId), filtra:
        //      - match.tournament === args.tournament
        //      - now >= matchTime - 1h  (já bloqueado)
        // 5. enriquece com homeTeam/awayTeam (mesmo enrichMatch de matches.ts)
        // 6. retorna [{ match, prediction }] ordenado por utcDate desc
    },
});
```

Pontos de atenção:

- **Não vazar palpites de jogos ainda abertos.** O filtro `now >= matchTime - LOCK_WINDOW_MS` é a barreira — usar exatamente o mesmo `LOCK_WINDOW_MS` já definido no arquivo.
- **Performance**: `predictions.by_user` traz tudo do usuário; em torneio cheio (Copa = 104 jogos × 50 membros) é OK, mas usar `take(200)` como teto é prudente.
- **Auth**: rejeitar silenciosamente (`return null`) se caller não autenticado ou não-membro, em vez de jogar erro — UI fica simples.

### Plano de frontend

1. **Tornar a linha do ranking clicável** ([`leagues/[id]/page.tsx:32`](apps/web/src/app/\(app\)/leagues/[id]/page.tsx)) — virar `<Link>` para `/leagues/{leagueId}/members/{userId}`.
2. **Nova rota**: `apps/web/src/app/(app)/leagues/[id]/members/[userId]/page.tsx`.
   - Header: avatar, nome do membro (resolvido via `users` igual `getRanking` faz hoje), pts totais na liga, posição, exatos/acertos.
   - Body: lista de cards de palpites bloqueados, agrupados por rodada/grupo igual a aba Palpites (reaproveitar `roundLabel`/`groupByRound` extraindo para `apps/web/src/lib/match-grouping.ts`).
   - Cada card: mesmo `MatchCard` em **modo somente-leitura** — passar uma flag `readOnly` que esconde os `+/-`/Salvar e mostra o palpite formatado, mantendo o `PointsBadge` em cima do placar quando o jogo terminou.
3. **Vazio**: se `getMemberLockedPredictions` retornar `[]`, copy “Esse membro ainda não tem palpites bloqueados nesse torneio.”
4. **Privacy**: deixar **explícito** na aba Regras um parágrafo novo: “Seus palpites ficam visíveis para os outros membros da liga assim que o jogo é bloqueado (1h antes do início).” — gerenciar expectativa.

### Arquivos tocados

- editado: `packages/backend/convex/predictions.ts` (nova `getMemberLockedPredictions`)
- editado: `apps/web/src/components/match-card.tsx` (prop `readOnly`)
- novo: `apps/web/src/lib/match-grouping.ts` (extrair helpers)
- editado: `apps/web/src/app/(app)/predictions/page.tsx` (consumir helpers do lib)
- editado: `apps/web/src/app/(app)/leagues/[id]/page.tsx` (`RankingRow` clicável)
- novo: `apps/web/src/app/(app)/leagues/[id]/members/[userId]/page.tsx`
- editado: `apps/web/src/app/(app)/regras/page.tsx` (parágrafo de privacidade)

---

## 5. Robustez do cálculo de pontos (corrigir Bugs A e B)

### Plano

1. **`upsertMatch` não pode mais perder transições.** Em [`matches.ts:158-174`](packages/backend/convex/matches.ts):
   - Trocar `justFinished` por uma flag mais ampla `shouldComputePoints`:

     ```ts
     const newlyFinished   = !wasFinished && args.status === "FINISHED";
     const scoreNowVisible =
         args.status === "FINISHED" &&
         (existing.homeScore == null || existing.awayScore == null) &&
         args.homeScore  != null && args.awayScore  != null;

     return {
         id: existing._id,
         shouldComputePoints: newlyFinished || scoreNowVisible,
     };
     ```
   - `footballData.ts:121` passa a olhar `shouldComputePoints`.
2. **`computeForMatch` idempotente.** Já é, na prática (filtra `calculatedAt === undefined`), mas vale garantir teste manual: rodar duas vezes seguidas tem que retornar o mesmo `points` total e não duplicar incrementos em `leagueMembers.totalPoints`. **Atenção**: hoje o increment ocorre dentro do laço `for (const pred of predictions)`. Se `computeForMatch` for chamado de novo num jogo que já teve pontos computados, o filtro `calculatedAt === undefined` impede duplicação ✓. Mantém-se idempotente.
3. **Recompute administrativo.** Adicionar uma `internalAction recomputeAll` em `predictions.ts` que percorre todos os jogos `FINISHED` com `homeScore`/`awayScore` e roda `computeForMatch` para cada — ferramenta de emergência caso a base fique inconsistente. Chamável por `npx convex run predictions:recomputeAll '{}'`.
4. **Logging defensivo.** `footballData.ts:130` já loga `synced/pointsComputed`. Adicionar `console.warn` quando `shouldComputePoints=true` e `match.homeScore==null` (cenário inesperado).
5. **(Opcional)** Aumentar a frequência do cron BSA durante a janela de jogo:
   - Hoje `30 * * * *` = 1×/h. Para sentir “está rolando”, mudar para `*/15 * * * *` durante semana — a API permite 10 req/min, 4×/h fica longe disso.
   - **Decisão pendente**: vale o ruído de logs vs. percepção de ao-vivo? Talvez só mudar para `*/30` (2×/h).

### Arquivos tocados

- editado: `packages/backend/convex/matches.ts` (lógica `shouldComputePoints`)
- editado: `packages/backend/convex/footballData.ts` (consumir flag nova)
- editado: `packages/backend/convex/predictions.ts` (nova `recomputeAll`)
- editado: `packages/backend/convex/crons.ts` (cadência, se decidirmos)

---

## 6. Ordem sugerida de execução

1. **§1 verificação operacional** primeiro — rodar `syncTodayBSA` manualmente, confirmar se o problema do usuário é Bug A/B ou só cadência. Resultado decide se §5 entra antes ou depois.
2. **§5 fix de robustez** — sem isso, qualquer feature de ponto exibido fica refém de jogos com pontos zerados por bug.
3. **§2 paleta unificada e badge em cima do placar** — isolado, baixo risco.
4. **§3 ranking colorido** — depende de §2 (paleta) e do schema atual.
5. **§4 palpites públicos pós-bloqueio** — maior, mas independente do resto. Dá pra fazer em paralelo a §3.

## 7. Pontos que precisam de decisão antes de executar

- §3: micro-badge do último jogo basta, ou queremos histograma de tiers (mexe em schema)?
- §4: linha do ranking vira `<Link>` para nova rota, ou abrimos modal `<Dialog>` com a lista de palpites por cima da página? Rota é mais compartilhável; modal é mais leve.
- §5.5: aumentar cadência do cron BSA para `*/15` ou `*/30`?
- §1: depois do diagnóstico, queremos manter a janela WC `today→today+60` (ainda relevante porque a Copa só começa em junho), ou trocar pelo cron unificado discutido em `PLANO_USABILIDADE.md`?
