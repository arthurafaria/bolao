# Relatório de Trabalho — 01/05/2026

**Projeto:** Bolão 2026 (Copa do Mundo + Brasileirão)
**Commit:** `bed746f`
**Deploy:** https://bolao-web-psi.vercel.app
**Repositório:** https://github.com/arthurafaria/bolao

---

## Resumo executivo

Repaginação completa do front-end do Bolão 2026. Identidade de cor preservada (verde hue 145 + amarelo hue 90), com profundidade de paleta expandida, sistema de motion do zero, 8 novos componentes, e todas as telas redesenhadas — landing, auth e app interno.

**29 arquivos alterados · 2.581 inserções · 1.314 remoções**

---

## 1. Planejamento

Criado `PLANO_REPAGINACAO_FRONTEND.md` antes de qualquer código — 18 seções cobrindo paleta, tipografia, catálogo de animações, novos componentes, estrutura de arquivos, 5 fases de execução, riscos mapeados e definição de pronto.

---

## 2. Fase 1 — Fundação CSS e Motion

### Novos arquivos

**`packages/ui/src/styles/tokens.css`**
Todos os tokens `--b-*` extraídos e expandidos:
- Paleta brand ampliada: `--b-brand-50`, `--b-brand-100`, `--b-brand-200`, `--b-brand-lo`, `--b-brand-hi`
- 4 cores de status com bg/fg próprios: `--b-success`, `--b-warning`, `--b-danger`, `--b-info`
- Sombras coloridas brand: `--b-shadow-brand-sm/md/lg/xl` e `--b-glow-brand`
- Gradientes prontos: `--g-brand-vert`, `--g-brand-diag`, `--g-brand-soft`, `--g-card-shine`
- Tokens dark mode atualizados com charcoal mais profundo e verdoso

**`packages/ui/src/styles/motion.css`**
Sistema de motion completo:
- Tokens de duração: `--motion-fast` (120ms) → `--motion-xslow` (900ms)
- 5 easings: `--ease-out-quart/back/expo/in-out` + spring
- 12 keyframes: `shimmer`, `shake`, `shine-sweep`, `pulse-glow`, `bounce-dot`, `fade-in`, `slide-up`, `slide-down`, `scale-in`, `float`, `spin-ring`, `count-up`
- Utilities: `.animate-shimmer`, `.animate-shake`, `.animate-pulse-glow`, `.animate-float`, `.animate-fade-in`, `.animate-slide-up`, `.animate-scale-in`
- `@media (prefers-reduced-motion: reduce)` global

**`packages/ui/src/styles/globals.css` — refatorado**
- Importa `tokens.css` e `motion.css`
- `:focus-visible` global: 2px outline brand, offset 2px
- Utilities de tipografia: `.text-display-hero/xl/lg/md/sm`, `.text-eyebrow`, `.text-numeric`
- Utilities de sombra e backgrounds semânticos

**Dependência instalada:** `motion@12.38.0`

---

## 3. Fase 2 — Componentes Base (Design System)

### Componentes reescritos

| Arquivo | O que mudou |
|---|---|
| `button.tsx` | 8 variants (brand, accent, success, danger, danger-solid, outline, ghost, link), prop `loading` nativa com spinner inline, hover `scale(1.02)` + sombra brand, efeito shine sweep, `rounded-xl` padrão |
| `input.tsx` | `rounded-xl`, h-10, ring brand no foco, aria-invalid com shake |
| `card.tsx` | 5 variants (default, elevated, inset, gradient, ghost), prop `hoverable` com lift |
| `skeleton.tsx` | Shimmer animado (gradient sweep) no lugar do pulse estático |
| `progress.tsx` | Barra rounded, cor brand, transição `ease-out-expo` |
| `sonner.tsx` | Ícones com cores de status brand, CSS vars por tipo de toast |
| `theme-switch-button.tsx` | View Transitions API com fallback gracioso |

### Componentes novos

| Arquivo | Descrição |
|---|---|
| `spinner.tsx` | Dual-ring: anel externo brand + anel interno accent em sentido oposto. Tamanhos xs/sm/md/lg/xl |
| `dots-loader.tsx` | 3 bolinhas com bounce em sequência, label opcional |
| `tag.tsx` | Pill com 6 variants (brand, accent, success, warning, danger, muted), prop `dot` |
| `animated-number.tsx` | Contagem rolante via `requestAnimationFrame` com ease-out expo |
| `floating-input.tsx` | Label flutuante animada, slot de ícone, slot de feedback, erro com slide-up (dentro de `input.tsx`) |
| `empty-state.tsx` | Estado vazio padronizado com ícone, título, descrição, slot de action |
| `page-transition.tsx` | Wrapper de `animate-slide-up` por mudança de rota |

