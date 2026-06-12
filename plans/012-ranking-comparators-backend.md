# Plan 012: Backend — comparadores de ranking compartilhados + cravadas expostas

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b04a4c0..HEAD -- packages/backend/convex/leagues.ts packages/backend/convex/schema.ts`
> Se algum arquivo in-scope mudou desde a escrita deste plano, compare os
> excertos de "Current state" com o código vivo antes de prosseguir; em caso
> de mismatch, trate como STOP condition.
>
> **Leitura obrigatória antes do Step 1**: `packages/backend/convex/_generated/ai/guidelines.md`
> (regra do CLAUDE.md do backend — sempre ler antes de tocar código Convex).

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (refatoração de sort + campo aditivo; nenhuma mudança de pontuação)
- **Depends on**: none
- **Category**: tech-debt (fundação para 013–016)
- **Planned at**: commit `b04a4c0`, 2026-06-12

## Why this matters

O dono do produto quer que **cravadas (placares exatos) sirvam de critério de
desempate** no ranking padrão e que ligas "mais cravadas" ganhem um painel com
dois rankings (pontos e cravadas) — ver planos 013–014. A lógica de desempate
**já existe** dentro de `getRanking` em `leagues.ts`, mas está inline, sem
testes e inacessível ao frontend (que precisará reordenar client-side ao
alternar abas). Este plano extrai os comparadores para um módulo puro,
compartilhável e testado com `bun test` — é o "teste de funcionamento do
padrão" pedido pelo dono. Sem ele, o 013 duplicaria a regra de ordenação no
frontend e qualquer divergência criaria rankings inconsistentes no meio da
Copa (em andamento: 11/06–19/07/2026).

## Current state

- `packages/backend/convex/leagues.ts` — funções de liga; `getRanking`
  (linhas 465–520) ordena inline:

```ts
// leagues.ts:480-490
const league = await ctx.db.get(args.leagueId);
const mode = league?.rankingMode ?? "POINTS";
members.sort((a, b) =>
    mode === "EXACTS"
        ? b.exactScores - a.exactScores ||
            b.totalPoints - a.totalPoints ||
            b.correctResults - a.correctResults
        : b.totalPoints - a.totalPoints ||
            b.exactScores - a.exactScores ||
            b.correctResults - a.correctResults,
);
```

- O retorno de `getRanking` já inclui `exactScores` e `correctResults` via
  spread `...member` (linha 512–516) — o frontend já recebe os dados de
  cravadas; nada a mudar aí.
- `getUserLeagues` (linhas 522–543) devolve `{ ...league, myPoints: m.totalPoints }`
  — **não** expõe as cravadas do usuário (o card de liga do 013 vai precisar).
- `packages/backend/convex/schema.ts:86-102` — `leagueMembers` tem
  `totalPoints`, `exactScores`, `correctResults` (mantidos por deltas em
  `predictions.ts:245-249`, função `computeForMatch`). "Cravada" = palpite com
  placar exato (`components.result && homeGoals && awayGoals`), que vale 10 pts
  na pontuação padrão.
- Não existe `packages/backend/convex/lib/` nem nenhum arquivo `*.test.*` no
  repo. O runtime é Bun 1.3.13, que traz o runner `bun test` embutido — não
  instale vitest/jest.
- Convenções: TypeScript estrito, formatação Biome (tabs), comentários e
  mensagens em pt-BR. Módulos helper dentro de `convex/` sem exports de
  query/mutation são tratados pelo Convex como módulos comuns.

## Commands you will need

| Purpose | Command (da raiz `bolao/`) | Expected on success |
|---------|----------------------------|---------------------|
| Install | `bun install` | exit 0 |
| Typecheck | `bun run check-types` | exit 0 em todos os workspaces |
| Lint/format | `bun run check` | exit 0 (autofix aplicado) |
| Testes | `bun test packages/backend/tests` | todos passam |

> ⚠️ **NUNCA rode `bun run dev:server` ou `bunx convex deploy`** — o
> `CONVEX_DEPLOYMENT` local aponta para **produção** e publica funções a cada
> save. O deploy é responsabilidade exclusiva do plano 016.

## Scope

**In scope** (únicos arquivos a modificar/criar):
- `packages/backend/convex/lib/ranking.ts` (criar)
- `packages/backend/tests/ranking.test.ts` (criar)
- `packages/backend/convex/leagues.ts` (refatorar sort de `getRanking`; campo novo em `getUserLeagues`)

**Out of scope** (NÃO tocar, mesmo parecendo relacionado):
- `packages/backend/convex/predictions.ts` — o cálculo de pontos/cravadas está
  correto e em produção no meio do torneio; qualquer mudança ali é risco real.
- `packages/backend/convex/schema.ts` — nenhum campo novo é necessário.
- Qualquer arquivo do frontend (`apps/web/**`) — é o plano 013.

## Git workflow

- Trabalhe direto na `master` (convenção do repo — sem branches de feature).
- **Não commite nem pushe** — o plano 016 consolida commit, push e deploy.

## Steps

### Step 1: Criar o módulo puro de comparadores

Crie `packages/backend/convex/lib/ranking.ts`:

```ts
/**
 * Comparadores de ranking de liga — fonte única usada pelo backend
 * (getRanking) e pelo frontend (abas do painel de ranking).
 *
 * Ranking de pontos: total de pontos; cravadas desempatam; depois
 * resultados certos. Ranking de cravadas: só placares exatos contam;
 * pontos desempatam; depois resultados certos.
 */
