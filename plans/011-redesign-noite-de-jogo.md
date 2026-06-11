# Plan 011: Redesign "Noite de Jogo" — overhaul visual completo do app

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: os planos 001–010 estão aplicados na working tree
> sobre o commit `e87755c`. Não compare com o SHA — confirme que os excertos de
> "Current state" batem com o código vivo. Mismatch grosseiro = STOP.
>
> **Leitura obrigatória antes do Step 1** (skills dentro do próprio repo):
> 1. `.agents/skills/make-interfaces-feel-better/SKILL.md` (inteira — é curta)
> 2. `.agents/skills/frontend-design/SKILL.md` (inteira)
> 3. `.agents/skills/design-taste-frontend/SKILL.md` (seções 2, 3, 4 e 5)
> 4. `.agents/skills/impeccable/SKILL.md` (seção "Shared design laws" e "Absolute bans")
> As leis dessas skills que regem ESTE plano estão destiladas abaixo em
> "Leis de design deste redesign" — em conflito, o plano manda.

## Status

- **Priority**: P1 (pedido direto do dono: "mudar praticamente tudo")
- **Effort**: L
- **Risk**: MED (visual global; zero lógica de negócio)
- **Depends on**: 001–006, 010 (DONE — o redesign veste as features entregues)
- **Category**: direction
- **Planned at**: commit `e87755c` + planos 001–010 aplicados, 2026-06-10

## Why this matters

O plano 005 ajustou tokens na margem e o dono rejeitou o resultado: *"o front-end não foi mudado"*. O pedido agora é explícito: **mudar praticamente tudo**, interface inspirada em **Rei do Pitaco, OSM e Cartola**, sem botões genéricos, indo fundo. O que esses três apps têm em comum — e o Bolão não tem: são **dark-first**, com verde saturado dominando a superfície (não um tint tímido), **amarelo vibrante como cor de ação**, tipografia condensada gigante, números de placar como elemento gráfico central, e controles gordos com resposta tátil. O Bolão tem a estrutura certa (tokens centralizados, Barlow Condensed, componentes coesos) — falta o compromisso estético. Este plano é esse compromisso.

## A direção (decidida — não reabra)

**Conceito: "Noite de Jogo"** — o app é um estádio à noite. Quem usa está no sofá ou no busão, celular na mão, jogo rolando.

1. **Dark-first de verdade.** Dark vira o tema canônico e recebe todo o esmero; light continua existindo e legível, mas é o tema secundário. (Cena física, lei da impeccable: "torcedor conferindo palpite no celular, à noite, durante o jogo" — a cena força dark.)
2. **Estratégia de cor: Committed** (lei da impeccable). O verde-gramado profundo CARREGA a superfície — não é tint de 2% de chroma, é o campo. O **amarelo (`--b-accent`) vira a cor de AÇÃO**: todo CTA primário, estado ativo de navegação e momento "palpite agora" é amarelo sobre escuro (assinatura Rei do Pitaco). O verde-claro brand vira identidade/sucesso. Azul fica restrito a informação.
3. **Placar como tipografia-herói.** Números de palpite/placar em DM Mono ou Barlow Condensed pesada, grandes, `tabular-nums`, como num placar de estádio.
4. **Textura, não enfeite.** Profundidade via gradientes radiais já existentes + um motivo de campo (linhas de gramado/círculo central em SVG decorativo de baixíssima opacidade) em superfícies-herói. Sem glassmorphism decorativo, sem gradient text.
5. **Controles táteis e gordos.** Botões primários mais altos, amarelos, com sombra dura; press scale 0.96; alvos ≥40px.

## Leis de design deste redesign (destiladas das skills — cumpra todas)

**Banimentos absolutos** (impeccable + design-taste):
- ❌ **Emoji na UI** — nunca. O switcher de competição usa `🌍` hoje: substituir por SVG (ver Fase 3).
- ❌ Gradient text (`background-clip: text`).
- ❌ Side-stripe (border-left/right colorida >1px como acento).
- ❌ Glassmorphism decorativo (blur só onde já existe com função: header sticky, bottom-nav).
- ❌ Template "hero-metric" (número grande + label + gradiente) e grids de cards idênticos.
- ❌ `h-screen` em seções full-height → `min-h-[100dvh]`.
- ❌ `transition: all` → propriedades explícitas.
- ❌ Modal como primeiro pensamento; nested cards.

