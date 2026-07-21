# Esquema de Usabilidade — Chuta de Bico (Brasileirão, campeonato longo)

> **O que é este documento**: o "norte" de produto/UX para transformar o app (hoje
> desenhado para uma Copa de 1 mês) num bolão de **campeonato longo** — o Brasileirão
> Série A, 38 rodadas ao longo de ~8 meses. **Não é um plano de execução de código**;
> é a especificação de usabilidade que os planos `004` e `005` implementam. Leia isto
> antes de executar aqueles dois.
>
> **Planned at**: commit `857d0d0`, 2026-07-21.

## Por que o formato muda tudo

Uma Copa e um Brasileirão são jogos de bolão **estruturalmente diferentes**, e a UX atual
é toda de Copa:

| | Copa (o que existe hoje) | Brasileirão (o alvo) |
|---|---|---|
| Duração | ~1 mês, intenso | ~8 meses, ritmo constante |
| Unidade de navegação | Fase (grupos → mata-mata) | **Rodada** (1 a 38) |
| Estrutura | Grupos A–L, chaveamento, mata-mata | Liga corrida: todos jogam todos, 2 turnos |
| Ritmo do usuário | Vários jogos/dia, todo dia | ~10 jogos concentrados no fim de semana (qua/sáb/dom) |
| "Onde estou?" | "Que fase é?" | **"Que rodada é a atual? Já palpitei tudo dela?"** |
| Fim | Um campeão, acabou | Sem clímax único — engajamento tem que se **renovar a cada rodada** |

O risco central do formato longo é **o usuário esquecer de voltar**. Numa Copa ele volta
sozinho (empolgação). Em 8 meses de Brasileirão, o produto precisa criar micro-ciclos de
retorno: cada rodada é uma "minicompetição" com abertura (palpitar), tensão (jogos) e
fechamento (recap + quem foi o melhor da rodada). Esse é o coração deste esquema.

## Princípios (as regras que as telas devem obedecer)

1. **A rodada atual é o centro de gravidade.** Toda tela principal responde primeiro
   "qual é a rodada atual e o que falta fazer nela", antes de qualquer outra coisa.
2. **Nunca uma lista infinita.** 38 rodadas × 10 jogos = 380 jogos. O usuário só vê a
   rodada relevante por vez, com navegação explícita entre rodadas (◀ Rodada 12 ▶).
3. **Fechar o ciclo de cada rodada.** Quando a rodada termina, mostrar um **recap**:
   quantos pontos o usuário fez, quem foi o melhor da rodada na liga, sua evolução.
   Isso é o que traz o usuário de volta na semana seguinte.
4. **Progresso sempre visível.** "Você palpitou 7/10 jogos da Rodada 12." O usuário
   nunca deve descobrir tarde demais que esqueceu de palpitar.
5. **Reaproveitar o design existente ("Noite de Jogo").** Cores, tokens (`var(--b-*)`),
   `Scorecard`, `DayHeader`, `PillTabs`, `BentoTile`, `points-palette.ts` — tudo já
   existe e é bonito. Este esquema **reorganiza**, não redesenha do zero.
6. **Uma competição só, sem ruído de Copa.** Sem seletor de torneio, sem aba mata-mata,
   sem "fase de grupos", sem prorrogação/pênaltis. Rótulo é sempre "Rodada N".

## Conceito novo e único que o backend precisa expor: "rodada atual"

Hoje não existe a noção de "rodada atual". O campo já existe nos dados
(`matches.matchday` = número da rodada, vindo da football-data.org para o BSA). O que
falta é uma **regra de negócio** que decida qual é a rodada "atual":

> **Rodada atual** = a menor `matchday` que ainda tem pelo menos um jogo **não** `FINISHED`.
> Se todas terminaram (fim de temporada), a rodada atual é a última (38).

Essa regra é a base da navegação. O plano `005` a implementa como query
`matches.getCurrentRound({ tournament })`. Os planos de frontend consomem isso.

---

## Arquitetura de informação (as telas)

### 1. Dashboard (`/dashboard`) — "O que preciso fazer agora?"

**Objetivo**: em 1 tela, o usuário sabe (a) qual a rodada atual, (b) quanto falta palpitar
dela, (c) como foi na última rodada, (d) como vai nas ligas.

Ordem vertical proposta (reusando os blocos que já existem):

1. **Faixa da Rodada Atual** (novo — bloco de destaque no topo):
   - "RODADA 12 · fecha sábado 16:00" + barra de progresso "7/10 palpitados".
   - CTA primário: **"Completar palpites da rodada"** → `/predictions`.
   - Se 10/10: estado de sucesso "Rodada 12 completa ✓ — boa sorte!".
2. **Hero match** (já existe, `HeroMatch`): o próximo jogo da rodada atual sem palpite
   (em vez do "próximo jogo" genérico). Se todos palpitados, o próximo jogo cronológico.
3. **Recap da última rodada** (novo — só aparece quando há rodada encerrada):
   card compacto "Rodada 11: você fez 24 pts · melhor da liga: Rafa (31 pts)".
   Link para o recap completo (ver tela 4).