export interface RankableMember {
	totalPoints: number;
	exactScores: number;
	correctResults: number;
}

export function compareByPoints(a: RankableMember, b: RankableMember): number {
	return (
		b.totalPoints - a.totalPoints ||
		b.exactScores - a.exactScores ||
		b.correctResults - a.correctResults
	);
}

export function compareByExacts(a: RankableMember, b: RankableMember): number {
	return (
		b.exactScores - a.exactScores ||
		b.totalPoints - a.totalPoints ||
		b.correctResults - a.correctResults
	);
}
```

**Verify**: `bun run check-types` → exit 0.

### Step 2: Usar os comparadores em `getRanking`

Em `packages/backend/convex/leagues.ts`, importe
`compareByExacts, compareByPoints` de `./lib/ranking` e substitua o sort
inline (excerto em "Current state") por:

```ts
members.sort(mode === "EXACTS" ? compareByExacts : compareByPoints);
```

O comportamento observável deve ser **idêntico** ao atual (mesma cadeia de
desempate) — isso é refatoração, não mudança de regra.

**Verify**: `bun run check-types` → exit 0.

### Step 3: Expor cravadas em `getUserLeagues`

Na linha ~537 de `leagues.ts`, mude:

```ts
return league ? { ...league, myPoints: m.totalPoints } : null;
```

para:

```ts
return league
	? { ...league, myPoints: m.totalPoints, myExacts: m.exactScores }
	: null;
```

Campo aditivo: os consumidores atuais (`leagues/page.tsx`,
`dashboard/page.tsx`, `profile/page.tsx`) ignoram campos extras sem quebrar.

**Verify**: `bun run check-types` → exit 0.

### Step 4: Testes unitários dos comparadores

Crie `packages/backend/tests/ranking.test.ts` usando `bun:test` (fora de
`convex/` para o bundler do Convex não processar o arquivo de teste):

```ts
import { describe, expect, test } from "bun:test";
import {
	compareByExacts,
	compareByPoints,
} from "../convex/lib/ranking";
```

Casos obrigatórios (use objetos literais `{ totalPoints, exactScores, correctResults }`):

1. **Pontos: mais pontos vence** — `{50,2,8}` antes de `{40,5,9}`.
2. **Pontos: empate em pontos → mais cravadas vence** (a regra nova do dono) —
   `{50,3,7}` antes de `{50,1,9}`.
3. **Pontos: empate em pontos e cravadas → mais resultados certos vence** —
   `{50,2,9}` antes de `{50,2,7}`.
4. **Pontos: empate total → comparador devolve 0** (ordem estável).
5. **Cravadas: mais cravadas vence mesmo com menos pontos** — `{30,5,4}` antes
   de `{60,2,10}`.
6. **Cravadas: empate em cravadas → mais pontos vence** — `{60,3,8}` antes de
   `{40,3,9}`.
7. **Sort integrado**: um array de 5 membros embaralhados ordenado com
   `[...members].sort(compareByPoints)` produz a ordem esperada; idem
   `compareByExacts` com ordem distinta.

**Verify**: `bun test packages/backend/tests` → `7 pass` (ou mais), 0 fail.

### Step 5: Lint/format

**Verify**: `bun run check` → exit 0; `git status` mostra somente os 3
arquivos in-scope modificados/criados.

## Test plan

- Novos testes: `packages/backend/tests/ranking.test.ts` (Step 4) — primeiro
  arquivo de teste do repo; não há exemplar existente, siga o esqueleto acima.
- Verificação: `bun test packages/backend/tests` → todos passam.
- Regressão manual leve: não aplicável aqui (não rode o servidor); a
  verificação visual fica no plano 015.

## Done criteria

Machine-checkable. TODOS devem valer:

- [ ] `bun run check-types` exit 0
- [ ] `bun test packages/backend/tests` exit 0 com ≥7 testes passando
- [ ] `bun run check` exit 0
- [ ] `grep -n "compareByPoints\|compareByExacts" packages/backend/convex/leagues.ts` retorna o import e o uso no sort
- [ ] `grep -n "myExacts" packages/backend/convex/leagues.ts` retorna a linha do `getUserLeagues`
- [ ] `grep -n "b.totalPoints - a.totalPoints" packages/backend/convex/leagues.ts` **não** retorna nada (sort inline removido)
- [ ] `git status` não mostra arquivos fora do escopo
- [ ] Linha do 012 atualizada em `plans/README.md`

## STOP conditions

Pare e reporte (não improvise) se:

- O sort em `getRanking` não bater com o excerto de "Current state" (código
  drifted).
- `bun test` não reconhecer o diretório/arquivos (runner indisponível nesta
  versão do Bun) — não instale outro test runner por conta própria.
- O typecheck do Convex (`tsc -p convex/tsconfig.json`) reclamar do diretório
  `lib/` dentro de `convex/` — não mova o módulo para outro pacote sem
  reportar antes.
- Qualquer coisa exigir mexer em `predictions.ts` ou `schema.ts`.

## Maintenance notes

- O plano 013 importa estes comparadores no web via
  `@bolao/backend/convex/lib/ranking` (funciona porque `@bolao/backend` não
  tem campo `exports` no package.json — se um dia adicionarem `exports`,
  inclua esse subpath).
- Se um novo critério de desempate surgir (ex.: data de entrada na liga), ele
  entra **só** em `lib/ranking.ts` e ganha caso de teste — nunca inline.
- Revisor: confira que o Step 2 não mudou a direção de nenhuma comparação
  (tudo decrescente, `b - a`).