**Obrigações** (make-interfaces-feel-better):
- ✅ Raio concêntrico: `raioExterno = raioInterno + padding` em TODO aninhamento de superfícies arredondadas.
- ✅ `tabular-nums` em TODO número dinâmico (placares, pontos, countdowns, rankings).
- ✅ Enter animado em blocos semânticos com stagger ~60–100ms (o repo já tem `stagger-children` + `--i`; use).
- ✅ Press `active:scale-[0.96]` (nunca menor que 0.95) em botões.
- ✅ Hit area ≥40×40px (estenda com pseudo-elemento se preciso).
- ✅ `text-wrap: balance` em headings; ease-out exponencial, nunca bounce.
- ✅ Skeletons com o formato do layout final (nunca spinner genérico).
- ✅ Estados vazios compostos e bonitos (o repo já tem o padrão — manter o nível).

**Performance** (design-taste): anime só `transform`/`opacity`; textura/grain apenas em pseudo-elemento `fixed` + `pointer-events-none`, nunca em container que rola.

## Current state

Stack: Next.js 16 App Router, React 19, Tailwind 4, tokens CSS customizados. Fontes **já configuradas** em `apps/web/src/app/layout.tsx:3-27`: Barlow (sans), Barlow Condensed (display), DM Mono — expostas como `--font-sans/--font-display/--font-mono` em `packages/ui/src/styles/globals.css:14-16`. **Não troque as fontes; explore-as mais.**

Arquivos-chave e estado:

- `packages/ui/src/styles/tokens.css` (~410 linhas) — todos os tokens `--b-*` (light `:root` ~linha 78, dark `.dark` ~linha 248). Pós-005, dark: `--b-bg: oklch(0.1 0.035 145)`, `--b-card: oklch(0.15 0.04 145)`, brand `oklch(0.72 0.22 145)`, accent `oklch(0.84 0.2 90)`. Gradientes `--g-*` e sombras `--b-shadow-*` no mesmo arquivo.
- `packages/ui/src/lib/button-variants.ts` — CVA; pós-005 a base tem `font-bold text-xs uppercase tracking-wide`, brand usa `--g-brand-vert`. Variantes: default/brand/accent/outline/secondary/ghost/success/danger/danger-solid/link; sizes até `xl` (h-12).
- `apps/web/src/components/providers.tsx:14-19` — `ThemeProvider` com `defaultTheme="dark"` **e `enableSystem`** (sistema claro sobrepõe o dark — ver Fase 1).
- `apps/web/src/app/(app)/layout.tsx` (~575 linhas) — shell: sidebar desktop, bottom-nav mobile (5 itens + perfil + admin + sair), header com `ThemeSwitch` + `CompetitionSwitcher`. O switcher renderiza emoji: `CompetitionFlag` (~linha 380) faz `<span style={{fontSize}}>{flag}</span>` com `flag: "🌍"` vindo de `apps/web/src/contexts/tournament-context.tsx:5-18`.
- `apps/web/src/components/match/scorecard.tsx` (~415 linhas) — card de palpite, o componente mais importante do produto: nomes dos times, escudo/bandeira, steppers +/− de placar, lock-countdown, venue (linha ~363).
- `apps/web/src/components/match/hero-match.tsx`, `day-header.tsx`, `group-header.tsx` (criado pelo 003), `live-clock.tsx`, `lock-countdown.tsx`.
- Páginas: `dashboard/page.tsx` (~318L), `predictions/page.tsx` (pós-003: seções por grupo + "Jogos do dia"), `leagues/page.tsx` (pós-006: wizard), `leagues/[id]/page.tsx` (+`podium.tsx`, `ranking-row.tsx`), `mata-mata/page.tsx` + `components/bracket/` (criados pelo 004), `regras/page.tsx` (pós-008), `profile/page.tsx`, landing `app/page.tsx` (pós-010, com `cup-countdown.tsx`).
- `packages/ui/src/components/` — biblioteca compartilhada (button, pill-tabs, tag, dialog, input, skeleton, empty-state, bento-tile, sparkline…).
- `packages/ui/src/styles/motion.css` — animações (`stagger-children`, `--i`, `scale-in`, easings `--ease-out-*`, durações `--motion-*`).

