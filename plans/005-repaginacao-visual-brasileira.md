# Plan 005: Repaginação visual — fundos mais vivos e brasileiros, botões com identidade

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e87755c..HEAD -- packages/ui/src/styles packages/ui/src/lib/button-variants.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (mudança visual global, julgamento estético envolvido)
- **Depends on**: none (mas recomenda-se aterrissar após 001–003 para revisar o visual já no modo Copa)
- **Category**: direction
- **Planned at**: commit `e87755c`, 2026-06-10

## Why this matters

O dono do produto quer o app com cara de **futebol brasileiro** — referências: **OSM (Online Soccer Manager), Cartola FC e Rei do Pitaco**. O diagnóstico dele: fundos pálidos demais e botões com cara genérica de template ("botões slop"). O design system já é centralizado em tokens CSS (`--b-*`), então dá para mudar o clima do app inteiro mexindo em poucos arquivos, sem tocar em lógica. O objetivo: fundos com mais cor (verde-gramado com acentos amarelo/azul da bandeira), botões com mais identidade, mantendo legibilidade e o sistema de tokens existente.

**Princípio para o executor**: este plano é o oposto de "reescrever o front-end". Mude **valores de tokens** e a **receita dos botões**; não troque estrutura de componentes nem classes nas páginas. Mudanças cirúrgicas, alto impacto.

## Current state

- `packages/ui/src/styles/tokens.css` — TODOS os tokens semânticos `--b-*` (light `:root` e dark `.dark`). É importado por `globals.css`, que o app web importa via `apps/web/src/index.css` (linha única: `@import "@bolao/ui/globals.css";`).
- `packages/ui/src/styles/globals.css` — base styles; `packages/ui/src/styles/motion.css` — animações.
- `packages/ui/src/lib/button-variants.ts` — receita CVA de todos os botões (excerto abaixo).
- `packages/ui/src/components/button.tsx` — wrapper com shine-sweep no hover para `brand`/`default`; **não precisa mudar**.

Tokens-chave hoje (light, `tokens.css:78-140`, valores abreviados):

```css
--b-bg: oklch(0.975 0.006 145);        /* fundo geral: quase branco, levíssimo verde */
--b-surface: oklch(0.945 0.008 145);
--b-card: oklch(0.992 0.003 145);
--b-brand: oklch(0.46 0.18 145);        /* verde */
--b-accent: oklch(0.78 0.16 85);        /* amarelo */
--b-info: oklch(0.58 0.18 230);         /* azul (status) */
```

Dark (`tokens.css:244-251`):

```css
--b-bg: oklch(0.085 0.025 145);
--b-surface: oklch(0.105 0.028 145);
--b-card: oklch(0.135 0.03 145);
```

Botões hoje (`button-variants.ts:20-37`): variantes `default/brand/accent/outline/secondary/ghost/success/danger/danger-solid/link`, base com `rounded-xl`, `font-semibold text-xs`, hover `scale-[1.02]`, active `scale-[0.96]`, shine sweep. O visual atual é competente mas "flat shadcn": cantos médios, texto pequeno, pouca personalidade esportiva.

Já existem no repo (use, não recrie): gradientes `--g-brand-diag`, `--g-hero-match`, `--b-hero-bg`, sombra dura `--b-shadow-card-hard: 4px 4px 0 var(--b-brand)` (estilo "editorial sportivo" V2, `tokens.css:201-241`).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0              |
| Lint      | `bunx biome check packages/ui` | exit 0         |
| Build     | `bun run build`          | exit 0              |
| Dev       | `bun run dev:web` + `bun run dev:server` | app na porta 3001 |

## Suggested executor toolkit

- **Use a skill `make-interfaces-feel-better` se disponível** — este plano é exatamente o caso de uso dela (polimento visual, hierarquia, microinterações).

## Scope

**In scope** (the only files you should modify):
- `packages/ui/src/styles/tokens.css`
- `packages/ui/src/lib/button-variants.ts`

**Out of scope** (do NOT touch, even though they look related):
- Qualquer `page.tsx` ou componente em `apps/web/src/**` — as páginas consomem tokens; mudar tokens já as repagina. (Exceção zero. Se uma página "precisar" de ajuste, anote no relatório final.)
- `packages/ui/src/components/button.tsx` — o wrapper (shine, loading) fica como está.
- `packages/ui/src/styles/motion.css` — animações fora do escopo.
- Os tokens shadcn base (`--background`, `--primary`, …, `tokens.css:7-75`) — componentes de terceiros dependem deles; mexa apenas nos semânticos `--b-*` e nos gradientes `--g-*`.

## Git workflow

