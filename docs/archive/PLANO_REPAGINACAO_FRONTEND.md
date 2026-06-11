# Plano de Repaginação do Front-end — Bolão 2026

> Objetivo: dar uma cara nova e coesa pro produto inteiro — landing, autenticação, dashboard, palpites, ligas, perfil e admin — preservando a identidade verde (hue 145) + amarelo accent (hue 90), mas evoluindo paleta, tokens, tipografia, motion e micro-interações.

---

## 1. Princípios da repaginação

1. **Identidade preservada, refinada.** O verde continua verde, o amarelo continua amarelo. O que muda é a **profundidade** da paleta: mais variações claras (tints) e escuras (shades) pra dar hierarquia visual sem trocar o DNA.
2. **Bicromia editorial.** Verde + amarelo + neutros quentes (off-whites e charcoal verdoso). Nada de cinza puro/azulado: tudo puxa levemente pro hue 145 pra dar coesão.
3. **Cards com peso.** Sombras mais marcadas (multi-layer), bordas mais sutis, raios de canto generosos (28–40px nos cards principais).
4. **Tipografia mais expressiva.** Barlow Condensed Black em headlines com tracking apertado, Barlow regular pro corpo, DM Mono em números/placares.
5. **Motion intencional.** Toda animação tem propósito: feedback (botão), continuidade (page transition), revelação (entrada de seção), estado (skeleton/loading). Easings padronizados.
6. **Acessibilidade não-negociável.** Contraste AA+, foco visível em **todos** os interativos, suporte a `prefers-reduced-motion`, hit areas mínimas de 44px.
7. **Mobile-first revisado.** Navegação inferior repaginada, gestures, safe-area iOS, animações otimizadas.

---

## 2. Sistema de cores (light + dark)

### 2.1 Núcleo da marca

| Token            | Light                       | Dark                        | Uso                                          |
| ---------------- | --------------------------- | --------------------------- | -------------------------------------------- |
| `--b-brand`      | `oklch(0.46 0.22 145)`      | `oklch(0.72 0.22 145)`      | Verde principal (CTA, links, foco)           |
| `--b-brand-hi`   | `oklch(0.52 0.24 145)`      | `oklch(0.82 0.20 145)`      | Hover / hi-light do verde                    |
| `--b-brand-lo`   | `oklch(0.36 0.20 145)` ⭐   | `oklch(0.62 0.22 145)` ⭐   | Pressed / sombra de gradiente (NOVO)         |
| `--b-brand-50`   | `oklch(0.96 0.04 145)` ⭐   | `oklch(0.18 0.06 145)` ⭐   | Tint mais claro pra superfícies suaves (NOVO)|
| `--b-brand-100`  | `oklch(0.92 0.06 145)` ⭐   | `oklch(0.22 0.08 145)` ⭐   | Tint suave (NOVO)                            |
| `--b-brand-200`  | `oklch(0.86 0.10 145)` ⭐   | `oklch(0.28 0.12 145)` ⭐   | Tint médio (NOVO)                            |
| `--b-brand-fg`   | `oklch(0.99 0 0)`           | `oklch(0.07 0.025 145)`     | Texto sobre brand                            |

> ⭐ Tokens novos. Os existentes `--b-brand-5/10/12/15/25/40` (alphas via `color-mix`) ficam preservados pra retrocompatibilidade.

### 2.2 Accent (amarelo)

| Token             | Light                        | Dark                         |
| ----------------- | ---------------------------- | ---------------------------- |
| `--b-accent`      | `oklch(0.78 0.18 90)`        | `oklch(0.84 0.20 90)`        |
| `--b-accent-hi`   | `oklch(0.84 0.20 90)` ⭐     | `oklch(0.90 0.20 90)` ⭐     |
| `--b-accent-50`   | `oklch(0.97 0.05 90)` ⭐     | `oklch(0.20 0.08 90)` ⭐     |
| `--b-accent-fg`   | `oklch(0.18 0.10 90)`        | `oklch(0.10 0.06 90)`        |

### 2.3 Status (NOVO)

