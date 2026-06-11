# Plan 007: Pontuação personalizada por liga (pesos decididos pelo líder)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: este plano foi escrito com os planos 001–006 aplicados
> na working tree sobre o commit `e87755c` (possivelmente ainda não commitados/deployados).
> Não use `git diff` contra o SHA — em vez disso, confirme que os excertos de
> "Current state" abaixo batem com o código vivo (em especial: `leagues` tem
> `rankingMode` no schema, o wizard de `leagues/page.tsx` tem `step: 1 | 2 | 3`,
> e `computeForMatch` em `predictions.ts` está como no excerto). Mismatch = STOP.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: HIGH (mexe no motor de pontos durante o torneio)
- **Depends on**: plans/006-ligas-wizard-ranking.md (DONE)
- **Category**: direction
- **Planned at**: commit `e87755c` + planos 001–006 aplicados, 2026-06-10

> **Nota de escopo (decisão do dono do produto, 2026-06-10)**: a versão anterior
> deste plano incluía "momento de fechamento configurável por liga" (`lockPolicy`).
> Isso foi **removido por decisão do dono** — não implemente nenhuma forma de lock
> por liga, nem "lock mais restritivo entre ligas". O fechamento continua sendo o
> global de 1h para todo mundo. Este plano é só sobre **pesos de pontuação por liga**.

## Why this matters

O líder de uma liga pode escolher o critério de ranking (plano 006, já entregue: pontos × cravadas). Este plano completa a personalização: o líder define os **pesos da pontuação** da liga (quanto vale acertar o resultado, os gols de cada time e o bônus de placar exato). O mesmo palpite do usuário passa a render pontos diferentes em ligas com pesos diferentes.

**Por que dá para fazer sem remodelar nada**: o palpite é global por usuário+jogo, mas os **totais já são por liga** (`leagueMembers.totalPoints`). O que falta é o cálculo saber derivar pontos com pesos arbitrários — para isso, os **componentes do acerto** (acertou resultado? gols do mandante? do visitante?) passam a ser persistidos no palpite, e os pontos de qualquer liga viram uma função `f(componentes, pesos)`.

## Current state

- `packages/backend/convex/schema.ts`:
  - `leagues` (após o plano 006): `name, description, ownerId, joinType, rankingMode (opcional, POINTS|EXACTS), inviteCode, memberCount`.
  - `predictions`: `userId, matchId, predictedHome, predictedAway, points (opcional), calculatedAt (opcional)` — **sem componentes**.
- `packages/backend/convex/predictions.ts` (não alterado pelos planos 001–006):
  - `calcPoints` (linhas 15-45): exato = 10; resultado certo = 5 + 2 por time com gols exatos; resultado errado = só os bônus de 2. Retorna `{ points, isExact, isCorrectResult }`.
  - `computeForMatch` (linhas 165-214): excerto crítico do loop de deltas:

```ts
for (const pred of predictions) {
	const { points, isExact, isCorrectResult } = calcPoints(
		pred.predictedHome, pred.predictedAway, match.homeScore, match.awayScore,
	);
	const previousPoints = pred.points ?? 0;
	const pointsDelta = points - previousPoints;
	const exactDelta = (isExact ? 1 : 0) - (pred.points === 10 ? 1 : 0);
	const correctResultDelta =
		(isCorrectResult ? 1 : 0) - (previousPoints >= 5 ? 1 : 0);

	await ctx.db.patch(pred._id, { points, calculatedAt: now });

	if (pointsDelta === 0 && exactDelta === 0 && correctResultDelta === 0) continue;

	const memberships = await ctx.db
		.query("leagueMembers")
		.withIndex("by_user", (q) => q.eq("userId", pred.userId))
		.filter((q) => q.eq(q.field("status"), "ACTIVE"))
		.collect();

	for (const membership of memberships) {
		await ctx.db.patch(membership._id, {
			totalPoints: membership.totalPoints + pointsDelta,
			exactScores: membership.exactScores + exactDelta,
			correctResults: membership.correctResults + correctResultDelta,
		});
	}
}
```

  **Problema central**: o delta usa `pred.points` (pontuação padrão do site) como estado anterior e aplica o **mesmo** delta em todas as ligas. Com pesos por liga, cada liga precisa do seu delta: `f(componentesNovos, pesos) − f(componentesAntigos, pesos)`.
  - `resetComputedPoints` (linhas 216-244) + `recomputeAll`/`adminRecomputeAll` (linhas 329-353, 373-405): zeram tudo e recalculam jogo a jogo — rede de segurança.
