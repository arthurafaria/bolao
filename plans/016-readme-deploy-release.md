# Plan 016: README atualizado + commit, push (GitHub) e deploy de tudo

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: confirme em `plans/README.md` que 012–014 estão
> DONE e que o 015 está DONE (ou PARCIAL/BLOCKED apenas pelo roteiro
> autenticado, com os gates automatizados do Step 1 do 015 todos verdes — é o
> estado registrado em `plans/015-relatorio.md` em 2026-06-12, que **libera
> este plano**). Se o 015 estiver FAILED, STOP — não se faz release com
> verificação reprovada.
>
> **Fato conhecido do working tree (2026-06-12)**: além dos arquivos com
> conteúdo alterado, ~24 arquivos aparecem como `M` no `git status` **com
> `git diff` vazio** — artefato de fim de linha LF/CRLF do Windows (aviso "LF
> will be replaced by CRLF"). Isso é esperado, NÃO é STOP condition; ver Step 3.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED (publica em produção durante a Copa)
- **Depends on**: plans/012, 013, 014, 015
- **Category**: docs + release
- **Planned at**: commit `b04a4c0`, 2026-06-12

## Why this matters

Pedido do dono: *"Ao final do último plano criado, coloca pra ele deployar e
commitar tudo no github. Além disso atualiza o markdown README com todas as
informações."* Os planos 012–015 deixaram tudo na working tree sem commit. Este
plano documenta a feature no README, consolida o commit, publica o frontend
(push na `master` → Vercel) e o backend (`bunx convex deploy`) e fecha o ciclo.

## Current state

- Branch `master`, working tree com as mudanças de 012–015 **não commitadas**
  (decisão dos planos anteriores: commit consolidado aqui).
- `README.md` (raiz de `bolao/`) — seções relevantes:
  - "Funcionalidades implementadas → Ligas" (linhas ~80–88): bullets sobre
    convite, ranking em tempo real, "pontuação personalizada e ranking por
    exatos configuráveis", medalhas. **Não descreve** o desempate por cravadas
    nem o painel duplo.
  - "Estrutura do monorepo" (linhas ~14–53): árvore comentada; `leagues.ts`
    descrito como "join por código, getInvitePreview, getRanking".
  - "Pontuação" (linhas ~71–78): tabela 10/7/5/2/0 — continua válida.
- Deploy (README linhas ~239–248 + `DEPLOY.md`): frontend sobe **via push na
  `master`** (Vercel, root `apps/web`); backend via `bunx convex deploy` da
  raiz do monorepo. `CONVEX_DEPLOYMENT` local já aponta para
  `prod:brazen-lemming-799`.
- Convenção de commits (de `git log`): conventional commits em pt-BR, ex.:
  `feat(leagues): convite por link com entrada direta na liga`,
  `docs(readme): atualiza com convite por link, toggle de liga e fallback ESPN`.
- Superprojeto: `bolao/` é submódulo de `d:\Claude Projetos\Bolão` (repo raiz);
  o histórico do superprojeto tem commits `chore: atualiza submódulo (...)`
  após cada push do submódulo.

## Commands you will need

| Purpose | Command (da raiz `bolao/`) | Expected on success |
|---------|----------------------------|---------------------|
| Gates | `bun run check-types && bun run check && bun test packages/backend/tests && bun run build` | exit 0 em todos |
| Commit | `git add … && git commit` | pre-commit hook (Biome) passa |
| Push | `git push origin master` | aceito; dispara deploy Vercel |
| Deploy backend | `bunx convex deploy` | exit 0, funções publicadas |

## Scope

**In scope**:
- `README.md` (raiz de `bolao/`)
- `plans/README.md` (status)
- Operações git (add/commit/push) e `bunx convex deploy`
- Commit do ponteiro do submódulo no superprojeto (`d:\Claude Projetos\Bolão`)

**Out de scope**:
- Qualquer mudança de código — se um gate falhar, é STOP, não fix.
- `SPEC.md`/`DEPLOY.md` — sem mudanças de processo de deploy.
- Variáveis de ambiente / dashboard Convex / dashboard Vercel.

## Git workflow

- Branch: `master` direto (convenção do repo).
- Mensagens: conventional commits pt-BR (exemplos em "Current state").
- Push explicitamente autorizado pelo dono neste pedido ("deployar e commitar
  tudo no github").

## Steps

### Step 1: Atualizar o README

Em `README.md`, seção "Funcionalidades implementadas → Ligas":

1. Atualize o bullet "Ranking em tempo real…" e adicione bullets cobrindo:
   - Ranking padrão exibe `pontos | cravadas` por membro; **cravadas (placares
     exatos) são o 1º critério de desempate**, resultados certos o 2º.
   - Ligas "mais cravadas" têm **painel segmentado** com Ranking de pontos
     (visão padrão na entrada) e Ranking de cravadas (só placares exatos;
     pontos desempatam).
   - Card da lista de ligas mostra pontos e cravadas do usuário.
2. Na árvore do monorepo, atualize o comentário de `leagues.ts` para citar os
   comparadores: `# join por código, getRanking (comparadores em lib/ranking.ts)`
   e adicione a linha `packages/backend/tests/` (testes com `bun test`).
3. Na seção de scripts, adicione a linha
   `| bun test packages/backend/tests | Testes unitários (comparadores de ranking) |`.
4. Mencione na seção "Regras"/funcionalidades que a página `/regras` documenta
   o desempate (seção "Rankings e desempate").

**Verify**: `grep -in "desempate" README.md` → ≥2 ocorrências;
`grep -n "bun test" README.md` → 1 linha.

### Step 2: Gates finais

`bun run check-types && bun run check && bun test packages/backend/tests && bun run build`

**Verify**: exit 0 nos quatro. Se qualquer um falhar → STOP.

### Step 3: Commit consolidado

1. `git diff --stat` (não `git status`) — confira que o **conteúdo** alterado
   se limita a este conjunto (estado verificado em `plans/015-relatorio.md`):
   - `packages/backend/convex/leagues.ts`
   - `apps/web/src/app/(app)/leagues/[id]/page.tsx`
   - `apps/web/src/app/(app)/leagues/[id]/manage/page.tsx`
   - `apps/web/src/app/(app)/leagues/page.tsx`
   - `apps/web/src/app/(app)/regras/page.tsx`
   - `apps/web/src/app/page.tsx`
   - `apps/web/src/components/leagues/podium.tsx`
   - `apps/web/src/components/leagues/ranking-row.tsx`
   - `plans/README.md`
   - `README.md` (após o Step 1 deste plano)
   - Untracked: `packages/backend/convex/lib/`, `packages/backend/tests/`,
     `plans/012-*.md` … `plans/016-*.md`, `plans/015-relatorio.md`
   Arquivo com **diff de conteúdo** fora dessa lista → STOP.
   Arquivos `M` no `git status` com `git diff <arquivo>` vazio são o artefato
   CRLF já conhecido — ignore-os; `git add` neles é no-op e não vai sujar o
   commit.
2. Commits separados por unidade lógica (convenção do repo) — use os paths
   explícitos abaixo, não `git add -A`:
   - `git add packages/backend` →
     `feat(leagues): comparadores de ranking com desempate por cravadas + testes`
   - `git add apps/web` →
     `feat(leagues): painel pontos/cravadas na liga e cravadas no ranking`
   - `git add README.md plans` →
     `docs: ranking duplo, desempate por cravadas e planos 012-016`
3. O pre-commit hook (Biome) deve passar em cada commit — se falhar, rode
   `bun run check` e re-stage; se persistir, STOP.

**Verify**: `git log --oneline -3` mostra os 3 commits; `git status` sem nada
staged e sem untracked de código (os `M` de CRLF podem permanecer).

### Step 4: Push (GitHub → deploy do frontend na Vercel)

`git push origin master`

**Verify**: push aceito (exit 0). O deploy da Vercel é automático no push; se
você tiver acesso à CLI/dashboard da Vercel, confirme que o deployment ficou
`READY`; senão, anote no relatório que a confirmação ficou com o dono.

### Step 5: Deploy do backend (Convex)

Da raiz `bolao/`: `bunx convex deploy`

Isso publica `leagues.ts` + `lib/ranking.ts` em produção. A mudança é
backward-compatible (mesma ordenação, campo `myExacts` aditivo), então a ordem
frontend/backend não importa.

**Verify**: exit 0 e saída listando o deployment de produção. Em seguida,
smoke test read-only: abrir o site em produção, entrar numa liga e conferir
que o ranking renderiza com `pts | cravadas` (cenários 2 e 4–5 do plano 015,
versão rápida).

**Pendência herdada do 015**: os cenários autenticados 1–8 e 11–14 ficaram
para o dono (sem credenciais de teste — ver `plans/015-relatorio.md`). Após o
deploy, peça ao dono para preencher a tabela do relatório **em produção**
(tudo read-only; criar liga "mais cravadas" de teste é permitido). Se algum
cenário 2–8 falhar em prod, acione o rollback descrito nas STOP conditions.

### Step 6: Ponteiro do submódulo no superprojeto

No diretório pai (`d:\Claude Projetos\Bolão`):

1. `git add bolao`
2. `git commit -m "chore: atualiza submódulo (ranking duplo pontos/cravadas)"`
3. `git push` **somente se** `git remote -v` mostrar um remote configurado;
   sem remote, o commit local basta (anote no relatório).

**Verify**: `git -C "d:\Claude Projetos\Bolão" log --oneline -1` mostra o
commit do ponteiro.

### Step 7: Fechar o índice

Atualize `plans/README.md`: 012–016 com status final e uma linha de nota se
algo ficou pendente (ex.: confirmação do deploy Vercel).

## Test plan

- Sem testes novos. Os gates do Step 2 + smoke test do Step 5 são a verificação.

## Done criteria

- [ ] `grep -in "desempate" README.md` ≥2 ocorrências
- [ ] Gates do Step 2 todos exit 0
- [ ] `git log --oneline -3` mostra os commits feat/feat/docs
- [ ] `git push origin master` exit 0
- [ ] `bunx convex deploy` exit 0
- [ ] Smoke test de produção executado (ou explicitamente delegado ao dono no relatório)
- [ ] Commit do ponteiro no superprojeto feito
- [ ] `plans/README.md` com 012–016 finalizados

## STOP conditions

Pare e reporte se:

- Qualquer gate do Step 2 falhar — não conserte código neste plano.
- `git status` mostrar arquivos fora do conjunto esperado dos planos 012–016.
- O push for rejeitado (ex.: remote à frente) — **não** use `--force`; faça
  `git pull --rebase origin master`, re-rode os gates e tente de novo uma vez;
  se ainda falhar, reporte.
- `bunx convex deploy` falhar ou pedir configuração interativa.
- O smoke test de produção mostrar ranking quebrado → reporte imediatamente;
  o rollback do frontend é re-deploy do commit anterior na Vercel (dono
  decide), e o backend pode ser revertido com `git revert` + novo deploy.

## Maintenance notes

- A partir daqui, qualquer mudança na cadeia de desempate exige atualizar **em
  conjunto**: `lib/ranking.ts` + testes (012), copy de regras/landing (014) e
  README (016). Inconsistência entre código e regra escrita é bug de produto.
- O dia em que existir staging do Convex, o Step 5 ganha um passo
  intermediário — hoje é deploy direto em prod (realidade do projeto, já
  documentada no README).
