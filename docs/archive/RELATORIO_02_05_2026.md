# Relatório de Trabalho — 02/05/2026

**Projeto:** Bolão 2026 (Copa do Mundo + Brasileirão)
**Plano fonte:** `PLANO_REPAGINACAO_FRONTEND_V2.md`
**Repositório:** https://github.com/arthurafaria/bolao

---

## Resumo executivo

Repaginação V2 — aprofundamento em cima da V1 (01/05). Direção visual fixa: **Editorial Sportivo**. Foco: redesenhar **todas as 6 telas internas** que tinham ficado com cara de produto antigo, introduzir **15 componentes novos** com motion próprio, e ampliar o catálogo de **animações UX** para padronizar o feedback do produto.

**Restrição respeitada:** abas/sidebar/bottom nav permaneceram idênticas — só o conteúdo dentro de cada rota foi tocado.

---

## 1. Plano (Fase 0)

`PLANO_REPAGINACAO_FRONTEND_V2.md` consolidado: decisões fechadas (§0.1), 18 seções, **§4.7 catálogo de animações UX** com ~14 grupos de microinterações (entrada de página, números, botões, inputs, listas, lock countdown, hero, pódio, scorecard, bento, tabs, toasts, page transitions, reduced-motion).

---

## 2. Fundação V2 (Fase 1)

### Tokens novos

`packages/ui/src/styles/tokens.css` ganhou:
- **Pódio:** `--b-gold`, `--b-silver`, `--b-bronze` + bgs equivalentes (light + dark).
- **Sombras editoriais:** `--b-shadow-card-hard` (4px brand offset) e `--b-shadow-card-soft` (multi-layer brand).
- **Gradientes:** `--g-editorial-dark`, `--g-flag-overlay`, `--g-hero-match`.
- **Tipografia scoreboard:** `--font-scoreboard-size: clamp(3rem, 8vw, 6rem)`.

### Keyframes UX novos

`packages/ui/src/styles/motion.css`:
`number-pop`, `ripple`, `ring-success`, `pulse-warning`, `pulse-danger`, `slide-in-right`, `slide-in-left`, `podium-rise`, `glow-breath`, `flip-down`, `border-flash` + utility `.stagger-children` parametrizada por `--i` e `--d`.

### 15 componentes novos

**UI lib (`packages/ui`):**
| Componente | Função |
|---|---|
| `sparkline.tsx` | Mini-gráfico SVG inline, zero deps |
| `delta-badge.tsx` | ▲/▼/— colorido com cor automática |
| `pill-tabs.tsx` | Tab bar com pílula deslizante (motion CSS) |
| `bento-tile.tsx` | Container bento variants default/accent/gold/dark + sub-componentes |
| `flag-bg.tsx` | Bandeira com blur + overlay |

**Web (`apps/web/src/components`):**
| Componente | Função |
|---|---|
| `match/live-clock.tsx` | Countdown HH:MM:SS auto-atualizando |
| `match/lock-countdown.tsx` | 4 níveis de urgência (calm/warning/danger/critical com pulse) |
| `match/day-header.tsx` | Sticky header de dia com progress bar |
| `match/scorecard.tsx` | Substituto horizontal do match-card, com ring-success ao salvar |
| `match/hero-match.tsx` | Banner full-bleed do próximo jogo, tilt 3D no mouse |
| `dashboard/stat-tile.tsx` | Tile editorial com AnimatedNumber + Sparkline + DeltaBadge |
| `leagues/ranking-row.tsx` | Linha premium com avatar colorido, coroa flutuante no 1º |
| `leagues/podium.tsx` | 3 colunas com `podium-rise` em sequência |
| `regras/points-meter.tsx` | Tier chips clicáveis com exemplo numérico |
| `regras/rule-toc.tsx` | Sumário sticky com IntersectionObserver |

---

## 3. Dashboard (Fase 2)

`apps/web/src/app/(app)/dashboard/page.tsx` — reescrita do zero.

