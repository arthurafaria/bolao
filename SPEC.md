# Bolão da Copa — Especificação do Produto

> Última atualização: 2026-04-21

## Visão Geral

Site de previsão de placares para a Copa do Mundo 2026 (e futuras competições). Usuários fazem palpites de placares, participam de ligas com ranking e acompanham resultados em tempo real.

---

## Funcionalidades

### 1. Autenticação
- Login/cadastro via email+senha e OAuth (Google)
- Gerenciado pelo BetterAuth + `@convex-dev/better-auth`
- Perfil do usuário: nome, avatar, apelido (nickname)

### 2. Palpites
- Usuário prevê o placar exato de cada partida (gols do time A × gols do time B)
- Palpites podem ser criados/editados até **1 hora antes** do início da partida
- Após o encerramento da janela, palpites ficam bloqueados e visíveis para membros das mesmas ligas
- Pontuação calculada automaticamente após o resultado oficial ser registrado

#### Sistema de Pontuação

| Resultado | Pontos |
|-----------|--------|
| Placar exato | 10 pts |
| Vencedor correto + saldo de gols correto | 7 pts |
| Vencedor correto + gols de um dos times correto | 5 pts |
| Apenas vencedor correto (ou empate certo, placar errado) | 3 pts |
| Resultado completamente errado | 0 pts |

### 3. Ligas
- Usuário pode criar ligas e convidar outros
- **Limite:** 50 membros por liga
- **Tipos de entrada:**
  - `OPEN`: qualquer usuário pode entrar com o link/código de convite
  - `MODERATED`: o administrador aprova ou recusa cada solicitação
- O criador da liga é o administrador
- Admin pode remover membros e alterar configurações da liga
- Cada liga tem um código de convite único (6 caracteres alfanuméricos)

#### Ranking da Liga
- Tabela ordenada por pontos totais acumulados (soma de todos os jogos)
- Em caso de empate: critério de desempate por mais palpites exatos, depois mais vitórias corretas
- Exibe posição, nome, avatar e pontuação de cada membro

### 4. Visualização de Palpites de Outros Jogadores
- Membros da mesma liga podem ver os palpites dos colegas **depois que a janela de edição fechar** (1h antes do jogo)
- Antes disso, os palpites são privados

### 5. Partidas e Dados
- Dados da Copa do Mundo 2026 sincronizados via API externa (ver seção Integração de Dados)
- Exibição por fase: grupos, oitavas, quartas, semis, final
- Status da partida: `SCHEDULED`, `LIVE`, `FINISHED`, `POSTPONED`
- Resultados atualizados automaticamente via cron job no Convex

---

## Páginas / Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page com CTA de cadastro/login |
| `/dashboard` | Home pós-login: próximas partidas + resumo de pontuação nas ligas |
| `/predictions` | Lista de todas as partidas para palpitar, agrupadas por rodada/fase |
| `/predictions/[matchId]` | Detalhe de uma partida: palpite individual + estatísticas |
| `/leagues` | Explorar ligas públicas + criar liga |
| `/leagues/[leagueId]` | Ranking da liga + palpites dos membros por partida |
| `/leagues/[leagueId]/manage` | Administração da liga (apenas para admin) |
| `/leagues/join/[inviteCode]` | Entrar em uma liga via código |
| `/profile` | Perfil do usuário: histórico, estatísticas pessoais |

---

## Design e UX

- Inspirado no **Cartola FC** e **Rei do Pitaco**: visual moderno, esportivo, mobile-first
- Paleta de cores: verde/amarelo/azul (Copa do Brasil) com fundo escuro
- Componentes via **shadcn/ui** + **TailwindCSS**
- Atualizações em tempo real via **Convex subscriptions** (ranking, resultados ao vivo)
- Toasts para feedback de ações (palpite salvo, liga criada, etc.)

---

## Integração de Dados (API de Futebol)

### API Escolhida: `football-data.org`
- **Plano gratuito:** 10 req/min, acesso à Copa do Mundo e Copas Continentais
- **Endpoint base:** `https://api.football-data.org/v4/`
- **Autenticação:** Header `X-Auth-Token`
- **Competição:** World Cup 2026 (código: `WC`)

### Estratégia de Sincronização
- **Cron job no Convex** roda a cada hora para buscar resultados de partidas do dia
- **Bootstrap inicial:** script único para importar todos os jogos da competição
- Cache de dados no Convex (não chamar API a cada request do usuário)
- Fallback: caso a API esteja fora, exibe dados em cache com timestamp da última atualização

### Dados Necessários da API
- Lista de partidas (id, times, data/hora, grupo/fase)
- Resultado das partidas (placar final, placar de prorrogação/penaltis)
- Times: nome, código, bandeira/escudo
- Grupos e classificação (fase de grupos)

---

## Stack Técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 (App Router), TypeScript |
| Estilização | TailwindCSS 4, shadcn/ui |
| Backend/DB | Convex |
| Autenticação | BetterAuth + `@convex-dev/better-auth` |
| Real-time | Convex subscriptions (useQuery) |
| Cron Jobs | Convex scheduled functions |
| Deploy | Vercel (frontend) + Convex Cloud (backend) |
| Monorepo | Bun workspaces + Biome (lint/format) |

---

## Modelo de Dados (Convex Schema)

### `users`
> Gerenciado pelo BetterAuth — tabelas: `user`, `session`, `account`, `verification`

### `teams`
```
id, name, shortName, crest (url), nationality, apiId
```

### `matches`
```
id, homeTeamId, awayTeamId, utcDate, status,
homeScore (null até acabar), awayScore (null até acabar),
stage (GROUP_STAGE | ROUND_OF_16 | QUARTER_FINALS | SEMI_FINALS | FINAL),
group (A-H | null), matchday, apiId, tournament
```

### `predictions`
```
id, userId, matchId,
predictedHome, predictedAway,
points (null até calculado), calculatedAt,
createdAt, updatedAt
```

### `leagues`
```
id, name, description, ownerId,
joinType (OPEN | MODERATED),
inviteCode, memberCount, createdAt
```

### `leagueMembers`
```
id, leagueId, userId,
totalPoints, status (ACTIVE | PENDING | REMOVED),
joinedAt
```

### `leagueJoinRequests`
```
id, leagueId, userId, requestedAt, status (PENDING | APPROVED | REJECTED)
```
