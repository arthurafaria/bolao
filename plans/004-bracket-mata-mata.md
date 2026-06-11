# Plan 004: Bracket visual do mata-mata (pré-oitavas → final) com bandeira + sigla

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e87755c..HEAD -- apps/web/src/app/(app) apps/web/src/lib/match-grouping.ts packages/backend/convex/matches.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/002-wc2026-dados-mata-mata-tla.md (campo `teams.tla` e rótulos de fase)
- **Category**: direction
- **Planned at**: commit `e87755c`, 2026-06-10

## Why this matters

Depois da fase de grupos (termina 27/06/2026), a Copa 2026 vira um mata-mata de 32: **pré-oitavas → oitavas → quartas → semifinais → disputa de 3º lugar → final** (final em 19/07/2026). Hoje o app só tem listas de jogos; não existe nenhuma visualização de chaveamento. O dono do produto pediu um **bracket** pronto antes do mata-mata começar, usando **bandeira do país + sigla de 3 letras** (ex.: 🇧🇷 BRA) para caber na tela. Vagas ainda não definidas aparecem como "A definir".

## Current state

- Não existe página de bracket. Rotas do app ficam em `apps/web/src/app/(app)/` (dashboard, predictions, leagues, regras, profile, admin), todas client components com o layout/nav em `apps/web/src/app/(app)/layout.tsx`.
- Navegação: `navItems` em `apps/web/src/app/(app)/layout.tsx:37-46`:

```tsx
const navItems: {
	href: "/dashboard" | "/predictions" | "/leagues" | "/regras";
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}[] = [
	{ href: "/dashboard", label: "Início", icon: LayoutDashboard },
	{ href: "/predictions", label: "Palpites", icon: Shield },
	{ href: "/leagues", label: "Ligas", icon: Trophy },
	{ href: "/regras", label: "Regras", icon: BookOpen },
];
```

(Esse array é usado pelo sidebar desktop e pelo bottom-nav mobile no mesmo arquivo.)

