# Plano: Reset de Pontuações + Lembrete por Email (1h antes do 1º jogo do dia)

Data: 2026-05-23

## Parte 1 — Zerar TODAS as pontuações

### Estado atual
Já existe `internal.predictions.resetComputedPoints` em [predictions.ts:216](packages/backend/convex/predictions.ts#L216) que:
- Zera `leagueMembers.totalPoints`, `exactScores`, `correctResults`
- Limpa `predictions.points` e `predictions.calculatedAt` (mantém os palpites em si, só apaga o que foi calculado)

`adminRecomputeAll` faz reset **e depois recomputa** a partir das partidas FINISHED — não serve, porque o user quer começar do zero de verdade.

### Ação
Adicionar um wrapper público `adminResetAllPoints` em `predictions.ts` que:
- Verifica `isAdmin` por email (mesmo padrão de `adminRecomputeAll`)
- Chama só `resetComputedPoints` (sem recomputar)
- Retorna `{ resetMemberships, resetPredictions }`

**Execução:** rodar uma vez via Convex dashboard ou `npx convex run predictions:adminResetAllPoints` (logado como admin) na sessão.

> Decisão: **não** apagar os documentos de `predictions` — só zerar pontos. Se a Copa começar e a partida ficar FINISHED, o cron normal vai recomputar os pontos dos palpites existentes. Isso é o comportamento desejado: "começar do zero" do placar, sem perder palpites já registrados.

---

## Parte 2 — Email "1h antes do 1º jogo do dia"

### Infraestrutura
- **Email:** Resend já está configurado (`AUTH_RESEND_KEY` no env, biblioteca `resend` instalada — usada por [ResendOTP.ts](packages/backend/convex/ResendOTP.ts)). **Não precisa de MCP nem provider novo.**
- **Agendamento:** Convex `crons` + `ctx.scheduler.runAt` (built-in, sem dependência externa).
- **Domínio:** continuamos com `onboarding@resend.dev` (sandbox do Resend) até ter domínio verificado. Limite gratuito é 100 emails/dia, suficiente pro bolão.

### Conceito
1. Um cron diário às **03:00 UTC** (= 00:00 horário de Brasília) descobre qual é o **primeiro jogo do dia** (em horário de São Paulo, torneio = `WC` Copa do Mundo).
2. Se existir um jogo, agenda um `scheduler.runAt(kickoff - 1h, sendFirstMatchReminder)`.
3. A action `sendFirstMatchReminder`:
   - Re-checa o match (status ainda válido, não cancelado/adiado)
   - Busca todos os usuários autenticados que têm `email` definido
   - Envia 1 email por usuário com: nome dos times, horário em Brasília, link pra página de palpites
4. **Idempotência:** adicionar campo opcional `reminderScheduledAt: v.optional(v.number())` em `matches` para não agendar duas vezes o mesmo lembrete.

### Mudanças no schema
[schema.ts](packages/backend/convex/schema.ts), tabela `matches`:
```ts
reminderScheduledAt: v.optional(v.number()),
```
(opcional, retrocompatível com docs existentes)

### Arquivos a criar/alterar

#### `packages/backend/convex/notifications.ts` (novo)
Três funções:

1. **`scheduleDailyReminder`** (`internalAction`, sem args)
   - Pega `now` e calcula a "janela do dia" em horário de São Paulo (`America/Sao_Paulo`, fixo UTC-3 — a Copa é em junho/julho de 2026, sem horário de verão no Brasil)
   - Roda `internal.matches.getFirstMatchOfDay(tournament: "WC", dayStartUtc, dayEndUtc)`
   - Se match existe, `status ∈ {TIMED, SCHEDULED}`, e `reminderScheduledAt` está vazio:
     - Calcula `kickoff - 1h`
     - Se ainda no futuro, agenda `internal.notifications.sendFirstMatchReminder({ matchId })` via `ctx.scheduler.runAt`
     - Marca `matches.reminderScheduledAt = now` via mutation

2. **`sendFirstMatchReminder`** (`internalAction`, args: `{ matchId }`)
   - Lê o match enriquecido (com times)
   - Se status ≠ TIMED/SCHEDULED → log e aborta (jogo cancelado/adiado)
   - Busca todos usuários via `internal.users.listEmails`
   - Para cada email: chama Resend (template HTML inline, mesmo estilo visual do OTP)
   - Loop com `Promise.allSettled` pra não falhar geral se 1 email der erro; log dos que falharem

3. **Helpers internos:**
   - `markReminderScheduled` (`internalMutation`): patch em `matches.reminderScheduledAt`

#### `packages/backend/convex/matches.ts`
Adicionar:
- **`getFirstMatchOfDay`** (`internalQuery`, args: `{ tournament, dayStartUtc, dayEndUtc }`)
  - Usa índice `by_tournament_date`
  - Filtra status TIMED/SCHEDULED
  - Retorna o primeiro por `utcDate` asc

#### `packages/backend/convex/users.ts` (novo, pequeno)
- **`listEmails`** (`internalQuery`): retorna `[{ userId, email, name }]` de todos users com email não-nulo

#### `packages/backend/convex/crons.ts`
Adicionar:
```ts
crons.cron(
  "schedule first match reminder",
  "0 3 * * *", // 03:00 UTC = 00:00 BRT
  internal.notifications.scheduleDailyReminder,
  {},
);
```

> Por que cron diário em vez de só usar `scheduler.runAt` direto: o `sync WC today` cron (de hora em hora) cria/atualiza matches, então não dá pra agendar no momento da criação sem reagendar várias vezes. Cron diário é mais previsível e single-source-of-truth.

### Template do email
Reusar o estilo visual do OTP (dark + verde). Conteúdo:
- Assunto: `⚽ {Time A} x {Time B} começa em 1h — Bolão 2026`
- Corpo HTML: nome dos times, horário em Brasília formatado, link `${SITE_URL}/predictions`, mensagem "Garanta seu palpite antes do lock!"
- Versão texto simples como fallback

### Edge cases tratados
| Situação | Comportamento |
|---|---|
| Jogo cancelado entre agendamento e envio | Action checa status, aborta com log |
| Cron roda 2× no mesmo dia (raríssimo) | `reminderScheduledAt` previne duplicata |
| Usuário sem email (Google sem scope?) | Filtrado em `users.listEmails` |
| Resend falha pra 1 email | `Promise.allSettled` segue para os outros, loga falha |
| Próximo jogo é amanhã | Cron de hoje não acha jogo TIMED hoje, não agenda — cron de amanhã pega |
| Lembrete de "agora" (jogo começa em <1h após cron rodar) | `scheduler.runAt` aceita data passada; Convex executa imediatamente |
| Vai expirar limite Resend (100/dia) | OK pra bolão pequeno; se crescer, configurar domínio próprio |

### Não-objetivos (deixar pra depois se precisar)
- Opt-out por usuário (campo `notificationsEnabled` em `users`) — adicionar quando alguém pedir
- Lembrete pra cada jogo individual (só o primeiro do dia, conforme pedido)
- Push/SMS — só email
- Templates em React Email — HTML inline é suficiente

---

## Ordem de execução

1. **Schema:** adicionar `reminderScheduledAt` em `matches`
2. **Backend:** criar `notifications.ts`, `users.ts`, adicionar query em `matches.ts`, atualizar `crons.ts`
3. **Wrapper de reset:** adicionar `adminResetAllPoints` em `predictions.ts`
4. **Deploy:** `bun run dev:server` valida sem erro de tipo; deploy de produção via Convex
5. **Executar reset uma vez:** `npx convex run predictions:adminResetAllPoints` (ou pelo dashboard)
6. **Validar:** o próximo cron de 03:00 UTC deve agendar o lembrete; checar `convex logs --tail`

---

## Variáveis de ambiente necessárias
- `AUTH_RESEND_KEY` ✅ (já existe)
- `SITE_URL` ✅ (já existe)

Sem novas envs. Sem MCP.
