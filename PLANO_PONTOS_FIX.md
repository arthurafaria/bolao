# Plano — corrigir pontos travados e perfil do membro que não carrega

> Data do plano: 2026-04-26
> Estado: ✅ concluído e em produção (2026-04-26)
> Prioridade: alta — bug visível no produto, percepção de "metade ficou pela metade"

## Contexto reportado pelo usuário

Tirando print da aba **Palpites** com três cards do Brasileirão:

| Jogo                      | Horário | Estado mostrado     | Pontos    |
| ------------------------- | ------- | ------------------- | --------- |
| Botafogo × Internacional  | 18:30   | `fechado` + Bloqueado + `✓ Salvo — 2×1` | **não aparece** |
| Remo × Cruzeiro           | 18:30   | `fechado` + Bloqueado + `✓ Salvo — 1×2` | **não aparece** |
| São Paulo × Mirassol      | 21:00   | `Encerrado` + `Palpite: 1×0`            | **★ 10 pts** ✅ |

Resumo do usuário:
1. O badge de pontos funcionou no jogo de cima certinho — **§2 do plano anterior está OK**.
2. Os jogos do começo da rodada (já encerrados na vida real) **não viraram `FINISHED` no banco** — continuam mostrando o palpite como se ainda fosse jogo aberto bloqueado, sem placar real.
3. A linha do ranking virou clicável, mas **a página do perfil do membro não abre**. Cadê.

---

## 1. Diagnóstico — por que Botafogo×Internacional e Remo×Cruzeiro estão como "fechado"

### O que o card mostra é leitura direta do schema