- Query pronta para buscar jogos por fase: `getByStage` em `packages/backend/convex/matches.ts:39-62` — `args: { tournament, stage? }`; sem `stage` retorna **todos** os jogos do torneio (já com `homeTeam`/`awayTeam` populados via `enrichMatch`). Use-a com `{ tournament: "WC2026" }` e filtre/agrupe os mata-matas no cliente — 104 jogos é barato.
- Times: tabela `teams` com `name, shortName, crest (URL da bandeira), nationality, tla` (o `tla` é adicionado pelo plano 002 — confirme que existe no schema antes de começar).
- Fases (campo `matches.stage`, valores do football-data.org): fase de 32 pode vir como `LAST_32`/`ROUND_OF_32`/`PLAYOFF_ROUND_OF_32`; depois `LAST_16`/`ROUND_OF_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `THIRD_PLACE`, `FINAL`. Rótulos em pt-BR em `apps/web/src/lib/match-grouping.ts` (`STAGE_LABELS`, expandido pelo plano 002). **Verifique os valores reais na dashboard do Convex (tabela `matches`) antes de codificar a ordem das colunas.**
- Tradução de nomes de seleção: `apps/web/src/lib/team-translations.ts` (ex.: "Brazil" → "Brasil").
- Convenções de UI: tokens `var(--b-*)` (`packages/ui/src/styles/tokens.css`), headers editoriais (`text-eyebrow` + `font-display` uppercase), componentes compartilhados em `packages/ui/src/components/` (ex.: `Skeleton`, `Tag`). Use `apps/web/src/app/(app)/predictions/page.tsx` como exemplar de estrutura de página.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0              |
| Lint      | `bunx biome check apps/web` | exit 0           |
| Build     | `bun run build`          | exit 0              |
| Dev       | `bun run dev:web` + `bun run dev:server` | app na porta 3001 |

## Suggested executor toolkit

- Skill `make-interfaces-feel-better`, se disponível, para o polimento visual do bracket.

## Scope

**In scope** (the only files you should modify/create):
- `apps/web/src/app/(app)/mata-mata/page.tsx` (criar)
- `apps/web/src/components/bracket/` (criar — ex.: `bracket.tsx`, `bracket-match.tsx`)
- `apps/web/src/app/(app)/layout.tsx` — **somente** para adicionar o item "Mata-mata" ao `navItems`
- `apps/web/src/lib/match-grouping.ts` — somente se precisar de um helper de ordenação de fases

**Out of scope** (do NOT touch, even though they look related):
- `packages/backend/convex/**` — a query `getByStage` já basta; nenhuma função nova.
- Palpites dentro do bracket — o bracket é **visualização**; palpitar continua na página de palpites. Não adicione inputs de placar.
- `scorecard.tsx`, página de predictions, dashboard.

## Git workflow

- Branch: `advisor/004-bracket-mata-mata`
- Commits em português, conventional commits (`feat(bracket): ...`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Componente de jogo do bracket

Crie `apps/web/src/components/bracket/bracket-match.tsx`: card compacto de um confronto. Cada lado mostra:

- Bandeira: `<img src={team.crest} … />` com ~20px de largura, cantos levemente arredondados (`rounded-[2px]`), `alt` com o nome do time. Os crests de seleções no football-data.org são as bandeiras (SVG).
- Sigla: `team.tla ?? team.shortName.slice(0, 3).toUpperCase()` em `font-display` bold.
- Placar (se `match.status === "FINISHED"` ou ao vivo), à direita; vencedor em `text-[var(--b-text)]`, perdedor em `text-[var(--b-text-3)]`.
- Slot indefinido (jogo ainda sem times definidos não existe no banco — veja Step 2): renderize um placeholder "A definir" em `text-[var(--b-text-4)]`.
- Abaixo do confronto, em texto `text-xs text-[var(--b-text-3)]`: data (`dd/MM HH:mm` local) e estádio (`match.venue`), quando houver.

Estilo: borda `border-[var(--b-border-sm)]`, fundo `bg-[var(--b-card)]`, `rounded-2xl`, padding compacto — coerente com `LeagueCard` em `apps/web/src/app/(app)/leagues/page.tsx:332-339`.

**Verify**: `bun run check-types` → exit 0.

### Step 2: Página do bracket

Crie `apps/web/src/app/(app)/mata-mata/page.tsx` (client component, `"use client"`):

1. Busque `useQuery(api.matches.getByStage, { tournament: "WC2026" })` (hardcode `WC2026` — o bracket é da Copa; não use `useTournament`).
2. Filtre jogos com `stage !== "GROUP_STAGE"` e agrupe por fase na ordem: pré-oitavas (32) → oitavas → quartas → semifinais → 3º lugar → final. Defina a ordem num array local de stages aceitos (inclua os aliases: `["LAST_32", "ROUND_OF_32", "PLAYOFF_ROUND_OF_32"]` todos na posição 1, etc.). Dentro de cada fase, ordene por `utcDate`.
3. Layout: **colunas horizontais com scroll** (`overflow-x-auto`, uma coluna por fase, `min-w` fixo por coluna, colunas posteriores com mais espaçamento vertical entre os cards para sugerir convergência do chaveamento). No mobile o scroll horizontal é o mecanismo principal — não tente espremer 6 colunas.
4. Cabeçalho de cada coluna: rótulo via `STAGE_LABELS` (já em pt-BR).
5. **Slots futuros**: enquanto a API não cria os jogos de uma fase (vagas indefinidas), a fase não tem documentos. Para cada fase sem jogos, renderize a coluna com placeholders "A definir" na quantidade certa (16, 8, 4, 2, 1+1). Quantidades: pré-oitavas 16 jogos, oitavas 8, quartas 4, semis 2, 3º lugar 1, final 1.
6. Header editorial da página (mesmo padrão das outras): eyebrow "Caminho até a taça", título "Mata-mata".
7. Estado de loading: `Skeleton`s de colunas (siga o padrão de loading de `predictions/page.tsx:182-191`).

**Verify**: `bun run check-types` → exit 0; com dev server rodando, `/mata-mata` renderiza 6 colunas (placeholders enquanto não há jogos de mata-mata no banco).

### Step 3: Item de navegação

Em `apps/web/src/app/(app)/layout.tsx`, adicione ao `navItems` (e ao union type do `href`):

```tsx
{ href: "/mata-mata", label: "Mata-mata", icon: GitBranch },
```

(importe `GitBranch` de `lucide-react`; ele lembra um chaveamento). O mesmo array alimenta desktop e mobile — nenhuma outra mudança no layout.

**Verify**: `bun run check-types` → exit 0; o item aparece no sidebar e no bottom-nav.

### Step 4: Lint e build finais

**Verify**: `bunx biome check apps/web` → exit 0; `bun run build` → exit 0.

## Test plan

Sem runner de testes; verificação manual:

- `/mata-mata` abre com 6 colunas na ordem correta, com rótulos em português.
- Sem jogos de mata-mata no banco: todas as colunas mostram placeholders "A definir" nas quantidades 16/8/4/2/1/1.
- (Se possível, insira um jogo de teste com stage de mata-mata via dashboard do Convex) — o card mostra bandeira + sigla + data/estádio.
- Scroll horizontal funciona no viewport mobile (devtools, 390px).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `bunx biome check apps/web` exits 0
- [ ] `test -f "apps/web/src/app/(app)/mata-mata/page.tsx"` → exit 0
- [ ] `grep -n "mata-mata" "apps/web/src/app/(app)/layout.tsx"` retorna ≥ 1 match
- [ ] `grep -rn "A definir" apps/web/src/components/bracket/` retorna ≥ 1 match
- [ ] `git status` só mostra arquivos do escopo
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- O campo `tla` não existir no schema de `teams` (plano 002 não aterrissou) — dependência não satisfeita.
- Os valores reais de `stage` no banco não baterem com nenhum alias listado — reporte os valores observados em vez de chutar a ordem.
- Você se ver implementando palpite/input de placar dentro do bracket — fora do escopo.
- Adicionar o 5º item ao nav mobile quebrar o layout do bottom-nav (overflow) — reporte com screenshot/descrição em vez de redesenhar o nav por conta própria.

## Maintenance notes

- Quando o football-data.org criar os jogos do mata-mata (com times "winner of group X" resolvidos), os placeholders são substituídos automaticamente pelos jogos reais — confirme que o merge placeholder/jogo real por fase funciona (a coluna usa jogos reais quando existem, completando com placeholders até a contagem esperada).
- Revisor: atenção à ordem/aliases de stage e ao fallback de sigla quando `tla` for nulo.
- Follow-up deferido: linhas conectoras SVG entre as colunas (puro polimento, não bloqueia).
