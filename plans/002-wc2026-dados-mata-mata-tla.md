# Plan 002: Preparar os dados da Copa 2026 — fases do mata-mata, sigla (TLA) dos países e cadência de sync

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e87755c..HEAD -- packages/backend/convex/schema.ts packages/backend/convex/matches.ts packages/backend/convex/footballData.ts packages/backend/convex/crons.ts apps/web/src/lib/match-grouping.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug / migration
- **Planned at**: commit `e87755c`, 2026-06-10

## Why this matters

A Copa do Mundo 2026 tem um formato novo: **48 seleções em 12 grupos (A–L)**, classificam os 2 primeiros de cada grupo + os 8 melhores terceiros para um **mata-mata de 32** ("pré-oitavas"), seguido de oitavas, quartas, semifinais, disputa de 3º lugar e final — 104 jogos, de 11/06 a 19/07/2026. O código atual foi escrito para o formato antigo: os rótulos de fase em `match-grouping.ts` não conhecem a fase de 32 nem a disputa de 3º lugar, o schema de `teams` não guarda a sigla de 3 letras (TLA, ex.: BRA, ARG) que o bracket (plano 004) vai precisar, e o cron de sync da Copa roda só de hora em hora (o do Brasileirão roda a cada 10 min). Este plano deixa a camada de dados pronta antes das features de UI.

**Decisão de API (registrada aqui para não ser reavaliada)**: foi pedido avaliar migrar para TheSportsDB. Veredito: **não migrar**. O free tier do TheSportsDB tem dados comunitários, livescores apenas no tier pago (Patreon) e exigiria reescrever toda a camada de sync (status, grupos, fases) na véspera do torneio. O football-data.org já está integrado, cobre a Copa (código `WC`) no plano gratuito, e o código já tem mitigação para suas falhas conhecidas (`forceFinishStaleLive` em `matches.ts`). Risco alto, benefício nenhum.

## Current state

- `packages/backend/convex/schema.ts` — schema Convex; tabela `teams` (linhas 8-14) tem `name, shortName, crest, nationality, apiId`, **sem TLA**.
- `packages/backend/convex/matches.ts` — `upsertTeam` (linhas 102-128) e `upsertMatch` (linhas 130-193).
- `packages/backend/convex/footballData.ts` — sync com football-data.org; interface `ApiTeam` (linhas 75-81) não captura o campo `tla` que a API retorna para seleções; `doSync` chama `upsertTeam` nas linhas 257-271.
- `packages/backend/convex/crons.ts` — cron `"sync WC today"` roda `0 * * * *` (de hora em hora); o BSA roda `*/10 * * * *`.
- `apps/web/src/lib/match-grouping.ts` — `STAGE_LABELS` (linhas 1-7) só conhece `ROUND_OF_16, QUARTER_FINALS, SEMI_FINALS, FINAL, GROUP_STAGE`.

Excerto de `match-grouping.ts:1-7`:

```ts
export const STAGE_LABELS: Record<string, string> = {
	ROUND_OF_16: "Oitavas de Final",
	QUARTER_FINALS: "Quartas de Final",
	SEMI_FINALS: "Semifinais",
	FINAL: "Final",
	GROUP_STAGE: "Fase de Grupos",
};
```

Excerto de `footballData.ts:75-81`:

```ts
interface ApiTeam {
	id: number;
	name: string;
	shortName: string;
	crest: string;
	area?: { name: string };
}
```

Excerto de `crons.ts:7`:

```ts
crons.cron("sync WC today", "0 * * * *", internal.footballData.syncToday, {});
```

Convenções: TypeScript estrito, Biome (tabs, aspas duplas), comentários em português, validadores Convex com `v.*`. Antes de mexer em código Convex, leia `packages/backend/convex/_generated/ai/guidelines.md` (instrução do CLAUDE.md do backend).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0              |
| Lint      | `bunx biome check packages/backend apps/web` | exit 0 |
| Build     | `bun run build`          | exit 0              |
| Logs Convex | `npx convex logs --tail` (dentro de `packages/backend`) | stream de logs |

## Scope

**In scope** (the only files you should modify):
- `packages/backend/convex/schema.ts`
- `packages/backend/convex/matches.ts`
- `packages/backend/convex/footballData.ts`
- `packages/backend/convex/crons.ts`
- `apps/web/src/lib/match-grouping.ts`

**Out of scope** (do NOT touch, even though they look related):
- `packages/backend/convex/predictions.ts` — pontuação não muda neste plano.
- A UI de bracket/grupos (planos 003 e 004).
- Migração de API (decisão registrada acima: ficamos no football-data.org).
- `packages/backend/convex/_generated/**` — gerado pelo Convex, nunca editar à mão.

## Git workflow

- Branch: `advisor/002-wc2026-dados`
- Commits em português, conventional commits (`feat:`, `fix:`, `chore:`); exemplo do log: `feat: remove modo demo e reordena selector de competição`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rótulos das novas fases