- **Header editorial:** eyebrow com torneio + headline duas linhas, "ao seu painel" em verde brand.
- **HeroMatch full-bleed** com bandeiras, glow respirando, tilt 3D, countdown 60–96px, CTA brand com shine.
- **Bento de 4 stat tiles:** Pontos (accent), Palpites, Exatos (gold se >0), Precisão (%) — todos com `AnimatedNumber`.
- **2 colunas (lg+):** próximos jogos com Scorecard + stagger 70ms à esquerda; sidebar com Top Liga em BentoTile dark + lista compacta de outras ligas + CTA criar liga (se 0).

---

## 4. Predictions (Fase 3)

`apps/web/src/app/(app)/predictions/page.tsx` — agrupamento por dia substituiu agrupamento por rodada.

- **PillTabs com 3 filtros + contadores:** Pendentes (Target), Próximos (Trophy), Histórico (History).
- **DayHeader sticky** com `HOJE`/`AMANHÃ`/dia da semana, contador `X/Y palpitados` colorido por estado, progress bar inferior animada.
- **Scorecard horizontal** substituiu MatchCard vertical. Inputs +/− com number-pop. Lock countdown 4 níveis. Ring-success ao salvar.
- **Modo Demo:** banner amarelo discreto + drawer lateral acionado pelo botão `?` (saiu do meio da página, virou opt-in com slide-up stagger nos 4 passos).
- **Empty states** específicos por tab.
- Stagger 60ms entre scorecards do mesmo dia.

---

## 5. Leagues (Fase 4)

`apps/web/src/app/(app)/leagues/page.tsx` (lista):
- Header editorial + CTA "Criar liga" brand.
- **Mini-stats** Ligas/Pontos/Adversários.
- **JoinLeagueCard** com input mono CAPS LOCK tracking 0.4em.
- **Grid de LeagueCards** 2 colunas, stagger 70ms, com pontos GIGANTES + link "Abrir liga" deslizante.
- Dialog Criar Liga repaginado com OPEN/MODERATED em cards selecionáveis.

`apps/web/src/app/(app)/leagues/[id]/page.tsx` (detalhe):
- Back link sutil + header com nome 60px + meta.
- **Pódio** com `podium-rise` em sequência (3º→2º→1º), Crown flutuante no 1º.
- **Ranking** com RankingRow premium (avatar colorido por hash, borda colorida no top-3, ring brand se for você), stagger 40ms.
- **InviteSheet** drawer lateral com código gigante em mono, botões Copiar + Compartilhar (`navigator.share` quando disponível).

`apps/web/src/app/(app)/leagues/[id]/members/[userId]/page.tsx` — também upgradeada:
- Hero do membro com avatar 80px colorido, Crown se for 1º lugar, pontos GIGANTES com borda lateral colorida (ouro/prata/bronze).
- Lista de palpites bloqueados em Scorecards `readOnly` com stagger.

---

## 6. Profile, Regras, Admin (Fase 5)

### `/profile` — carteirinha do torcedor
- Hero com gradiente brand + textura dots, avatar 80–96px com cor derivada do hash do nome.
- Nome em Barlow Condensed Black 60px, editável inline.
- 3 hero stats + bento de 4 StatTiles detalhados.
- Card "Taxa de acerto" com número 60px e barra animada.
- Botão Sair com `variant="danger"`.

### `/regras` — manual editorial
- Layout 2 colunas (lg+): TOC sticky 220px + conteúdo.
- TOC ativo via IntersectionObserver com barrinha brand vertical.
- 5 sections com ícones temáticos coloridos (CheckCircle/XCircle/Clock/Trophy).
- `<PointsMeter />` interativo + box brand com fórmula em lista.
- ExampleRow com bloco de pts colorido por tier.

### `/admin` — painel operacional
- Acesso restrito amigável com Lock icon se não-admin.
- 3 sections (Sincronização, Recomputação, Correção).
- ActionCard padronizado com Button `loading` + confirm dialog opcional + toast + log inline.
- Form de patch placar com confirm explícito.

