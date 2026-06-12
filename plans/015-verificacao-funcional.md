# Plan 015: Verificação funcional do ranking duplo — roteiro de usuário

> **⚠️ ESTADO 2026-06-12 — EXECUTADO PARCIALMENTE.** Resultado consolidado em
> `plans/015-relatorio.md`:
> - Step 1 (gates automatizados): ✅ PASS — re-verificado pelo advisor.
> - Cenários públicos 9–10: ✅ PASS (verificação via curl pelo executor).
> - Revisão de diff dos planos 012–014: ✅ CONFORME (advisor).
> - Cenários autenticados 1–8 e 11–14: **PENDENTES — exigem sessão logada do
>   dono**; a tabela para preencher está no relatório. Podem ser executados
>   localmente OU em produção após o deploy do 016 (mudança é display-only;
>   risco de liberar antes do roteiro completo aceito e registrado no relatório).
> - O 016 está **liberado** para executar; não repita os passos já PASS.
>
> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: confirme que os planos 012, 013 e 014 estão
> marcados como DONE (ou aplicados na working tree) em `plans/README.md` e que
> `packages/backend/convex/lib/ranking.ts` existe. Caso contrário, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (somente leitura — nenhuma mutação de dados)
- **Depends on**: plans/012, 013, 014
- **Category**: tests
- **Planned at**: commit `b04a4c0`, 2026-06-12

## Why this matters

Pedido do dono: "testes de funcionabilidade do usuário, testes de
funcionamento do padrão". O funcionamento do padrão (regra de ordenação e
desempate) está coberto pelos testes unitários do 012. Este plano é a outra
metade: **verificar como usuário**, no app rodando, que o painel segmentado, o
desempate exibido e a copy entregues em 013/014 se comportam como
especificado — antes do deploy do 016. A Copa está em andamento; um ranking
visualmente errado é o tipo de bug que os membros das ligas percebem em
minutos.

## Current state

- Stack de execução local: `bun run dev:web` sobe **só o frontend** Next na
  porta 3001, lendo o deployment Convex já publicado (que é **produção** —
  ver aviso abaixo). Não há ambiente de staging.
- Não há test runner de UI (Playwright/Cypress) no repo — **não instale**.
  Este plano é um roteiro manual estruturado (browser, ou skill de
  verificação visual se disponível no seu ambiente).
- Comportamentos a verificar (especificados nos planos 012–014):
  - Linha do ranking: `NOME — X PTS | Y CRAVADA(S)` em todas as ligas;
    destaque visual segue a aba ativa.
  - Liga `rankingMode === "POINTS"`: sem abas; ordem por pontos com desempate
    por cravadas.
  - Liga `rankingMode === "EXACTS"`: PillTabs "Ranking de pontos" / "Ranking
    de cravadas"; **aba de pontos ativa ao entrar** (exigência literal do
    dono); aba de cravadas ordena por `exactScores` (pontos desempatam) e o
    pódio passa a rotular "cravadas".
  - Card da lista de ligas mostra pontos + cravadas do usuário.
  - Regras: seção "Rankings e desempate" no TOC e no corpo; landing menciona
    desempate por cravadas.

## Commands you will need

| Purpose | Command (da raiz `bolao/`) | Expected on success |
|---------|----------------------------|---------------------|
| Testes unitários | `bun test packages/backend/tests` | todos passam |
| Typecheck | `bun run check-types` | exit 0 |
| Lint | `bun run check` | exit 0 |
| Build de produção | `bun run build` | exit 0 |
| Dev (só web) | `bun run dev:web` | porta 3001 |

> ⚠️ **PROIBIDO neste plano**: `bun run dev:server`, `bunx convex deploy`,
> `npx convex run <qualquer mutation>` (ex.: `patchMatchScore`,
> `recomputeAll`, `resetComputedPoints`). O deployment Convex configurado é o
> de **produção, com a Copa em andamento e usuários reais**. Este plano é
> 100% leitura: navegar, olhar, reportar.

## Suggested executor toolkit

- Se o seu ambiente tiver uma skill de verificação visual/manual de app (ex.:
  `verify` ou `run`), use-a para conduzir o roteiro do Step 2 com screenshots.
- Sem browser automatizável, execute o roteiro num browser comum e registre
  os resultados por escrito no relatório final.

## Scope

**In scope**:
- Executar comandos read-only e o roteiro de navegação.
- Editar **apenas** `plans/README.md` (status) e, se necessário, criar
  `plans/015-relatorio.md` com o resultado.

**Out of scope**:
- Qualquer edição de código. Se um cenário falhar, **reporte** (STOP
  condition) — o conserto volta para o plano que o introduziu.
- Qualquer mutação de dados em produção.

## Git workflow

- Nada a commitar além do status/relatório em `plans/` (o 016 consolida).

## Steps

### Step 1: Gates automatizados