- `packages/backend/convex/leagues.ts` (após 006): `create` e `update` já aceitam `rankingMode` opcional; `getRanking` ordena em memória conforme o modo.
- `apps/web/src/app/(app)/leagues/page.tsx` (após 006): `CreateLeagueDialog` é um wizard com `const [step, setStep] = useState<1 | 2 | 3>(1)` (linha ~31); o passo 3 (`step === 3`, linha ~167) tem os botões-cartão de `rankingMode` e o submit. `WizardProgress` (linha ~212) mostra "Passo {n} de 3".
- `apps/web/src/app/(app)/leagues/[id]/manage/page.tsx` (após 006): admin edita `rankingMode` via `api.leagues.update`.
- `apps/web/src/app/(app)/leagues/[id]/page.tsx` (após 006): exibe tag com o critério de ranking.

Convenções: Convex com validadores `v.*` e `ConvexError`; UI em português com tokens `var(--b-*)`; toasts `sonner`. Antes de mexer em código Convex, leia `packages/backend/convex/_generated/ai/guidelines.md`. Skills úteis se disponíveis: `convex-best-practices`, `convex-migrations`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0              |
| Lint      | `bunx biome check apps/web packages/backend` | exit 0 |
| Build     | `bun run build`          | exit 0              |
| Recompute (rede de segurança) | dashboard do Convex → Functions → `predictions:recomputeAll` (internal) ou `predictions:adminRecomputeAll` logado como admin | totais recalculados |

## Scope

**In scope** (the only files you should modify):
- `packages/backend/convex/schema.ts`
- `packages/backend/convex/predictions.ts`
- `packages/backend/convex/leagues.ts`
- `apps/web/src/app/(app)/leagues/page.tsx` (wizard: opção de pontuação no passo 3)
- `apps/web/src/app/(app)/leagues/[id]/manage/page.tsx`
- `apps/web/src/app/(app)/leagues/[id]/page.tsx` (exibir "Pontuação personalizada")

**Out of scope** (do NOT touch, even though they look related):
- **Qualquer lock/fechamento por liga** — removido do escopo por decisão do dono. Não toque em `LOCK_WINDOW_MS`, no `upsert` de palpites, em `scorecard.tsx` nem em `lock-countdown.tsx`.
- Palpites por liga (`predictions` com `leagueId`) — rejeitado, remodelagem grande demais.
- A pontuação **padrão** do site (10/7/5/2 via `calcPoints`) — pesos custom são opt-in por liga.
- `footballData.ts`, crons, bracket, página de regras.

## Git workflow

