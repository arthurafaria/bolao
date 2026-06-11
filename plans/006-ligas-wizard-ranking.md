# Plan 006: Criação de liga em passo a passo + critério de ranking escolhido pelo líder

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e87755c..HEAD -- packages/backend/convex/schema.ts packages/backend/convex/leagues.ts "apps/web/src/app/(app)/leagues"`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `e87755c`, 2026-06-10

## Why this matters

O dono do produto quer que cada liga tenha regras decididas pelo líder, e que criar uma liga seja **um passo a passo mais intuitivo**. Este plano entrega a primeira fatia, de baixo risco: o líder escolhe o **critério de ranking** — "quem faz mais pontos" (atual) ou "quem crava mais resultados exatos" — e o formulário de criação vira um wizard de 3 passos. A fatia arriscada (pontuação customizada e momento de fechamento por liga) fica no plano 007, separada de propósito: ela mexe no cálculo de pontos no meio do torneio.

Os dados para o ranking por cravadas **já existem**: `leagueMembers` mantém `exactScores` e `correctResults` atualizados pelo `computeForMatch`. É só ordenar diferente.

## Current state

- `packages/backend/convex/schema.ts` — tabela `leagues` (linhas 58-67): `name, description, ownerId, joinType (OPEN|MODERATED), inviteCode, memberCount`. Tabela `leagueMembers` (linhas 69-85): tem `totalPoints`, `exactScores`, `correctResults` e índice `by_league_points`.
- `packages/backend/convex/leagues.ts` — `create` (linhas 32-78, args `name/description/joinType`), `update` (linhas 280-302), `getRanking` (linhas 327-370, ordena via índice `by_league_points` desc), `getById` (linhas 304-313).
- `apps/web/src/app/(app)/leagues/page.tsx` — `CreateLeagueDialog` (linhas 25-140): formulário único (nome, descrição, tipo de entrada com dois botões-cartão) dentro de `Dialog` do pacote `@bolao/ui`.
- `apps/web/src/app/(app)/leagues/[id]/page.tsx` — página da liga (ranking; usa `getRanking`).
- `apps/web/src/app/(app)/leagues/[id]/manage/page.tsx` — administração da liga (usa `update`).

Excerto de `leagues.ts:327-340` (ordenação atual do ranking):

```ts
export const getRanking = query({
	args: { leagueId: v.id("leagues") },
	handler: async (ctx, args) => {
		...
		const members = await ctx.db
			.query("leagueMembers")
			.withIndex("by_league_points", (q) => q.eq("leagueId", args.leagueId))
			.order("desc")
			.filter((q) => q.eq(q.field("status"), "ACTIVE"))
			.collect();
```

Excerto do seletor de tipo de entrada em `leagues/page.tsx:94-125` (padrão de "botões-cartão" a reutilizar para o passo de ranking):

```tsx
<div className="grid grid-cols-2 gap-2">
	{(["OPEN", "MODERATED"] as const).map((type) => (
		<button ... onClick={() => setJoinType(type)}
			className={cn("rounded-2xl border p-3 text-left ...",
				joinType === type
					? "border-[var(--b-brand)] bg-[var(--b-brand-10)]"
					: "border-[var(--b-border-md)] hover:bg-[var(--b-tint)]")}>
```

Convenções: Convex com validadores `v.*` e `ConvexError`; UI em português; tokens `var(--b-*)`; toasts com `sonner`. Antes de mexer em código Convex, leia `packages/backend/convex/_generated/ai/guidelines.md`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0              |
| Lint      | `bunx biome check apps/web packages/backend` | exit 0 |
| Build     | `bun run build`          | exit 0              |
| Dev       | `bun run dev:web` + `bun run dev:server` | app na porta 3001 |

## Scope

**In scope** (the only files you should modify):
- `packages/backend/convex/schema.ts`
- `packages/backend/convex/leagues.ts`
- `apps/web/src/app/(app)/leagues/page.tsx`
- `apps/web/src/app/(app)/leagues/[id]/page.tsx` (exibir o critério vigente)
- `apps/web/src/app/(app)/leagues/[id]/manage/page.tsx` (permitir trocar o critério)

**Out of scope** (do NOT touch, even though they look related):
- `packages/backend/convex/predictions.ts` — o cálculo de pontos NÃO muda; só a ordenação do ranking.
- Pontuação customizada e fechamento de palpites por liga — plano 007.
- O fluxo de entrar/aprovar/remover membros.

## Git workflow

- Branch: `advisor/006-ligas-wizard-ranking`
- Commits em português, conventional commits (`feat(leagues): ...`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Campo `rankingMode` no schema

Em `schema.ts`, tabela `leagues`, adicione após `joinType`:

```ts
// Critério do ranking, decidido pelo líder. Ausente = POINTS (comportamento histórico).
rankingMode: v.optional(v.union(v.literal("POINTS"), v.literal("EXACTS"))),
```

**Verify**: `bun run check-types` → exit 0.

### Step 2: Backend — create, update e getRanking

Em `leagues.ts`:

1. `create`: aceite `rankingMode: v.optional(v.union(v.literal("POINTS"), v.literal("EXACTS")))` e grave no insert (default `"POINTS"` quando ausente).
2. `update`: aceite o mesmo arg opcional e inclua no patch (`if (args.rankingMode) patch.rankingMode = args.rankingMode;`).
3. `getRanking`: depois do `.collect()`, reordene em memória conforme o modo (≤50 membros, custo trivial). Busque a liga (`ctx.db.get(args.leagueId)`) — repare que `getById` já existe mas aqui você precisa do doc dentro da própria query:

```ts
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

(O índice `by_league_points` continua sendo usado para buscar; a ordenação final é a do sort.)

**Verify**: `bun run check-types` → exit 0.

### Step 3: Wizard de criação em 3 passos

Em `leagues/page.tsx`, transforme `CreateLeagueDialog` num wizard com estado `step: 1 | 2 | 3` dentro do mesmo `Dialog`:

- **Passo 1 — Identidade**: nome + descrição (campos atuais). Botão "Continuar" (desabilitado com nome < 3 chars).
- **Passo 2 — Entrada**: os dois botões-cartão OPEN/MODERATED atuais. Botões "Voltar" / "Continuar".
- **Passo 3 — Ranking**: dois botões-cartão no mesmo padrão visual (excerto em "Current state"):
  - `POINTS`: título "Mais pontos", descrição "Ranking pela soma de pontos de todos os palpites (padrão do site)".
  - `EXACTS`: título "Mais cravadas", descrição "Ranking por quem acerta mais placares exatos; pontos desempatam".
  - Botões "Voltar" / "Criar liga" (submit chama `createLeague({ name, description, joinType, rankingMode })`).
- Indicador de progresso no topo do dialog: três bolinhas/segmentos ("Passo {n} de 3"), usando tokens (`bg-[var(--b-brand)]` para o passo ativo, `bg-[var(--b-border-md)]` para inativos).
- Resetar `step` para 1 ao fechar o dialog.

**Verify**: `bun run check-types` → exit 0; manualmente, criar uma liga percorrendo os 3 passos funciona e a liga nasce com o modo escolhido (confira o doc na dashboard do Convex).

### Step 4: Exibir e editar o critério

1. `leagues/[id]/page.tsx`: junto ao cabeçalho do ranking, mostre uma `Tag` (componente `@bolao/ui/components/tag`, já usado nesta área) com o critério: "Ranking: mais pontos" ou "Ranking: mais cravadas". O dado vem do `getById`/league doc já carregado na página (confirme qual query a página usa e leia `rankingMode ?? "POINTS"` dela).
2. `leagues/[id]/manage/page.tsx`: adicione o mesmo par de botões-cartão do wizard para o admin trocar o modo, chamando `api.leagues.update` com `{ leagueId, rankingMode }` + toast de sucesso (padrão `sonner` já usado na página).

**Verify**: trocar o modo no manage reordena o ranking na página da liga (Convex é reativo — sem reload).

### Step 5: Lint e build finais

**Verify**: `bunx biome check apps/web packages/backend` → exit 0; `bun run build` → exit 0.

## Test plan

Sem runner de testes; verificação manual com 2+ contas (ou dados de membros existentes):

- Liga nova `POINTS`: ranking igual ao comportamento atual.
- Trocar para `EXACTS` no manage: membro com mais `exactScores` sobe para o topo mesmo com menos `totalPoints` (se os dados existentes não tiverem esse caso, edite `exactScores` de um membro na dashboard do Convex para forçá-lo e confirme a ordenação).
- Ligas antigas (sem `rankingMode`): comportam-se como `POINTS`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `bunx biome check apps/web packages/backend` exits 0
- [ ] `grep -n "rankingMode" packages/backend/convex/schema.ts packages/backend/convex/leagues.ts` retorna matches nos dois arquivos
- [ ] `grep -c "Passo" "apps/web/src/app/(app)/leagues/page.tsx"` ≥ 1
- [ ] `git status` só mostra arquivos do escopo
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Os excertos de "Current state" não baterem com o código (drift).
- Você se ver alterando `computeForMatch`/`calcPoints` em `predictions.ts` — isso é o plano 007, não este.
- A página `leagues/[id]` não tiver acesso ao doc da liga para ler `rankingMode` (estrutura diferente do esperado) — reporte em vez de criar query nova sem necessidade.
- O `Dialog` do `@bolao/ui` não comportar o conteúdo do wizard sem quebra de layout no mobile.

## Maintenance notes

- O plano 007 adiciona mais campos de configuração à liga — o passo 3 do wizard é o lugar onde eles entrarão; deixe o passo legível para crescer.
- O plano 008 (página de regras) menciona que ligas podem ter critério próprio — aterrissar este plano antes deixa aquela copy verdadeira.
- Revisor: atenção ao default `"POINTS"` para ligas antigas e ao reset do wizard ao fechar o dialog.