Rode, da raiz `bolao/`:

1. `bun test packages/backend/tests` → todos passam (regra de desempate ok).
2. `bun run check-types` → exit 0.
3. `bun run check` → exit 0.
4. `bun run build` → exit 0 (garante que o deploy do 016 não vai quebrar na
   Vercel).

**Verify**: os quatro comandos com exit 0.

### Step 2: Roteiro de usuário (app rodando)

Pré-requisito: `bun run dev:web` + uma sessão logada em
`http://localhost:3001`. **Se você não tiver credenciais**, pare aqui, marque
o plano como BLOCKED em `plans/README.md` com o motivo "roteiro manual requer
sessão logada do dono" e liste o roteiro abaixo no relatório para o dono
executar — isso conta como conclusão parcial válida.

Cenários (registre ✅/❌ + screenshot quando possível):

| # | Cenário | Resultado esperado |
|---|---------|--------------------|
| 1 | `/leagues` — cards | Cada card mostra "Seus pontos" e o mini-stat de cravadas |
| 2 | Abrir liga **POINTS** | Sem abas; tabela ordenada por pontos decrescentes; cada linha `PTS \| CRAVADA(S)` com pontos em destaque |
| 3 | Desempate visível | Se dois membros têm os mesmos pontos, quem tem mais cravadas aparece primeiro (se não houver empate real na liga, valide pela ordenação dos testes do Step 1 e anote "sem empate nos dados") |
| 4 | Abrir liga **EXACTS** | Abas "Ranking de pontos" / "Ranking de cravadas" visíveis; **"Ranking de pontos" ativa na entrada** |
| 5 | Alternar para "Ranking de cravadas" | Lista reordena por cravadas; destaque das linhas troca para cravadas; pódio mostra números de cravadas com rótulo "cravadas"; animação de entrada roda de novo |
| 6 | Voltar para "Ranking de pontos" | Ordem e destaque voltam; sem layout shift na largura das linhas |
| 7 | Sair da liga e reentrar | Aba volta para "Ranking de pontos" (não persiste) |
| 8 | Singular/plural | Membro com 1 cravada mostra "cravada"; com 0 ou ≥2, "cravadas" |
| 9 | `/regras` | TOC tem "Rankings e desempate"; âncora rola até a seção; conteúdo bate com o comportamento visto nos cenários 2–6 |
| 10 | `/` (landing, deslogado) | Copy menciona desempate por cravadas; sem quebra de layout |
| 11 | Mobile 390px (DevTools) | Cenários 2, 4 e 5 sem overflow horizontal; nome truncado não empurra os stats |
| 12 | Tema claro e escuro | Painel/abas legíveis nos dois temas |
| 13 | Teclado | Abas alcançáveis por Tab; `role="tablist"` e `aria-selected` corretos (inspecionar elemento) |
| 14 | Console | Nenhum erro de console/hydration durante os cenários |

Se não existir liga EXACTS na conta de teste, criar uma liga nova "mais
cravadas" pelo wizard **é permitido** (é dado do próprio dono, não altera
pontuação de ninguém) — anote no relatório que a liga foi criada para teste.

**Verify**: tabela preenchida com ≥12 cenários executados (ou BLOCKED
documentado conforme acima).

### Step 3: Relatório

Escreva `plans/015-relatorio.md` com: data, commit testado (`git rev-parse
--short HEAD`), tabela de cenários com resultados, screenshots (paths) e
qualquer ressalva. Atualize a linha do 015 em `plans/README.md`:
DONE (tudo ✅) ou BLOCKED/FAILED com uma linha de motivo.

**Verify**: arquivo criado; índice atualizado.

## Test plan

Este plano **é** o test plan dos planos 012–014. Nenhum teste novo de código.

## Done criteria

- [ ] Step 1: 4 comandos exit 0
- [ ] `plans/015-relatorio.md` existe com a tabela de cenários preenchida (ou BLOCKED justificado)
- [ ] Nenhum arquivo de código modificado (`git status` limpo fora de `plans/`)
- [ ] Linha do 015 atualizada em `plans/README.md`

## STOP conditions

Pare e reporte se:

- Qualquer cenário de 2 a 8 falhar → registre no relatório, marque FAILED no
  índice e aponte qual plano (013 ou 012) deve ser reaberto. **Não conserte
  código você mesmo.**
- `bun run build` falhar → o 016 não pode rodar; reporte o erro completo.
- Qualquer passo parecer exigir uma mutation Convex em produção.

## Maintenance notes

- Este roteiro vale como regressão manual sempre que mexerem em
  `leagues/[id]/page.tsx`, `ranking-row.tsx` ou `podium.tsx` — referencie-o em
  PRs futuros.
- Se o projeto um dia ganhar ambiente de staging do Convex, os cenários 3 e 8
  podem virar testes com dados sintéticos (hoje impossível sem tocar prod).
