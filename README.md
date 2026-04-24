# Bolão da Copa 2026

Site de previsão de placares para a Copa do Mundo 2026. Usuários fazem palpites de placar exato, participam de ligas com amigos e acompanham o ranking em tempo real.

## Stack

- **Next.js 15** (App Router) — frontend
- **Convex** — backend reactivo, real-time, crons e funções serverless
- **@convex-dev/auth** — autenticação (email+senha e OAuth)
- **shadcn/ui** + **TailwindCSS 4** — UI
- **Bun** — runtime e gerenciador de workspaces
- **Biome** — lint e formatação

## Estrutura do monorepo

```
bolao/
├── apps/
│   └── web/              # Frontend Next.js (porta 3001)
├── packages/
│   ├── backend/          # Convex: schema, funções, crons, auth
│   └── ui/               # Componentes shadcn/ui compartilhados
```

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

Copie as variáveis de ambiente geradas:

```bash
# packages/backend/.env.local → apps/web/.env.local
CONVEX_URL=...
FOOTBALL_DATA_API_KEY=...
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

## Adicionar componentes UI

Primitivos compartilhados (via `@bolao/ui`):

```bash
npx shadcn@latest add <componente> -c packages/ui
```

Blocos específicos do app web:

```bash
cd apps/web && npx shadcn@latest add <componente>
```

## Documentação

- [SPEC.md](SPEC.md) — regras de negócio, pontuação, ligas, integração de dados
- [IMPLEMENTATION.md](IMPLEMENTATION.md) — plano de implementação e checklist de progresso
