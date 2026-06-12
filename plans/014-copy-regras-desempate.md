# Plan 014: Copy — regras, landing e wizard explicam o desempate por cravadas e o ranking duplo

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b04a4c0..HEAD -- "apps/web/src/app/(app)/regras" apps/web/src/app/page.tsx "apps/web/src/app/(app)/leagues/page.tsx" "apps/web/src/app/(app)/leagues/[id]/manage/page.tsx"`
> Os planos 012–013 devem estar aplicados na working tree. Compare os excertos
> de "Current state" com o código vivo; mismatch grosseiro = STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (só texto/JSX estático)
- **Depends on**: plans/013-painel-ranking-duplo.md (a copy descreve a UI entregue)
- **Category**: docs
- **Planned at**: commit `b04a4c0`, 2026-06-12

## Why this matters

Pedido do dono: *"Deixa isso tudo claro na aba regras, deixa isso tudo claro
na explicação do site."* As regras novas que precisam estar escritas onde o
usuário lê:

1. **Ranking padrão (todas as ligas)**: ordena por pontos; **empate em pontos
   é decidido por cravadas** (placares exatos); persiste o empate, decide
   quem tem mais resultados certos. Exibido como `PONTOS | CRAVADAS`.
2. **Liga "mais cravadas"**: painel com duas visões — *Ranking de pontos*
   (visualização padrão na entrada) e *Ranking de cravadas* (conta **só**
   placares exatos, 10 pts na pontuação padrão; pontos desempatam).

Regra não escrita gera briga de bolão — o objetivo do dono é justamente
desempate "mais justo" e transparente em ligas grandes.

## Current state

- `apps/web/src/app/(app)/regras/page.tsx` (455 linhas) — página de regras com
  TOC sticky:

```ts
// regras/page.tsx:15-23
const TOC = [
    { id: "pontuacao", label: "Sistema de pontuação" },
    { id: "seu-jeito", label: "Jogue do seu jeito" },
    { id: "copa", label: "Formato da Copa" },
    { id: "exemplos-certo", label: "Acertou o resultado" },
    { id: "exemplos-errado", label: "Errou o resultado" },
    { id: "prazo", label: "Prazo pra palpitar" },
    { id: "ligas", label: "Ligas privadas" },
];
```

  - Seção `seu-jeito` (linhas 109–150): cards "O jeito do site" (… "ranking
    por soma de pontos") e "O seu jeito" ("o líder decide se o ranking
    privilegia quem soma mais pontos ou quem crava mais placares exatos").
  - Seção `ligas` (linhas 333–358): parágrafo "O ranking soma todos os pontos
    conquistados…" — sem menção a desempate.
  - Padrão visual das seções: `<section id className="scroll-mt-24 space-y-5">`
    + header com eyebrow + `h2` display uppercase; caixas
    `rounded-2xl border border-[var(--b-border-sm)] bg-[var(--b-card)] p-5`.
- `apps/web/src/app/page.tsx` (landing pública):
  - Hero, parágrafo linha ~211: "…dispute ligas privadas com ranking por
    pontos ou cravadas. E o Brasileirão segue valendo no mesmo app."
  - Feature card "Ligas privadas" (linhas ~29–36): "Monte grupos com amigos,
    família ou trabalho; o líder escolhe ranking por pontos ou por cravadas."
- `apps/web/src/app/(app)/leagues/page.tsx`, wizard passo 3 (linhas 188–201):
  OptionCard "Mais pontos" → "Ranking pela soma de pontos de todos os
  palpites" (não menciona desempate); "Mais cravadas" → "Ranking por placares
  exatos; pontos desempatam" (ok, mas não menciona o painel duplo).
- `apps/web/src/app/(app)/leagues/[id]/manage/page.tsx` (linhas ~210–215):
  mesmos OptionCards do wizard (espelhar mudanças).
- Tom da copy do produto: pt-BR informal-direto ("Crava aí", "a galera",
  "sem planilha manual"), frases curtas, `<strong className="text-[var(--b-text)]">`
  para destacar termos.

## Commands you will need

| Purpose | Command (da raiz `bolao/`) | Expected on success |
|---------|----------------------------|---------------------|
| Typecheck | `bun run check-types` | exit 0 |
| Lint/format | `bun run check` | exit 0 |
| Dev (só web) | `bun run dev:web` | porta 3001 |

> ⚠️ **NUNCA rode `bun run dev:server` ou `bunx convex deploy`** (deployment
> local = produção; deploy é do plano 016).

## Scope

**In scope**:
- `apps/web/src/app/(app)/regras/page.tsx`
- `apps/web/src/app/page.tsx` (só os trechos de copy citados)
- `apps/web/src/app/(app)/leagues/page.tsx` (só descriptions dos OptionCards)
- `apps/web/src/app/(app)/leagues/[id]/manage/page.tsx` (só descriptions dos OptionCards)

**Out of scope**:
- Qualquer lógica/componente — 012/013 fecharam isso.
- `SPEC.md` e `README.md` — documentação técnica é o plano 016.
- Estrutura visual da landing (seções, animações) — só texto.

## Git workflow

- Direto na `master`; **não commite nem pushe** (plano 016 consolida).

## Steps

### Step 1: Nova seção "Rankings e desempate" nas regras

Em `regras/page.tsx`:

1. No `TOC`, insira após `seu-jeito`:
   `{ id: "rankings", label: "Rankings e desempate" },`
2. Crie a seção `id="rankings"` logo após a seção `seu-jeito`, seguindo o
   padrão visual descrito em "Current state". Conteúdo (adapte ao tom do site,
   mantendo os fatos exatos):
   - **Ranking de pontos (o padrão)**: classifica pela soma de pontos. Empatou
     em pontos? **Quem tem mais cravadas (placares exatos) fica na frente.**
     Persistiu o empate, decide quem acertou mais resultados. Na tabela, cada
     jogador aparece como `pontos | cravadas`.
   - **Liga "mais cravadas"**: além do ranking de pontos (que é a visão padrão
     ao abrir a liga), a liga ganha o **Ranking de cravadas** — só os placares
     exatos contam (10 pts na pontuação padrão); em empate de cravadas, os
     pontos desempatam. Alterne entre as duas visões no topo da tabela.
   - Sugestão de estrutura: dois cards lado a lado (`grid sm:grid-cols-2`),
     espelhando o padrão da seção `seu-jeito`.
3. Na seção `ligas` (linhas 333–358), complemente o parágrafo do ranking com
   uma frase sobre o desempate por cravadas, linkando a âncora `#rankings`
   ("veja como funciona o desempate").
