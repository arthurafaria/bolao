# Plan 013: Frontend — painel segmentado Pontos/Cravadas e cravadas na linha do ranking

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b04a4c0..HEAD -- "apps/web/src/app/(app)/leagues" apps/web/src/components/leagues packages/ui/src/components/pill-tabs.tsx`
> O plano 012 deve estar aplicado (working tree, possivelmente sem commit) —
> confirme que `packages/backend/convex/lib/ranking.ts` existe e exporta
> `compareByPoints`/`compareByExacts`. Se não existir, STOP: execute o 012 antes.
>
> **Leitura obrigatória antes do Step 1** (skills dentro do próprio repo —
> mesmo conjunto usado no redesign 011; em conflito, o plano manda):
> 1. `.agents/skills/make-interfaces-feel-better/SKILL.md` (inteira)
> 2. `.agents/skills/impeccable/SKILL.md` (seções "Shared design laws" e "Absolute bans")
> 3. `.agents/skills/design-taste-frontend/SKILL.md` (seções 2–5)

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (mexe na página mais vista de ligas durante a Copa; só display, zero pontuação)
- **Depends on**: plans/012-ranking-comparators-backend.md
- **Category**: direction (pedido direto do dono)
- **Planned at**: commit `b04a4c0`, 2026-06-12

## Why this matters

Pedido textual do dono (2026-06-12), que rege as decisões deste plano:

1. Em ligas **"mais cravadas"** (`rankingMode === "EXACTS"`) **somente**, o
   painel da liga deve segmentar o ranking em **RANKING DE PONTOS** e
   **RANKING DE CRAVADAS**. O ranking de cravadas conta **só os placares
   exatos** (10 pts na pontuação padrão). O ranking de pontos *"DEVE SER
   MANTIDO COMO O PADRÃO DE VISUALIZAÇÃO DO USUÁRIO NO MOMENTO DE ENTRADA NO
   PAINEL DE LIGAS"* — ou seja, **a aba ativa ao entrar é sempre "Pontos"**,
   mesmo em liga de cravadas. Essa decisão está fechada; não reabra.
2. Em **todas** as ligas, a linha do ranking que hoje mostra só
   `USUÁRIO — 10 pts` passa a mostrar `USUÁRIO — 10 PTS | 1 CRAVADA`.
   Cravadas são o critério de desempate do ranking de pontos (o backend já
   ordena assim; o 012 formalizou em `compareByPoints`).

Hoje o usuário não tem como ver quantas cravadas cada rival tem sem abrir
perfil por perfil, e em ligas de cravadas não dá para ver a disputa por pontos.

## Current state

- `apps/web/src/app/(app)/leagues/[id]/page.tsx` (350 linhas) — página da liga:
  - `ranking = useQuery(api.leagues.getRanking, { leagueId })` (linha 44);
    cada item já traz `totalPoints`, `exactScores`, `correctResults`, `name`,
    `userId` (spread `...member` no backend).
  - `podiumEntries` (linhas 47–54): top 3 de `ranking` com `points: m.totalPoints`.
  - Tabela (linhas 168–210): mapeia `ranking` em `<RankingRow position name points isYou />`,
    com stagger `--d: 40ms` / `--i: idx`.
  - Header da tabela tem `<Tag>` "Mais pontos"/"Mais cravadas" (linhas 180–182).
  - `rankingMode` derivado na linha 87: `league.rankingMode ?? "POINTS"`.
- `apps/web/src/components/leagues/ranking-row.tsx` (139 linhas) — linha do
  ranking; bloco de pontos atual (linhas 128–136):

```tsx
{/* Points */}
<div className="flex shrink-0 flex-col items-end">
    <span className="font-black font-display text-2xl text-[var(--b-text)] tabular-nums leading-none">
        {points}
    </span>
    <span className="text-[10px] text-[var(--b-text-4)] uppercase tracking-wider">
        pts
    </span>
