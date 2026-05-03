# Plano de Repaginação V2 — Bolão 2026

> Continuação do `PLANO_REPAGINACAO_FRONTEND.md` (executado em 01/05/2026, commit `bed746f`). A V1 entregou **fundação**: tokens, motion, design system, landing e auth. As **telas internas** ficaram herdando os tokens novos sem redesenho próprio.
>
> Esta V2 é sobre **redesenhar praticamente tudo o que ficou para trás** — dashboard, predictions, leagues, profile, regras, admin — e elevar a barra visual do produto inteiro com padrões novos (bento, hero match, scorecards, ranking row, sticky day headers, countdown ao vivo).

---

## 0. Diagnóstico rápido (o que ainda tá "antigo")

| Tela              | Estado atual                                                                                            | Diagnóstico                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `/dashboard`      | Stat cards inline com `style={{}}`, lista de "próximos jogos" usando `MatchCard` puro                   | Sem hierarquia, sem hero, sem countdown, sem destaque    |
| `/predictions`    | "DemoTutorial" gigante no topo, lista plana de matches por rodada                                       | Sem agrupamento por dia, sem urgência, tutorial poluindo |
| `/leagues`        | Lista de ligas + página `[id]` com tabela básica                                                        | Sem ranking visual, sem reorder animado, sem podium      |
| `/profile`        | Form de conta + alguns dados                                                                            | Sem identidade, sem stats grandes, sem histórico         |
| `/regras`         | Documento corrido                                                                                       | Sem TOC, sem visualização do sistema de pontos           |
| `/admin`          | Painel funcional cru                                                                                    | Sem hierarquia, sem feedback de ações                    |
| `match-card.tsx`  | Recebeu o "Salvar"→"✓ Salvo" mas continua com layout vertical pesado                                    | Pode ser bem mais elegante com layout de scorecard       |

---

## 0.1 Decisões fechadas (02/05/2026)

- ✅ **Direção visual:** Editorial Sportivo (Opção A).
- ✅ **Não tocar nas abas/sidebar/bottom nav** — só o conteúdo dentro de cada rota.
- ✅ Redesenhar todas as 6 telas internas (dashboard, predictions, leagues, profile, regras, admin).
- ✅ Seguir as fases conforme proposto.
- ✅ **Bônus:** focar pesado em animações de UX (ver §5).

---

## 1. Direção visual V2 — três opções (escolher uma antes de codar)

A V1 chegou em "moderno e coeso". A V2 precisa escolher uma **personalidade** mais forte. Sugiro 3 caminhos — cada um sustenta tudo o que vem depois.

### Opção A — **Editorial Sportivo** (recomendado)
Inspiração: The Athletic, ESPN+, OneFootball premium.
- Tipografia condensada gritante em headlines, números enormes (Barlow Condensed Black 80–120px nas pontuações).
- Imagens de bandeiras grandes como background de cards (com overlay verde).
- Layouts assimétricos, "página de revista".
- Cor: brand verde + accent amarelo + **preto profundo** ocasional como contraste editorial.
- Sensação: peso, autoridade, "torcida adulta".

### Opção B — **Stadium Glassmorphism**
Inspiração: apps modernos com `backdrop-blur` (Linear, Arc, novos apps Apple).
- Cards translúcidos com blur sobre gradiente brand mesh fixo no `body`.
- Bordas com gradiente `border-gradient` brand→accent.
- Glows coloridos por trás de elementos chave.
- Sensação: futurista, leve, "noite de jogo iluminada".

### Opção C — **Retro Manager** (arrojado)
Inspiração: Football Manager, cartelas de figurinhas, Panini.
- Cards com aparência de "carta": número grande no canto, time no centro, borda brilhante por raridade.
- Tipografia Barlow Condensed em CAPS LOCK absoluto.
- Cores chapadas, sombras duras tipo `4px 4px 0 var(--b-brand)`.
- Sensação: nostalgia + tabuleiro de jogo.

> **Default proposto: Opção A — Editorial Sportivo.** Sustenta a marca verde, evita ser "mais um app SaaS bonitinho", e dá hierarquia visual real pros números (que é o coração do produto). As opções B e C podem entrar como **inspirações pontuais** dentro da A (ex.: glass na tela de jogo ao vivo, cartas só no perfil "histórico").

---

## 2. Padrões novos a introduzir (transversal)

