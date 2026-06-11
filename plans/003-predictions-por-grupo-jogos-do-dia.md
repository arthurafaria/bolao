# Plan 003: Página de palpites da Copa organizada por grupos, com destaque para os jogos do dia

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e87755c..HEAD -- apps/web/src/app/(app)/predictions/page.tsx apps/web/src/lib/match-grouping.ts apps/web/src/components/match`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-modo-copa-padrao.md, plans/002-wc2026-dados-mata-mata-tla.md
- **Category**: direction
- **Planned at**: commit `e87755c`, 2026-06-10

## Why this matters

A Copa 2026 tem **12 grupos (A–L), 48 seleções e 72 jogos só na fase de grupos**, distribuídos em 3 rodadas. A página de palpites hoje agrupa jogos apenas por **dia**, o que funciona para o Brasileirão mas vira uma lista enorme e sem estrutura na Copa. O dono do produto pediu: dividir por **grupos** para facilitar a experiência, ajustando por rodada (os dois jogos de cada grupo por rodada aparecem juntos), e ao mesmo tempo deixar claro quais são os **jogos do dia**, com data e estádio. Data e estádio já aparecem no card de jogo — o trabalho deste plano é o agrupamento e o destaque do dia.

## Current state

- `apps/web/src/app/(app)/predictions/page.tsx` — página de palpites (client component). Tem 3 abas (`upcoming`/`pending`/`history` — "Próximos/Pendentes/Histórico" via `PillTabs`), filtra os jogos e agrupa **por dia** com `groupByDay` (definida no próprio arquivo, linhas 28-45), renderizando `DayHeader` + lista de `Scorecard`.
- `apps/web/src/lib/match-grouping.ts` — helpers de agrupamento por rodada/fase: `roundKey`, `roundLabel` ("Grupo A", "Rodada N", rótulos de fase) e `groupByRound`. **Hoje ninguém usa `groupByRound` na página de palpites.**
- `apps/web/src/components/match/scorecard.tsx` — card de jogo; já exibe `match.venue` (linha 363) e horário. Não mexa nele.
- `apps/web/src/components/match/day-header.tsx` — cabeçalho de seção por dia (data formatada + progresso de palpites).
- O torneio ativo vem de `useTournament()` (`apps/web/src/contexts/tournament-context.tsx`); jogos vêm de `api.matches.getAllByDate` com `{ tournament }`, e cada match tem `stage`, `group` (ex.: `"GROUP_A"` ou `"A"` — `roundLabel` normaliza os dois), `matchday`, `utcDate`, `venue`.

Excerto de `predictions/page.tsx:47-61` (seleção da "próxima rodada", que hoje decide o que aparece na aba Próximos):

```tsx
function getNextRoundMatches(matches: Match[]): Match[] {
	const sorted = [...matches].sort(
		(a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
	);
	const first = sorted[0];
	if (!first) return [];

	if (first.matchday != null) {
		return sorted.filter(
			(m) => m.stage === first.stage && m.matchday === first.matchday,
		);
	}

	return sorted.filter((m) => dayKey(m.utcDate) === dayKey(first.utcDate));
}
```

Excerto de `predictions/page.tsx:195-226` (renderização atual por dia):

```tsx
<div className="space-y-8">
	{grouped.map(([key, date, dayMatches]) => {
		const predictedCount = dayMatches.filter((m) => predMap?.has(m._id)).length;
		return (
			<section key={key} className="space-y-3">
				<DayHeader date={date} totalMatches={dayMatches.length} predictedMatches={predictedCount} />
				...
				<Scorecard match={m} prediction={...} readOnly={tab === "history"} />
```

Excerto de `match-grouping.ts:22-27`:

```ts
export function roundLabel(match: RoundableMatch): string {
	const groupLetter = match.group?.replace(/^(?:GRUPO|GROUP)[_\s]+/, "");
	if (groupLetter) return `Grupo ${groupLetter}`;
	if (match.matchday != null) return `Rodada ${match.matchday}`;
	return STAGE_LABELS[match.stage] ?? match.stage.replace(/_/g, " ");
}
```

Convenções de UI do repo: tokens CSS `var(--b-*)` (definidos em `packages/ui/src/styles/tokens.css`), classes utilitárias Tailwind 4, headers "editoriais" com `text-eyebrow` + `font-display` uppercase (veja o header da própria página, linhas 140-152), animação de lista com `stagger-children` + `--i`. Textos da UI em português. Siga exatamente esses padrões.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0              |
| Lint      | `bunx biome check apps/web` | exit 0           |
| Build     | `bun run build`          | exit 0              |
| Dev       | `bun run dev:web` (porta 3001; requer `bun run dev:server` em outro terminal) | app abre |

## Suggested executor toolkit

- Se a skill `make-interfaces-feel-better` estiver disponível, use-a ao desenhar o destaque "Jogos de hoje" (Step 3).

## Scope

**In scope** (the only files you should modify):
- `apps/web/src/app/(app)/predictions/page.tsx`
- `apps/web/src/lib/match-grouping.ts` (apenas se precisar de um helper novo, ex.: ordenar grupos A→L)
- `apps/web/src/components/match/group-header.tsx` (criar, se optar por um header próprio de grupo)

**Out of scope** (do NOT touch, even though they look related):
- `apps/web/src/components/match/scorecard.tsx` e `day-header.tsx` — já exibem venue/data; não alterar.
- `packages/backend/convex/**` — nenhuma query nova é necessária; `getAllByDate` já traz tudo.
- Dashboard e bracket (plano 004).
- O comportamento das abas Pendentes/Histórico além do agrupamento descrito.

## Git workflow

- Branch: `advisor/003-predictions-grupos`
- Commits em português, conventional commits (`feat(predictions): ...`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Helper de agrupamento por grupo

Em `apps/web/src/lib/match-grouping.ts`, adicione (sem alterar as funções existentes):

```ts
/** Agrupa jogos da fase de grupos por grupo (A→L), preservando ordem de data dentro do grupo. */
export function groupByGroup<T extends RoundableMatch>(
	matches: T[],
): [string, T[]][] {
	const map = new Map<string, T[]>();
	for (const m of matches) {
		const letter = m.group?.replace(/^(?:GRUPO|GROUP)[_\s]+/, "") ?? "?";
		const list = map.get(letter) ?? [];
		list.push(m);
		map.set(letter, list);
	}
	return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}
```

**Verify**: `bun run check-types` → exit 0.

### Step 2: Agrupar a aba "Próximos" por grupo quando for fase de grupos da Copa

Em `predictions/page.tsx`:

1. A seleção da rodada atual (`getNextRoundMatches`) continua igual — ela já isola a rodada vigente (`stage + matchday`).
2. Na renderização da aba `upcoming`: se `tournament === "WC2026"` **e** todos os jogos exibidos têm `group` preenchido (fase de grupos), troque o agrupamento por dia pelo agrupamento por grupo (`groupByGroup`). Cada seção vira:
   - Header do grupo: eyebrow "Grupo" + letra em `font-display` uppercase (siga o padrão visual do header da página; se preferir, crie `components/match/group-header.tsx` com a mesma estrutura do `day-header.tsx`, mostrando "Grupo A" + contagem `palpitados/total`).
   - Os 2 jogos do grupo daquela rodada como `Scorecard`s (que já mostram dia, hora e estádio).
3. Nas demais situações (mata-mata, Brasileirão, abas Pendentes/Histórico), mantenha o agrupamento por dia atual — sem mudança de comportamento.
4. Acima das seções de grupo, mostre o rótulo da rodada (use `roundLabel` do primeiro jogo, ex.: "Rodada 1") como um sub-header da aba.

**Verify**: `bun run check-types` → exit 0; com o dev server rodando e dados da Copa sincronizados, a aba Próximos mostra seções "Grupo A" … na ordem alfabética, 2 jogos por seção.

### Step 3: Seção "Jogos de hoje"

Ainda em `predictions/page.tsx`, na aba `upcoming` (apenas modo Copa):

1. Calcule `todayMatches`: jogos de `cleanedMatches` cujo `dayKey(m.utcDate)` é o dia local de hoje e `status !== "FINISHED"` (inclua jogos ao vivo — `LIVE/IN_PLAY/PAUSED` — para o usuário acompanhar).
2. Se `todayMatches.length > 0`, renderize uma seção destacada **antes** dos grupos:
   - Header: eyebrow "Hoje no gramado" + título "Jogos do dia" (mesmo padrão editorial).
   - Container com borda de destaque (`border-[var(--b-brand-25)]`) e fundo `bg-[var(--b-brand-5)]`, cantos `rounded-[28px]`, padding `p-4` — coerente com os cards existentes.
   - Dentro, os `Scorecard`s dos jogos de hoje (eles já mostram horário e estádio).
3. Evite duplicação visual confusa: os jogos de hoje **também** continuam aparecendo no seu grupo — isso é aceitável e esperado (o destaque é um atalho). Não implemente lógica de remoção.

**Verify**: visualmente, com jogos na data de hoje no banco, a seção "Jogos do dia" aparece no topo com os jogos corretos; `bun run build` → exit 0.

### Step 4: Passada final de lint

**Verify**: `bunx biome check apps/web` → exit 0 (rode `bun run check` para autofix de formatação se necessário — ele usa `--write`, é o fluxo normal do repo).

## Test plan

Sem runner de testes no repo; não crie um. Verificação manual:

- Modo Copa, aba Próximos: rodada vigente dividida por "Grupo A"…"Grupo L", 2 jogos por grupo, com data/hora/estádio visíveis nos cards.
- Jogos com data de hoje → seção "Jogos do dia" no topo.
- Modo Brasileirão: comportamento idêntico ao atual (agrupado por dia).
- Abas Pendentes e Histórico: comportamento idêntico ao atual.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `bunx biome check apps/web` exits 0
- [ ] `grep -n "groupByGroup" apps/web/src/lib/match-grouping.ts apps/web/src/app/(app)/predictions/page.tsx` retorna match nos dois arquivos
- [ ] `grep -n "Jogos do dia" apps/web/src/app/(app)/predictions/page.tsx` retorna ≥ 1 match
- [ ] `git status` só mostra arquivos do escopo
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Os excertos de "Current state" não baterem com o código (drift).
- Os jogos da Copa no banco **não** tiverem o campo `group` preenchido na fase de grupos (verifique na dashboard do Convex) — o agrupamento não tem dado para funcionar; reporte.
- Você precisar alterar `scorecard.tsx` ou uma query Convex para concluir — está fora do escopo; reporte o motivo.
- O formato real do campo `group` não for capturado pela regex `^(?:GRUPO|GROUP)[_\s]+` nem for uma letra simples (ex.: vier "Group A1") — reporte com o valor observado.

## Maintenance notes

- Quando a fase de grupos acabar (27/06/2026), a aba Próximos cai automaticamente no agrupamento por dia para o mata-mata — comportamento desejado; o bracket (plano 004) cobre a visualização do mata-mata.
- Revisor: cheque a condição que decide grupo-vs-dia (todos os jogos com `group`) e a ordenação A→L com 12 grupos.
- Follow-up deferido: filtro/seletor de rodada (1/2/3) na fase de grupos — não incluído para manter o escopo pequeno.
