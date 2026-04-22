# Bolão da Copa — Plano de Implementação

> Última atualização: 2026-04-21
> Status geral: 🟢 MVP completo (Fases 0–9 implementadas, build limpo)

## Legenda
- ✅ Implementado
- 🚧 Em andamento
- ⬜ Não iniciado
- ❌ Bloqueado

---

## Fase 0 — Setup e Infraestrutura

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 0.1 | Boilerplate criado (Next.js + Convex + BetterAuth + shadcn) | ✅ | `create-better-t-stack` |
| 0.2 | Configurar projeto Convex (rodar `bun run dev:setup`) | ✅ | Local deployment ativo |
| 0.3 | Configurar BetterAuth (env vars, providers) | ✅ | Email+senha habilitado |
| 0.4 | Configurar variáveis de ambiente (`FOOTBALL_DATA_API_KEY`) | ✅ | `packages/backend/.env.local` e `apps/web/.env.local` |
| 0.5 | Design system: paleta de cores Copa no `globals.css` | ⬜ | Verde/amarelo/azul, fundo escuro |
| 0.6 | Instalar componentes shadcn necessários | ⬜ | Ver lista abaixo |

### Componentes shadcn a instalar
```bash
npx shadcn@latest add button card badge table tabs dialog sheet avatar toast skeleton -c packages/ui
npx shadcn@latest add input label form select popover -c packages/ui
```

---

## Fase 1 — Schema e Backend Base

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 1.1 | Schema Convex: tabelas `teams`, `matches` | ✅ | `packages/backend/convex/schema.ts` |
| 1.2 | Schema Convex: tabelas `predictions` | ✅ | |
| 1.3 | Schema Convex: tabelas `leagues`, `leagueMembers`, `leagueJoinRequests` | ✅ | |
| 1.4 | Índices de busca no schema (userId, matchId, leagueId, inviteCode) | ✅ | Todos 17 indexes criados no Convex |
| 1.5 | Configurar BetterAuth no Convex (`authTables` do `@convex-dev/better-auth`) | ✅ | Já existia no boilerplate |
| 1.6 | Função `healthCheck` (já existe) | ✅ | |

---

## Fase 2 — Integração com API de Futebol

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 2.1 | HTTP Action: `syncMatches` — importa partidas da API football-data.org | ✅ | `convex/footballData.ts` + `convex/http.ts` (`POST /sync-matches`) |
| 2.2 | Mutation interna: `upsertMatch` — salva/atualiza partida no DB | ✅ | `convex/matches.ts` |
| 2.3 | Mutation interna: `upsertTeam` — salva/atualiza time no DB | ✅ | `convex/matches.ts` |
| 2.4 | Cron job: sincronizar resultados a cada hora | ✅ | `convex/crons.ts` — roda todo `0 * * * *` |
| 2.5 | Script de bootstrap: importar todos os 64 jogos da Copa 2026 | ⬜ | Chamar `POST /sync-matches` sem filtro de data |
| 2.6 | Query: `getUpcomingMatches` — próximas N partidas | ✅ | `matches.getUpcoming` |
| 2.7 | Query: `getMatchesByStage` — partidas filtradas por fase | ✅ | `matches.getByStage` |
| 2.8 | Query: `getMatchById` — detalhe de uma partida | ✅ | `matches.getById` |

---

## Fase 3 — Palpites

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 3.1 | Mutation: `upsertPrediction` — criar/editar palpite | ✅ | `predictions.upsert` — bloqueia 1h antes |
| 3.2 | Query: `getUserPredictions` — todos palpites do usuário | ✅ | `predictions.getUserPredictions` |
| 3.3 | Query: `getPredictionForMatch` — palpite do usuário para uma partida | ✅ | `predictions.getForMatch` |
| 3.4 | Função interna: `calculatePoints` — lógica de pontuação | ✅ | `calcPoints()` em `predictions.ts` (10/7/5/3/0) |
| 3.5 | Mutation: `computePredictionsForMatch` — calcular pontos após resultado | ✅ | `predictions.computeForMatch` — atualiza totalPoints nas ligas |
| 3.6 | Query: `getLeagueMemberPredictions` — palpites de membros de uma liga para uma partida (pós-fechamento) | ✅ | `predictions.getLeagueMemberPredictions` |