### 2.1 **Bento Layout** (substitui grid genérico)
- Dashboard vira uma grade bento: tiles de tamanhos diferentes (1×1, 2×1, 1×2, 2×2) com gap 16–20px.
- CSS Grid com `grid-template-areas` por breakpoint.
- Cada tile é um `<BentoTile>` (novo componente) com slot pra header, conteúdo e footer.

### 2.2 **HeroMatch** (novo componente)
- Banner full-bleed do "próximo jogo" com:
  - Bandeiras grandes (ou crests) em ambos os lados, brilho radial brand atrás.
  - Countdown ao vivo `HH:MM:SS` em DM Mono enorme.
  - Botão "Palpitar agora" brand com shine.
  - Local + horário + estádio (campo `venue` que já entrou).

### 2.3 **Scorecard horizontal**
- Substitui o `match-card.tsx` vertical atual.
- Layout: `[CrestEsquerda] [Nome] [Input -X+] [vs] [Input -X+] [Nome] [CrestDireita]` em uma linha no desktop, 2 linhas no mobile.
- Lock countdown como faixa inferior fina (verde→amarelo→vermelho conforme aproxima).
- Estado salvo com check verde minimalista no canto, sem "pílula".

### 2.4 **Sticky Day Header**
- Em listas longas (predictions, dashboard "próximos"), o header de cada dia (ex.: "QUI · 14 MAI") gruda no topo enquanto scrolla, com fade do background ao chegar.
- Mostra contador de jogos do dia + ícone de status (todos palpitados / faltam X).

### 2.5 **Ranking Row**
- Linha de ranking premium: posição grande, avatar, nome, pontos em DM Mono, delta da rodada (▲▼) com cor.
- Top-3 com highlights: ouro/prata/bronze sutis na borda esquerda.
- Reorder animado com FLIP (motion `layout`).

### 2.6 **Stat Tile editorial**
- Substitui `StatCard` inline do dashboard.
- Eyebrow caps + número GIGANTE (Barlow Condensed 900, 64–96px) + sub texto + sparkline opcional.
- Variants: `default`, `accent` (verde), `gold` (top performer).

### 2.7 **Pill Tab Bar**
- Substitui tabs genéricos onde aplicável (perfil, ligas, admin).
- Pílula brand desliza entre tabs com `motion.layout` (mesmo padrão da bottom nav).

### 2.8 **Side Drawer** (substitui modais grandes)
- Pra "Convidar pra liga", "Editar perfil", "Detalhes do jogo": drawer lateral em desktop, bottom sheet em mobile.
- Já temos `sheet.tsx` em `packages/ui` — usar consistentemente.

---

## 3. Novos componentes a criar

| Componente              | Pasta                                | Descrição                                                              |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `bento-tile.tsx`        | `packages/ui/src/components/`        | Container bento com slots header/body/footer e variants de tamanho     |
| `hero-match.tsx`        | `apps/web/src/components/match/`     | Banner full-bleed do próximo jogo                                      |
| `scorecard.tsx`         | `apps/web/src/components/match/`     | Substitui match-card vertical pelo layout horizontal                   |
| `lock-countdown.tsx`    | `apps/web/src/components/match/`     | Faixa de countdown que muda cor por urgência                           |
| `live-clock.tsx`        | `apps/web/src/components/match/`     | Relógio HH:MM:SS auto-atualizando, em DM Mono                          |
| `day-header.tsx`        | `apps/web/src/components/match/`     | Sticky day header com contador                                          |
| `ranking-row.tsx`       | `apps/web/src/components/leagues/`   | Linha de ranking premium                                                |
| `podium.tsx`            | `apps/web/src/components/leagues/`   | Top-3 visual em forma de pódio (3 colunas, 1º maior)                   |
| `stat-tile.tsx`         | `apps/web/src/components/dashboard/` | Stat editorial (substitui o inline `StatCard`)                         |
| `sparkline.tsx`         | `packages/ui/src/components/`        | Mini-gráfico SVG inline (rendered em ~80×24)                           |
| `pill-tabs.tsx`         | `packages/ui/src/components/`        | Tab bar com pill animado                                                |
| `points-meter.tsx`      | `apps/web/src/components/`           | Visualização do sistema de pontos (10/7/5/3/0) — usado em /regras       |
| `rule-toc.tsx`          | `apps/web/src/components/regras/`    | Sumário lateral sticky em /regras                                       |
| `flag-bg.tsx`           | `packages/ui/src/components/`        | Bandeira/crest de time como background com overlay e blur              |
| `delta-badge.tsx`       | `packages/ui/src/components/`        | ▲ +3 / ▼ −1 / — colorido pra deltas                                    |
| `confetti.tsx`          | `packages/ui/src/components/`        | (opcional V1 não fez) celebração em primeiro palpite cravado            |

