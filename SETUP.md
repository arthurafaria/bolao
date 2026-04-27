# Como rodar o projeto em um PC novo

Guia prático e completo. Siga em ordem — são ~5 minutos.

---

## 1. Pré-requisitos

Instale **Bun** (runtime + gerenciador de pacotes):

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell como admin)
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verifique:

```bash
bun --version   # deve ser >= 1.3
git --version
node --version  # deve ser >= 18 (usado apenas para gerar chaves JWT se necessário)
```

---

## 2. Clonar o repositório

```bash
git clone https://github.com/arthurafaria/bolao.git
cd bolao
```

---

## 3. Instalar dependências

```bash
bun install
```

---

## 4. Configurar variáveis de ambiente

O projeto precisa de dois arquivos `.env.local` (não versionados). Crie-os com os valores abaixo:

### `packages/backend/.env.local`

```env
# Deployment de desenvolvimento local do Convex
# Deixe este arquivo configurado para rodar o Convex localmente.
# Para inicializar pela primeira vez, rode: bun run dev:setup (veja Seção 5b)
CONVEX_DEPLOYMENT=prod:brazen-lemming-799
CONVEX_URL=https://brazen-lemming-799.convex.cloud
CONVEX_SITE_URL=https://brazen-lemming-799.convex.site
FOOTBALL_DATA_API_KEY=b536090580204ad6a4da508a9bd7bf23
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_CONVEX_URL=https://brazen-lemming-799.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://brazen-lemming-799.convex.site
```

---

## 5. Instalar o pre-commit hook (Biome)

```bash
bun run setup:hooks
```

Isso instala o linter automático que roda antes de cada commit.

---

## 6. Rodar o projeto

### Opção A — Só o frontend (mais rápido, usa o backend de produção)

```bash
bun run dev:web
```

Acesse [http://localhost:3001](http://localhost:3001).

> Use esta opção no dia a dia para trabalhar no frontend sem precisar do Convex local rodando.

### Opção B — Frontend + backend Convex local (ambiente completo)

Precisa que o Convex CLI esteja logado:

```bash
bunx convex login   # abre o browser para autenticar
bun run dev         # sobe web (porta 3001) + Convex (porta 3210) em paralelo
```

> Use esta opção quando for alterar funções do backend (`packages/backend/convex/`).

---

## 7. Verificar se está tudo ok

- [http://localhost:3001](http://localhost:3001) → deve abrir o app
- Faça login com sua conta (já cadastrada em produção)
- A página de **Palpites** deve exibir as rodadas do Brasileirão

---

## Comandos úteis do dia a dia

| Comando | O que faz |
|---|---|
| `bun run dev:web` | Só o frontend (porta 3001) |
| `bun run dev` | Frontend + Convex local |
| `bun run check-types` | Checa TypeScript em todos os workspaces |
| `bun run check` | Biome lint + autofix |
| `git add -p && git commit` | Commit interativo (hook roda Biome automaticamente) |

---

## Deploy

O site sobe automaticamente no Vercel a cada push em `master`.

Para forçar um deploy manualmente (a partir da raiz do monorepo):

```bash
npx vercel deploy --prod
```

> O projeto já está vinculado: `arthurafarias-projects/bolao-web`.

---

## Operações de manutenção (via Convex CLI)

Execute a partir de `packages/backend/` com `CONVEX_URL` do `.env.local` ou com a flag `--prod`:

```bash
# Importar todos os jogos da temporada (BSA) — rode uma vez se o banco estiver vazio
npx convex run footballData:syncAllBSA --prod

# Forçar sync do Brasileirão agora (últimos 7 dias + próximos 30 dias)
npx convex run footballData:syncTodayBSA --prod

# Importar todos os jogos da Copa do Mundo
npx convex run footballData:syncAll --prod

# Recomputar pontos de todos os jogos encerrados
npx convex run predictions:recomputeAll --prod

# Ver logs em tempo real
npx convex logs --prod --tail
```

> Essas mesmas operações estão disponíveis em `/admin` no site (mais fácil).

---

## Troubleshooting

**`bun run dev` não inicia o Convex**
→ Rode `bunx convex login` para autenticar o CLI.

**Página em branco / erro de CORS**
→ Confira se `NEXT_PUBLIC_CONVEX_URL` em `apps/web/.env.local` está correto.

**Commit bloqueado pelo hook**
→ O Biome encontrou erros de lint. Rode `bun run check` para ver e corrigir.

**Tipos fora de sincronia (`_generated` desatualizados)**
→ Rode `bun run dev:server` pelo menos uma vez para o Convex gerar os tipos atualizados.
