# Bolão da Copa — Plano de Implementação

> Última atualização: 2026-04-24
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
| 0.1 | Boilerplate criado (Next.js + Convex + shadcn) | ✅ | `create-better-t-stack` |
| 0.2 | Configurar projeto Convex (`bun run dev:setup`) | ✅ | Local deployment ativo |
| 0.3 | Configurar auth (`@convex-dev/auth`) | ✅ | Providers: Password + Resend (email) |
| 0.4 | Configurar variáveis de ambiente | ✅ | Ver seção abaixo |
| 0.5 | Design system: paleta de cores Copa no `globals.css` | ✅ | OKLCH: verde (hue 145) + amarelo (hue 90) + dark mode + fontes Barlow/Barlow Condensed/DM Mono |
| 0.6 | Instalar componentes shadcn necessários | ✅ | avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, progress, separator, sheet, skeleton, sonner, table, tabs, theme-switch-button |
| 0.7 | Higiene de git: `.gitignore`, pre-commit hook (Biome), `biome.json` | ✅ | `bun run setup:hooks` instala o hook localmente |

---

## Fase 1 — Schema e Backend Base

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 1.1 | Schema Convex: tabelas `teams`, `matches` | ✅ | `packages/backend/convex/schema.ts` |
| 1.2 | Schema Convex: tabelas `predictions` | ✅ | |
| 1.3 | Schema Convex: tabelas `leagues`, `leagueMembers`, `leagueJoinRequests` | ✅ | |
| 1.4 | Índices de busca no schema (userId, matchId, leagueId, inviteCode) | ✅ | 17 indexes criados |
| 1.5 | Configurar `@convex-dev/auth` no Convex (`authTables`, `store`, `signIn`, `signOut`) | ✅ | `convex/auth.ts` + `convex/auth.config.ts` |
| 1.6 | Função `healthCheck` | ✅ | `convex/healthCheck.ts` |

---

## Fase 2 — Integração com API de Futebol

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 2.1 | HTTP Action: `syncMatches` — importa partidas da API football-data.org | ✅ | `convex/footballData.ts` + `convex/http.ts` (`POST /sync-matches`) |
| 2.2 | Mutation interna: `upsertMatch` — salva/atualiza partida no DB | ✅ | `convex/matches.ts` |
| 2.3 | Mutation interna: `upsertTeam` — salva/atualiza time no DB | ✅ | `convex/matches.ts` |
| 2.4 | Cron job: sincronizar resultados a cada hora | ✅ | `convex/crons.ts` — `0 * * * *` |
| 2.5 | Bootstrap: importar todos os 64 jogos da Copa 2026 | ⬜ | Chamar `POST /sync-matches` sem filtro de data |
| 2.6 | Query: `getUpcomingMatches` | ✅ | `matches.getUpcoming` |
| 2.7 | Query: `getMatchesByStage` | ✅ | `matches.getByStage` |
| 2.8 | Query: `getMatchById` | ✅ | `matches.getById` |

---

## Fase 3 — Palpites

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 3.1 | Mutation: `upsertPrediction` — criar/editar palpite | ✅ | `predictions.upsert` — bloqueia 1h antes |
| 3.2 | Query: `getUserPredictions` | ✅ | `predictions.getUserPredictions` |
| 3.3 | Query: `getPredictionForMatch` | ✅ | `predictions.getForMatch` |
| 3.4 | Função interna: `calculatePoints` (10/7/5/3/0) | ✅ | `calcPoints()` em `predictions.ts` |
| 3.5 | Mutation: `computePredictionsForMatch` — calcula pontos + atualiza ligas | ✅ | `predictions.computeForMatch` |
| 3.6 | Query: `getLeagueMemberPredictions` — pós-fechamento da janela | ✅ | `predictions.getLeagueMemberPredictions` |

---

## Fase 4 — Ligas

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 4.1 | Mutation: `createLeague` (gera inviteCode único) | ✅ | `leagues.create` |
| 4.2 | Mutation: `joinLeague` — liga OPEN via código | ✅ | `leagues.join` — limite 50 membros |
| 4.3 | Mutation: `requestJoinLeague` — liga MODERATED | ✅ | `leagues.join` — cria request se MODERATED |
| 4.4 | Mutation: `approveJoinRequest` / `rejectJoinRequest` | ✅ | `leagues.approveRequest` / `leagues.rejectRequest` |
| 4.5 | Mutation: `removeMember` | ✅ | `leagues.removeMember` |
| 4.6 | Mutation: `leaveLeague` | ✅ | `leagues.leave` |
| 4.7 | Mutation: `updateLeague` | ✅ | `leagues.update` |
| 4.8 | Query: `getLeagueById` | ✅ | `leagues.getById` |
| 4.9 | Query: `getLeagueRanking` | ✅ | `leagues.getRanking` — desc por totalPoints |
| 4.10 | Query: `getUserLeagues` | ✅ | `leagues.getUserLeagues` |
| 4.11 | Query: `getLeagueByInviteCode` | ✅ | `leagues.getByInviteCode` |
| 4.12 | Query: `getPendingJoinRequests` | ✅ | `leagues.getPendingRequests` |
| 4.13 | Atualizar `leagueMembers.totalPoints` após cálculo | ✅ | `predictions.computeForMatch` atualiza todos membros |

---