</div>
```

- `apps/web/src/components/leagues/podium.tsx` — pódio top 3; rótulo `pts`
  fixo na linha 137–139; recebe `PodiumEntry { position, name, points }`.
- `packages/ui/src/components/pill-tabs.tsx` — segmented control pronto
  (pílula animada, `role="tablist"`, prop `size`, `aria-label`). Exemplar de
  uso: `apps/web/src/app/(app)/predictions/page.tsx:180`.
- `apps/web/src/app/(app)/leagues/page.tsx` — lista de ligas; `LeagueCard`
  (linhas 528–594) mostra "Seus pontos" + `points={league.myPoints}`; após o
  012, `getUserLeagues` também devolve `myExacts`.
- Convenções visuais (redesign 011, "Noite de Jogo"): tokens `--b-*`,
  headings `font-display` uppercase, números `tabular-nums`, stagger
  `stagger-children` + `--i`, sem emoji na UI, raio concêntrico
  (externo = interno + padding), animar só transform/opacity.

## Commands you will need

| Purpose | Command (da raiz `bolao/`) | Expected on success |
|---------|----------------------------|---------------------|
| Typecheck | `bun run check-types` | exit 0 |
| Lint/format | `bun run check` | exit 0 |
| Dev (só web) | `bun run dev:web` | Next na porta 3001 |
| Testes | `bun test packages/backend/tests` | todos passam (regressão do 012) |

> ⚠️ **NUNCA rode `bun run dev:server` ou `bunx convex deploy`** — o
> deployment Convex local aponta para **produção**. `dev:web` é seguro
> (frontend local lendo o backend já publicado).

## Scope

**In scope** (únicos arquivos a modificar):
- `apps/web/src/app/(app)/leagues/[id]/page.tsx`
- `apps/web/src/components/leagues/ranking-row.tsx`
- `apps/web/src/components/leagues/podium.tsx`
- `apps/web/src/app/(app)/leagues/page.tsx` (somente `LeagueCard` — cravadas no card)

**Out of scope** (NÃO tocar):
- `packages/ui/src/components/pill-tabs.tsx` — usar como está; sem fork.
- `packages/backend/**` — backend fechado no 012.
- `apps/web/src/app/(app)/leagues/[id]/manage/page.tsx` e
  `members/[userId]/page.tsx` — usam `getRanking` só como lista; a ordem
  default não muda.
- Copy de regras/landing — é o plano 014.

## Git workflow

- Trabalhe direto na `master`; **não commite nem pushe** (plano 016 consolida).

## Steps

### Step 1: `RankingRow` ganha cravadas e métrica de destaque

Em `ranking-row.tsx`, adicione à interface:

```ts
exacts?: number;
metric?: "points" | "exacts"; // qual stat é o destaque; default "points"
```

Substitua o bloco "Points" (excerto em "Current state") por **dois blocos de
stat lado a lado com divisor vertical**, formato `10 PTS | 1 CRAVADA`:

- Stat primário (métrica ativa): número `text-2xl font-black font-display
  tabular-nums` em `var(--b-text)` — visual atual.
- Divisor: `<span className="h-8 w-px bg-[var(--b-border-md)]" />`.
- Stat secundário (a outra métrica): mesmo layout, número `text-lg` e cor
  `var(--b-text-3)` — presente mas subordinado.
- Labels: `pts` e `cravadas`/`cravada` (singular quando o valor é 1; pontos
  mantêm `pts` sempre, como hoje).
- Quando `metric === "points"`: pontos à esquerda como primário? **Não** —
  mantenha a ordem fixa `pontos | cravadas` (pontos sempre primeiro, como o
  dono pediu: "10 PONTOS | 1 CRAVADA") e troque apenas **qual lado recebe o
  estilo primário** conforme `metric`. Ordem estável evita layout shift ao
  alternar abas.
- Se `exacts === undefined`, renderize só o bloco de pontos (comportamento
  atual — nenhum outro call site quebra).
- Em telas muito estreitas o nome já trunca (`truncate`); os stats têm
  `shrink-0`. Verifique a 390px que nada quebra de linha.

**Verify**: `bun run check-types` → exit 0.

### Step 2: `Podium` ganha rótulo de unidade

Em `podium.tsx`, adicione `unit?: string` (default `"pts"`) a `PodiumProps` e
use no `<span>` do rótulo (linhas 137–139). Nenhuma outra mudança.

**Verify**: `bun run check-types` → exit 0.

### Step 3: Painel segmentado na página da liga

Em `leagues/[id]/page.tsx`:

1. Importe `PillTabs` de `@bolao/ui/components/pill-tabs`,
   `compareByExacts, compareByPoints` de
   `@bolao/backend/convex/lib/ranking`, e `Star` de `lucide-react` (ícone da
   aba de cravadas; `Trophy` já está importado para a de pontos).
2. Estado da aba: `const [rankingTab, setRankingTab] = useState<"POINTS" | "EXACTS">("POINTS");`
   — **default `"POINTS"` sempre** (exigência literal do dono). Não persista
   em localStorage.
3. A aba efetiva: `const activeTab = rankingMode === "EXACTS" ? rankingTab : "POINTS";`
   (liga de pontos nunca mostra abas nem ranking de cravadas).
4. Ordenação client-side (não confie na ordem do servidor, que segue o modo
   da liga):

```ts
const sortedRanking = useMemo(() => {
    if (!ranking) return [];
    return [...ranking].sort(
        activeTab === "EXACTS" ? compareByExacts : compareByPoints,
    );
}, [ranking, activeTab]);
```

5. `podiumEntries` passa a derivar de `sortedRanking` com
   `points: activeTab === "EXACTS" ? m.exactScores : m.totalPoints`; o
   `<Podium>` recebe `unit={activeTab === "EXACTS" ? "cravadas" : "pts"}`.
6. No header da seção "Ranking" (junto ao `<Tag>` existente, linhas 179–187):
   quando `rankingMode === "EXACTS"`, renderize o segmented control acima da
   tabela (entre o header e a lista), full-bleed à esquerda:

```tsx
<PillTabs
    aria-label="Critério do ranking"
    size="sm"
    value={rankingTab}
    onChange={setRankingTab}
    items={[
        { value: "POINTS", label: "Ranking de pontos", icon: Trophy },
        { value: "EXACTS", label: "Ranking de cravadas", icon: Star },
    ]}
/>
```

   Em liga EXACTS, o `<Tag>` estático "Mais cravadas" do header fica
   redundante com as abas — remova o `<Tag>` **apenas no caso EXACTS** (em
   liga POINTS ele permanece como hoje).
7. A lista mapeia `sortedRanking` e passa
   `exacts={member.exactScores}` e
   `metric={activeTab === "EXACTS" ? "exacts" : "points"}` ao `RankingRow`.
   Mantenha `position={idx + 1}`, stagger e o `<Link>` por membro como estão.
8. Ao trocar de aba, re-dispare o stagger da lista trocando a `key` do
   container: `key={activeTab}` no div `stagger-children` — entrada animada a
   cada alternância (lei make-interfaces-feel-better: enter animado em bloco
   semântico; o CSS já existe).

**Verify**: `bun run check-types` → exit 0.

### Step 4: Cravadas no card da lista de ligas

Em `leagues/page.tsx`, `LeagueCard`: adicione prop `exacts?: number` e passe
`exacts={league.myExacts}` no call site (~linha 497). No rodapé do card, ao
lado de "Seus pontos", acrescente um segundo mini-stat "Cravadas" com o mesmo
padrão visual (label `text-[10px] uppercase tracking-wider` +
número `font-black font-display tabular-nums`), número em `text-xl` e cor
`var(--b-text-3)` para não competir com os pontos.

**Verify**: `bun run check-types` → exit 0.

### Step 5: Conferência visual local

Rode `bun run dev:web`, abra `http://localhost:3001/leagues` logado (se não
houver sessão/credenciais disponíveis, pule e deixe para o plano 015 — anote
no relatório):

- Card de liga mostra pontos + cravadas.
- Liga POINTS: sem abas; linhas mostram `PTS | CRAVADA(S)` com pontos em
  destaque.
- Liga EXACTS: abas visíveis, **"Ranking de pontos" ativa ao entrar**;
  alternar para "Ranking de cravadas" reordena a lista, troca o destaque das
  linhas e o pódio passa a exibir cravadas com rótulo "cravadas".

**Verify**: checklist acima sem erro no console do browser nem hydration
mismatch no terminal do Next.

### Step 6: Lint/format e regressão

**Verify**: `bun run check` → exit 0; `bun test packages/backend/tests` →
todos passam; `git status` só mostra os 4 arquivos in-scope (mais os do 012,
se ainda não commitados).

## Test plan

- Sem test runner de UI no repo (não instale um). A regra de ordenação está
  coberta pelos testes do 012; este plano é display.
- Verificação manual estruturada: Step 5 aqui + roteiro completo de usuário no
  plano 015.

## Done criteria

TODOS devem valer:

- [ ] `bun run check-types` exit 0
- [ ] `bun run check` exit 0
- [ ] `bun test packages/backend/tests` exit 0
- [ ] `grep -n "PillTabs" "apps/web/src/app/(app)/leagues/[id]/page.tsx"` retorna import + uso
- [ ] `grep -n "compareByExacts" "apps/web/src/app/(app)/leagues/[id]/page.tsx"` retorna import + uso
- [ ] `grep -n "exacts" apps/web/src/components/leagues/ranking-row.tsx` retorna a prop nova
- [ ] `grep -n "unit" apps/web/src/components/leagues/podium.tsx` retorna a prop nova
- [ ] `grep -n "myExacts" "apps/web/src/app/(app)/leagues/page.tsx"` retorna o uso no card
- [ ] Nenhum arquivo fora do escopo em `git status`
- [ ] Linha do 013 atualizada em `plans/README.md`

## STOP conditions

Pare e reporte se:

- `packages/backend/convex/lib/ranking.ts` não existir (012 não aplicado).
- O import `@bolao/backend/convex/lib/ranking` falhar no build/typecheck do
  web (ex.: package `exports` bloqueando subpath) — não duplique os
  comparadores no web sem reportar.
- O excerto do bloco "Points" de `ranking-row.tsx` não bater com o código vivo.
- Implementar exigir mudança em `pill-tabs.tsx` ou em qualquer arquivo do
  backend.
- O nome do membro colidir com os dois stats a 390px sem solução com
  `truncate`/`shrink` — reporte com screenshot em vez de esconder o stat.

## Maintenance notes

- A aba **não** é persistida de propósito (exigência: pontos como visualização
  padrão na entrada). Se o dono pedir persistência um dia, use o padrão de
  `localStorage` do `tournament-context.tsx`.
- O `members/[userId]/page.tsx` mostra "exatos" no perfil do membro — se a
  nomenclatura mudar para "cravadas" no 014, considere alinhar lá também
  (deferido; anotar no PR).
- Revisor: confirme que liga POINTS não renderiza abas e que a ordem visual
  dos stats na linha é fixa (pontos sempre à esquerda) — só o destaque troca.
