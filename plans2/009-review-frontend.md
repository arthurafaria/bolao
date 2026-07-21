# Review de Frontend (Next.js / UI) — Chuta de Bico

> **O que é**: uma revisão de UI/UX e acessibilidade do frontend, feita com a skill
> `web-design-guidelines` (Web Interface Guidelines da Vercel, buscadas na fonte oficial em
> 2026-07-21). Documento de **review** (achados + recomendações), não um plano passo a passo.
> Read-only: nenhum código foi alterado.
>
> **Revisado no commit**: `857d0d0`, 2026-07-21. **Escopo**: `apps/web/src/**` — foco nas
> telas e componentes mais usados (root layout, app layout, dashboard, predictions, scorecard,
> hero-match, admin, providers). Não é exaustivo por arquivo.

## Veredito

O frontend é visualmente forte e bem tokenizado (design system "Noite de Jogo": `var(--b-*)`,
`tabular-nums`, `Image` com fallback de escudo, empty states cuidados, `<Link>` pra navegação).
Os gaps são de **acessibilidade e plataforma**, não de estética: **(1)** motion pesado sem
respeitar `prefers-reduced-motion`, **(2)** metadata de viewport/theme-color/color-scheme
ausente, **(3)** `outline-none` sem substituto de foco em vários lugares, e **(4)** estado de
navegação (abas, rodada, torneio) fora da URL. Nada disso bloqueia o pivot, mas #1 e #3
afetam usuários reais de teclado e com sensibilidade a movimento.

## Achados (ordenados por alavancagem)

| # | Achado | Categoria | Impacto | Esforço | Confiança |
|---|--------|-----------|---------|---------|-----------|
| F1 | Sem `prefers-reduced-motion` global; app é cheio de animação | a11y (motion) | Tilt/glow/stagger ignoram a preferência do usuário | S | ALTA |
| F2 | Falta `viewport`/`themeColor`/`color-scheme` no root | plataforma/theming | Barra do navegador e controles nativos não batem com o dark | S | ALTA |
| F3 | `outline-none` sem `focus-visible` em vários inputs/botões | a11y (foco) | 6 arquivos usam `outline-none`, só 3 usam `focus-visible` | M | MED |
| F4 | Estado (abas, rodada, torneio) fora da URL | navegação | Sem deep-link; Cmd+click e voltar não preservam a aba/rodada | M | ALTA |
| F5 | Listas grandes sem virtualização | performance | Palpites busca a temporada inteira (>50 itens) e renderiza tudo | M | MED |
| F6 | `HeroMatch` faz `setState` a cada `mousemove` (tilt) | performance | Re-render em rajada no hover do hero | S | ALTA |
| F7 | `ScoreInput`: mesmo `aria-label="Placar"` nos dois inputs | a11y (form) | Leitor de tela não distingue mandante/visitante | S | ALTA |
| F8 | Resultado de ação do admin sem `aria-live` | a11y | Atualização assíncrona não é anunciada | S | MED |

---

### F1 — Motion sem `prefers-reduced-motion` global

- **Evidência**: `grep prefers-reduced-motion apps/web/src` retorna **só** `logo-marquee.tsx:63`.
  O resto do app usa animações intensas sem guarda: `hero-match.tsx:38-54` (tilt no mousemove),
  `hero-match.tsx:81` (`animate-glow-breath`), `layout.tsx` (`animate-scale-in`,
  `animate-pulse-glow`), `scorecard.tsx` (`animate-number-pop`, `animate-ring-success`),
  `stagger-children` em várias páginas.
- **Impacto**: usuários com `prefers-reduced-motion: reduce` (vestibular, enxaqueca) recebem
  todo o movimento mesmo assim. A guideline exige honrar essa preferência.
- **Esforço**: S. **Fix sketch**: um bloco global no `index.css`:
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
  e, no `hero-match.tsx`, checar `window.matchMedia("(prefers-reduced-motion: reduce)")`
  antes de registrar o listener de tilt.

### F2 — Sem `viewport` / `themeColor` / `color-scheme`

- **Evidência**: `app/layout.tsx:29-32` só exporta `title`+`description`. Não há
  `export const viewport: Viewport`, nem `themeColor`, nem `color-scheme` no `<html>`
  (grep por `viewport|theme-color|color-scheme` em `apps/web/src` → **vazio**). O app é
  dark-first (`providers.tsx:16` `defaultTheme="dark"`).
- **Impacto**: a barra de status/URL do navegador mobile não acompanha o fundo escuro, e
  controles nativos (scrollbar, date picker, autofill) renderizam em light. A guideline pede
  `color-scheme: dark` no `<html>` e `<meta name="theme-color">` igual ao fundo.
- **Esforço**: S. **Fix sketch**: em `app/layout.tsx`, adicionar
  `export const viewport: Viewport = { themeColor: "#0b0d10" }` (usar a cor real de
  `--b-bg`) e `colorScheme: "dark"`; ou `style={{ colorScheme: "dark" }}` no `<html>`.
  Como o tema pode alternar (next-themes), idealmente `themeColor` com os dois esquemas.

### F3 — `outline-none` sem substituto de foco

- **Evidência**: 6 arquivos usam `outline-none` (`layout.tsx`, `leagues/[id]/page.tsx`,
  `profile/page.tsx`, `sign-up/page.tsx`, `sign-in/page.tsx`, `scorecard.tsx`) mas só 3
  arquivos no app usam `focus-visible`. Ex. concreto: `scorecard.tsx:161-166` — o input de
  placar tem `outline-none` e nenhum `focus-visible:ring`. `layout.tsx:386` — o trigger do
  dropdown de avatar tem `outline-none`.
