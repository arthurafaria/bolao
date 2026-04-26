# Bolão da Copa 2026

Site de previsão de placares para a Copa do Mundo 2026 e Brasileirão Série A. Usuários fazem palpites de placar exato, participam de ligas com amigos e acompanham o ranking em tempo real.

## Stack

- **Next.js 15** (App Router) — frontend
- **Convex** — backend reativo, real-time, crons e funções serverless
- **@convex-dev/auth** — autenticação (email+senha; chaves RSA RS256 obrigatórias)
- **shadcn/ui** + **TailwindCSS 4** — UI (design system Copa: verde + amarelo, dark mode, Barlow/DM Mono)
- **Bun** — runtime e gerenciador de workspaces
- **Biome** — lint e formatação (pre-commit hook)

## Estrutura do monorepo

```
bolao/
├── apps/
│   └── web/                    # Frontend Next.js (porta 3001)
│       └── src/
│           ├── app/
│           │   ├── (app)/      # Rotas autenticadas
│           │   │   ├── admin/          # Ferramentas de admin (só owner)
│           │   │   ├── dashboard/
│           │   │   ├── leagues/[id]/
│           │   │   │   ├── members/[userId]/   # Palpites públicos do membro
│           │   │   │   └── manage/
│           │   │   ├── predictions/
│           │   │   ├── profile/        # Com editor de nome
│           │   │   └── regras/
│           │   └── (auth)/     # sign-in, sign-up
│           ├── components/
│           │   └── match-card.tsx      # Card de partida (modo normal + readOnly)
│           ├── contexts/
│           │   └── tournament-context.tsx  # Alterna WC2026/BSA2026 (default: BSA2026)
│           └── lib/
│               ├── match-grouping.ts   # Helpers: groupByRound, roundLabel
│               ├── points-palette.ts   # Paleta de pontos (10/7/5/2/0) — fonte da verdade
│               └── team-translations.ts
├── packages/
│   ├── backend/                # Convex: schema, funções, crons, auth
│   │   └── convex/
│   │       ├── footballData.ts # Sync WC2026 + BSA2026, admin wrappers
│   │       ├── matches.ts      # upsertMatch + forceFinishStaleLive
│   │       ├── predictions.ts  # Palpites, cálculo de pontos, recomputeAll
│   │       ├── leagues.ts      # getRanking com nomes reais
│   │       ├── crons.ts        # WC: 0 * * * * | BSA: */10 * * * *
│   │       └── schema.ts
│   └── ui/                     # Componentes shadcn/ui compartilhados
```

## Torneios suportados

| Código | Torneio | Cron |
|--------|---------|------|
| `WC2026` | Copa do Mundo 2026 | hourly (`0 * * * *`) |
| `BSA2026` | Brasileirão Série A 2026 | a cada 10 min (`*/10 * * * *`) |

A UI abre no **Brasileirão** por padrão (tem jogos em andamento agora). O usuário pode trocar pelo seletor de torneio — a preferência é salva em `localStorage`.

## Funcionalidades implementadas

### Palpites
- Input de placar +/− por jogo, bloqueado 1h antes do início
- Badge de pontos **acima** do placar quando o jogo encerra, com cores unificadas pela paleta de Regras (`points-palette.ts`)
- Edge case: palpite com jogo encerrado mas pontos ainda não calculados → badge cinza "aguardando"

### Pontuação
| Resultado | Pontos |
|-----------|--------|
| Placar exato | ⭐ 10 |
| Vencedor + diferença de gols | 7 |
| Vencedor certo | 5 |
| Empate previsto (placar errado) | 2 |
| Errou | 0 |

### Ligas
- Criar liga OPEN ou MODERATED (aprovação manual de membros)
- Entrar por código de convite
- Ranking em tempo real com **nomes reais** dos membros
- Clicar em um membro do ranking abre `/leagues/[id]/members/[userId]` com todos os **palpites bloqueados** daquele membro (visíveis só para membros ativos da liga)
- Posição 1/2/3 com medalhas 🥇🥈🥉

### Perfil
- Stats: total de palpites, % de acerto, pontos totais
- Editor de nome (para contas criadas antes do campo ser obrigatório)

### Página admin (`/admin`)
Acessível apenas para o e-mail owner. Botões:
- **Resync Brasileirão** — força `syncTodayBSA` imediatamente
- **Resync Copa** — força `syncToday`
- **Forçar encerramento** — promove jogos `IN_PLAY`/`PAUSED` com mais de 3h para `FINISHED` (cobre API que não emite o status final)
- **Recompute pontos** — recalcula pontos de todos os jogos `FINISHED` com placar (idempotente)

### Robustez do cálculo de pontos
- `shouldComputePoints` — captura transições perdidas (jogo que entrou como `FINISHED` com score `null` na primeira sync e recebeu o score na sync seguinte)
- `forceFinishStaleLive` — varredura periódica: todo jogo com mais de 3h do início e placar preenchido, mas ainda `IN_PLAY`/`PAUSED`, vira `FINISHED`
- `recomputeAll` — ferramenta de emergência para reprocessar toda a base