| Token              | Light                       | Dark                        | Uso                              |
| ------------------ | --------------------------- | --------------------------- | -------------------------------- |
| `--b-success`      | `oklch(0.58 0.18 150)`      | `oklch(0.74 0.20 150)`      | Palpite cravado, salvo           |
| `--b-warning`      | `oklch(0.74 0.16 70)`       | `oklch(0.82 0.18 70)`       | Lock chegando, pendente          |
| `--b-danger`       | `oklch(0.58 0.22 27)`       | `oklch(0.70 0.22 22)`       | Erro, bloqueado, destrutivo      |
| `--b-info`         | `oklch(0.58 0.18 230)`      | `oklch(0.72 0.18 230)`      | Avisos neutros                   |

### 2.4 Superfícies (refinamento)

**Light mode** vai ficar um pouco mais quente/papel:
```
--b-bg:        oklch(0.975 0.006 145)   /* off-white com leve tint verde */
--b-surface:   oklch(0.945 0.008 145)
--b-card:      oklch(1 0 0)
--b-card-hi:   oklch(0.99 0.004 145)   ⭐
--b-inner:     oklch(0.955 0.006 145)
--b-input-bg:  oklch(0.985 0.004 145)
```

**Dark mode** vai pra um charcoal verdoso mais profundo, menos azulado:
```
--b-bg:        oklch(0.085 0.025 145)
--b-surface:   oklch(0.105 0.028 145)
--b-card:      oklch(0.135 0.030 145)
--b-card-hi:   oklch(0.155 0.032 145)  ⭐
--b-inner:     oklch(0.115 0.026 145)
--b-input-bg:  oklch(0.16  0.030 145)
```

### 2.5 Sombras com cor

Sombras coloridas (puxando pro brand) em vez de pretos puros — melhora coesão:
```
--b-shadow-brand-sm: 0 2px 6px oklch(0.30 0.12 145 / 0.10)
--b-shadow-brand-md: 0 8px 24px oklch(0.30 0.12 145 / 0.14)
--b-shadow-brand-lg: 0 24px 60px oklch(0.30 0.12 145 / 0.18)
--b-shadow-brand-xl: 0 40px 96px oklch(0.30 0.12 145 / 0.22)
```

E sombras "elevadas" pra dark com glow sutil:
```
--b-glow-brand: 0 0 0 1px oklch(0.7 0.22 145 / 0.18), 0 12px 36px oklch(0.6 0.22 145 / 0.18)
```

### 2.6 Gradientes prontos

```
--g-brand-vert:   linear-gradient(180deg, var(--b-brand-hi), var(--b-brand))
--g-brand-diag:   linear-gradient(135deg, var(--b-brand) 0%, oklch(0.72 0.22 155) 100%)
--g-brand-soft:   linear-gradient(135deg, var(--b-brand-100), var(--b-brand-50))
--g-mesh-hero:    /* multi-radial pra fundos, refatorado a partir do --b-hero-bg atual */
--g-card-shine:   linear-gradient(180deg, oklch(1 0 0 / 0.8), oklch(1 0 0 / 0)) /* highlight no topo */
```

---

## 3. Tipografia

Mantém o trio **Barlow / Barlow Condensed / DM Mono**, mas com regras de uso mais claras:

| Estilo              | Fonte             | Peso     | Tracking  | Uso                                 |
| ------------------- | ----------------- | -------- | --------- | ----------------------------------- |
| `display-hero`      | Barlow Condensed  | 900      | -0.02em   | H1 landing, headlines de página     |
| `display-xl/lg/md`  | Barlow Condensed  | 800–900  | -0.01em   | Títulos de seção, números grandes   |
| `display-sm`        | Barlow Condensed  | 700      | normal    | Subtítulos                          |
| `eyebrow`           | Barlow            | 600      | 0.22em    | Tags caps, labels uppercase         |
| `body-lg/md/sm`     | Barlow            | 400–500  | normal    | Corpo de texto                      |
| `numeric`           | DM Mono           | 500      | 0         | Placares, pontuações, posições      |
| `code`              | DM Mono           | 400      | 0         | Códigos de liga, IDs                |

Classes utilitárias novas em `globals.css`:
```css
.text-display-hero { font-family: var(--font-display); font-weight: 900; line-height: 0.9; letter-spacing: -0.02em; text-transform: uppercase; }
.text-display-xl   { ... }
.text-eyebrow      { font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; font-size: 0.75rem; }
.text-numeric      { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
```

Hoje há muito `style={{...}}` inline com `font-display` repetido — vamos consolidar nessas utilities.

---

## 4. Sistema de motion (animações)

### 4.1 Tokens de motion (NOVOS)

