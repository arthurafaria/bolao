# Plan 009: Limpeza do repositório — código morto e documentos históricos arquivados

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e87755c..HEAD -- packages/backend/convex/demo.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (mas execute por último — os outros planos citam caminhos atuais)
- **Category**: tech-debt
- **Planned at**: commit `e87755c`, 2026-06-10

## Why this matters

O pedido do produto inclui "já que o código teve várias versões, sinta-se livre para refatorar de uma forma menos bagunçada". O grosso da "bagunça" não é o código de produção (que está razoável e centralizado) — é o **resíduo das versões**: um módulo Convex de demo órfão que continua deployado, e oito documentos de planejamento/relatório de fases já concluídas soltos na raiz, que confundem qualquer pessoa (ou agente) tentando entender o estado atual. Limpar isso barateia toda manutenção futura. Refatorações de código maiores (quebrar `page.tsx` de 729 linhas etc.) foram avaliadas e **deferidas de propósito** — risco sem retorno durante o torneio.

## Current state

- `packages/backend/convex/demo.ts` (162 linhas) — módulo do antigo "modo demo", removido da UI no commit `a279f1f` (`feat: remove modo demo e reordera selector de competição`). Verificação de orfandade feita no planejamento: `grep -rn "internal\.demo\|api\.demo" packages/backend/convex apps/web/src` → nenhum uso. **Refaça esse grep antes de deletar.**
- Documentos históricos na raiz do repo (todos descrevem trabalho já concluído ou planos antigos):
  - `IMPLEMENTATION.md` — checklist do MVP (Fases 0–9, concluídas)
  - `PLANO_PONTOS_E_PALPITES_PUBLICOS.md`, `PLANO_PONTOS_FIX.md`, `PLANO_REPAGINACAO_FRONTEND.md`, `PLANO_REPAGINACAO_FRONTEND_V2.md`, `PLANO_USABILIDADE.md`, `PLAN_RESET_AND_REMINDERS.md` — planos de features já entregues
  - `RELATORIO_01_05_2026.md`, `RELATORIO_02_05_2026.md` — relatórios pontuais
- Documentos **vivos** na raiz (não tocar): `README.md`, `SPEC.md`, `SETUP.md`, `DEPLOY.md`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0              |
| Build     | `bun run build`          | exit 0              |
| Lint      | `bunx biome check .`     | exit 0              |

## Scope

**In scope**:
- Deletar `packages/backend/convex/demo.ts`
- Criar `docs/archive/` e mover para lá os 9 documentos históricos listados acima (use `git mv`)

**Out of scope** (do NOT touch):
- `README.md`, `SPEC.md`, `SETUP.md`, `DEPLOY.md` — documentação viva.
- Qualquer refatoração de código de produção (split de `apps/web/src/app/page.tsx`, extração do `CompetitionSwitcher` do layout etc.) — avaliado e deferido; não faça "já que está aqui".
- `plans/` — é o diretório deste fluxo de trabalho.
- `scripts/`, `skills-lock.json`, `bts.jsonc` — em uso.

## Git workflow

- Branch: `advisor/009-limpeza-repo`
- Dois commits: `chore: remove módulo demo órfão` e `docs: arquiva planos e relatórios concluídos em docs/archive`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirmar e remover o módulo demo

1. `grep -rn "internal\.demo\|api\.demo\|from \"./demo\"" packages/backend/convex apps/web/src` → deve retornar vazio. Se retornar algo, STOP.
2. Delete `packages/backend/convex/demo.ts`.

**Verify**: `bun run check-types` → exit 0; `bun run build` → exit 0. (O Convex remove as funções do deployment no próximo `convex dev`/deploy — nada extra a fazer.)

### Step 2: Arquivar documentos históricos

```
mkdir -p docs/archive
git mv IMPLEMENTATION.md PLANO_*.md PLAN_RESET_AND_REMINDERS.md RELATORIO_*.md docs/archive/
```

Antes de mover `IMPLEMENTATION.md`: `grep -rn "IMPLEMENTATION.md" README.md SETUP.md DEPLOY.md SPEC.md .agents .claude 2>/dev/null` — se algum documento vivo ou skill o referenciar, atualize a referência para `docs/archive/IMPLEMENTATION.md` no mesmo commit.

**Verify**: `ls docs/archive` mostra 9 arquivos; `ls *.md` na raiz mostra apenas `README.md SPEC.md SETUP.md DEPLOY.md`.

### Step 3: Verificação final

**Verify**: `bunx biome check .` → exit 0; `git status` limpo após os dois commits.

## Test plan

Sem testes a escrever. A verificação é typecheck + build (provam que nada importava o módulo deletado).

## Done criteria

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `test -f packages/backend/convex/demo.ts` → exit 1 (arquivo não existe)
- [ ] `ls docs/archive | wc -l` → 9
- [ ] Raiz contém apenas README/SPEC/SETUP/DEPLOY como `.md`
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- O grep do Step 1 encontrar QUALQUER referência a `demo` — o módulo não é órfão.
- Algum dos documentos listados não existir mais ou tiver sido renomeado (drift).
- Você sentir vontade de refatorar código de produção "aproveitando a limpeza".

## Maintenance notes

- A memória do projeto/skills pode referenciar `IMPLEMENTATION.md` na raiz — se algo procurar por ele no futuro, está em `docs/archive/`.
- Candidatos a refatoração real, deferidos e documentados para depois da Copa: `apps/web/src/app/page.tsx` (729 linhas, landing), `apps/web/src/app/(app)/layout.tsx` (571 linhas — extrair `CompetitionSwitcher` para `components/`), wrappers admin duplicados em `footballData.ts`/`predictions.ts`.