---

## 4. Telas — redesenho página por página

### 4.1 `/dashboard` — **Bento centrado no próximo jogo**

**Layout (desktop, 1440px):**
```
┌──────────────────────────────────────────────────────────────┐
│  HERO MATCH (full-width, 320px alto)                          │
│  Bandeiras + countdown + CTA "Palpitar agora"                 │
└──────────────────────────────────────────────────────────────┘
┌────────────┬────────────┬──────────────────────────────────┐
│  PONTOS    │  POSIÇÃO   │  ACERTOS                          │
│  (tile     │  (tile     │  (tile 2x1 com sparkline + delta) │
│   accent)  │   default) │                                    │
└────────────┴────────────┴──────────────────────────────────┘
┌──────────────────────────────────┬──────────────────────────┐
│  PRÓXIMOS JOGOS DA RODADA        │  RANKING DA LIGA         │
│  (lista compacta, scorecards)    │  (top-5, ranking rows)   │
│                                  │                          │
└──────────────────────────────────┴──────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  TIMELINE — ÚLTIMAS RODADAS (gráfico de pontos por rodada)    │
└──────────────────────────────────────────────────────────────┘
```

**Mobile:** stack vertical, hero match com altura menor (220px), stats em 2 colunas, restante full-width.

**Detalhes:**
- HeroMatch com `flag-bg` em ambos os lados, gradiente verde mesh atrás, countdown live em 64px.
- Stat tiles com `animated-number` na entrada + sparkline (últimas 5 rodadas).
- "Próximos jogos" em scorecards horizontais, max 3 visíveis, com link "Ver todos".
- Ranking compacto em ranking-row (sem podium aqui — fica em /leagues).
- Timeline = mini chart SVG dos pontos por rodada (sparkline grande).

**Remover:**
- `StatCard` inline atual.
- Lista flat de matches.

### 4.2 `/predictions` — **Agrupamento por dia + urgência visual**

**Layout:**
```
┌─ Filtros: [Todos] [Não palpitados] [Próximas 24h]  ─┐
│                                                       │
│  QUI · 14 MAI · 4 jogos · 2 palpitados   ← sticky    │
│  ┌─ scorecard ─────────────────────────────────┐     │
│  │ Brasil 2 vs 1 Argentina  · trava em 1h 23m  │     │ ← warning amarelo
│  └─────────────────────────────────────────────┘     │
│  ┌─ scorecard ─────────────────────────────────┐     │
│  │ França 0 vs 0 Alemanha   · trava em 4m  ⚡  │     │ ← danger pulse
│  └─────────────────────────────────────────────┘     │
│                                                       │
│  SEX · 15 MAI · 3 jogos · 0 palpitados  ← sticky     │
│  ...                                                  │
└──────────────────────────────────────────────────────┘
```

**Detalhes:**
- Day header sticky, com contagem `X/Y palpitados` + barra de progresso fina.
- Scorecards horizontais com lock countdown dinâmico:
  - `> 6h`: cinza
  - `1h–6h`: warning (amarelo)
  - `< 1h`: danger (vermelho) com pulse glow
- Filtros com pill-tabs.
- "DemoTutorial" atual sai do topo — vira **drawer** acionado por botão `?` flutuante (só aparece se for primeiro acesso).
- Modo demo: badge fixo no topo "🏆 Modo Demonstração" com link pra entender, sem ocupar espaço.

### 4.3 `/leagues` (lista) e `/leagues/[id]` (detalhe)

**Lista:**
- Grid de cards por liga: avatar/escudo da liga, nome, X membros, sua posição grande.
- Botão grande "Criar liga" no topo + "Entrar com código".