- Branch: `advisor/005-repaginacao-visual`
- Commits em português; o repo usa `style(tokens): ...` / `style: ...` para isso (exemplos no log: `style(tokens): harmoniza paleta do light mode`, `style: aplica degradê claro nos cards principais`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fundos mais vivos (light mode)

Em `tokens.css`, bloco light `:root` (linhas 78-86): suba levemente o chroma e ajuste o tom dos surfaces para um verde-gramado perceptível (hoje é quase imperceptível: chroma 0.006). Valores de partida (ajuste fino a olho é esperado, mantenha a relação bg < surface < card em lightness):

```css
--b-bg: oklch(0.965 0.018 140);       /* verde claro perceptível */
--b-surface: oklch(0.93 0.025 140);
--b-card: oklch(0.99 0.006 140);
```

E enriqueça `--b-hero-bg` (linhas 169-186) reforçando o radial amarelo existente (terceiro gradiente, hue 90): suba a opacidade de `0.08` para ~`0.14` e adicione um quarto radial azul sutil (hue 250, opacidade ~0.06) num canto, ecoando a bandeira.

**Verify**: `bun run dev:web` — dashboard e palpites no light mode têm fundo visivelmente esverdeado, texto continua legível (contraste AA no olho: texto `--b-text` sobre `--b-bg`).

### Step 2: Fundos mais vivos (dark mode)

Bloco `.dark` (linhas 244-251): mesmo movimento, mais sutil (dark já tem chroma 0.025):

```css
--b-bg: oklch(0.10 0.035 145);
--b-surface: oklch(0.12 0.04 145);
--b-card: oklch(0.15 0.04 145);
```

**Verify**: alternar o tema no app (botão no header) — dark mode com verde mais presente, cards ainda destacados do fundo.

### Step 3: Botões com identidade esportiva

Em `button-variants.ts`, na base da CVA e nas variantes (não mexa nas `size` exceto onde indicado):

1. Tipografia mais forte: na base, troque `font-semibold text-xs` por `font-bold text-xs uppercase tracking-wide` — combina com o `font-display` uppercase que as páginas já usam em títulos.
2. Variante `brand` (a principal): troque o fundo chapado por gradiente + sombra existentes do design system:

```ts
brand:
	"bg-[image:var(--g-brand-vert)] text-[var(--b-brand-fg)] shadow-[var(--b-shadow-brand-sm)] hover:shadow-[var(--b-shadow-brand-md)] hover:brightness-105",
```

3. Variante `accent` (amarelo): adicione `shadow-[0_2px_8px_oklch(0.78_0.16_85_/_0.35)]` para o amarelo "Cartola" ganhar presença.
4. Variante `outline`: deixe-a menos "form de template" — borda 1px `border-[var(--b-brand-25)]`, texto `text-[var(--b-brand)]`, hover `bg-[var(--b-brand-5)]`.
5. Não altere `ghost`, `link`, `danger*`, `success`, `secondary` — eles são utilitários e estão bem.

**Verify**: `bun run check-types` → exit 0; visualmente, os CTAs ("Criar liga" em /leagues, botões de auth) ficam mais fortes sem quebrar nenhum layout (cheque /leagues, /predictions, /sign-in, dialog de criar liga).

### Step 4: Passada de revisão visual completa

Navegue por todas as rotas nos dois temas: `/` (landing), `/sign-in`, `/dashboard`, `/predictions`, `/leagues` (+ dialog de criar liga), `/regras`, `/profile`. Procure por: texto ilegível sobre os novos fundos, botões estourando layout por causa do `uppercase tracking-wide` (textos longos), contrastes quebrados.

Se um texto de botão estourar: reduza o `tracking-wide` para `tracking-normal` na base (uma mudança, global) em vez de mexer página a página.

**Verify**: `bun run build` → exit 0; `bunx biome check packages/ui` → exit 0; nenhuma quebra visual nas rotas listadas.

## Test plan

Sem runner de testes; a verificação é a passada visual do Step 4 nos dois temas + build. Critério estético de aceitação: colocando o app lado a lado com o estado anterior (`git stash` permite comparar), o fundo deve ser perceptivelmente mais verde/vivo e os CTAs mais marcantes — sem nenhuma página quebrada.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `bunx biome check packages/ui` exits 0
- [ ] `git diff --name-only` mostra **somente** `packages/ui/src/styles/tokens.css` e `packages/ui/src/lib/button-variants.ts`
- [ ] `grep -n "uppercase" packages/ui/src/lib/button-variants.ts` retorna ≥ 1 match
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Os excertos de "Current state" não baterem com o código (drift).
- Você sentir necessidade de editar qualquer arquivo de `apps/web/src/**` para o visual "funcionar" — é o sinal de que a mudança de token foi longe demais; recue o token e reporte.
- O contraste de texto ficar claramente insuficiente em alguma combinação e não houver valor de token que resolva sem refazer a escala toda.
- `bun run build` falhar por erro de CSS/Tailwind após as mudanças.

## Maintenance notes

- Tokens são o contrato visual do app: os planos 003/004/006 criam UI nova por cima deles e herdam esta repaginação automaticamente — por isso este plano não toca páginas.
- Revisor: avalie em **ambos os temas** e no mobile; o risco real é contraste, não código.
- Follow-up deferido: repaginar a landing (`apps/web/src/app/page.tsx`, 729 linhas) — página grande, melhor como esforço separado depois que os tokens assentarem.