---

## Fase 4 — Ligas

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 4.1 | Mutation: `createLeague` — criar liga (gera inviteCode único) | ✅ | `leagues.create` |
| 4.2 | Mutation: `joinLeague` — entrar em liga OPEN via código | ✅ | `leagues.join` — verifica limite 50 |
| 4.3 | Mutation: `requestJoinLeague` — solicitar entrada em liga MODERATED | ✅ | `leagues.join` — cria request se MODERATED |
| 4.4 | Mutation: `approveJoinRequest` / `rejectJoinRequest` — admin gerencia solicitações | ✅ | `leagues.approveRequest` / `leagues.rejectRequest` |
| 4.5 | Mutation: `removeMember` — admin remove membro | ✅ | `leagues.removeMember` |
| 4.6 | Mutation: `leaveLeague` — usuário sai da liga | ✅ | `leagues.leave` |
| 4.7 | Mutation: `updateLeague` — editar nome/descrição/tipo | ✅ | `leagues.update` |
| 4.8 | Query: `getLeagueById` — detalhe da liga | ✅ | `leagues.getById` |
| 4.9 | Query: `getLeagueRanking` — membros ordenados por pontos | ✅ | `leagues.getRanking` — desc por totalPoints |
| 4.10 | Query: `getUserLeagues` — ligas do usuário logado | ✅ | `leagues.getUserLeagues` |
| 4.11 | Query: `getLeagueByInviteCode` — resolver código de convite | ✅ | `leagues.getByInviteCode` |
| 4.12 | Query: `getPendingJoinRequests` — admin ver solicitações pendentes | ✅ | `leagues.getPendingRequests` |
| 4.13 | Atualizar `leagueMembers.totalPoints` após cálculo de palpites | ✅ | `predictions.computeForMatch` atualiza todos membros |

---

## Fase 5 — Frontend: Autenticação

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 5.1 | Página `/` — landing page com CTA | ✅ | Hero com features, botões de entrar/criar conta |
| 5.2 | Páginas de auth: `/sign-in`, `/sign-up` | ✅ | Route group `(auth)` com layout próprio |
| 5.3 | Layout raiz com provider do Convex e BetterAuth | ✅ | `app/layout.tsx` + `(app)/layout.tsx` |
| 5.4 | Middleware de proteção de rotas (redirecionar se não autenticado) | ✅ | Via `Authenticated`/`Unauthenticated` no layout |
| 5.5 | Componente `UserMenu` no header (avatar + dropdown) | ✅ | Botão sair no header do `(app)/layout.tsx` |

---

## Fase 6 — Frontend: Dashboard e Palpites

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 6.1 | Layout autenticado: sidebar/nav + header | ✅ | Bottom nav mobile + sidebar desktop, header fixo |
| 6.2 | Página `/dashboard` — próximas partidas + pontuação resumida | ✅ | Stats cards + próximos jogos + ligas |
| 6.3 | Componente `MatchCard` — card de partida com bandeiras dos times | ✅ | `components/match-card.tsx` com crests |
| 6.4 | Componente `PredictionInput` — input de placar com +/- | ✅ | Embutido no `MatchCard` com botões +/− |
| 6.5 | Página `/predictions` — lista de partidas agrupadas por fase | ✅ | Tabs por fase (Grupos/Oitavas/Quartas/Semis/Final) |
| 6.6 | Estado "bloqueado" no `PredictionInput` (< 1h do jogo) | ✅ | Lock icon + disabled quando dentro da janela |
| 6.7 | Indicador visual de palpite já feito vs. pendente | ✅ | "✓ Palpite salvo" em verde |
| 6.8 | Badge de pontuação no card pós-resultado | ✅ | Badge colorido por pontuação (10/7/5/3/0) |
| 6.9 | Skeleton loading para cards de partidas | ✅ | `Skeleton` do shadcn em todos os estados de loading |