- Branch: `advisor/007-pontuacao-personalizada`
- Commits pequenos por step, em português (`feat(leagues): ...`, `feat(predictions): ...`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Schema — pesos na liga e componentes no palpite

1. Em `leagues` (logo após `rankingMode`):

```ts
// Pesos de pontuação da liga. Ausente = padrão do site (resultado 5, gols 2, bônus exato 1).
scoring: v.optional(
	v.object({
		result: v.number(),     // acertar vencedor/empate
		goal: v.number(),       // acertar os gols de um time (cada lado)
		exactBonus: v.number(), // bônus quando o placar é exato
	}),
),
```

(Sanidade: com `result=5, goal=2, exactBonus=1`, placar exato soma 5+2+2+1 = 10 — idêntico ao `calcPoints` atual.)

2. Em `predictions`:

```ts
// Componentes do acerto, gravados no cálculo — permitem derivar pontos com pesos por liga.
components: v.optional(
	v.object({
		result: v.boolean(),
		homeGoals: v.boolean(),
		awayGoals: v.boolean(),
	}),
),
```

**Verify**: `bun run check-types` → exit 0.

### Step 2: Motor de pontos por componentes

Em `predictions.ts`:

1. Adicione, acima de `calcPoints`:

```ts
type ScoreComponents = { result: boolean; homeGoals: boolean; awayGoals: boolean };
type Scoring = { result: number; goal: number; exactBonus: number };
const DEFAULT_SCORING: Scoring = { result: 5, goal: 2, exactBonus: 1 };

function calcComponents(ph: number, pa: number, ah: number, aa: number): ScoreComponents {
	return {
		result: Math.sign(ph - pa) === Math.sign(ah - aa),
		homeGoals: ph === ah,
		awayGoals: pa === aa,
	};
}

function pointsFrom(c: ScoreComponents | undefined, s: Scoring): number {
	if (!c) return 0;
	const exact = c.result && c.homeGoals && c.awayGoals;
	return (
		(c.result ? s.result : 0) +
		(c.homeGoals ? s.goal : 0) +
		(c.awayGoals ? s.goal : 0) +
		(exact ? s.exactBonus : 0)
	);
}
```

2. Reescreva `calcPoints` como casca fina (mesma assinatura e retorno de hoje):

```ts
function calcPoints(ph: number, pa: number, ah: number, aa: number) {
	const c = calcComponents(ph, pa, ah, aa);
	const isExact = c.result && c.homeGoals && c.awayGoals;
	return {
		points: pointsFrom(c, DEFAULT_SCORING),
		isExact,
		isCorrectResult: c.result,
		components: c,
	};
}
```

3. Em `computeForMatch`, no loop de palpites:
   - Capture `components` do retorno de `calcPoints` e o estado anterior `oldComponents = pred.components`.
   - Patch do palpite: `{ points, calculatedAt: now, components }` (`points` segue sendo a pontuação padrão — alimenta perfil/stats).
   - Substitua o loop de memberships por um delta **por liga**:

```ts
for (const membership of memberships) {
	const league = await ctx.db.get(membership.leagueId);
	const scoring = league?.scoring ?? DEFAULT_SCORING;
	// Dados antigos (sem components): o total da liga foi acumulado com a
	// pontuação padrão, então o estado anterior é pred.points.
	const oldPts = oldComponents
		? pointsFrom(oldComponents, scoring)
		: (pred.points ?? 0);
	const newPts = pointsFrom(components, scoring);
	const leagueDelta = newPts - oldPts;
	if (leagueDelta === 0 && exactDelta === 0 && correctResultDelta === 0) continue;
	await ctx.db.patch(membership._id, {
		totalPoints: membership.totalPoints + leagueDelta,
		exactScores: membership.exactScores + exactDelta,
		correctResults: membership.correctResults + correctResultDelta,
	});
}
```

   - **Atenção à ordem**: `oldComponents` e os deltas globais (`exactDelta`, `correctResultDelta`) devem ser lidos/calculados **antes** do patch do palpite. O `continue` que hoje pula o loop inteiro quando nada mudou (linha ~195) deve sair de cima do loop de memberships — o delta agora é por liga, então a checagem de curto-circuito vai para dentro do loop (como acima). Derive `exactDelta` do estado anterior preferindo componentes: `oldExact = oldComponents ? (oldComponents.result && oldComponents.homeGoals && oldComponents.awayGoals) : pred.points === 10`, mantendo o fallback atual.
4. Em `resetComputedPoints`, limpe também os componentes: `components: undefined` no patch dos palpites. Assim `recomputeAll` reconstrói tudo do zero com pesos por liga corretos.

**Verify**: `bun run check-types` → exit 0. Depois, anote os `totalPoints` de 2-3 membros de ligas existentes (dashboard do Convex), rode `predictions:recomputeAll` pela dashboard e confirme que os totais ficam **idênticos** (regressão zero em ligas sem `scoring`).

### Step 3: Backend de ligas — aceitar `scoring`

Em `leagues.ts`, `create` e `update`: adicione o arg opcional com o mesmo validador do schema e validação de faixa:

```ts
scoring: v.optional(
	v.object({ result: v.number(), goal: v.number(), exactBonus: v.number() }),
),
```

No handler, se presente: valide `Number.isInteger(x) && x >= 0 && x <= 20` para os três campos (senão `throw new ConvexError("Pesos devem ser inteiros entre 0 e 20")`) e grave/patche. No `update`, use `if (args.scoring) patch.scoring = args.scoring;` (mesmo padrão do `rankingMode`).

**Verify**: `bun run check-types` → exit 0.

### Step 4: Wizard e manage

1. No passo 3 do wizard (`leagues/page.tsx`, bloco `step === 3`), abaixo dos cartões de `rankingMode`: toggle "Pontuação: Padrão do site / Personalizada" (dois botões-cartão no mesmo padrão visual dos existentes). Se "Personalizada": três inputs numéricos (`Input` do `@bolao/ui`) — "Resultado", "Gols de cada time", "Bônus de placar exato" — pré-preenchidos com 5/2/1, `min=0 max=20`. Submit passa `scoring` só quando personalizada.
2. No manage (`leagues/[id]/manage/page.tsx`): mesmo bloco para editar, chamando `api.leagues.update`. Junto ao salvar, aviso em texto pequeno: *"Pesos novos valem para os próximos jogos; pontos já calculados só mudam num recálculo geral feito pelo admin do site."*
3. Na página da liga (`leagues/[id]/page.tsx`): quando `league.scoring` existir, tag "Pontuação personalizada" ao lado da tag de ranking, com os pesos visíveis (ex.: "5 / 2 / 1") num tooltip ou texto pequeno.

**Verify**: criar liga com pesos 10/3/2 persiste `scoring` (dashboard); `bun run check-types` → exit 0.

### Step 5: Validação de ponta a ponta

1. Crie (ou edite via dashboard) uma liga com `scoring: { result: 10, goal: 3, exactBonus: 2 }` e garanta que um usuário com palpite calculado é membro dela e de uma liga padrão.
2. Force o recálculo de um jogo finalizado: dashboard → `predictions:computeForMatch` com o `matchId` (ou rode `recomputeAll`).
3. Confirme: na liga personalizada o membro tem totais coerentes com os pesos novos; na liga padrão, totais inalterados.
4. Rode `computeForMatch` **duas vezes** no mesmo jogo: a segunda passada não pode alterar nenhum total (deltas zero — idempotência).

**Verify**: itens 3 e 4 confirmados; `bun run build` → exit 0; `bunx biome check apps/web packages/backend` → exit 0.

## Test plan

Sem runner de testes no repo; o roteiro do Step 5 é o teste. Os dois itens inegociáveis: **regressão zero** em ligas sem `scoring` (Step 2 verify) e **idempotência** do recálculo (Step 5.4).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `bunx biome check apps/web packages/backend` exits 0
- [ ] `grep -n "components" packages/backend/convex/schema.ts` retorna match na tabela `predictions`
- [ ] `grep -n "pointsFrom" packages/backend/convex/predictions.ts` retorna ≥ 2 matches
- [ ] `grep -rn "lockPolicy" packages/backend apps/web/src` retorna **zero** matches (o lock por liga não entrou)
- [ ] Roteiro do Step 5 (itens 3 e 4) executado e descrito no relatório final
- [ ] `git status` só mostra arquivos do escopo
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Os excertos de "Current state" não baterem com o código — em especial o loop de deltas de `computeForMatch`.
- A verificação de regressão zero (Step 2) falhar após uma tentativa de correção — não "ajuste" totais à mão.
- Você se ver implementando qualquer forma de lock por liga ou adicionando `leagueId` a `predictions` — ambos explicitamente rejeitados.
- O wizard não comportar os inputs de pesos sem quebrar o layout mobile do dialog.

## Maintenance notes

- `adminRecomputeAll` segue sendo a rede de segurança universal — depois deste plano ela reconstrói totais **com os pesos por liga**.
- Limitação documentada (Step 4.2): mudar pesos de uma liga existente não reescreve o passado até um recálculo geral. Follow-up natural: recálculo por liga.
- A página de Regras (plano 008) deve mencionar pesos personalizados **somente depois** que este plano aterrissar — o 008 já contém essa checagem condicional.
- Revisor: o ponto frágil é o fallback de dados antigos (`pred.components === undefined`) no delta por liga — escrutine essas linhas; e confirme que o curto-circuito (`continue`) foi movido para dentro do loop de memberships.