Comportamento a preservar (contrato funcional — o redesign não muda NADA disso): rotas, queries, mutations, textos de erro, fluxo do wizard, lógica de lock, agrupamentos por grupo/dia, contagens das abas.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0              |
| Lint+fmt  | `bun run check` (autofix, fluxo normal do repo) | exit 0 |
| Build     | `bun run build`          | exit 0              |
| Dev       | `bun run dev:web` + `bun run dev:server` | app na porta 3001 |

Sem suíte de testes no repo. O gate de cada fase é typecheck + build + a checagem visual descrita.

## Suggested executor toolkit

- As 4 skills listadas no topo (estão em `.agents/skills/` no repo). Se o harness permitir invocá-las como skills, use `make-interfaces-feel-better` na Fase 7 e `frontend-design` como musa nas Fases 3–5. A skill `ui-ux-pro-max` (mesma pasta) tem paletas e guidelines por tipo de produto — consulte se precisar de desempate, mas a direção deste plano prevalece.
- Skill `color-palette` para validar contraste WCAG das novas combinações (Fase 1).

## Scope

**In scope** (os únicos lugares que você modifica):
- `packages/ui/src/styles/` (tokens.css, globals.css, motion.css)
- `packages/ui/src/lib/button-variants.ts`
- `packages/ui/src/components/**` (visual apenas; APIs/props mantidas — exceção: prop nova opcional é ok)
- `apps/web/src/components/**` (visual/estrutura JSX de apresentação)
- `apps/web/src/app/**/page.tsx` e `apps/web/src/app/(app)/layout.tsx` (apresentação)
- `apps/web/src/components/providers.tsx` (uma linha — tema)
- `apps/web/src/contexts/tournament-context.tsx` (apenas o campo `flag`/metadados visuais)

**Out of scope** (não toque):
- `packages/backend/**` — nada de backend, queries novas ou mudança de dados.
- `apps/web/src/contexts/tournament-context.tsx` além de metadados visuais (a lógica de janela da Copa é do plano 001).
- Lógica de negócio em qualquer página (filtros, sorts, mutations, validações).
- `package.json` — **nenhuma dependência nova** (motion já existe em apps/web; fontes já configuradas).
- Renomear rotas ou mexer em auth.

## Git workflow

- Branch: `advisor/011-redesign-noite-de-jogo`
- **Um commit por fase**, em português: `style(tokens): ...`, `style(ui): ...`, `style(app-shell): ...` etc. Histórico-exemplo: `style(tokens): harmoniza paleta do light mode`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Fase 1 — Fundamentos: tema, cor comprometida, textura

1. **Dark canônico**: em `providers.tsx`, remova `enableSystem` (mantenha `defaultTheme="dark"`). Quem quiser light usa o toggle.
2. **Tokens dark "drenched"** em `tokens.css` (bloco `.dark`): aprofunde o compromisso — valores de partida (ajuste fino a olho é esperado; preserve a relação bg < surface < card e contraste AA do texto):
   - `--b-bg: oklch(0.13 0.05 150)` · `--b-surface: oklch(0.16 0.055 150)` · `--b-card: oklch(0.19 0.06 150)` — verde-campo perceptível, não cinza esverdeado.
   - `--b-accent` (amarelo) sobe para protagonista: `oklch(0.86 0.19 95)`; crie `--b-action: var(--b-accent)` e `--b-action-fg: oklch(0.17 0.08 95)` (texto escuro sobre amarelo) — tokens novos para a cor de ação, para as fases seguintes não hardcodarem amarelo.
   - Light mode: ajuste espelhado mais suave (`--b-action` = amarelo mais denso `oklch(0.75 0.16 90)` para contraste com texto escuro) — light é secundário, mas não pode quebrar.
