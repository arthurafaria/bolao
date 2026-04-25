# Plano de correções de usabilidade

> Data do plano: 2026-04-25
> Estado: pendente de execução

## Diagnóstico

Investigação feita antes de montar o plano. Raiz de cada problema reportado:

- **Default Copa do Mundo:** [`apps/web/src/contexts/tournament-context.tsx:33,40`](apps/web/src/contexts/tournament-context.tsx) inicializa o estado como `WC2026`. Qualquer aparelho sem `localStorage` salvo cai na Copa.
- **Sem jogos da Copa:** o único cron que toca o football-data é `syncToday`, que só pede `dateFrom=hoje&dateTo=amanhã` ([`packages/backend/convex/crons.ts:7`](packages/backend/convex/crons.ts), [`packages/backend/convex/footballData.ts:144-153`](packages/backend/convex/footballData.ts)). Como hoje é 2026-04-25 e a Copa só começa em junho, a API responde `{matches: []}` a cada execução. Existe `syncAll` ([`footballData.ts:137`](packages/backend/convex/footballData.ts)), mas nada o aciona pela UI/cron — a fixture list nunca foi semeada.
- **"Jogador XXXX" / "Você":** o backend [`leagues.getRanking`](packages/backend/convex/leagues.ts) devolve só `leagueMembers` cru, sem cruzar com a tabela `users` do auth. O front faz o fallback feio em [`apps/web/src/app/(app)/leagues/[id]/page.tsx:60`](apps/web/src/app/\(app\)/leagues/[id]/page.tsx). O nome existe no banco — o `sign-up-form.tsx` força `min(2)` no campo nome e o profile do auth já persiste `name` ([`auth.ts:10-16`](packages/backend/convex/auth.ts)).

---

## 1. Default de torneio: abrir no Brasileirão

**Por quê:** é o único campeonato com jogos hoje. Cair na Copa vazia é o pior primeiro contato possível enquanto faltam ~6 semanas pro Mundial começar.

**Como:**

- Trocar `useState<TournamentCode>("WC2026")` para `"BSA2026"` em [`tournament-context.tsx:40`](apps/web/src/contexts/tournament-context.tsx).
- Trocar também o default do `createContext` na linha 33 pra ficar consistente.
- Manter o respeito ao `localStorage`: quem já escolheu Copa continua na Copa.

**Decisão pendente:** quando a Copa começar em junho, voltamos pra `WC2026` manual ou implementamos um auto-default "torneio com jogo mais próximo"?

---

## 2. Backfill da fixture da Copa do Mundo 2026

**Por quê:** mesmo abrindo no Brasileirão, a aba Copa precisa ter conteúdo. A API football-data já publica o calendário do `WC2026`; falta importar.

**Como:**

- Rodar uma vez: `npx convex run footballData:syncAll '{}'` (ou via dashboard Convex). Sem `dateFrom`/`dateTo`, importa os 104 jogos.
- Ampliar o cron pra blindar o futuro: trocar `syncToday` por uma janela `today → today + 60 dias`. Conforme a API confirmar datas/sedes, novos jogos entram automaticamente sem execução manual.
- Frequência: 1×/hora está OK pro Brasileirão (jogos rolando), mas a Copa pré-início pode ir pra 4×/dia. Pode ser um cron único cobrindo os dois torneios com janela maior.

**Arquivos:** [`packages/backend/convex/crons.ts`](packages/backend/convex/crons.ts), [`packages/backend/convex/footballData.ts`](packages/backend/convex/footballData.ts).

---

## 3. Mostrar nomes reais no ranking da liga

**Por quê:** "Jogador A4F2" mata a graça de competir. Queremos ver "Arthur 88 pts" pra criar a vibe de bolão.

**Backend** ([`packages/backend/convex/leagues.ts`](packages/backend/convex/leagues.ts)):

- Em `getRanking`, depois do `take(50)`, fazer `Promise.all` puxando `ctx.db.get(member.userId as Id<"users">)` e devolver `{ ...member, name, email }`.
- Fallback: se `name` faltar, usar prefixo do email; se nem isso, `"Jogador"`.
- Mesma enriquecida vale pra `getPendingRequests` (página de gerenciamento da liga). `getUserLeagues` é só do próprio usuário, então não precisa.

**Frontend** ([`apps/web/src/app/(app)/leagues/[id]/page.tsx:60`](apps/web/src/app/\(app\)/leagues/[id]/page.tsx)):

- Tirar o `isCurrentUser ? "Você" : ...`. Mostrar sempre `member.name`.
- Pra deixar claro qual linha é a do usuário logado, manter o destaque visual atual (`border-primary/20 bg-primary/10`) e adicionar um badge sutil "você" ao lado do nome — em vez de substituir o nome.

---

## 4. Garantir que contas antigas tenham nome

Se algum dos 4+ usuários do Convex auth foi criado antes do form atual ou via fluxo que não passou `name`, vai aparecer como prefixo do email. A página de perfil já lê `user.name`, mas **não tem editor**.

**Como:**

- Adicionar campo "Nome" editável em [`apps/web/src/app/(app)/profile/page.tsx`](apps/web/src/app/\(app\)/profile/page.tsx) chamando `api.auth.setCurrentUserName` (mutation que já existe em [`auth.ts:37`](packages/backend/convex/auth.ts) e está sem uso).
- Custo: baixíssimo, grande retorno.

---

## Ordem de execução proposta

1. Backend: enriquecer `getRanking` com nomes (~5 min).
2. Frontend: ajustar ranking pra mostrar nome + badge "você" (~5 min).
3. Trocar default pra `BSA2026` (~1 min).
4. Ampliar janela do cron + rodar `syncAll` da Copa uma vez (~5 min).
5. Adicionar editor de nome no perfil (~10 min).

**Total estimado:** ~30 min. Arquivos isolados, sem refactor estrutural — risco baixo.

---

## Checklist de execução

- [ ] 1. `getRanking` retorna `name`/`email` cruzados com `users`
- [ ] 2. Ranking da liga exibe nome real + badge "(você)" no usuário logado
- [ ] 3. `getPendingRequests` também enriquecido com nomes
- [ ] 4. Default do `TournamentContext` virou `BSA2026`
- [ ] 5. `syncAll` da Copa rodado uma vez (104 jogos no banco)
- [ ] 6. Cron `syncToday` ampliado pra janela de 60 dias
- [ ] 7. Editor de nome funcional no `/profile`