**Detalhe:**
```
┌─────────────────────────────────────────────────┐
│  HEADER LIGA (nome, código copiável, X membros) │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│              PÓDIO (top 3 visual)                │
│           🥈           🥇          🥉            │
│         Pedro        Ana         João           │
│         142          156         128            │
└─────────────────────────────────────────────────┘
┌─ Pill tabs: [Ranking] [Rodada atual] [Histórico] ┐
│                                                   │
│  RANKING (rows do 4º em diante, animadas)         │
│  4. Maria      120 pts   ▲ +2                     │
│  5. Carlos     115 pts   ▼ −1                     │
│  ...                                              │
└──────────────────────────────────────────────────┘
```

**Detalhes:**
- Pódio com 3 colunas, 1º maior no centro, com confetti ao mudar líder.
- Ranking rows com motion.layout pra reorder animado (quando dados mudam em tempo real).
- "Convidar" abre side drawer com código grande copiável + QR code (futuro).
- Tab "Rodada atual" mostra como cada membro foi nessa rodada (pontos + delta).
- Tab "Histórico" = chart de evolução de cada membro (line chart leve).

### 4.4 `/profile` — **Carteirinha do torcedor**

**Layout:**
```
┌─────────────────────────────────────────┐
│  HERO PROFILE (240px)                    │
│  Avatar grande + Nome BIG + email        │
│  Stats inline: Pontos · Posição · Ligas  │
└─────────────────────────────────────────┘
┌─ Pill tabs: [Visão geral] [Conta] [Notificações] ┐
│                                                    │
│ Visão geral:                                       │
│   - Card: "Sua melhor rodada" (mostra placares)    │
│   - Card: "Acertos ao longo do tempo" (chart)      │
│   - Card: "Times mais palpitados" (top 5)          │
│                                                    │
│ Conta:                                             │
│   - Editar nome, email                             │
│   - Trocar senha                                   │
│   - Excluir conta (destrutivo, com confirmação)    │
│                                                    │
│ Notificações:                                      │
│   - Toggles (lock chegando, resultado saiu, etc.)  │
└───────────────────────────────────────────────────┘
```

**Detalhes:**
- Avatar com inicial colorida (cor derivada do nome via hash).
- Hero com gradiente brand sutil + textura dots.
- Cards "Visão geral" usam stat tiles + mini charts.
- Forms da aba "Conta" usam `FloatingInput` pra coerência.
- Botão "Excluir conta" em variant `danger-solid` com confirmation dialog forte.

### 4.5 `/regras` — **Documentação editorial com TOC**

**Layout:**
```
┌──────────────┬─────────────────────────────────────┐
│              │                                       │
│   TOC        │   CONTEÚDO (max-w-prose)              │
│   (sticky)   │                                       │
│              │   ## Sistema de pontuação             │
│   • Visão    │   <PointsMeter />  ← visual interativo│
│     geral    │                                       │
│   • Pontuação│   ## Como funciona o lock             │
│   • Lock     │   ...                                 │
│   • ...      │                                       │
│              │                                       │
└──────────────┴─────────────────────────────────────┘
```

**Detalhes:**
- TOC lateral sticky no desktop, virando "expansível no topo" no mobile.
- Active section highlight no TOC via IntersectionObserver.
- `<PointsMeter />` é um diagrama interativo: barra horizontal com 4 chips (10/7/5/3/0), cada chip clicável mostra exemplo numérico.
- Mini-cards visuais com exemplos: "Você palpitou 2×1, deu 2×1 → 10 pts", etc.
- Anchor links com smooth scroll.

### 4.6 `/admin` — **Painel operacional sério**

**Layout:**
- Header com KPIs do sistema (usuários ativos, palpites hoje, jogos sincronizados).
- Pill tabs: `[Sincronização] [Usuários] [Ligas] [Logs]`.
- Tabela de jobs (cron status) com status pills coloridos.
- Botão "Forçar sync" com confirmação + loading state.
- Logs recentes em estilo terminal (mono, fundo `--b-inner`).

**Detalhes:**
- Toda ação destrutiva pede confirmação via dialog.
- Toast pra cada operação concluída/falhada.
- Sem "decoração" desnecessária — admin é ferramenta de trabalho.

---

## 4.7 Catálogo de animações UX (NOVO — transversal a todas as telas)

Cada animação tem propósito explícito (feedback, hierarquia, continuidade, urgência). Lista exaustiva pra implementar:

### Entrada de página / seção
- **Stagger reveal:** filhos diretos do `<main>` entram com `slide-up + fade` em cascata, 60ms de delay entre cada (`.stagger > * { animation-delay: calc(var(--i) * 60ms) }`).
- **Hero fade-in:** HeroMatch entra com `scale 0.96 → 1 + fade` em `--motion-medium` com `--ease-out-expo`.
- **Section reveal on scroll:** seções abaixo da fold entram com `fade-up` ao cruzar 70% do viewport (IntersectionObserver, `--motion-medium`).

### Números (placares, pontos, posição)
- **Count-up animado:** `<AnimatedNumber>` em todas as estatísticas grandes (já existe, usar mais).
- **Number flip:** ao mudar valor (ex.: pontos somam após resultado), o dígito velho desliza pra cima e some, o novo entra de baixo (mecanismo "rolling counter"). Componente `<RollingNumber>`.
- **Score pulse:** quando palpite é salvo com sucesso, o número faz `scale 1 → 1.15 → 1` em 300ms.

### Botões
- **Press ripple:** ao clicar, círculo brand `scale 0 → 1 + opacity 0.3 → 0` se expande do ponto do clique (canvas-free, só CSS pseudo).
- **Loading swap:** label some com `slide-down + fade`, spinner entra com `scale-up + fade`. Reverso quando termina.
- **Success morph:** botão "Salvar" → "✓ Salvo" com width animado + check SVG desenhando-se (`stroke-dashoffset` de 24 → 0 em 360ms).
- **Hover lift consistente:** `translateY(-1px) + shadow-brand-md` em `--motion-fast`.

### Inputs / formulários
- **Floating label:** label sobe e diminui em `--motion-base` no foco (já existe).
- **Validation ring:** ao validar OK, ring verde se expande de 0 → 2px em 200ms; ao validar erro, ring vermelho + shake do campo.
- **+/− score:** ao clicar +/− no scorecard, número faz mini count-up de 200ms; botão "ricoche" (`scale 0.92 → 1`).

### Listas / tabelas
- **FLIP reorder:** ranking row e tabela de classificação reordenam com motion `layout` (300ms ease-out-expo) quando dados mudam.
- **Item enter:** novo item entra com `slide-up + fade`; item removido sai com `slide-down + fade-out + height 0`.
- **Sticky day header:** ao virar sticky, ganha sombra inferior + `backdrop-blur 12px` em transição de 200ms.

### Lock countdown (urgência)
- **Cor escala progressiva:** `> 6h` cinza → `1h–6h` warning amarelo → `< 30min` danger vermelho → `< 5min` danger com `animate-pulse-glow` infinito.
- **Tick visual:** a cada segundo, dígito faz mini-flip imperceptível pra dar "pulso" de tempo correndo.

### HeroMatch (jogo do dia)
- **Bandeiras parallax:** ao mover o mouse no hero, as duas bandeiras se inclinam `rotateX/Y` máx 4° (efeito 3D sutil via `transform: perspective(1000px)`).
- **Glow respirando:** background mesh do hero pulsa opacity 0.85 → 1 → 0.85 em loop de 4s (sutil, suporta reduced-motion).
- **Countdown digital:** dígitos do contador trocam com `count-up` (transform: translateY) a cada segundo.

### Pódio (top 3)
- **Subida do pódio:** ao montar, as 3 colunas sobem do chão com `translateY(40px) → 0` em sequência (3º primeiro, depois 2º, depois 1º), spring com `--ease-out-back`.
- **Coroa 1º lugar:** ícone de coroa flutua continuamente (`animate-float`) e tem leve glow brand.
- **Mudança de líder:** quando o 1º lugar muda, confetti dispara + nova posição pulsa.

### Scorecard
- **Save morph:** botão "Salvar" colapsa em width, vira pílula verde "✓ Salvo" com check desenhando-se.
- **Lock approach:** quando faltam < 5min, card inteiro ganha `outline 2px dashed warning` que pulsa.
- **Drag de score (futuro mobile):** swipe horizontal incrementa/decrementa (haptic).

### Bento tiles
- **Stagger entry:** entrada com 80ms de delay entre tiles, `slide-up + scale 0.95 → 1`.
- **Hover tilt:** tile reage ao mouse com `rotateX/Y` máx 2° + `shadow-brand-md` (perspective parent).
- **Active glow:** tile com dado "fresco" (acabou de mudar) ganha pulse de borda brand por 2s.