## Fase 5 — Frontend: Autenticação

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 5.1 | Página `/` — landing page com CTA | ✅ | Hero com features + botões entrar/criar conta |
| 5.2 | Páginas `/sign-in`, `/sign-up` | ✅ | Route group `(auth)` com layout próprio |
| 5.3 | Página `/regras` — explicação do sistema de pontuação | ✅ | Acessível sem autenticação |
| 5.4 | Layout raiz com providers Convex + `@convex-dev/auth` | ✅ | `app/layout.tsx` + `(app)/layout.tsx` |
| 5.5 | Proteção de rotas (redirecionar se não autenticado) | ✅ | Via `Authenticated`/`Unauthenticated` no layout |
| 5.6 | Componente `UserMenu` no header (avatar + dropdown) | ✅ | Botão sair no header do `(app)/layout.tsx` |

---

## Fase 6 — Frontend: Dashboard e Palpites

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 6.1 | Layout autenticado: sidebar/nav + header | ✅ | Bottom nav mobile + sidebar desktop |
| 6.2 | Página `/dashboard` — próximas partidas + pontuação | ✅ | Stats cards + próximos jogos + ligas |
| 6.3 | Componente `MatchCard` — card de partida com bandeiras | ✅ | `components/match-card.tsx` com crests |
| 6.4 | Componente `PredictionInput` — input de placar +/− | ✅ | Embutido no `MatchCard` |
| 6.5 | Página `/predictions` — partidas agrupadas por fase | ✅ | Tabs por fase (Grupos/Oitavas/Quartas/Semis/Final) |
| 6.6 | Estado "bloqueado" no `PredictionInput` (< 1h do jogo) | ✅ | Lock icon + disabled |
| 6.7 | Indicador visual: palpite salvo vs. pendente | ✅ | "✓ Palpite salvo" em verde |
| 6.8 | Badge de pontuação no card pós-resultado | ✅ | Colorido por pontuação (10/7/5/3/0) |
| 6.9 | Skeleton loading | ✅ | Em todos os estados de loading |

---

## Fase 7 — Frontend: Ligas

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 7.1 | Página `/leagues` — lista + botão criar liga | ✅ | Lista "Minhas Ligas" + form entrar por código |
| 7.2 | Dialog: criar liga (nome, descrição, tipo) | ✅ | Toggle OPEN/MODERATED |
| 7.3 | Entrar em liga via código de convite | ✅ | Via form na página de ligas |
| 7.4 | Página `/leagues/[id]` — ranking em tempo real | ✅ | useQuery reativo com `getRanking` |
| 7.5 | Tabela de ranking: posição, avatar, pontos | ✅ | Medalhas 🥇🥈🥉 + stats por membro |
| 7.6 | Aba "Palpites" na liga — ver palpites dos membros por rodada | ⬜ | Próxima iteração |
| 7.7 | Página `/leagues/[id]/manage` — painel admin | ✅ | Aprovação de requests + remoção de membros |
| 7.8 | Botão "Copiar código de convite" com toast | ✅ | Feedback visual (✓ Copiado!) |

---

## Fase 8 — Frontend: Perfil

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 8.1 | Página `/profile` — stats gerais + ligas | ✅ | Cards de stats + progress bar de acerto |
| 8.2 | Stats: total palpites, % acerto, pontos totais | ✅ | |
| 8.3 | Histórico de palpites com resultado e pontos | ⬜ | Próxima iteração |
| 8.4 | Upload de avatar (Convex File Storage) | ⬜ | Opcional |

---

## Fase 9 — Polimento e Deploy

| # | Tarefa | Status | Notas |
|---|--------|--------|-------|
| 9.1 | Responsividade mobile | ✅ | Bottom nav mobile + sidebar desktop |
| 9.2 | Toast notifications globais (Sonner) | ✅ | Em todas as ações |
| 9.3 | Tratamento de erros e empty states | ✅ | Em todas as páginas |
| 9.4 | SEO básico: metadata por página | ✅ | Title/description no `layout.tsx` |
| 9.5 | Deploy no Vercel + env vars de produção | ⬜ | |
| 9.6 | Domínio customizado | ⬜ | Opcional |

---

## Variáveis de Ambiente

### `packages/backend/.env.local`
```
CONVEX_DEPLOYMENT=...           # gerado pelo `bun run dev:setup`
CONVEX_SITE_URL=...             # URL do Convex HTTP (ex: http://127.0.0.1:3211 em local)
FOOTBALL_DATA_API_KEY=...       # football-data.org (gratuito, 10 req/min)
AUTH_RESEND_KEY=...             # Resend API key para emails de auth
```

### `apps/web/.env.local`
```
NEXT_PUBLIC_CONVEX_URL=...      # copiado de packages/backend/.env.local
NEXT_PUBLIC_CONVEX_SITE_URL=... # URL do HTTP actions do Convex
```

> **Nota:** A autenticação usa `@convex-dev/auth` diretamente no Convex — não há variáveis `BETTER_AUTH_*` no web. O segredo de sessão é gerenciado pelo próprio Convex.

---

## Itens Pendentes para Pós-MVP

| Item | Prioridade |
|------|-----------|
| 2.5 — Bootstrap dos 64 jogos da Copa | Alta — necessário antes da Copa começar |
| 7.6 — Aba "Palpites" dos membros na liga | Média |
| 8.3 — Histórico de palpites no perfil | Média |
| 9.5 — Deploy no Vercel | Alta |
| 8.4 — Upload de avatar | Baixa |
| 9.6 — Domínio customizado | Baixa |
