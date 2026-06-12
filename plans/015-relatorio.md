# Plano 015 — Relatório de verificação

- **Data**: 2026-06-12
- **Base**: commit `b04a4c0` + working tree com planos 012–014 aplicados (não commitados)
- **Executores**: agente executor (gates + páginas públicas via curl) + revisão de diff pelo advisor

## Resultado geral

**PARCIAL — liberado para release.** Gates automatizados e verificação pública: PASS.
Revisão de diff dos planos 012–014 pelo advisor: CONFORME. Roteiro autenticado
(cenários 1–8 e 11–14): **PENDENTE — requer sessão logada do dono** (não há
credenciais de teste; sem ambiente de staging). Como a mudança é 100% display
(nenhuma pontuação alterada; desempate já existia no backend), o risco de
liberar o 016 antes do roteiro autenticado é baixo — decisão registrada na
seção "Pendências".

## Gates automatizados (Step 1) — PASS

| Comando | Resultado |
|---------|-----------|
| `bun test packages/backend/tests` | ✅ 8 pass / 0 fail (21 expects) — re-executado pelo advisor |
| `bun run check-types` | ✅ exit 0 nos 3 workspaces — re-executado pelo advisor |
| `bun run check` | ✅ exit 0 (executor) |
| `bun run build` | ✅ exit 0 (executor) |

## Revisão de diff (advisor) — CONFORME

`git diff --stat`: conteúdo alterado em exatamente 9 arquivos + 2 diretórios
novos — escopo exato dos planos 012–014, nada fora:

- **012** ✅ `convex/lib/ranking.ts` criado conforme spec; sort inline de
  `getRanking` substituído pelos comparadores; `myExacts` aditivo em
  `getUserLeagues`; `tests/ranking.test.ts` com 8 casos.
- **013** ✅ aba padrão `"POINTS"` (exigência literal do dono); abas só em liga
  EXACTS; ordem fixa `pontos | cravadas` com troca de destaque por `metric`;
  singular "cravada" com valor 1; `key={activeTab}` re-dispara o stagger;
  pódio com `unit`; cravadas no card de liga; Tag "Mais cravadas" removida só
  no caso EXACTS.
- **014** ✅ seção `#rankings` ("Rankings e desempate") no TOC e corpo das
  regras; link âncora na seção ligas; hero e feature card da landing; wizard e
  manage com copy espelhada "cravadas desempatam".

### Nota: artefatos CRLF no `git status`

~24 arquivos aparecem como `M` no `git status` **sem diff de conteúdo**
(aviso "LF will be replaced by CRLF" — artefato de fim de linha do Windows).
Confirmado: `git diff` neles é vazio. **Não é trabalho fora de escopo.**
`git add` neles é no-op (normalização mantém o índice igual). O plano 016 já
está ajustado para não tratar isso como STOP.

## Verificação pública (executor, via curl) — PASS

- ✅ `GET /` → HTML contém "cravada desempata" (hero) e "cravada é critério de
  desempate" (feature card "Ligas privadas").
- ✅ `GET /regras` → HTTP 200; chunk compilado contém "Rankings e desempate"
  2× (TOC + seção) e múltiplas ocorrências de "desempate"/"cravad".

## Pendências — roteiro autenticado (dono executa)

Os cenários abaixo exigem sessão logada. Execute **localmente**
(`bun run dev:web` → http://localhost:3001) **ou em produção logo após o
deploy do 016** (todos são read-only; criar uma liga "mais cravadas" de teste
pelo wizard é permitido). Marque ✅/❌:

| # | Cenário | Esperado | ✓ |
|---|---------|----------|---|
| 1 | `/leagues` — cards | "Seus pontos" + mini-stat "Cravadas" em cada card | |
| 2 | Liga POINTS | Sem abas; linhas `PTS \| CRAVADA(S)` com pontos em destaque; ordem por pontos | |
| 3 | Desempate visível | Empate em pontos → quem tem mais cravadas em cima (se não houver empate real, anotar "sem empate nos dados") | |
| 4 | Liga EXACTS — entrada | Abas visíveis; **"Ranking de pontos" ativa ao entrar** | |
| 5 | Aba "Ranking de cravadas" | Reordena por cravadas; destaque troca; pódio rotula "cravadas"; stagger roda de novo | |
| 6 | Voltar para "Pontos" | Ordem/destaque voltam; sem layout shift | |
| 7 | Sair e reentrar na liga | Aba volta para "Ranking de pontos" (não persiste) | |
| 8 | Singular/plural | 1 → "cravada"; 0 ou ≥2 → "cravadas" | |
| 9 | `/regras` | TOC "Rankings e desempate"; âncora funciona; conteúdo bate com 2–6 | |
| 10 | `/` deslogado | Copy de desempate sem quebra de layout | |
| 11 | Mobile 390px | Cenários 2/4/5 sem overflow; nome truncado não empurra stats | |
| 12 | Temas claro/escuro | Painel/abas legíveis nos dois | |
| 13 | Teclado | Abas via Tab; `role="tablist"` / `aria-selected` corretos | |
| 14 | Console | Sem erro de console/hydration | |

**Se qualquer cenário 2–8 falhar**: reabrir o plano 013 (display) ou 012
(ordenação) — não consertar inline sem registrar aqui.
