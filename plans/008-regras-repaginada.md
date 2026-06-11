# Plan 008: Repaginar a página de Regras — mais bonita, mais explicativa, "jogue do seu jeito"

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e87755c..HEAD -- "apps/web/src/app/(app)/regras" apps/web/src/components/regras`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: nenhum obrigatório; idealmente após 005 (tokens novos) e 006 (critério de ranking por liga existir de verdade)
- **Category**: direction / docs
- **Planned at**: commit `e87755c`, 2026-06-10

## Why this matters

A página de regras é onde um usuário novo decide se entendeu o jogo. O dono do produto pediu: deixá-la **mais bonita e explicativa**, e deixar claro que dá para **jogar do jeito do site ou do jeito do usuário** — isto é, as regras padrão valem em qualquer lugar, mas o líder de uma liga pode personalizar o critério da disputa (plano 006: ranking por pontos ou por cravadas; plano 007, se aterrissar: pesos e fechamento próprios). Hoje a página já tem boa estrutura (TOC + seções + medidor interativo de pontos), mas não menciona personalização por liga, não cobre a Copa (fases, mata-mata) e o tom é mais técnico que convidativo.

## Current state

- `apps/web/src/app/(app)/regras/page.tsx` (356 linhas) — client component. Estrutura: header editorial → grid `[220px_1fr]` com `RuleToc` sticky à esquerda e seções à direita. TOC atual (linhas 8-14): `pontuacao`, `exemplos-certo`, `exemplos-errado`, `prazo`, `ligas`.
- `apps/web/src/components/regras/points-meter.tsx` — visualização interativa da pontuação (mantém).
- `apps/web/src/components/regras/rule-toc.tsx` — TOC com âncoras (`items: { id, label }[]`).

Excerto de `regras/page.tsx:8-24`:

```tsx
const TOC = [
	{ id: "pontuacao", label: "Sistema de pontuação" },
	{ id: "exemplos-certo", label: "Acertou o resultado" },
	{ id: "exemplos-errado", label: "Errou o resultado" },
	{ id: "prazo", label: "Prazo pra palpitar" },
	{ id: "ligas", label: "Ligas privadas" },
];

