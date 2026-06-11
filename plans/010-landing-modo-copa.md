# Plan 010: Landing page em modo Copa — hero da Copa 2026, contagem regressiva e copy atualizada

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: este plano foi escrito com os planos 001–006 aplicados
> na working tree sobre o commit `e87755c`. Não use `git diff` contra o SHA —
> confirme que os excertos de "Current state" batem com o código vivo
> (`apps/web/src/app/page.tsx`: `featureCards` na linha ~17, `pointsTiers` na ~44,
> `storySteps` na ~77, hero na ~165). Mismatch = STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW-MED (página pública, mas sem lógica de negócio)
- **Depends on**: 001–005 (DONE) — herda tokens repaginados e o modo Copa por padrão
- **Category**: direction
- **Planned at**: commit `e87755c` + planos 001–006 aplicados, 2026-06-10

## Why this matters

A landing (`/`) é a porta de entrada de usuário novo, e a Copa começa em **11/06/2026** (final em 19/07). A página atual é genérica — fala de "Copa 2026 · Brasileirão" em pé de igualdade, sem urgência nem cara de evento. Durante as 5 semanas do torneio, a landing deve **vender a Copa**: hero com a Copa em primeiro plano, contagem regressiva/status do torneio, e copy que reflete o que o app já faz hoje (grupos A–L, bracket do mata-mata em `/mata-mata`, ligas com critério de ranking escolhido pelo líder). É a continuação natural da repaginação do plano 005, que mudou tokens mas deliberadamente não tocou páginas.

## Current state

- `apps/web/src/app/page.tsx` (729 linhas) — landing inteira num arquivo. Server/client: **sem** `"use client"` no topo (confirme; se houver hooks, há diretiva). Estrutura:
  - Linhas 17-42: `featureCards` (3 cards: palpite, ligas, tempo real).
  - Linhas 44-75: `pointsTiers` (faixas de pontuação 10/7/5/2/0).
  - Linhas 77-87: `storySteps` (3 passos de onboarding).
  - Linhas 89-163: header sticky com logo "Bolão 2026", subtítulo "Copa 2026 · Brasileirão", `ThemeSwitch`, CTAs Entrar/Criar conta.
  - Linhas 165-429: hero — tags `["Copa 2026", "Brasileirão", "Ligas privadas"]`, headline, CTAs, e uma coluna direita ilustrativa.
  - Linhas 437-687: seções de features, pontuação, passos e CTA final.
- `apps/web/src/components/landing/logo-marquee.tsx` — marquee de logos usado pela landing.
- Componentes/tokens disponíveis: `Tag`, `buttonVariants` (`@bolao/ui`), tokens `var(--b-*)` e gradientes (`--b-hero-bg`, `--g-brand-diag`) em `packages/ui/src/styles/tokens.css` (repaginados pelo plano 005 — cores mais vivas).
- Rotas que a landing pode promover (todas atrás de login): `/predictions` (palpites por grupo), `/mata-mata` (bracket), `/leagues`, `/regras`.
- Datas-âncora do torneio: abertura 11/06/2026; fase de grupos até 27/06; final 19/07/2026.

Excerto do hero atual (`page.tsx:165-174`):

```tsx
<section className="mx-auto grid max-w-7xl gap-12 px-5 pt-10 pb-16 md:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:pt-16">
	<div className="max-w-3xl">
		{/* Tags */}
		<div className="mb-6 flex flex-wrap gap-2">
			{["Copa 2026", "Brasileirão", "Ligas privadas"].map((tag) => (
				<Tag key={tag} variant="brand">
					{tag}
				</Tag>
			))}
		</div>
```

Convenções: textos em português, tokens `var(--b-*)` (nunca cor hardcoded nova), headers com `text-eyebrow` + `font-display`/`text-display-*`, ícones `lucide-react`. A própria landing é o exemplar de estilo — mantenha a estrutura de seções e o sistema visual; este plano muda conteúdo e hierarquia, não o design system.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0              |
| Lint      | `bunx biome check apps/web` | exit 0           |
| Build     | `bun run build`          | exit 0              |
| Dev       | `bun run dev:web` (porta 3001) | landing abre sem login |

## Suggested executor toolkit

- Skills `make-interfaces-feel-better` e/ou `frontend-design`, se disponíveis, para o hero e a contagem regressiva.

## Scope

**In scope** (the only files you should modify/create):
- `apps/web/src/app/page.tsx`
- `apps/web/src/components/landing/` (novos componentes da landing, ex.: `cup-countdown.tsx`)

**Out of scope** (do NOT touch, even though they look related):
- `packages/ui/**` (tokens/botões — plano 005, já entregue).
- Páginas autenticadas, layout do app, backend.
- Buscar dados do Convex na landing (jogos reais, contagens) — a landing é estática/pública; nada de `useQuery` aqui neste plano (deferido, ver maintenance notes).
- Split estrutural completo da página em N componentes — extraia componente novo apenas quando criar conteúdo novo (ex.: countdown); não refatore o que já funciona.

## Git workflow