---

## 7. Higiene de código (Fase 6 parcial)

Removidos arquivos legados não usados (substituídos por novos):
- `apps/web/src/components/match-card.tsx` → substituído por `match/scorecard.tsx`
- `apps/web/src/components/sign-in-form.tsx` → toda a lógica vive na page
- `apps/web/src/components/sign-up-form.tsx` → idem
- `apps/web/src/components/header.tsx` → não usado, layout cuida disso
- `apps/web/src/components/user-menu.tsx` → não usado
- `apps/web/src/components/mode-toggle.tsx` → ThemeSwitch da `@bolao/ui` cobre

Auditoria a11y das telas novas: foco visível global ativo (`globals.css :focus-visible`), aria-labels em todos os botões só com ícone (edit name, +/−, ?, etc.), `aria-live="polite"` em countdowns e numbers.

---

## 8. Animações UX implementadas

- **Página entra:** `animate-fade-in` em todas as 6 telas + stagger nos filhos.
- **Stat tiles:** AnimatedNumber rolando ao montar.
- **Scorecard:** number-pop nos inputs, ring-success ao salvar, hover lift.
- **Lock countdown:** 4 níveis de urgência (`calm` → `warning` → `danger` → `critical` com `animate-pulse-danger`).
- **HeroMatch:** glow-breath infinito, tilt 3D `rotateX/Y` máx 4° no mouse, LiveClock auto-atualizando.
- **Pódio:** podium-rise com delay 0/120/240ms (3º→2º→1º), Crown floating, ring colorido por posição.
- **Ranking:** stagger 40ms, hover lift + brand shadow, ring brand se for você.
- **Bento:** stagger 70ms, hover translate-y-1 + brand shadow.
- **Pill tabs:** pílula desliza com transition CSS no `left`/`width`.
- **Drawers:** slide lateral com fade overlay (sheet do `@bolao/ui`).
- **DayHeader:** progress bar com `--motion-medium` ease-out-expo.
- **Reduced-motion:** todas honram `@media (prefers-reduced-motion: reduce)` global.

---

## 9. Validação

| Checkpoint | Status |
|---|---|
| Type-check (`bun run check-types`) | ✅ exit 0 |
| Build (`bun run build`) | ✅ exit 0 |
| Rotas compiladas | ✅ 14 rotas |
| Regressão funcional | ✅ todas as queries Convex preservadas |
| `console.error/warn` no build | ✅ nenhum |

---

## 10. Números do dia

| Métrica | Valor |
|---|---|
| Telas internas redesenhadas | 6 |
| Componentes novos criados | 15 |
| Keyframes UX novos | 11 |
| Tokens novos | ~12 |
| Arquivos legados removidos | 6 |
| Arquivos novos | ~17 |
| Plano V2 atualizado | §0.1, §4.7 |

---

## 11. O que ficou de fora (próximos ciclos)

- Lighthouse pass formal (precisa browser rodando — não dá pra automatizar daqui).
- Screenshots antes/depois (idem).
- Bundle analysis do `motion` (não foi usado ainda — animações estão em CSS puro).
- Confetti em primeiro palpite cravado (feature flag).
- ErrorBoundary global.
- Sparklines reais nos StatTiles (precisa de query Convex que retorne pontos por rodada — out of scope V2).
- Tab "Histórico" da liga com chart de evolução (idem).

---

## 12. Próximos passos sugeridos

1. **Deploy + validação visual em produção** — acessar `bolao-web-psi.vercel.app` e percorrer cada tela em desktop e mobile.
2. **Commit consolidado** dos 17+ arquivos novos + 6 reescritos + 6 deletados.
3. Decidir se vale a pena adicionar uma query Convex `getPointsByMatchday` pra alimentar sparklines reais.
4. Adicionar ErrorBoundary global em `app/(app)/layout.tsx` numa próxima janela.