---

## 4. Fase 3 — Landing Page e Auth

### Landing (`apps/web/src/app/page.tsx`) — reescrita completa

- **Header sticky** com blur 20px, borda suave, logo + botões ghost + CTA brand com shine
- **Hero**: headline com destaque verde em "bonito", dashboard mockup flutuando (`animate-float` 6s), stats com hover lift e sombra brand
- **Marquee de times** — 16 bandeiras de seleções rolando com máscara de fade nas bordas (`logo-marquee.tsx`)
- **Features** — 3 cards com hover lift (`-translate-y-1`), ícone scala no hover, `Tag` component
- **Seção Pontuação** — 4 tiers visuais (10pts placar exato → 0pts errou) com chips coloridos por nível
- **Stepper "Como funciona"** — 3 passos com linha conectora gradiente vertical, cards flutuando ao lado
- **CTA final** — fundo gradiente brand diagonal, textura de dots, botão branco
- **Footer** — logo + link Regras + copyright (não existia antes)

### Auth Layout (`apps/web/src/app/(auth)/layout.tsx`)

- Painel de branding com `animate-fade-in`, dot pulsando (`animate-pulse-glow`), hero text com `animate-slide-up`
- Card do formulário com `animate-scale-in` na entrada
- Mobile: logo decente no topo antes do form (antes sumia tudo)

### Sign-in (`apps/web/src/app/(auth)/sign-in/page.tsx`)

- `FloatingInput` com ícones (Mail, Lock)
- Botão `variant="brand"` com `loading` nativo
- Headline com destaque verde em "de volta"

### Sign-up (`apps/web/src/app/(auth)/sign-up/page.tsx`)

- `FloatingInput` com ícones (User, Mail, Lock)
- **Medidor de força de senha**: barra tricolor (fraca/média/forte) + 3 checks inline animados
- Benefits com checkmarks brand
- Botão `variant="brand"` com `loading`

### Forgot-password (`apps/web/src/app/(auth)/forgot-password/page.tsx`)

- `FloatingInput` com ícones (Mail, Hash, Lock)
- Botão `variant="brand"` com `loading`
- Headlines com destaque verde

---

## 5. Fase 4 — App Interno

### Layout do app (`apps/web/src/app/(app)/layout.tsx`)

**Sidebar desktop:**
- Barra indicadora vertical esquerda que aparece/desaparece com animação (height 0% → 60%) em vez de background em cada item
- Hover dos links com transição de cor suave
- Botão logout vira vermelho no hover (`--b-danger-bg`)
- Logo menor e mais compacto

**Mobile bottom nav:**
- Pill de background brand que aparece na aba ativa com `animate-scale-in`
- Ícone da aba ativa faz `scale(1.08)`
- `padding-bottom: env(safe-area-inset-bottom)` para iOS

**Tela de loading (auth resolver):**
- Trocou o spinner genérico pelo logo trofeu pulsando com `animate-pulse-glow` e `--b-glow-brand`
- Microcopy: "Preparando o gramado…"

**Dropdown de competição:**
- Abre com `animate-scale-in`, borda e sombra brand

### Match card (`apps/web/src/components/match-card.tsx`)

- Botão "Salvar" com hover `scale(1.04)` + sombra brand
- "✓ Salvo" aparece em verde (`--b-success`) com `animate-slide-up`

### Loader geral (`apps/web/src/components/loader.tsx`)

- Substituiu `<Loader2>` simples pelo logo trofeu pulsando com glow

---

## 6. Fase 5 — Polimento

- `progress.tsx`: borda arredondada e transição brand
- `sonner.tsx`: cores de status nos ícones e fundos dos toasts
- Type-check zerado: 0 erros TypeScript
- Build de produção: 13 rotas compilando, exit code 0

---

## 7. Entrega

| Item | Status |
|---|---|
| Build (`bun run build`) | ✅ Exit code 0 |
| Type-check (`check-types`) | ✅ Exit code 0 |
| Push GitHub (`master`) | ✅ `bed746f` |
| Deploy Vercel | ✅ Ready |

**URL produção:** https://bolao-web-psi.vercel.app

---

## 8. Números do dia

| Métrica | Valor |
|---|---|
| Arquivos alterados | 29 |
| Linhas adicionadas | 2.581 |
| Linhas removidas | 1.314 |
| Novos componentes UI | 8 |
| Novas keyframes CSS | 12 |
| Novos tokens de design | ~60 |
| Rotas cobertas | 13 |
| Fases executadas | 5/5 |