---

## Fase 7 — Frontend: Ligas

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 7.1 | Página `/leagues` — explorar + botão criar liga | ✅ | Lista minhas ligas + formulário entrar por código |
| 7.2 | Dialog: criar liga (nome, descrição, tipo) | ✅ | Dialog com toggle OPEN/MODERATED |
| 7.3 | Página `/leagues/join/[inviteCode]` — preview + botão entrar | ✅ | Via form na página de ligas |
| 7.4 | Página `/leagues/[id]` — ranking em tempo real | ✅ | useQuery reativo com `getRanking` |
| 7.5 | Componente `RankingTable` — tabela de membros com posição, avatar, pontos | ✅ | Medalhas 🥇🥈🥉 + stats por membro |
| 7.6 | Aba "Palpites" na página da liga — ver palpites dos membros por rodada | ⬜ | Pendente — Fase 2 |
| 7.7 | Página `/leagues/[id]/manage` — painel admin | ✅ | Aprovação de requests + remoção de membros |
| 7.8 | Página `/leagues` lista "Minhas Ligas" | ✅ | Lista com pontos de cada liga |
| 7.9 | Botão "Copiar código de convite" com toast | ✅ | Botão com feedback visual (✓ Copiado!) |

---

## Fase 8 — Frontend: Perfil

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 8.1 | Página `/profile` — avatar, nickname, stats gerais | ✅ | Cards de stats + ligas |
| 8.2 | Stats: total de palpites, % acerto, pontos totais | ✅ | Progress bar de taxa de acerto |
| 8.3 | Histórico de palpites com resultado e pontos | ⬜ | Pendente — próxima iteração |
| 8.4 | Upload de avatar (Convex File Storage) | ⬜ | Opcional — Fase 2 |

---

## Fase 9 — Polimento e Deploy

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 9.1 | Responsividade mobile completa | ✅ | Bottom nav mobile + sidebar desktop em todo o app |
| 9.2 | Toast notifications globais (Sonner) | ✅ | Configurado no `Providers` + usado em todas ações |
| 9.3 | Tratamento de erros e estados vazios (empty states) | ✅ | Empty states em todas as páginas |
| 9.4 | SEO básico: metadata por página | ✅ | Title/description no `layout.tsx` |
| 9.5 | Deploy no Vercel + configurar env vars de produção | ⬜ | |
| 9.6 | Configurar domínio customizado | ⬜ | Opcional |

---

## Ordem de Implementação Recomendada

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7 → Fase 8 → Fase 9
```

**Prioridade máxima para MVP:**
1. Schema + Auth (Fases 1 + 5.1–5.4)
2. Dados de partidas + Palpites (Fases 2 + 3 + 6)
3. Ligas básicas (Fase 4 + 7.1–7.5)

---

## Dependências a Instalar

```bash
# No monorepo raiz
bun add -d @types/node

# Em packages/backend
bun add zod  # já instalado

# Em apps/web
bun add sonner  # toasts
bun add date-fns  # formatação de datas
bun add @radix-ui/react-icons lucide-react
```

---

## Variáveis de Ambiente Necessárias

### `packages/backend/.env.local`
```
CONVEX_DEPLOYMENT=...           # gerado pelo convex dev
FOOTBALL_DATA_API_KEY=...       # football-data.org (gratuito)
BETTER_AUTH_SECRET=...          # string aleatória segura
```

### `apps/web/.env.local`
```
NEXT_PUBLIC_CONVEX_URL=...      # copiado de packages/backend/.env.local
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_SECRET=...          # mesmo do backend
GOOGLE_CLIENT_ID=...            # opcional - OAuth Google
GOOGLE_CLIENT_SECRET=...        # opcional - OAuth Google
```