3. **Motivo de campo**: adicione a `globals.css` uma utility `.field-texture` — pseudo-elemento com SVG inline (linhas horizontais de gramado, opacidade ≤3% no dark) para uso em superfícies-herói (dashboard hero, auth, landing hero). Respeite a regra de performance: `position: fixed` ou no elemento estático, `pointer-events-none`, nunca em container que rola.
4. **Números de placar**: garanta utility `.score-display` em `globals.css` (font display ou mono, `font-variant-numeric: tabular-nums`, peso 800) se já não existir equivalente; aplique `tabular-nums` como padrão nos componentes numéricos nas fases seguintes.

**Verify**: `bun run check-types` && `bun run build` → exit 0; app no dark mode tem fundo verde-noite inconfundível; texto AA legível (use a skill `color-palette` ou devtools para conferir contraste de `--b-text` sobre `--b-bg` ≥ 4.5:1).

### Fase 2 — Botões e controles sem slop

Em `button-variants.ts` (e só nele — o wrapper `button.tsx` fica):

1. **Nova variante `action`** (o CTA canônico do app): `bg-[var(--b-action)] text-[var(--b-action-fg)]`, altura generosa via sizes existentes, sombra dura tátil `shadow-[0_4px_0_oklch(0.55_0.14_95)]` que colapsa no press (`active:shadow-none active:translate-y-[2px]`) — botão de "apostar" de app de palpite, não botão de form.
2. `brand` continua para ações secundárias de identidade; `outline`/`ghost` ficam.
3. Base: avalie subir `text-xs` → `text-sm` nos sizes `lg`/`xl` (CTAs gordos pedem tipografia maior).
4. **Migre os CTAs primários** para `variant="action"`: confirmar palpite no `scorecard.tsx`, "Criar liga"/"Entrar" em `leagues/page.tsx`, CTAs do wizard, "Criar conta" na landing e auth. Ações destrutivas/neutras não mudam.
5. `pill-tabs.tsx` e inputs (`input.tsx`): estado ativo das tabs usa `--b-action` (pílula amarela, texto escuro); inputs com fundo `--b-inner`, borda só no focus (`focus-visible` ring na cor de ação) — labels sempre acima do input (lei design-taste; já é o padrão do repo, mantenha).

**Verify**: `bun run check-types` → exit 0; `grep -rn "variant=\"action\"" apps/web/src | wc -l` ≥ 5; visual: CTAs amarelos táteis nos dois temas, press com afundamento físico.

### Fase 3 — App shell: navegação com identidade

Em `apps/web/src/app/(app)/layout.tsx`:

1. **Bottom-nav mobile** (o app é mobile-first): reduza para 5 slots — Início, Palpites, **ação central elevada** (botão circular amarelo `--b-action`, ícone de bola/raio, leva para `/predictions`, sobressai ~12px acima da barra, sombra dura), Ligas, Mata-mata. Perfil sai da barra e vira avatar no header (link para `/profile`); Regras fica acessível pelo menu/da página de ligas e do dashboard (link contextual) — confirme que nenhuma rota fica órfã (Regras precisa continuar linkada de pelo menos um lugar visível; o sidebar desktop a mantém).
2. **Sidebar desktop**: item ativo com pílula amarela em vez do gradiente verde atual; logo ganha o motivo de campo sutil no bloco do topo.
3. **Header**: `CompetitionFlag` — **mate o emoji**: para `WC2026`, substitua `🌍` por um SVG inline (taça/globo geométrico de 2 cores usando `currentColor` + `--b-action`), no mesmo padrão do `BrazilFlag` que já existe ao lado (~linha 351). Em `tournament-context.tsx`, o campo `flag: "🌍"` pode permanecer no objeto (dado), mas nenhum componente pode renderizá-lo; remova o fallback de emoji do `CompetitionFlag`.
4. Sair/admin: agrupe num menu do avatar (use o `dropdown-menu` de `@bolao/ui`) — menos itens soltos na barra.