### Tab switching (pill tabs)
- **Pill slide:** background da pílula desliza com `motion.layout` entre tabs (~280ms `--ease-spring`).
- **Content crossfade:** conteúdo da tab antiga sai com `fade-out 120ms`, novo entra com `fade-in + slide-up 8px 240ms`.

### Toasts
- **Entry from top-right:** slide-in horizontal 16px + fade.
- **Auto-dismiss:** progress bar fina inferior contando down (já existe via Sonner, garantir cor brand).

### Feedback de salvamento global
- **Optimistic + rollback:** mudança aplicada imediato; se falhar, reverte com shake + toast.
- **Saved indicator:** ícone de "salvo" no header sutil pisca check verde quando algo é persistido (canto superior direito).

### Page transitions
- **Slide-up entry:** wrapper `<PageTransition>` (já existe) — manter.
- **Section anchors:** scroll suave + highlight sutil no destino (background brand-5 que fade-out em 1s).

### Reduced motion fallback
- Todas as animações respeitam `@media (prefers-reduced-motion: reduce)` (já configurado em motion.css).
- Animações de loop (`float`, `pulse-glow`) viram estáticas.
- Crossfades viram instantâneos.

---

## 5. Componentes existentes a evoluir

| Componente             | Mudança                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| `match-card.tsx`       | Reescrever como `scorecard.tsx` horizontal                                   |
| Stat inline `dashboard`| Extrair pra `stat-tile.tsx` em `apps/web/src/components/dashboard/`          |
| `loader.tsx`           | Já está bom (logo trofeu pulsando). Adicionar variants `inline` e `fullscreen` |
| `header.tsx`           | Avaliar se ainda é usado — provavelmente deprecar (substituído por layout)   |
| `sign-in-form.tsx` / `sign-up-form.tsx` | Deprecar definitivamente — toda a lógica vive nas pages           |
| `card.tsx`             | Adicionar variant `flag-bg` que aceita prop `imageUrl` pra cards com bandeira atrás |
| `progress.tsx`         | Variant `urgent` (cor muda conforme `value` cresce — vai virando warning/danger) |

---

## 6. Tokens novos a adicionar (refinamento da V1)

```css
/* Sombras "carta" (estilo opção C, usar pontualmente) */
--b-shadow-card-hard: 4px 4px 0 var(--b-brand);
--b-shadow-card-soft: 0 12px 32px oklch(0.30 0.12 145 / 0.10), 0 2px 4px oklch(0.30 0.12 145 / 0.06);

/* Cores especiais pódio */
--b-gold:   oklch(0.78 0.16 85);
--b-silver: oklch(0.78 0.02 250);
--b-bronze: oklch(0.62 0.12 50);

/* Backgrounds editoriais */
--g-editorial-dark: linear-gradient(180deg, oklch(0.10 0.03 145), oklch(0.06 0.025 145));
--g-flag-overlay:   linear-gradient(135deg, oklch(0.46 0.22 145 / 0.85), oklch(0.30 0.18 145 / 0.95));

/* Tipografia "scoreboard" */
--font-scoreboard-size: clamp(3rem, 8vw, 6rem);
```

E uma utility:
```css
.text-scoreboard {
  font-family: var(--font-mono);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  font-size: var(--font-scoreboard-size);
  line-height: 1;
  letter-spacing: -0.02em;
}
```

---

## 7. Fases de execução

### **Fase 0 — Decisões (antes de codar)**
- [ ] Escolher direção visual (A/B/C ou mix).
- [ ] Aprovar wireframes deste documento.

### **Fase 1 — Padrões e componentes novos**
> Sem mudar telas ainda — só preparar o ferramental.
- [ ] Criar `BentoTile`, `Sparkline`, `PillTabs`, `DeltaBadge`, `FlagBg` em `@bolao/ui`.
- [ ] Criar `LiveClock`, `LockCountdown`, `DayHeader`, `Scorecard`, `HeroMatch` em `apps/web/src/components/match/`.
- [ ] Criar `StatTile`, `RankingRow`, `Podium`, `RuleToc`, `PointsMeter`.
- [ ] Adicionar tokens novos (gold/silver/bronze, gradientes editoriais).
- [ ] Página `/dev/components-v2` (rota oculta) pra validar todos visualmente em iso.

**Entregável:** todos os componentes novos prontos, build verde, dark/light validados.