Em `apps/web/src/lib/match-grouping.ts`, expanda `STAGE_LABELS`. O football-data.org usa nomes de stage em SCREAMING_SNAKE; para a fase de 32 o nome pode vir como `LAST_32`, `ROUND_OF_32` ou `PLAYOFF_ROUND_OF_32` — adicione todos os candidatos apontando para o mesmo rótulo (chaves extras são inofensivas; `roundLabel` já tem fallback para stages desconhecidos):

```ts
export const STAGE_LABELS: Record<string, string> = {
	GROUP_STAGE: "Fase de Grupos",
	LAST_32: "Pré-oitavas",
	ROUND_OF_32: "Pré-oitavas",
	PLAYOFF_ROUND_OF_32: "Pré-oitavas",
	LAST_16: "Oitavas de Final",
	ROUND_OF_16: "Oitavas de Final",
	QUARTER_FINALS: "Quartas de Final",
	SEMI_FINALS: "Semifinais",
	THIRD_PLACE: "Disputa de 3º lugar",
	FINAL: "Final",
};
```

**Verify**: `bun run check-types` → exit 0.

### Step 2: Campo `tla` no schema de teams

Em `packages/backend/convex/schema.ts`, adicione à tabela `teams` (após `nationality`):

```ts
tla: v.optional(v.string()), // sigla FIFA de 3 letras (BRA, ARG…) — vem da API
```

Opcional para não invalidar documentos existentes.

**Verify**: `bun run check-types` → exit 0.

### Step 3: Capturar o TLA no sync

1. Em `packages/backend/convex/footballData.ts`, adicione `tla?: string;` à interface `ApiTeam` (linhas 75-81).
2. Nas duas chamadas a `internal.matches.upsertTeam` dentro de `doSync` (linhas ~257-271), passe `tla: match.homeTeam.tla` / `tla: match.awayTeam.tla`.
3. Em `packages/backend/convex/matches.ts`, em `upsertTeam`: adicione `tla: v.optional(v.string())` aos args e inclua `tla: args.tla` no `ctx.db.patch` e no insert. Não sobrescreva um `tla` existente com `undefined`: no patch, use `...(args.tla ? { tla: args.tla } : {})`.

**Verify**: `bun run check-types` → exit 0.

### Step 4: Acelerar o cron da Copa durante o torneio

Em `packages/backend/convex/crons.ts`, mude o cron da Copa de hora em hora para a cada 10 minutos (mesma cadência do BSA — o free tier do football-data permite 10 req/min e cada sync usa 1 request):

```ts
crons.cron("sync WC today", "*/10 * * * *", internal.footballData.syncToday, {});
```

**Verify**: `bun run check-types` → exit 0.

### Step 5: Validar contra dados reais

Com o backend dev rodando (`bun run dev:server`, exige `FOOTBALL_DATA_API_KEY` configurada no deployment Convex):

1. Dispare um sync: na dashboard do Convex (ou via `npx convex run`, dentro de `packages/backend`): `npx convex run footballData:syncAll '{}'`.
2. Confira nos logs (`npx convex logs --tail`) a linha `[WC2026] Synced N matches…` com N > 0.
3. Na dashboard do Convex, inspecione a tabela `teams`: seleções sincronizadas devem ter `tla` preenchido (ex.: `BRA`). Inspecione `matches`: anote os valores **reais** do campo `stage` para jogos de mata-mata, se já existirem na resposta da API.
4. Se o stage real da fase de 32 não for nenhuma das chaves do Step 1, **adicione a chave real** a `STAGE_LABELS` (mantendo as outras) e registre o valor observado na sua mensagem final.

**Verify**: tabela `teams` mostra `tla` preenchido para pelo menos uma seleção; log de sync sem erro.

## Test plan

Sem infraestrutura de testes no repo; não crie uma. Validação = Step 5 (dados reais) + typecheck + build.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `bunx biome check packages/backend apps/web` exits 0
- [ ] `grep -n "Pré-oitavas" apps/web/src/lib/match-grouping.ts` retorna ≥ 1 match
- [ ] `grep -n "tla" packages/backend/convex/schema.ts packages/backend/convex/matches.ts packages/backend/convex/footballData.ts` retorna matches nos 3 arquivos
- [ ] `grep -n '"\*/10 \* \* \* \*"' packages/backend/convex/crons.ts` retorna 2 matches (WC e BSA)
- [ ] `git status` só mostra os arquivos do escopo
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Os excertos de "Current state" não baterem com o código (drift).
- O sync do Step 5 falhar com erro 4xx/5xx da API duas vezes — pode ser chave ausente no deployment; reporte em vez de mexer em env vars.
- A API **não** retornar `tla` para seleções (campo ausente no JSON) — o plano 004 depende disso; reporte para reavaliar a fonte da sigla.
- Você se ver tentado a mudar a lógica de pontuação ou `upsertMatch` além do especificado.

## Maintenance notes

- O plano 004 (bracket) consome `teams.tla`; o plano 003 (UI de grupos) consome os novos `STAGE_LABELS`.
- Depois da Copa, o cron do WC pode voltar para `0 * * * *` (ou ser removido).
- Revisor: confira que `upsertTeam` não apaga `tla` existente quando a API ocasionalmente omite o campo.