[`apps/web/src/components/match-card.tsx:184-188`](apps/web/src/components/match-card.tsx#L184-L188):

```ts
const isLocked =
    Date.now() >= lockTime ||
    (match.status !== "TIMED" && match.status !== "SCHEDULED");
const isFinished = match.status === "FINISHED";
```

Estado `fechado` aparece em [`match-card.tsx:284-290`](apps/web/src/components/match-card.tsx#L284-L290) **só** quando `isLocked && !isFinished`. Logo: os dois jogos **não estão `FINISHED` no banco do Convex**. Status real é provavelmente `IN_PLAY`/`PAUSED`/`LIVE` — ou ficou `FINISHED` pela primeira sync mas com score `null` (ver §1.2).

E o `2 × 1` / `1 × 2` que aparecem **não são** o placar real — são os inputs do palpite renderizados como números porque `isLocked && !readOnly && !isFinished` cai no ramo do `<ScoreInput disabled />` em [`match-card.tsx:378-396`](apps/web/src/components/match-card.tsx#L378-L396). É o `home`/`away` do estado local, hidratados do `prediction.predictedHome/Away`.

### 1.1 Possível causa A — football-data.org demorou pra publicar `FINISHED`

A API gratuita às vezes leva 30–60 min depois do apito final pra mudar o status do jogo. Cadência atual em [`packages/backend/convex/crons.ts:9-14`](packages/backend/convex/crons.ts#L9-L14) é `*/30 * * * *`. Se o jogo terminou às 20:20 e a API só virou pra `FINISHED` por volta de 21:10, o cron das 21:00 perdeu, o de 21:30 pega — e a percepção do usuário é "demorou demais".

### 1.2 Possível causa B — `FINISHED` chegou sem score na primeira sync, e `upsertMatch` resolve, mas só na próxima sync

Após o último fix em [`packages/backend/convex/matches.ts:158-180`](packages/backend/convex/matches.ts#L158-L180):

```ts
const wasFinished = existing.status === "FINISHED";
const newlyFinished = !wasFinished && args.status === "FINISHED";
const scoreNowVisible =
    args.status === "FINISHED" &&
    (existing.homeScore == null || existing.awayScore == null) &&
    args.homeScore != null && args.awayScore != null;
const alreadyFinishedWithScore =
    wasFinished && args.homeScore != null && args.awayScore != null;
return {
    id: existing._id,
    shouldComputePoints: newlyFinished || scoreNowVisible || alreadyFinishedWithScore,
};
```

O caso A/B do plano anterior está coberto **se a API enviar `FINISHED`**. O que **não está coberto** é: API mantém o status em `LIVE`/`IN_PLAY` indefinidamente, ou nunca emite o `FINISHED` — o banco também nunca emite. É um cenário que acontece com fonte gratuita.

### 1.3 Possível causa C — cron silenciosamente falhou

`footballData.ts:54-55` joga `Error` se `FOOTBALL_DATA_API_KEY` não estiver definida. O Convex marca o cron como falho mas **a UI não mostra nada**. Mesma coisa se o fetch der `429` (rate limit) ou `403`.

### O que verificar antes de mexer no código

Comandos no monorepo (`packages/backend`):

```bash
npx convex run footballData:syncTodayBSA '{}'   # força sync agora
npx convex logs --tail                          # observa em tempo real
```

Dashboard do Convex (Production):
1. **Crons** → última execução de `sync BSA today` — se vermelho, abrir o erro.
2. **Logs** → `[BSA2026] Synced X matches, computed points for Y` (linha em [`footballData.ts:137-139`](packages/backend/convex/footballData.ts#L137-L139)). Conferir o `Y`.
3. **Data → matches** → procurar `apiId` correspondente a Botafogo×Internacional e Remo×Cruzeiro de hoje. Olhar `status`, `homeScore`, `awayScore`. Se for `IN_PLAY` com score preenchido → **§2 abaixo é a correção**.
4. **Data → predictions** → conferir se as predictions desses `matchId` têm `points` e `calculatedAt`.

---

## 2. Fix — converter `IN_PLAY`/`PAUSED` antigos em `FINISHED` quando a API trava

### Estratégia

Toda partida cujo `utcDate + 3h` (margem segura: 90min de jogo + acréscimos + intervalo + prorrogação eventual) já passou e que tem **score preenchido** mas status diferente de `FINISHED` deve ser tratada como encerrada. Não é responsabilidade do `upsertMatch` (que é por-partida), mas de uma **varredura periódica** em cima do banco.

### Plano

1. **Nova `internalMutation forceFinishStaleLive`** em [`matches.ts`](packages/backend/convex/matches.ts):

   ```ts
   export const forceFinishStaleLive = internalMutation({
       args: {},
       handler: async (ctx) => {
           const now = Date.now();
           const STALE_MS = 3 * 60 * 60 * 1000; // 3h após o início
           const staleStatuses = ["LIVE", "IN_PLAY", "PAUSED"] as const;

           let promoted = 0;
           for (const status of staleStatuses) {
               const matches = await ctx.db
                   .query("matches")
                   .withIndex("by_status", (q) => q.eq("status", status))
                   .take(100);
               for (const m of matches) {
                   const start = new Date(m.utcDate).getTime();
                   const isStale = now - start > STALE_MS;
                   const hasScore = m.homeScore != null && m.awayScore != null;
                   if (isStale && hasScore) {
                       await ctx.db.patch(m._id, { status: "FINISHED" });
                       promoted++;
                   }
               }
           }
           console.log(`[forceFinishStaleLive] Promoted ${promoted} matches to FINISHED`);
           return { promoted };
       },
   });
   ```

2. **Hook no fim do `doSync`** em [`footballData.ts:135`](packages/backend/convex/footballData.ts#L135) — depois do laço, chamar `forceFinishStaleLive` e, para cada partida promovida, rodar `computeForMatch`. Mais simples: chamar `recomputeAll` (já existe em [`predictions.ts:283-297`](packages/backend/convex/predictions.ts#L283-L297)) — ele percorre todos os `FINISHED` com score e roda `computeForMatch` (idempotente). Mas `recomputeAll` em todo sync pode ficar caro com 380 jogos do Brasileirão; melhor:

   ```ts
   // dentro de doSync, depois do for-loop:
   const { promoted } = await ctx.runMutation(internal.matches.forceFinishStaleLive);
   if (promoted > 0) {
       await ctx.runAction(internal.predictions.recomputeAll, {});
   }
   ```

   `recomputeAll` precisa virar um `internalAction` (hoje é `action`) pra ser chamável de outro action. Ou: criar uma `recomputeStale` que recebe a lista de `matchId` promovidos.

3. **Decisão**: `recomputeAll` é idempotente, então rodar ele é seguro. Custo: ~50 reads por jogo × N jogos finalizados. Aceitável dado que só roda quando `promoted > 0`.

4. **Edge case — cron travou e não tem score nem com 3h**: a varredura ignora (precisa de `hasScore`). Se ficar dias com score `null` é problema da API, não da gente. Logamos um `console.warn` listando os ids com `isStale && !hasScore` pra eventual debug manual.

### Arquivos tocados

- editado: `packages/backend/convex/matches.ts` (nova `forceFinishStaleLive`)
- editado: `packages/backend/convex/predictions.ts` (`recomputeAll` vira `internalAction` ou cria `recomputeStale`)
- editado: `packages/backend/convex/footballData.ts` (chama os dois ao final de `doSync`)

---

## 3. Fix — página `/leagues/[id]/members/[userId]` não carrega

### Estado atual

Página existe em [`apps/web/src/app/(app)/leagues/[id]/members/[userId]/page.tsx`](apps/web/src/app/\(app\)/leagues/[id]/members/[userId]/page.tsx) e a query [`getMemberLockedPredictions`](packages/backend/convex/predictions.ts#L200-L281) está implementada. Commit `ce1e0a1` introduziu, `5ad5af1` corrigiu o crash. Logo: o código local **deveria funcionar**. Se o usuário diz que não carrega, é uma de 4 hipóteses:

### 3.1 Hipótese A — deploy desatualizado

Vercel + Convex são deploys separados. Possível que:
- O frontend (Vercel) tenha pegado o commit `5ad5af1` mas o **Convex deployment de produção** ainda esteja no estado anterior (sem `getMemberLockedPredictions`). Resultado: `useQuery` fica retornando `undefined` para sempre → skeleton infinito.
- Ou o inverso: Convex atualizado mas Vercel não — a rota `/leagues/[id]/members/[userId]` não existe no build de produção, dá `404`.

**Verificação**:
```bash
# do monorepo
git log --oneline -3                    # confirma que o commit local está no remoto
cd packages/backend && npx convex deploy   # força deploy do backend
cd apps/web && npx vercel --prod           # força deploy do frontend (se for vercel CLI)
```

Ou no dashboard: Convex → Deployments → última versão; Vercel → Deployments → último build com sucesso.

### 3.2 Hipótese B — runtime error na página

Se a query retornar dados em formato inesperado, a página pode crashar (white screen). Casos suspeitos:

1. [`page.tsx:76-79`](apps/web/src/app/\(app\)/leagues/[id]/members/[userId]/page.tsx#L76-L79) faz:
   ```ts
   const grouped = groupByRound(lockedPredictions.map((lp) => lp.match)).sort(
       ([, , a], [, , b]) =>
           new Date(b[0].utcDate).getTime() - new Date(a[0].utcDate).getTime(),
   );
   ```
   Se `groupByRound` retornar grupo vazio (`[]`), `b[0]` é `undefined` e `.utcDate` quebra. Embora `groupByRound` provavelmente nunca retorne grupos vazios, vale a defesa: filtrar grupos vazios antes do sort.

2. [`page.tsx:33`](apps/web/src/app/\(app\)/leagues/[id]/members/[userId]/page.tsx#L33):
   ```ts
   const member = ranking?.find((m) => m.userId === userId);
   ```
   `ranking` retorna membros com `.userId` (string). O `userId` da URL chega como `string` também. Mas: se o membro **não está na liga atual** (URL adulterada), `member` é `undefined` → ramo de erro [`page.tsx:50-74`](apps/web/src/app/\(app\)/leagues/[id]/members/[userId]/page.tsx#L50-L74) renderiza "Membro não encontrado". OK, isso já existe.

3. Skeleton **eterno**: se `lockedPredictions === undefined || ranking === undefined`, sempre skeleton. Se uma das duas queries nunca resolver (auth lenta, ou query indefinida), trava aí.

### 3.3 Hipótese C — Convex Auth não passou pro contexto da query

`getMemberLockedPredictions` faz `auth.getUserId(ctx)` e retorna `null` se não logado → ramo "Membro não encontrado". Isso é correto. Mas se o token do `@convex-dev/auth` ainda não chegou no Convex no primeiro render, retorna `null` por uma fração de segundo, mostra a tela de erro, e quando o token chega o `useQuery` re-executa mas **ele vai mostrar a tela de erro até ser substituída**. UX ruim mas não trava.

### Plano

1. **Adicionar logs temporários no client** (a remover depois do diagnóstico):
   - No topo do componente: `console.log("[member-profile]", { userId, lockedPredictions, ranking, currentUser });` — pra ver no console do browser exatamente o que cada query está retornando.
   - Pedir pro usuário abrir DevTools → Console e tirar print do que aparece quando ele clica num nome.

2. **Forçar deploys** se ainda não foi feito:
   ```bash
   # backend
   cd packages/backend && npx convex deploy --prod
   # frontend (assumindo Vercel — confirmar com DEPLOY.md)
   git push origin master   # se Vercel auto-deploy
   ```
   Verificar em [`DEPLOY.md`](DEPLOY.md) qual é o fluxo oficial do projeto.

3. **Hardening do componente**:
   - Trocar a checagem `lockedPredictions === undefined || ranking === undefined` por uma seção de skeleton só **enquanto qualquer das queries está `undefined`**, mas mostrar **erro distinto** quando uma das duas é `null`. Hoje colapsa os dois em "Membro não encontrado" o que mascara problemas de auth vs problemas de URL.
   - No header do member, **falhar gracioso** se `member` undefined (URL adulterada vs membro removido vs deploy desatualizado): copy `"Esse membro não está mais nessa liga (ou o deploy do backend está pendente)."` — eleva o usuário pra entender o problema.
   - Defender o `grouped[].sort()` contra grupos vazios.

4. **Tornar a Hipótese B impossível** — fazer a página lidar com `lockedPredictions === []` (vazio) e `lockedPredictions === [{ match, prediction }, …]` mesmo se `member` for `undefined`. Mostrar a lista de palpites com nome desconhecido em vez de bloquear tudo.

### Arquivos tocados

- editado: `apps/web/src/app/(app)/leagues/[id]/members/[userId]/page.tsx` (logs de debug + hardening)
- nenhum arquivo novo

---

## 4. Ferramenta admin — botão "Resync agora" pra emergências

### Justificativa

Cenário recorrente: usuário olha a tela e vê jogo travado. Hoje a única saída é abrir o terminal e rodar `npx convex run footballData:syncTodayBSA '{}'`. Não é prático e não é acessível.

### Plano

1. **Limitar à conta do owner** (ou a uma flag `isAdmin` em `users` — não existe hoje, mas dá pra usar `email === arthurdearaujofaria@gmail.com` como heurística pessoal por enquanto).
2. **Página oculta** `apps/web/src/app/(app)/admin/page.tsx` com botões:
   - "Resync Brasileirão agora" → chama `api.footballData.syncTodayBSA` (que hoje é `internalAction` — precisa virar `action` ou expor um wrapper público com guard).
   - "Forçar finalização de jogos travados" → chama nova `forceFinishStaleLive`.
   - "Recompute pontos" → chama `recomputeAll`.
   - Cada botão mostra o último log e timestamp da última execução.
3. **Wrapper público com guard**:
   ```ts
   export const adminSyncBSA = action({
       args: {},
       handler: async (ctx) => {
           const userId = await auth.getUserId(ctx);
           const user = userId ? await ctx.runQuery(internal.auth.getUserById, { userId }) : null;
           if (user?.email !== "arthurdearaujofaria@gmail.com") {
               throw new ConvexError("Unauthorized");
           }
           return ctx.runAction(internal.footballData.syncTodayBSA, {});
       },
   });
   ```
4. **Decisão pendente**: vale criar a página agora ou só expor os comandos via CLI até a Copa começar? A página é 1h de trabalho, vale.

### Arquivos tocados

- editado: `packages/backend/convex/footballData.ts` (wrappers `adminSync*`)
- editado: `packages/backend/convex/predictions.ts` (`adminRecomputeAll`)
- novo: `apps/web/src/app/(app)/admin/page.tsx`

---

## 5. Aumentar cadência durante a janela de jogo (opcional, mas resolve o problema na raiz)

Hoje BSA roda `*/30 * * * *` (2×/h). API permite 10 req/min — temos folga.

### Plano

Trocar pra `*/10 * * * *` (6×/h). Custo: 6 GETs/h fixo, irrelevante. Benefício: latência máxima entre apito final e UI atualizada cai de 30min pra 10min. Combinado com o §2 (force finish após 3h), cobre o caso edge de API que nunca emite FINISHED.

```ts
crons.cron("sync BSA today", "*/10 * * * *", internal.footballData.syncTodayBSA, {});
```

### Decisão pendente

`*/10` ou `*/15`? `*/10` parece melhor — ainda assim é 1/6 do limite gratuito.

### Arquivos tocados

- editado: `packages/backend/convex/crons.ts`

---

## 6. Ordem sugerida de execução

1. **§1 verificação operacional primeiro** — abrir Convex dashboard, confirmar status real dos dois jogos. Se já estão `FINISHED` com score (improvável, dado o que o card mostra), o problema é puramente de cálculo de pontos e §2 já resolve via `recomputeAll`. Se estão `IN_PLAY`/`PAUSED`, §2 é o caminho.
2. **§2 force-finish + recompute integrado ao sync** — sem isso, qualquer atraso da API trava UI por horas.
3. **§3.2 forçar deploys** — antes de mexer no código da página, garantir que o problema reportado não é só de deploy desatualizado.
4. **§3.3 hardening + logs** — só se §3.2 não resolver.
5. **§5 cron mais frequente** — barato, cola junto com §2.
6. **§4 página admin** — última, é qualidade-de-vida, não bloqueia.

---

## 7. Pontos que precisam de decisão antes de executar

- §2: hook do `forceFinishStaleLive` dentro do `doSync` (toda sync paga o custo da varredura) ou cron próprio rodando `*/15`? Varredura é barata (3 reads/min), mas separar é mais limpo.
- §3.2: o usuário já fez `npx convex deploy` desde o último commit? Se não, esse é o primeiro passo — pode resolver tudo sozinho.
- §4: criar página admin agora ou esperar a Copa começar pra ter mais cenários reais?
- §5: `*/10` ou `*/15`? (Ambos respeitam o rate limit de 10 req/min com folga enorme.)
- O `STALE_MS` de 3h cobre prorrogação + pênaltis (raro no Brasileirão, comum na Copa). Confirmar se 3h chega — final de Copa pode passar de 3h se for no limite. Talvez 4h seja mais seguro.