```css
/* Durations */
--motion-fast:   120ms   /* hover, tap feedback */
--motion-base:   220ms   /* transitions de cor, fade */
--motion-medium: 360ms   /* entrada de elemento */
--motion-slow:   560ms   /* hero, page transition */
--motion-xslow:  900ms   /* stagger lento */

/* Easings */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)
--ease-out-back:  cubic-bezier(0.34, 1.56, 0.64, 1)   /* bounce sutil */
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1)
--ease-in-out:    cubic-bezier(0.65, 0, 0.35, 1)
--ease-spring:    linear(0, 0.5, 0.9, 1.05, 0.99, 1)  /* CSS linear() — Tailwind v4 + browsers modernos */
```

### 4.2 Biblioteca a adicionar

Adicionar **`motion`** (sucessor do framer-motion, ~30kb gz) — só onde precisa de orquestração JS (page transitions, stagger, layout). Pra tudo que dá pra fazer em CSS, usar CSS puro (mais leve).

```bash
bun add motion
```

> Já temos `tw-animate-css` no projeto — usaremos as suas keyframes prontas (fade-in, slide, etc.) pra os casos triviais.

### 4.3 Catálogo de animações

#### Botões
- **Idle → Hover:** scale 1 → 1.02, shadow `sm` → `md`, brightness +4%, em `--motion-fast` com `--ease-out-quart`.
- **Press (active):** scale → 0.96 (já existe), reduzir shadow.
- **Loading:** spinner inline aparece com `fade + scale 0.8 → 1`, label faz crossfade.
- **Success (após salvar):** flash verde por 400ms (background pulse), ícone check anima `scale 0 → 1` com `--ease-out-back`.
- **Disabled:** opacity 0.5, sem hover.
- **Variant primary** ganha um efeito **shine** sutil (gradient sweep no hover) — feito com pseudo-element.

#### Inputs
- **Focus:** label sobe e diminui (floating label) com `--motion-base`, ring expande de 0 → 2px com `--ease-out-quart`.
- **Erro:** shake horizontal de 4px (3 ciclos, `--motion-base`), borda vermelha fade-in.
- **Sucesso (validação OK):** check verde aparece à direita com fade+scale.

#### Login / Sign-up
- **Mount da página:** painel direito (form) entra com `slide-up 16px + fade` em `--motion-medium`. Painel esquerdo (branding) faz `fade + scale 0.98 → 1`.
- **Stagger nos campos:** email, senha, botão entram em sequência com 80ms de delay entre cada.
- **Submit success:** form faz `scale 0.97 → 1.02 → 1` (pulse) e fade-out, transição pra dashboard com 200ms de blur+fade.
- **Submit error:** toast Sonner já existe; somar shake no form e flash vermelho na borda dos inputs problemáticos.
- **Switch sign-in ↔ sign-up:** crossfade do form (não usa router push completo se possível, ou page transition suave).

#### Loading / aguardo
- **Spinner principal:** trocar `Loader2` simples por um **dual-ring spinner** com cor brand (componente `<Spinner size="sm|md|lg" />`).
- **Progress dots:** 3 bolinhas com bounce em sequência (pra estados curtos como "Salvando palpite").
- **Skeleton refresh:** o `<Skeleton/>` atual é estático — vamos adicionar **shimmer animado** (gradient sweep horizontal) com `--motion-slow`.
- **Tela cheia (auth resolver, primeira carga):** logo do trofeu pulsa com glow brand, sutil.

#### Page transitions
- Layout `(app)` ganha um wrapper `<PageTransition>` que faz fade+slide-up de 8px em `--motion-base` quando `pathname` muda.
- Landing → sign-in: efeito de "abrir cortina" (slide horizontal 4%), sutil.

#### Theme switch (já existe, melhorar)
- Hoje o switch já tem cubic-bezier elástico — vamos somar uma **transição global** ao trocar tema: aplicar `view-transition-name` no `<html>` e usar `document.startViewTransition()` se disponível, com fallback pra fade do body por 240ms.

#### Dashboard
- **Cards entram com stagger** (40–60ms entre cada) na primeira render.
- **Números (placar, pontuação)** animam contagem (rolling counter) ao mudar valor — componente `<AnimatedNumber />`.
- **Ranking:** ao reordenar, items animam com `motion.layout` (FLIP).
- **Match card – Salvar palpite:** botão "Salvar" some com slide-down enquanto o "✓ Salvo" entra com slide-up + fade. Confetti sutil opcional em primeiro palpite do dia.