- **Impacto**: usuários de teclado perdem o indicador de foco nesses controles. A guideline é
  explícita: nunca `outline-none` sem um substituto `focus-visible`.
- **Esforço**: M (auditar cada uso). **Fix sketch**: para cada `outline-none`, adicionar
  `focus-visible:ring-2 focus-visible:ring-[var(--b-brand)] focus-visible:ring-offset-2`
  (ou equivalente do design system). Verificar os inputs de auth e o input de placar primeiro.

### F4 — Estado de UI fora da URL

- **Evidência**: `predictions/page.tsx:72` (`useState<FilterTab>`) — aba em estado local;
  a rodada selecionada (após plano 004) também será local; o torneio vai pra `localStorage`
  (`tournament-context.tsx:55`).
- **Impacto**: não dá pra compartilhar/deep-linkar "Rodada 12" nem a aba "Meus palpites";
  Cmd+click e o botão voltar não preservam o estado. A guideline pede URL refletindo
  filtros/abas/paginação.
- **Esforço**: M. **Fix sketch**: mover aba e rodada pra query params
  (`?tab=mine&rodada=12`) com `useSearchParams`/`router.replace`. Fica ainda mais relevante
  com a navegação por rodada do plano 004 — bom candidato a implementar **junto** dele.
- **Onde entra**: fold no plano 004 (que reescreve a navegação de Palpites).

### F5 — Listas grandes sem virtualização

- **Evidência**: `predictions/page.tsx` renderiza `Scorecard` para todas as matches
  retornadas por `getAllByDate` (a temporada inteira; ver achado B4 do review de backend);
  a aba "Meus palpites" também cresce sem limite ao longo da temporada.
- **Impacto**: com 380 jogos / muitos palpites, monta centenas de nós pesados de uma vez. A
  guideline recomenda virtualizar listas >50.
- **Esforço**: M. **Fix sketch**: a própria navegação por rodada (plano 004) já resolve o
  caso principal (mostra ~10 jogos por vez). Para "Meus palpites", paginar ou limitar por
  padrão. Não introduzir virtualização preventiva se a UI por rodada já limita o render.
- **Onde entra**: majoritariamente resolvido pelo plano 004; anotar o caso "Meus palpites".

### F6 — `HeroMatch` re-renderiza a cada `mousemove`

- **Evidência**: `hero-match.tsx:41-46` — `onMove` chama `setTilt({...})` a cada evento de
  mousemove enquanto o cursor está sobre o hero.
- **Impacto**: rajada de re-renders no hover (desktop). Escala pequena (um card), mas é
  trabalho desnecessário na thread principal.
- **Esforço**: S. **Fix sketch**: escrever o tilt direto em CSS custom properties via `ref`
  (`el.style.setProperty("--rx", ...)`) sem `setState`, ou dar `throttle`/`requestAnimationFrame`.
  Combinar com F1 (desligar tilt sob reduced-motion).

### F7 — `ScoreInput` com `aria-label` duplicado

- **Evidência**: `scorecard.tsx:167` — ambos os inputs de placar (mandante e visitante) usam
  `aria-label="Placar"`.
- **Impacto**: leitor de tela anuncia os dois campos igual; o usuário não sabe qual é qual.
- **Esforço**: S. **Fix sketch**: passar um label distinto por lado, ex.
  `aria-label={\`Placar de ${homeName}\`}` e `\`Placar de ${awayName}\``.

### F8 — Resultado assíncrono do admin sem `aria-live`

- **Evidência**: `admin/page.tsx:23-44` (`ResultLog`) renderiza o resultado da ação num
  `<pre>` sem região `aria-live`.
- **Impacto**: quando a ação termina e o log aparece, leitores de tela não anunciam. A
  guideline pede `aria-live="polite"` para updates assíncronos. (Os toasts do `sonner` já
  cobrem parte disso — impacto menor.)
- **Esforço**: S. **Fix sketch**: `aria-live="polite"` no container do `ResultLog`.

## O que já está bom (não mexer)

- **Open redirect tratado corretamente**: `safe-redirect.ts:7-11` rejeita `//` e paths
  externos — bom.
- **Navegação semântica**: nav e CTAs usam `<Link>`/`<button>`, não `<div onClick>`.
- **Imagens com fallback**: `TeamCrest`/`HeroCrest` têm `width`/`height`, `alt={name}` e
  `onError` → placeholder de iniciais.
- **Fontes com `display: swap`** (`app/layout.tsx:8-27`) e `<html lang="pt-BR">`.
- **`tabular-nums`** aplicado em placares/contadores — números não "dançam".
- **Empty states** cuidados em predictions/dashboard/admin.
- **`logo-marquee.tsx`** já respeita `prefers-reduced-motion` — usar como referência pro F1.

## Como isto se conecta aos planos

- **F4** e **F5** casam com o plano 004 (reescrita de Palpites por rodada) — implementar lá.
- **F1, F2, F3, F7, F8** são melhorias transversais de a11y/plataforma, independentes do
  pivot; podem virar **um único plano** "Acessibilidade & plataforma" (`010`+), de esforço S–M
  e risco baixo. Recomendo priorizar **F1** (reduced-motion) e **F3** (foco) — impacto real em
  usuários de teclado e sensíveis a movimento.
- **F6** é micro-perf; junto do F1 no mesmo passe do `hero-match`.