### **Fase 2 — Dashboard**
- [ ] Implementar layout bento.
- [ ] Integrar HeroMatch com query do próximo jogo.
- [ ] Stat tiles com animated-number e sparkline.
- [ ] Lista compacta de próximos jogos com scorecards.
- [ ] Ranking compacto top-5.
- [ ] Timeline de rodadas (chart simples SVG).

**Entregável:** dashboard novo, comparação lado-a-lado com versão antiga via screenshots.

### **Fase 3 — Predictions**
- [ ] Reescrever página com agrupamento por dia.
- [ ] Sticky day headers com contador.
- [ ] Migrar `match-card.tsx` → `Scorecard`.
- [ ] Lock countdown com 3 níveis de urgência.
- [ ] Filtros (pill tabs).
- [ ] Mover DemoTutorial pra drawer acionado por `?`.

**Entregável:** página de palpites nova, fluxo de salvar idêntico mas com motion novo.

### **Fase 4 — Leagues**
- [ ] Lista de ligas em grid de cards.
- [ ] Página detalhe com pódio + ranking rows + tabs.
- [ ] Reorder animado com motion.layout.
- [ ] Drawer de convite com QR code (placeholder).
- [ ] Confetti opcional ao mudar líder.

**Entregável:** ligas com sensação competitiva real.

### **Fase 5 — Profile + Regras + Admin**
- [ ] Profile como "carteirinha do torcedor" + tabs.
- [ ] Regras com TOC sticky e PointsMeter visual.
- [ ] Admin operacional limpo.

**Entregável:** todas as 6 telas internas redesenhadas.

### **Fase 6 — Polimento global**
- [ ] Auditoria a11y completa (foco visível, contraste, keyboard nav).
- [ ] Lighthouse pass (target ≥ 90/95/100).
- [ ] Screenshots antes/depois pra cada tela.
- [ ] Atualizar `IMPLEMENTATION.md` e `RELATORIO_*.md`.
- [ ] Deploy + commit consolidado.

---

## 8. Riscos e decisões

| Risco / decisão                                        | Mitigação                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Layout bento pode quebrar muito no mobile              | Definir `grid-template-areas` por breakpoint. Stack simples no <640px.   |
| HeroMatch full-bleed pode ficar pesado                 | Lazy-load das bandeiras, blur de baixa qualidade primeiro (placeholder). |
| Reorder animado em ranking pode ser custoso            | Limitar motion.layout a top 20. Resto sem animação.                       |
| Sparklines aumentam bundle se usar lib (recharts etc.) | Implementar inline em SVG puro. ~30 linhas de código, zero dep.          |
| Confetti adiciona kb e pode ser cafona                 | Feature flag, opt-in, só em primeiro palpite cravado. Reduced-motion off. |
| Mudar `match-card.tsx` quebra dashboard e predictions  | Reescrever em paralelo (`scorecard.tsx`), trocar usos de uma vez no fim. |
| Tab "Histórico" da liga precisa de query nova          | Spec da query: pontos por rodada por usuário. Avaliar custo Convex.      |

---

## 9. Out of scope (V3+)

- PWA install / push notifications.
- Dark/light mode automático por hora do dia.
- Onboarding interativo guiado.
- Tema customizável por usuário (cor da liga, etc.).
- Internacionalização.
- App nativo / React Native.
- Histórico granular (palpite por palpite navegável no profile).

---

## 10. Definição de pronto (DoD por fase)

Cada fase só fecha quando:
1. ✅ Build verde (`bun run build`).
2. ✅ Type-check verde (`bun run check-types`).
3. ✅ Biome lint/format verde.
4. ✅ Dark e light mode validados na tela alvo.
5. ✅ Mobile (375px) e desktop (1440px) validados.
6. ✅ Sem regressão funcional (palpitar, criar liga, etc.).
7. ✅ Sem `console.error/warn`.
8. ✅ Screenshots antes/depois anexados ao commit.

---

## 11. Próximo passo

1. **Tu escolhe a direção visual** (A / B / C / mix) — sec. 1.
2. **Tu aprova ou ajusta os wireframes** — sec. 4.
3. Eu começo pela **Fase 1** (componentes novos) sem tocar nas telas, pra ter o ferramental pronto.
4. Vamos página por página da Fase 2 em diante, validando cada uma antes de seguir.

> Posso ir mais ousado nos diffs (entrega a página inteira) ou mais conservador (bloco por bloco). Tua chamada.