#### Mobile bottom nav
- Tab ativa anima com **indicator pill** (background pill se desloca da aba antiga pra nova com spring).
- Ícone da aba ativa faz `scale 1 → 1.1 → 1` ao virar ativo.

#### Modals / Dialogs
- Backdrop fade-in 180ms; conteúdo: `slide-up 24px + scale 0.96 → 1` com `--ease-out-back`.
- Saída: reverso, mais rápido (`--motion-fast`).

#### Toasts (Sonner)
- Estilo já alinhado com o tema — só ajustar tokens pra usar as novas cores de status (`--b-success`, `--b-danger`).

### 4.4 Acessibilidade de motion

Em `globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

E no `motion`, usar `useReducedMotion()` pra desligar variantes complexas.

---

## 5. Componentes — atualizações

### 5.1 `packages/ui/src/components/button.tsx`
- Reescrever `buttonVariants`:
  - Substituir `rounded-none` → `rounded-xl` por padrão (raios maiores no app). Manter um size `square` pra casos especiais.
  - Adicionar variant **`brand`** (primary com gradiente + shine).
  - Adicionar variant **`accent`** (amarelo).
  - Adicionar variant **`success`** e **`danger-solid`**.
  - Substituir o `transition-[...]` longo por `transition-all duration-[var(--motion-fast)] ease-[var(--ease-out-quart)]`.
  - Hover: `hover:scale-[1.02] hover:shadow-[var(--b-shadow-brand-md)]` + `data-[loading=true]` state.
  - Adicionar `data-[loading=true]` que aplica spinner automaticamente (cuida do estado de loading interno).
- Sizes ficam compatíveis (`xs/sm/default/lg/icon-*`), mas com altura mínima de 44px no `lg` (mobile-friendly).
- Criar `<ButtonShine>` wrapper (pseudo `::before` com gradient sweep no hover).

### 5.2 `packages/ui/src/components/input.tsx`
- Substituir `rounded-none` → `rounded-lg`.
- Aumentar altura padrão pra `h-10` (mobile), `h-11` em formulários auth.
- Adicionar suporte a **floating label** via composto `<FloatingInput label="Email" />` (novo componente).
- Slot pra ícone à esquerda (`<Mail />`, `<Lock />`).
- Slot de feedback à direita (check verde, X vermelho, spinner) com transição.
- Estado `aria-invalid` com shake CSS.

### 5.3 `packages/ui/src/components/card.tsx`
- Adicionar variants `default` / `elevated` / `inset` / `gradient`.
- Hover state opcional (`hoverable` prop) que ativa lift sutil.

### 5.4 NOVOS componentes em `packages/ui/src/components/`

| Componente              | Descrição                                                              |
| ----------------------- | ---------------------------------------------------------------------- |
| `spinner.tsx`           | Dual-ring spinner com tamanhos sm/md/lg, cor brand                     |
| `dots-loader.tsx`       | 3 bolinhas bouncing pra micro-loading                                   |
| `progress-bar.tsx`      | Barra com shimmer (já existe `progress.tsx` — refatorar)               |
| `animated-number.tsx`   | Contagem rolante de números (usa `motion`)                             |
| `floating-input.tsx`    | Input com label flutuante                                              |
| `glow-card.tsx`         | Card com glow brand opcional (hover/focus)                             |
| `tag.tsx`               | Pill/tag (uniformizar os "rounded-full px-..." espalhados)             |
| `page-transition.tsx`   | Wrapper de transição entre rotas                                       |
| `confetti.tsx`          | Confetti opcional (canvas-confetti) pra celebrações                    |
| `marquee.tsx`           | Scroller horizontal (logos de times na landing)                        |

### 5.5 Refatoração de `globals.css`

- Mover **todos** os tokens novos pra blocos organizados (cores base → semânticos → motion → gradientes).
- Adicionar `@keyframes` pra: `shimmer`, `pulse-glow`, `bounce-dot`, `shake`, `shine-sweep`, `count-up`.
- Criar utilities `.shadow-brand-{sm,md,lg,xl}`, `.glow-brand`, `.bg-mesh-hero`, `.bg-card-shine`, `.animate-shimmer`, etc.

---

## 6. Landing page (`apps/web/src/app/page.tsx`)

### 6.1 Estrutura nova (top → bottom)

1. **Header sticky** com blur ao scrollar — logo, nav (Funcionalidades, Ligas, Regras, Entrar), CTA "Criar conta" com brand-shine.
2. **Hero** repaginado:
   - Headline mantida ("Bolão bonito pra quem leva futebol a sério") com **destaque em verde no "bonito"**.
   - **Mockup do dashboard** à direita ganha animação parallax leve no scroll + flutuação sutil (`translateY` infinito 6s).
   - **Counter animado** nos números (`484`, `20+`, `100%`).
   - Background mesh refinado, com partículas (dots flutuantes) opcionais.
3. **Strip de logos** (NOVA): marquee infinito com logos/escudos de times (Brasileirão + Copa) — passa lento, dá sensação de produto sério.
4. **Features (3 cards)** mantém estrutura, mas:
   - Hover do card faz lift + glow brand.
   - Ícones ganham micro-animação no hover (rotate sutil, ou fill).
   - Stagger na entrada quando entra no viewport (IntersectionObserver).
5. **"Como funciona"** vira um **stepper visual** (3 passos numerados grandes em coluna ou linha conforme breakpoint), com linha conectora animada que se desenha quando entra no viewport.
6. **Seção NOVA — "Pontuação"**: card que explica o sistema de pontos (10 placar exato, etc.) de forma visual com chips coloridos por tier (usa `points-palette.ts` já existente).
7. **Seção NOVA — "Prova social"**: 2–3 depoimentos curtos / quotes com cara de futebol (mock por enquanto).
8. **CTA final** mantida, mas com **fundo gradiente animado** (slow color shift do brand).
9. **Footer simples** (NOVO): logo, links (Regras, Contato, Privacidade), copyright. Hoje não tem footer.

### 6.2 Comportamentos

- Scroll suave nos âncoras.
- Reveal por seção (fade-up) com IntersectionObserver.
- CTA do header muda de variant após scroll > 200px (vira solid pra ficar mais visível).

---

## 7. Auth pages (`apps/web/src/app/(auth)/`)

### 7.1 Layout (`(auth)/layout.tsx`)

- Mantém estrutura split (branding esquerda + form direita), mas:
  - **Branding ganha animação contínua**: gradiente do background faz slow shift de hue (145 → 155 → 145), mesh de pontos com leve flutuação.
  - Stats no rodapé do branding entram com counter animado.
  - **Mobile**: hoje some o branding inteiro. Vamos colocar uma versão "comprimida" no topo (logo grande + headline curta) com altura adaptativa.
- Card do form ganha um **anel brand sutil no foco** (quando qualquer input dentro dele está focado, o card brilha levemente).

### 7.2 Sign-in / Sign-up / Forgot

- Substituir `<Input>` cru por `<FloatingInput>` com ícone (Mail, Lock, User).
- Submit button vira `<Button variant="brand" loading={isSubmitting}>` (loading interno).
- Erros: toast continua, mas **inputs com erro fazem shake + borda vermelha**.
- **Page transitions** entre sign-in ↔ sign-up: hoje é navegação completa com link. Avaliar SPA-style com `<Tabs>` interno na página, ou pelo menos `view-transition-name` pros campos comuns (header, logo, card).
- Sign-up: campo de senha com **medidor de força** (barra que enche conforme requisitos atendidos).
- "Esqueci a senha": página dedicada com mesmo layout, fluxo de magic link.

---

## 8. App layout (`apps/web/src/app/(app)/layout.tsx`)

### 8.1 Sidebar desktop

- Mantém estrutura, mas:
  - **Indicator de tab ativa** vira uma **barra vertical brand à esquerda** que se desloca com motion.layout entre items (não cada item ter seu próprio bg). Mais elegante e moderno.
  - Hover dos links: bg muda + ícone faz `scale 1.05` rapidinho.
  - Card de perfil no rodapé ganha hover lift.
  - Botão de logout: hover vira vermelho suave (warning).
  - Adicionar **search global (Ctrl+K)** opcional — placeholder por enquanto, mas com UI pronta.

### 8.2 Mobile bottom nav

- **Indicator pill**: background brand-12 que desliza entre as abas com spring (motion.layout).
- Ícones da aba ativa ganham scale + glow brand sutil.
- **Safe-area iOS**: garantir `padding-bottom: env(safe-area-inset-bottom)`.

### 8.3 Header (top bar)

- Adicionar **breadcrumbs** sutis (Início › Palpites › Rodada 12) que entram com fade.
- `CompetitionSwitcher`: dropdown com animação suave de open/close, items com hover smooth.
- ThemeSwitch já tá ok — só garantir consistência.

### 8.4 Loading state inicial (auth resolver)

- Substituir spinner simples por **logo do trofeu** pulsando com glow brand + texto "Preparando o gramado…" (microcopy bonitinho).

---

## 9. Páginas internas — micro-melhorias

### 9.1 Dashboard
- Cards de stats (pontos, posição) com **counter animado** + sparkline opcional.
- "Próximos jogos" como carousel horizontal com snap.
- Banner do próximo jogo grande, com countdown ao vivo (HH:MM:SS) atualizando.

### 9.2 Predictions (`/predictions`)
- `MatchCard`: já está visualmente forte. Adicionar:
  - **Animação no salvar**: botão Salvar morphs into "✓ Salvo" com check animado.
  - Inputs de placar +/− com **haptic feedback** (vibrate API no mobile).
  - Lock countdown: nos últimos 60min antes do fechamento, badge fica laranja (warning), nos últimos 5min, vermelho com pulse.
  - Card pulsing sutil quando está em "modo decisão" (próximo jogo da rodada).
- Lista vira **agrupada por dia** com sticky headers de data.

### 9.3 Leagues
- Tabela de classificação com **animação de reordenação** (motion.layout — quando posições mudam, linhas deslizam).
- Avatar do líder com coroa sutil, top-3 com cores ouro/prata/bronze.
- "Convidar" abre modal com código + botão copy (toast de confirmação).

### 9.4 Profile
- Card grande com avatar, nome, email, stats (pontos, ligas, melhor rodada).
- Avatar editável (upload no futuro) — placeholder com inicial colorida.
- Seções colapsáveis: Conta, Notificações, Privacidade, Sair.

### 9.5 Regras
- Layout tipo "documentação" com TOC lateral.
- Sistema de pontuação ilustrado com mini-cards visuais.

### 9.6 Admin
- Manter funcional, repaginar com mesmos tokens.

---

## 10. Loaders, skeletons e estados vazios

### 10.1 Substituições

| Hoje                                        | Novo                                      |
| ------------------------------------------- | ----------------------------------------- |
| `<Loader2 className="animate-spin" />`      | `<Spinner size="md" />` (dual-ring brand) |
| `<Skeleton />` estático                     | `<Skeleton />` com shimmer                |
| Texto "Carregando..."                       | `<DotsLoader label="Carregando" />`       |
| Tela cheia spinner (auth)                   | Logo trofeu pulsando + glow              |

### 10.2 Empty states (NOVO)

Componente `<EmptyState icon={...} title="..." description="..." action={...} />` pra usar em:
- Sem palpites ainda
- Sem ligas
- Liga sem membros
- Admin sem dados

Cada um com ilustração SVG inline (mascote ou ícone temático).

### 10.3 Error boundary

`<ErrorBoundary>` com tela amigável: ícone, mensagem, botão "Tentar de novo". Hoje não tem.

---

## 11. Acessibilidade & qualidade

- **Foco visível** em todos os interativos: ring brand de 2px com offset 2px (já tem em alguns, padronizar).
- **Aria-labels** em botões com só ícone.
- **Contraste**: validar todos os pares fg/bg com ferramenta (WebAIM ou similar). Especial atenção pra `--b-text-3` e `--b-text-4` em fundos coloridos.
- **Tab order** revisado em formulários e modals.
- **Reduced motion** respeitado.
- **Lighthouse** target: Performance ≥ 90, A11y ≥ 95, Best Practices = 100.

---

## 12. Performance

- **Fonts**: já usa `next/font` — manter, garantir `display: swap`.
- **Images**: time crests via `next/image` com `unoptimized` (já é o caso pra URLs externas — ok).
- **Motion bundle**: importar `motion/react` por componente, não global. Lazy-load onde não é crítico.
- **CSS**: tokens em camadas, sem duplicação. Tailwind v4 já faz purge agressivo.
- **Code split**: páginas internas já são por rota (Next App Router).
- **Analytics futuras**: deixar slot pra Vercel Analytics ou similar (não escopo agora).

---

## 13. Estrutura de arquivos — o que muda

### Novos arquivos
```
packages/ui/src/components/
  spinner.tsx
  dots-loader.tsx
  animated-number.tsx
  floating-input.tsx
  glow-card.tsx
  tag.tsx
  page-transition.tsx
  empty-state.tsx
  error-boundary.tsx
  marquee.tsx
  confetti.tsx                  (opcional)