const SCORING_RULES = [
	{ pts: "+5", desc: "por acertar o resultado (vitória ou empate)" },
	{ pts: "+2", desc: "por acertar os gols do time da casa" },
	{ pts: "+2", desc: "por acertar os gols do time visitante" },
	{ pts: "+1", desc: "bônus de placar exato (quando os dois +2 caem na mesma jogada)" },
];
```

Fatos do produto que a página deve refletir (fonte: código em `packages/backend/convex/predictions.ts` e `leagues.ts`):

- Pontuação padrão: +5 resultado, +2 gols de cada time, +1 bônus de exato (máximo 10).
- Palpites fecham **1h antes** do jogo; depois disso ficam visíveis para membros das mesmas ligas.
- Ligas: até 50 membros, entrada aberta ou moderada, código de 6 caracteres.
- **Se o plano 006 já aterrissou** (verifique: `grep -n "rankingMode" packages/backend/convex/leagues.ts` retorna match): o líder escolhe o critério de ranking (mais pontos ou mais cravadas). **Se o 007 também aterrissou** (`grep -n "lockPolicy" packages/backend/convex/schema.ts`): pesos de pontuação e fechamento personalizados por liga. Escreva a copy conforme o que EXISTE — nada de prometer feature que não está no código.
- Copa 2026: 12 grupos (A–L), 2 melhores + 8 melhores terceiros avançam; mata-mata: pré-oitavas (32) → oitavas → quartas → semis → 3º lugar → final em 19/07.

Convenções visuais: tokens `var(--b-*)`, headers com `text-eyebrow` + `font-display` uppercase, cards `rounded-2xl`/`rounded-[28px]` com `border-[var(--b-border-sm)]`. A própria página é o exemplar — siga o estilo das seções existentes.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0              |
| Lint      | `bunx biome check apps/web` | exit 0           |
| Build     | `bun run build`          | exit 0              |
| Dev       | `bun run dev:web` + `bun run dev:server` | app na porta 3001 |

## Suggested executor toolkit

- Skill `make-interfaces-feel-better`, se disponível, para a hierarquia visual das seções novas.

## Scope

**In scope** (the only files you should modify):
- `apps/web/src/app/(app)/regras/page.tsx`
- `apps/web/src/components/regras/` (novos componentes de seção, se necessário)

**Out of scope** (do NOT touch, even though they look related):
- `points-meter.tsx` e `rule-toc.tsx` — funcionam; reutilize.
- Backend (`packages/backend/**`) — a página só descreve o que existe.
- Tokens/`packages/ui` (plano 005).

## Git workflow

- Branch: `advisor/008-regras-repaginada`
- Commits em português (`feat(regras): ...` / `style(regras): ...`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Nova seção "Do seu jeito ou do nosso"

Adicione ao TOC (`{ id: "seu-jeito", label: "Jogue do seu jeito" }`) e crie a seção correspondente, posicionada logo após "Sistema de pontuação". Conteúdo (adapte a copy ao que existir no código — ver "Current state"):

- Card 1 — "O jeito do site": pontuação padrão (resuma com os mesmos números do `SCORING_RULES`), fechamento 1h antes, ranking por pontos. Vale em todo lugar por padrão.
- Card 2 — "O seu jeito": numa liga, o líder decide o critério do ranking (mais pontos × mais cravadas)\[, os pesos da pontuação e o momento de fechamento — só se o 007 existir\]. CTA `Link` para `/leagues` ("Criar minha liga").

Use dois cards lado a lado (`grid sm:grid-cols-2 gap-3`), no padrão visual dos botões-cartão de `apps/web/src/app/(app)/leagues/page.tsx:94-125`.

**Verify**: `bun run check-types` → exit 0; seção aparece e a âncora do TOC rola até ela.

### Step 2: Seção "Como funciona a Copa 2026"

Adicione ao TOC (`{ id: "copa", label: "Formato da Copa" }`) e crie uma seção curta e visual:

- Linha do tempo das fases: Grupos (12 grupos A–L, 11–27/06) → Pré-oitavas → Oitavas → Quartas → Semis → Final (19/07). Pode ser uma lista horizontal com setas/chevrons (`lucide-react`: `ChevronRight`) em chips `rounded-full border`.
- Um parágrafo: classificam-se os 2 primeiros de cada grupo + os 8 melhores terceiros.
- Se o plano 004 (bracket) já existir (rota `/mata-mata`), inclua um `Link` "Ver o chaveamento".

**Verify**: visualmente correta nos dois temas.

### Step 3: Polimento das seções existentes

Sem reescrever o conteúdo técnico (os números vêm do código e estão certos):

1. Revise a copy para tom convidativo e direto (a página já usa "você"; mantenha).
2. Garanta consistência visual entre as seções antigas e as duas novas (mesmos paddings, eyebrows, espaçamento `space-y-12`).
3. Confira que o TOC final tem as 7 entradas na ordem das seções.

**Verify**: `bunx biome check apps/web` → exit 0; `bun run build` → exit 0.

## Test plan

Sem runner de testes. Verificação manual: TOC com 7 itens, âncoras funcionando, página íntegra nos dois temas e no viewport mobile (TOC vira bloco acima do conteúdo — comportamento atual do grid).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `bunx biome check apps/web` exits 0
- [ ] `grep -n "seu-jeito" "apps/web/src/app/(app)/regras/page.tsx"` retorna ≥ 2 matches (TOC + seção)
- [ ] `grep -n '"copa"' "apps/web/src/app/(app)/regras/page.tsx"` retorna ≥ 1 match
- [ ] A copy não menciona pesos/fechamento custom se `lockPolicy` não existir no schema (cheque com o grep indicado em "Current state")
- [ ] `git status` só mostra arquivos do escopo
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Os excertos de "Current state" não baterem com o código (drift).
- Os números das regras no código divergirem dos listados aqui (ex.: alguém mudou `calcPoints`) — a página deve refletir o código; reporte a divergência em vez de escolher um lado.
- Você se ver editando backend ou `points-meter.tsx`.

## Maintenance notes

- Esta página é documentação viva da pontuação: qualquer mudança futura em `calcPoints`/`LOCK_WINDOW_MS` precisa ser refletida aqui (e no `PointsMeter`).
- Se o plano 007 aterrissar depois deste, a seção "Do seu jeito" precisa de um parágrafo a mais — registre como follow-up no índice.
- Revisor: confira que nada na copy promete feature inexistente.