- Branch: `advisor/010-landing-copa`
- Commits em português (`feat(landing): ...` / `style(landing): ...`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Contagem regressiva / status do torneio

Crie `apps/web/src/components/landing/cup-countdown.tsx` (client component — precisa de relógio):

- Props: nenhuma. Internamente, três fases pelas datas UTC: antes de 11/06/2026 12:00 UTC → contagem regressiva ("Faltam Xd Yh Zm pra bola rolar"); entre 11/06 e 19/07 → "A Copa está rolando — palpite agora" (sem contagem); depois → não renderiza nada (`return null`).
- Atualize a cada minuto (`setInterval` de 60s dentro de `useEffect`, com cleanup).
- Visual: pílula/banner horizontal com tokens de destaque (`bg-[var(--b-brand-10)]`, borda `border-[var(--b-brand-25)]`, texto `text-[var(--b-brand)]`), ícone `Timer` do `lucide-react`. Evite layout shift: reserve a altura mesmo durante a hidratação (renderize o container com texto placeholder no SSR e troque no client, ou use `suppressHydrationWarning` no nó do tempo).

**Verify**: `bun run check-types` → exit 0.

### Step 2: Hero em modo Copa

Em `page.tsx`, seção hero (linhas ~165-429):

1. Tags: troque `["Copa 2026", "Brasileirão", "Ligas privadas"]` por `["Copa do Mundo 2026", "12 grupos · 104 jogos", "Ligas com amigos"]`.
2. Insira o `<CupCountdown />` logo acima ou abaixo da headline.
3. Headline/subheadline: reescreva para a Copa em primeiro plano. Direção de copy (adapte mantendo o tom existente): headline tipo "A Copa de 2026 começou. Crava aí." e subheadline mencionando palpites por grupo, bracket do mata-mata e ligas privadas. O Brasileirão vira menção secundária ("E o Brasileirão segue valendo no mesmo app"), não some.
4. Subtítulo do header (linha ~139, "Copa 2026 · Brasileirão"): troque para "Copa do Mundo 2026" durante o torneio — mudança simples de string, sem lógica de data (a página será revisitada pós-Copa).

**Verify**: `bun run dev:web` → hero mostra countdown/status e a nova copy nos dois temas, sem layout shift perceptível no carregamento.

### Step 3: Copy das seções alinhada ao produto real

1. `featureCards` (linhas 17-42): atualize o primeiro card para citar a experiência da Copa ("palpite os 2 jogos do seu grupo por rodada"); adicione um **quarto** card para o bracket: ícone `GitBranch`, título "Mata-mata ao vivo", descrição sobre acompanhar o chaveamento das pré-oitavas à final (o grid das features deve acomodar 4 — confira o `grid-cols` da seção, ajuste para `sm:grid-cols-2 lg:grid-cols-4` se necessário).
2. `featureCards` card de ligas: mencione que o líder escolhe o critério do ranking (pontos × cravadas) — feature real do plano 006.
3. `storySteps` (linhas 77-87): passo 01 vira algo como "Entre e palpite os jogos da Copa, grupo a grupo." (o torneio agora é automático — plano 001; não diga mais "escolha o torneio").
4. `pointsTiers`: **não mude os números** (10/7/5/2/0 refletem `calcPoints`); só revise rótulos se estiverem confusos.

**Verify**: `grep -n "Escolha o torneio" apps/web/src/app/page.tsx` → zero matches; `bun run check-types` → exit 0.

### Step 4: Passada final

Revise a página inteira nos dois temas e no viewport mobile (390px): hierarquia do hero, grid de 4 features, CTA final. `bun run check` (autofix de formatação — fluxo normal do repo) se o lint reclamar.

**Verify**: `bun run build` → exit 0; `bunx biome check apps/web` → exit 0.

## Test plan

Sem runner de testes; verificação manual:

- Antes do kickoff (mude o relógio do sistema ou ajuste temporariamente a data-âncora num teste local): countdown com dias/horas corretos.
- Durante o torneio: banner "Copa está rolando".
- Mobile: countdown não estoura a largura; grid de features empilha bem.
- Nenhuma menção a feature inexistente (cheque: bracket existe em `/mata-mata`? rankingMode existe em `leagues.ts`? — ambos entregues pelos planos 004/006; se o grep falhar, ajuste a copy).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `bunx biome check apps/web` exits 0
- [ ] `test -f apps/web/src/components/landing/cup-countdown.tsx` → exit 0
- [ ] `grep -n "CupCountdown" apps/web/src/app/page.tsx` → ≥ 1 match
- [ ] `grep -n "Escolha o torneio" apps/web/src/app/page.tsx` → zero matches
- [ ] `git status` só mostra arquivos do escopo
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Os excertos de "Current state" não baterem com o código (drift).
- A página tiver `"use client"` global e padrões que conflitem com inserir um client component — avalie e, se o ajuste passar de trivial, reporte.
- Você se ver adicionando `useQuery`/dados do Convex à landing — deferido de propósito.
- O grid de 4 features quebrar o layout e exigir mexer em componentes de `packages/ui`.

## Maintenance notes

- As datas-âncora (11/06, 19/07) ficam hardcoded no `cup-countdown.tsx` — após a final, o componente se auto-oculta, mas a copy do hero precisará de revisão pós-Copa (registre como follow-up).
- Follow-up deferido: seção "jogos de hoje" na landing com dados reais do Convex (exige decidir entre query pública ou SSG revalidado — design à parte).
- Revisor: cheque hidratação do countdown (layout shift / mismatch SSR) e que a copy não promete nada que o app não faz.