packages/ui/src/styles/
  globals.css                   (refatorado)
  motion.css                    (NOVO — keyframes e utilities de motion)
  tokens.css                    (NOVO — todos os --b-* organizados)

apps/web/src/components/
  landing/                      (NOVO — seções da landing isoladas)
    hero.tsx
    features.tsx
    how-it-works.tsx
    points-system.tsx
    testimonials.tsx
    cta-final.tsx
    footer.tsx
    logo-marquee.tsx
  auth/
    auth-card.tsx               (wrapper do form com glow)
    password-strength.tsx
  dashboard/
    next-match-banner.tsx
    stats-counter.tsx

apps/web/src/lib/
  motion.ts                     (variants reutilizáveis pra motion/react)
```

### Arquivos a editar
```
packages/ui/src/components/button.tsx       — variants novas, motion
packages/ui/src/components/input.tsx        — rounded, altura, slots
packages/ui/src/components/card.tsx         — variants
packages/ui/src/components/skeleton.tsx     — shimmer
packages/ui/src/components/progress.tsx     — shimmer
packages/ui/src/components/theme-switch-button.tsx  — view-transition

apps/web/src/app/page.tsx                   — landing nova
apps/web/src/app/(auth)/layout.tsx          — animações, mobile
apps/web/src/app/(auth)/sign-in/page.tsx    — FloatingInput, transitions
apps/web/src/app/(auth)/sign-up/page.tsx    — idem + medidor de senha
apps/web/src/app/(auth)/forgot-password/page.tsx  — idem
apps/web/src/app/(app)/layout.tsx           — sidebar indicator, mobile pill, header
apps/web/src/app/(app)/dashboard/page.tsx   — counters, banner, stagger
apps/web/src/app/(app)/predictions/page.tsx — agrupamento, motion
apps/web/src/app/(app)/leagues/page.tsx     — table reorder
apps/web/src/app/(app)/profile/page.tsx     — repaginação
apps/web/src/app/(app)/regras/page.tsx      — layout doc
apps/web/src/components/match-card.tsx      — micro-animações de salvar
apps/web/src/components/loader.tsx          — usa Spinner novo
apps/web/src/components/sign-in-form.tsx    — alinhar com nova page (ou deprecar)
apps/web/src/components/sign-up-form.tsx    — idem
apps/web/src/components/header.tsx          — pode ser deprecado se não usado
```

### Dependências a adicionar (`apps/web/package.json`)
```
motion              ^11+    (animação JS leve, sucessor framer-motion)
canvas-confetti     ^1.9    (opcional, celebrações)
@types/canvas-confetti devDep (opcional)
```

> Nada de Lottie por enquanto — manter o bundle enxuto.

---

## 14. Fases de execução

A repaginação será feita em **5 fases sequenciais**, cada uma entregável e testável de forma isolada. O ideal é abrir um branch por fase pra revisar/voltar atrás se precisar.

### **Fase 1 — Fundação (tokens, motion, tipografia)**
> Sem mudança visual significativa ainda — apenas infraestrutura.

- [ ] Refatorar `globals.css` em `tokens.css` + `motion.css` + `globals.css`.
- [ ] Adicionar tokens novos de cor (brand-50/100/200/lo, status, sombras coloridas).
- [ ] Adicionar tokens de motion (durations, easings).
- [ ] Adicionar keyframes (shimmer, shake, shine-sweep, etc.).
- [ ] Criar utilities de tipografia (`.text-display-*`, `.text-eyebrow`, `.text-numeric`).
- [ ] Suporte a `prefers-reduced-motion` global.
- [ ] Instalar `motion`.
- [ ] Validar dark mode com novos tokens (não pode quebrar nada).

**Entregável**: build verde, dark/light funcionando, sem regressão visual.

### **Fase 2 — Componentes base do design system**
- [ ] Reescrever `Button` com variants brand/accent/success/danger-solid + loading state + shine.
- [ ] Reescrever `Input` (rounded, altura, slots) + criar `FloatingInput`.
- [ ] Refatorar `Card` com variants.
- [ ] Adicionar shimmer ao `Skeleton`.
- [ ] Criar `Spinner`, `DotsLoader`, `AnimatedNumber`, `Tag`, `PageTransition`, `EmptyState`, `ErrorBoundary`.
- [ ] Atualizar `theme-switch-button` com View Transitions API.

**Entregável**: design system pronto, storybook-like de validação visual (uma página `/dev/components` opcional).

### **Fase 3 — Landing + Auth**
- [ ] Reescrever landing por seções (componentes em `components/landing/`).
- [ ] Adicionar marquee de logos, parallax do mockup, counters, stagger, footer.
- [ ] Refatorar layout auth com animação contínua e mobile decente.
- [ ] Atualizar sign-in/sign-up/forgot com FloatingInput, page transition, shake em erro.
- [ ] Adicionar password strength meter no sign-up.

**Entregável**: usuário não-logado tem experiência nova completa.

### **Fase 4 — App interno**
- [ ] Sidebar desktop com indicator deslizante (motion.layout).
- [ ] Mobile bottom nav com pill animado.
- [ ] Page transitions entre rotas internas.
- [ ] Dashboard com counters animados, banner do próximo jogo, stagger.
- [ ] Predictions com agrupamento por dia, motion no salvar, countdown urgente.
- [ ] Leagues com tabela animada (FLIP).
- [ ] Profile e Regras repaginados.
- [ ] Loader inicial substituído pelo logo pulsante.

**Entregável**: usuário logado tem experiência nova completa.

### **Fase 5 — Polimento, a11y, performance**
- [ ] Auditoria de contraste em todos os pares.
- [ ] Foco visível padronizado em 100% dos interativos.
- [ ] Aria-labels e tab order revisados.
- [ ] Lighthouse pass em desktop e mobile (target ≥ 90/95/100).
- [ ] Otimização de bundle (analisar `motion` por chunk).
- [ ] Empty states em todas as listas.
- [ ] Error boundary ativo.
- [ ] Confetti opcional em primeiro palpite (feature flag).

**Entregável**: produto pronto pra release.

---

## 15. Riscos & decisões

| Risco / decisão                                      | Mitigação / escolha                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `motion` adiciona ~30kb gz                           | Importar por rota, lazy-load onde possível. Aceitável pelo ganho de UX.          |
| View Transitions API com suporte parcial             | Feature-detect e fallback pra crossfade CSS.                                     |
| Mudar `rounded-none` → `rounded-xl` em Button/Input  | Decisão consciente: o app já usa raios grandes nos cards. Manter coesão.         |
| Microinterações podem distrair                       | Tudo respeitará `prefers-reduced-motion`. Animações curtas (≤ 360ms na maioria). |
| Refator de `globals.css` pode quebrar página         | Fase 1 é dedicada pra isso, testando dark/light antes de seguir.                 |
| Trocar layout auth no mobile                         | Hoje some branding inteiro — versão comprimida é melhora real, baixo risco.     |
| Novos componentes em `@bolao/ui`                     | Já é um package compartilhado. Padrão consistente.                               |
| `sign-in-form.tsx` vs `sign-in/page.tsx` divergentes | Hoje há código duplicado/legado. Vamos consolidar na page e deprecar form.       |

---

## 16. Out of scope (pra outro plano)

- Internacionalização (i18n) — hoje tudo em PT-BR, manter.
- Refatoração de backend (Convex queries/mutations).
- Notificações push.
- App nativo (PWA já implícito via Next, mas manifest dedicado fica pra depois).
- Lottie / animações 3D.
- Onboarding tour interativo.

---

## 17. Definição de pronto (DoD por fase)

Cada fase só fecha quando:
1. ✅ Build verde (`bun run build`).
2. ✅ Type-check verde (`bun run check-types`).
3. ✅ Lint/format verde (Biome).
4. ✅ Dark **e** light mode validados visualmente em pelo menos: landing, sign-in, dashboard, predictions, leagues, profile.
5. ✅ Mobile (375px) e desktop (1440px) revisados.
6. ✅ Sem regressão de funcionalidade (login, palpites, ligas funcionam).
7. ✅ Sem `console.error`/`warn` no browser.

---

## 18. Próximo passo

Quando aprovar, começamos pela **Fase 1**. Posso ir mostrando os diffs por bloco antes de aplicar no projeto inteiro, ou ir mais direto e tu vai validando ao final de cada fase. Tua escolha.