4. **Seus números** (já existe): pontos, palpites, exatos, precisão — **na temporada**.
5. **Suas ligas** (já existe): top liga + lista. Sem mudança estrutural.

**Remover do dashboard**: nada de "COMPETITIONS[tournament].label" (Copa/seletor). O
eyebrow vira fixo "Brasileirão · Série A 2026".

### 2. Palpites (`/predictions`) — "Palpitar a rodada"

Hoje a tela tem abas Próximos / Mata-mata / Meus palpites, com sub-modos "consecutivos /
por grupo". **Reescrever para ser orientada a rodada:**

- **Navegação por rodada** no topo: `◀ Rodada 12 ▶` (setas + rótulo). Abre por padrão na
  **rodada atual**. O usuário pode navegar para rodadas passadas (read-only, já bloqueadas)
  e futuras (palpitáveis se abertas).
- Dentro da rodada: jogos agrupados por dia (`DayHeader` já existe — reusar), do primeiro
  ao último. Cada jogo é um `Scorecard` (já existe).
- **Cabeçalho de progresso da rodada**: "Rodada 12 — 7/10 palpitados · fecha sáb 16:00".
- Abas simplificadas para **duas**: **"Rodada"** (a navegação acima) e **"Meus palpites"**
  (histórico do usuário, do mais recente ao mais antigo — já existe, manter).
- **Remover**: aba "Mata-mata", sub-toggle "por grupo", todo o bracket.

Wireframe (mobile):

```
┌─────────────────────────────┐
│  PALPITES                    │
│  ┌─────────────────────────┐ │
│  │ [Rodada] [Meus palpites]│ │  ← 2 abas (PillTabs)
│  └─────────────────────────┘ │
│  ◀   RODADA 12   ▶           │  ← navegação de rodada
│  7/10 palpitados · fecha sáb │  ← progresso
│                              │
│  SÁB 20 JUL                  │  ← DayHeader (existe)
│   ┌───────────────────────┐  │
│   │ Flamengo  [2]×[1] Vasco│  │  ← Scorecard (existe)
│   └───────────────────────┘  │
│   ...                        │
│  DOM 21 JUL                  │
│   ...                        │
└─────────────────────────────┘
```

### 3. Ligas (`/leagues/[id]`) — "Como vou na temporada"

Mudanças mínimas — a liga já funciona. Ajustes:

- O painel segmentado atual é **Pontos / Cravadas** (por `rankingMode`). Manter.
- O `getRankingByPhase` (Geral / Grupos / Mata-mata) **não faz sentido** no Brasileirão
  (não há fases). O plano `003`/`005` o aposenta ou o reduz a "Geral" apenas.
- **Adicionar (plano 005)**: uma visão **"Rodada"** no ranking — "quem fez mais pontos na
  Rodada 12". Isso alimenta o recap e cria a competição semanal dentro da liga.

### 4. Recap de Rodada (novo — plano 005) — "Fecha o ciclo"

Quando uma rodada termina, cada liga ganha um recap acessível (card no dashboard + página
ou sheet):

- **Melhor da rodada** na liga (pódio da rodada, reusando `podium.tsx`).
- **Seus pontos na rodada** e sua posição naquela rodada.
- **Evolução na temporada**: sua posição geral subiu/desceu depois da rodada.
- Compartilhável (reusar `share-ranking-card.tsx`) — "Fui o melhor da Rodada 12 no Chuta
  de Bico 🐤" gera retorno orgânico e traz o grupo de volta.

Este é o bloco de **maior alavancagem de retenção** de todo o esquema.

---

## O que sai (herança de Copa que atrapalha o formato longo)

- Seletor de torneio (`CompetitionSwitcher`) e todo o `tournament-context` multi-torneio.
- Aba "Mata-mata" + página `/mata-mata` + bracket (`wc2026-bracket.ts`, `knockout.ts`,
  `components/bracket/*`).
- Sub-visão "por grupo" em Palpites.
- Desempate de prorrogação/pênaltis (`TiebreakerPicker` e toda a lógica de `tieBonus`).
- `getRankingByPhase` (Geral/Grupos/Mata-mata) na forma atual.
- Landing em modo Copa (countdown, "104 jogos da Copa", logo marquee FIFA).

## Métrica de sucesso do esquema

Se este esquema funcionar, um usuário consegue, em **≤2 toques a partir do dashboard**:
(1) ver quantos jogos da rodada atual ainda não palpitou, e (2) completar os que faltam.
E, na segunda-feira após a rodada, recebe um motivo claro para voltar (recap + melhor da
rodada). Se a tela principal não responder "qual a rodada e o que falta" de imediato, o
esquema falhou.

## Sequência de implementação

1. **Plano 002** dá a base: registry de torneios + BSA pontuando + `matchday` confiável.
2. **Plano 003** remove o desempate de mata-mata (limpa o modelo).
3. **Plano 004** entrega a AI acima: só-BSA, navegação por rodada, remove herança de Copa.
4. **Plano 005** entrega o recap de rodada + ranking por rodada (a retenção).

Planos `001` (encerrar a Copa) e `006` (rebrand) e `007` (segurança) são independentes
desta cadeia de UX, mas `001` deve rodar **antes** de `002` (ver o índice em README.md).