4. No card "O jeito do site" da seção `seu-jeito` (linha ~129–131), atualize
   "…e ranking por soma de pontos" para mencionar o desempate por cravadas.

**Verify**: `bun run check-types` → exit 0.

### Step 2: Landing — explicação do site

Em `apps/web/src/app/page.tsx`:

1. Feature card "Ligas privadas": description passa a mencionar o desempate,
   ex.: "…o líder escolhe ranking por pontos ou por cravadas — e cravada é
   critério de desempate." (≤ ~140 caracteres para não quebrar o layout do
   card; confira visualmente).
2. Parágrafo do hero (~linha 211): acrescente a ideia de desempate justo,
   ex.: "…ligas privadas com ranking por pontos ou cravadas — cravada
   desempata." Mantenha o parágrafo com no máximo 3 linhas no desktop.

**Verify**: `bun run check-types` → exit 0.

### Step 3: Wizard e gerenciamento — descriptions dos OptionCards

Nos dois arquivos (`leagues/page.tsx` passo 3 e `manage/page.tsx`), atualize:

- "Mais pontos": `"Ranking pela soma de pontos; cravadas desempatam"`
- "Mais cravadas": `"Dois rankings: pontos e cravadas (só placares exatos; pontos desempatam)"`

Use exatamente o mesmo texto nos dois arquivos (hoje já são espelhados).

**Verify**: `grep -rn "cravadas desempatam" apps/web/src/app` → ≥2 ocorrências
(wizard + manage); `bun run check-types` → exit 0.

### Step 4: Conferência visual

`bun run dev:web` →
- `http://localhost:3001/regras` (rota autenticada; sem sessão, reporte e
  deixe para o 015): TOC com "Rankings e desempate", âncora navega, seção
  renderiza nos dois temas.
- `http://localhost:3001/` (pública, sem login): hero e card de features com a
  copy nova, sem quebra de layout a 390px e 1280px.

**Verify**: checklist acima sem erro de console/hydration.

### Step 5: Lint/format

**Verify**: `bun run check` → exit 0; `git status` sem arquivos fora do escopo.

## Test plan

- Copy estática — sem testes automatizados. A validação é o Step 4 aqui e o
  roteiro de usuário do plano 015 (que confere se a copy bate com o
  comportamento real).

## Done criteria

TODOS devem valer:

- [ ] `bun run check-types` exit 0 e `bun run check` exit 0
- [ ] `grep -n "rankings" "apps/web/src/app/(app)/regras/page.tsx"` mostra o item do TOC e o `id` da seção
- [ ] `grep -in "desempat" "apps/web/src/app/(app)/regras/page.tsx"` retorna ≥2 ocorrências
- [ ] `grep -in "desempat" apps/web/src/app/page.tsx` retorna ≥1 ocorrência
- [ ] `grep -rn "cravadas desempatam" apps/web/src/app` retorna wizard E manage
- [ ] Nenhum arquivo fora do escopo em `git status`
- [ ] Linha do 014 atualizada em `plans/README.md`

## STOP conditions

Pare e reporte se:

- A UI descrita (abas, `pontos | cravadas` na linha) não existir na working
  tree — significa que o 013 não foi aplicado; a copy mentiria.
- O TOC/seções de `regras/page.tsx` não baterem com o excerto (drift).
- A copy nova estourar o layout dos cards da landing e não couber sem mudar
  estrutura — reporte com a sugestão de texto mais curto em vez de mexer no
  layout.

## Maintenance notes

- Se a pontuação padrão mudar (hoje placar exato = 10 pts via
  `SCORING_RULES`/`points-palette.ts`), a frase "10 pts na pontuação padrão"
  da seção `rankings` precisa acompanhar.
- Ligas com pontuação personalizada (plano 007): a cravada continua sendo
  "placar exato" independentemente do peso — a copy fala em "placar exato",
  não em "10 pontos", exceto na referência explícita à pontuação padrão.
  Revisor: confira essa nuance.
- Deferido: padronizar "exatos" → "cravadas" no perfil
  (`profile/page.tsx:211`) e no dashboard (`dashboard/page.tsx:137`) — fora de
  escopo aqui; candidato a follow-up de consistência.