**Verify**: `bun run check-types` → exit 0; `grep -rn "🌍\|🇧🇷" apps/web/src --include="*.tsx" | grep -v "tournament-context"` → zero matches em renderização; mobile 390px: barra com 5 slots + ação central sem overflow; todas as rotas antigas alcançáveis.

### Fase 4 — Palpites: o placar de estádio (coração do produto)

Em `scorecard.tsx` + `group-header.tsx` + `day-header.tsx` + `predictions/page.tsx` (apresentação apenas):

1. **Scorecard**: o placar vira o herói visual — números do palpite em `.score-display` grandes (clamp ~2.2rem), steppers +/− com hit area ≥44px e press tátil; nomes dos times em Barlow Condensed; escudo/bandeira com outline de 1px translúcido (lei make-interfaces: preto puro 10% no light, branco puro 10% no dark). Estado "palpitado" ganha selo discreto na cor de ação; estado "fechado" esfria o card (dessatura, cadeado). **Não toque na lógica** (handlers, mutations, lock).
2. **Raio concêntrico em todo o card**: audite o aninhamento (card → inner → botões) e corrija os raios pela fórmula.
3. **Group headers**: "GRUPO A" como tipografia display gigante de baixa opacidade atravessando o header (marca d'água), com a contagem palpitados/total em `tabular-nums`.
4. **"Jogos do dia"**: o container destacado vira o momento *drenched* da página — fundo `--g-hero-match` (existe nos tokens) + motivo de campo, cards internos com raio concêntrico ao container.
5. Stagger de entrada já existe (`stagger-children`) — confira que cada seção de grupo entra em blocos com delay, não a página inteira de uma vez.

**Verify**: `bun run check-types` && `bun run build` → exit 0; visual mobile + desktop nos dois temas; palpitar um jogo continua funcionando de ponta a ponta (criar/editar palpite num jogo aberto do dev).

### Fase 5 — Dashboard e mata-mata

1. **Dashboard** (`dashboard/page.tsx`, `hero-match.tsx`, `stat-tile.tsx`): hero match em modo "transmissão" — fundo `--g-hero-match` + textura, times grandes, countdown em mono `tabular-nums`. Stats pessoais: **proibido** o template hero-metric (número + label + gradiente em cards iguais); use uma faixa horizontal única com divisores (`divide-x`), números em display, sem caixas individuais (lei design-taste: dados respiram sem moldura).
2. **Mata-mata** (`mata-mata/page.tsx`, `components/bracket/`): colunas com cabeçalho display condensado; conectores visuais simples entre fases se couber barato (bordas/pseudo-elementos, não SVG complexo); confronto com bandeira + TLA em mono; "A definir" como slot fantasma (borda dashed, opacidade baixa). Slots de time com outline de imagem padrão.
3. **Ligas e perfil**: aplique o sistema (cor de ação nos CTAs, tabular-nums nos pontos, pódio com ouro/prata/bronze já tokenizados) — coerência, sem redesenho estrutural dessas páginas.

**Verify**: `bun run check-types` && `bun run build` → exit 0; dashboard sem grid de stat-cards idênticos (`grep -n "stat-tile" apps/web/src/app/\(app\)/dashboard/page.tsx` — se sobreviver, é porque virou faixa, não grid de cards).

### Fase 6 — Landing e auth no mesmo mundo

1. Landing (`app/page.tsx`): herda tokens novos automaticamente; ajuste o que destoar — hero com motivo de campo, CTAs `action`, countdown em mono `tabular-nums`. Não reescreva a estrutura (o plano 010 acabou de mexer); é uma passada de coerência.
2. Auth (`(auth)/layout.tsx`, sign-in/sign-up): painel com `--b-auth-panel-bg` + textura; CTAs `action`; inputs da Fase 2.

**Verify**: `bun run build` → exit 0; fluxo completo landing → sign-in → dashboard sem quebra visual nos dois temas.

### Fase 7 — Passada final de craft (checklist make-interfaces-feel-better)

Percorra o checklist da skill (`.agents/skills/make-interfaces-feel-better/SKILL.md`, seção "Review Checklist") sobre TODAS as superfícies tocadas e produza a tabela Before/After no formato da skill como parte do seu relatório final. Itens críticos: raios concêntricos, tabular-nums, hit areas, `transition` específica (zero `transition: all` — `grep -rn "transition: all\|transition-all" apps/web/src packages/ui/src` → zero), exits sutis, `text-wrap: balance` nos h1/h2.

Depois, o **teste do slop** (impeccable): abra cada página e pergunte "alguém diria que foi IA?". Se alguma seção parecer template (cards idênticos, hero-metric, espaçamento monótono), reestruture essa seção antes de fechar.

**Verify**: `bun run check` → exit 0; `bun run build` → exit 0; tabela Before/After no relatório.

## Test plan

Sem runner de testes. Roteiro de regressão manual (TODOS os itens, nos dois temas, mobile 390px + desktop):

1. Login → dashboard → palpitar um jogo aberto (criar e editar) → ver o palpite refletido.
2. Trocar de competição (Copa ↔ Brasileirão) pelo switcher.
3. Criar uma liga pelo wizard (3 passos) e abrir o ranking.
4. Navegar: dashboard, palpites (3 abas), ligas, liga aberta, mata-mata, regras, perfil, admin (se admin).
5. Landing deslogado + sign-in + sign-up renderizam e os CTAs funcionam.
6. Toggle de tema: nada ilegível em light.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `bun run check` exits 0
- [ ] `grep -rn "enableSystem" apps/web/src/components/providers.tsx` → zero matches
- [ ] `grep -rn "b-action" packages/ui/src/styles/tokens.css` → ≥ 2 matches (light + dark)
- [ ] `grep -rn "variant=\"action\"" apps/web/src` → ≥ 5 matches
- [ ] `grep -rn "🌍" apps/web/src --include="*.tsx" | grep -v tournament-context` → zero matches
- [ ] `grep -rn "transition-all" apps/web/src packages/ui/src --include="*.tsx" --include="*.ts"` → zero matches
- [ ] `grep -rn "h-screen" apps/web/src --include="*.tsx"` → zero matches (use min-h-[100dvh]/min-h-screen onde fizer sentido)
- [ ] Roteiro de regressão manual (6 itens) executado e reportado
- [ ] Tabela Before/After (formato make-interfaces-feel-better) no relatório final
- [ ] Nenhum arquivo fora do escopo em `git status`
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Qualquer mudança exigir tocar `packages/backend/**`, adicionar dependência ou alterar lógica de página (handler, query, validação) — o redesign é 100% apresentação.
- O item 1 do roteiro de regressão (palpitar) quebrar e uma tentativa de correção não resolver.
- O contraste AA for impossível com o amarelo escolhido em algum componente — reporte a combinação em vez de escurecer o amarelo globalmente por conta própria.
- A reorganização do bottom-nav (Fase 3) deixar alguma rota inalcançável sem mudança estrutural maior.
- Você se pegar reescrevendo a ESTRUTURA de leagues/regras/landing além de cor/tipo/espaçamento (Fases 5.3 e 6 são passadas de coerência, não redesenhos).

## Maintenance notes

- `--b-action`/`--b-action-fg` viram o contrato da cor de ação: features novas devem usá-los, nunca `--b-accent` direto em CTA.
- O tema light ficou deliberadamente secundário; se a base de usuários reclamar, uma passada dedicada de light mode é o follow-up (registre no índice).
- Revisor: os riscos reais são contraste (amarelo sobre verde-escuro em texto pequeno) e regressão funcional invisível no scorecard (handlers desconectados durante a reescrita do JSX). Escrutine o diff do `scorecard.tsx` com atenção dobrada.
- Pós-Copa: a direção "Noite de Jogo" segue valendo para o Brasileirão; nada aqui é sazonal.