## Pré-requisitos

- [Bun](https://bun.sh) >= 1.3
- Conta no [Convex](https://convex.dev)
- Chave de API do [football-data.org](https://www.football-data.org) (gratuita, 10 req/min)

## Setup

```bash
bun install
```

Configure o projeto Convex (primeira vez):

```bash
bun run dev:setup
```

Copie as variáveis de ambiente:

```bash
# packages/backend/.env.local
CONVEX_DEPLOYMENT=...            # gerado pelo dev:setup
CONVEX_SITE_URL=...              # URL do Convex HTTP local
FOOTBALL_DATA_API_KEY=...        # football-data.org

# apps/web/.env.local
NEXT_PUBLIC_CONVEX_URL=...       # copiado de packages/backend
NEXT_PUBLIC_CONVEX_SITE_URL=...  # URL do HTTP actions do Convex
```

> **Nota:** a autenticação não usa variáveis `BETTER_AUTH_*` nem `RESEND_*`. O `@convex-dev/auth` com provider `Password` requer chaves **RSA** (RS256) — ver seção Chaves JWT abaixo.

Instale o pre-commit hook (Biome):

```bash
bun run setup:hooks
```

Suba o ambiente de desenvolvimento:

```bash
bun run dev
```

Acesse em [http://localhost:3001](http://localhost:3001).

## Scripts disponíveis

| Comando | O que faz |
|---------|-----------|
| `bun run dev` | Sobe web + backend Convex em paralelo |
| `bun run dev:web` | Só o frontend |
| `bun run dev:server` | Só o Convex |
| `bun run build` | Build de todos os workspaces |
| `bun run check-types` | TypeScript em todos os workspaces |
| `bun run check` | Biome lint + format (com autofix) |
| `bun run setup:hooks` | Instala pre-commit hook localmente |

## Adicionar componentes UI

Primitivos compartilhados (via `@bolao/ui`):

```bash
npx shadcn@latest add <componente> -c packages/ui
```

Blocos específicos do app web:

```bash
cd apps/web && npx shadcn@latest add <componente>
```

## Chaves JWT (auth em produção)

O `@convex-dev/auth` com `Password` exige **RSA 2048 / RS256** — chaves EC causam erro `PrivateKeyInfo algorithm is not rsaEncryption` em runtime.

Gerar e configurar:

```bash
node -e "
const { generateKeyPairSync, createPublicKey } = require('crypto');
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const jwk = createPublicKey(publicKey).export({ format: 'jwk' });
const jwks = JSON.stringify({ keys: [{ ...jwk, use: 'sig', alg: 'RS256', kid: 'default' }] });
const { writeFileSync } = require('fs');
writeFileSync('/tmp/priv.pem', privateKey.trim());
writeFileSync('/tmp/jwks.json', jwks);
console.log('Gerado em /tmp/');
"
# Em packages/backend/:
bunx convex env set --prod JWT_PRIVATE_KEY="$(cat /tmp/priv.pem)"
bunx convex env set --prod JWKS="$(cat /tmp/jwks.json)"
```

Variáveis de ambiente do Convex Cloud (produção):

| Variável | Observação |
|----------|-----------|
| `JWT_PRIVATE_KEY` | Chave privada RSA 2048 PKCS#8 PEM |
| `JWKS` | Chave pública RS256 em formato JSON |
| `SITE_URL` | URL do Vercel (`https://<projeto>.vercel.app`) |
| `FOOTBALL_DATA_API_KEY` | Token da football-data.org |

## Deploy (Vercel + Convex Cloud)

Ver [DEPLOY.md](DEPLOY.md) para o guia completo. Resumo:

1. `bunx convex deploy` (da raiz do monorepo) → sobe backend + gera URLs
2. Configurar as 4 variáveis acima no dashboard do Convex (prod)
3. Criar projeto no Vercel apontando para este repo
   - Root directory: `apps/web`
   - Instalar integração oficial Convex↔Vercel (injeta `NEXT_PUBLIC_CONVEX_URL`)
   - Adicionar manualmente `NEXT_PUBLIC_CONVEX_SITE_URL`

## Operações manuais úteis

```bash
# Forçar sync do Brasileirão agora (de packages/backend/)
npx convex run footballData:syncTodayBSA '{}'

# Importar todos os jogos da Copa de uma vez
npx convex run footballData:syncAll '{}'

# Recomputar pontos de todos os jogos encerrados
npx convex run predictions:recomputeAll '{}'

# Forçar encerramento de jogos travados em IN_PLAY
npx convex run matches:forceFinishStaleLive '{}'

# Ver logs em tempo real
npx convex logs --tail
```

## Documentação

- [SPEC.md](SPEC.md) — regras de negócio, pontuação, ligas, integração de dados
- [IMPLEMENTATION.md](IMPLEMENTATION.md) — plano de implementação e checklist de progresso
- [DEPLOY.md](DEPLOY.md) — guia de deploy Vercel + Convex Cloud
