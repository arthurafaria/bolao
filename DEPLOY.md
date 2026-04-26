# Plano de Deploy — Vercel + Convex Cloud

Plano de implementação para hospedar o Bolão no Vercel, subir o backend no Convex Cloud e garantir que o app funcione bem em celulares reais.

## Decisões já tomadas

- **Backend:** Convex Cloud (deployment gerenciado, sem self-hosting)
- **Domínio:** sem domínio custom por enquanto — usar o `*.vercel.app` gerado
- **Repo no Vercel:** aponta para o submódulo `bolao` (tem remote Git próprio), não para o repo raiz `Bolão`

## Fases

### Fase 1 — Backend Convex em produção

1. Na raiz do submódulo, rodar `bunx convex deploy` pela primeira vez para criar o deployment de produção no Convex Cloud.
2. Anotar as duas URLs geradas:
   - `CONVEX_URL` (ex.: `https://<name>.convex.cloud`) → vai em `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_SITE_URL` (ex.: `https://<name>.convex.site`) → vai em `NEXT_PUBLIC_CONVEX_SITE_URL`
3. Configurar as variáveis de ambiente necessárias no dashboard do Convex (prod):
   - Secrets do `@convex-dev/auth` (ex.: `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`)
   - `FOOTBALL_DATA_API_KEY`
   - `API_FOOTBALL_KEY` (opcional, para preencher estádios quando a football-data.org não informa)
   - Qualquer outra env lida por actions/HTTP actions
4. Testar o backend prod de forma isolada: `bunx convex run <query>` apontando para o deployment prod, para confirmar que schema, auth e functions subiram corretamente.

**Saída desta fase:** backend prod funcionando no Convex Cloud, URLs em mãos, envs configuradas.

### Fase 2 — Preparar o repo para o Vercel

1. Revisar `apps/web/.env.local`:
   - Remover `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` se não forem mais lidos por ninguém (projeto migrou para Convex Auth).
   - Conferir se `NEXT_PUBLIC_CONVEX_SITE_URL` está presente (já está no schema de `packages/env/src/web.ts`).
2. Validar build local a partir do submódulo:
   ```bash
   bun install
   bun run check-types
   bun run build
   ```
   Corrigir qualquer erro de tipo ou build antes de ir para o Vercel.
3. Conferir que o pre-commit hook (biome) não está bloqueando nada que impeça o build.
4. Garantir que `bolao` tem um remote Git acessível pelo Vercel (GitHub/GitLab/Bitbucket). Se ainda não tiver, criar o repo remoto e dar push.

**Saída desta fase:** build passa localmente, repo `bolao` no GitHub pronto para ser conectado ao Vercel.

### Fase 3 — Criar projeto no Vercel

1. Criar novo projeto no Vercel apontando para o repo `bolao`.
2. Configurar:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Install Command:** `bun install` (na raiz do monorepo; o Vercel detecta o workspace)
   - **Build Command:** deixar padrão (`next build`) — se der problema com workspace, trocar para `cd ../.. && bun run build --filter=web`
   - **Output Directory:** padrão (`.next`)
   - **Node version:** compatível com o projeto (20+)
3. Instalar a **integração oficial Convex** no marketplace do Vercel e conectar ao projeto.
   - A integração injeta `CONVEX_DEPLOY_KEY` e `NEXT_PUBLIC_CONVEX_URL` automaticamente.
   - Ela também dispara `convex deploy` no build — garantindo que schema e functions sobem junto com o frontend.
4. Adicionar manualmente a env `NEXT_PUBLIC_CONVEX_SITE_URL` (a integração não cobre essa).
5. Primeiro deploy automático a partir de push na branch principal.

**Saída desta fase:** URL `https://<projeto>.vercel.app` funcional, apontando para o backend Convex Cloud.

### Fase 4 — Testar em celular (localhost + preview)

**Durante dev (antes do deploy):**

1. Rodar `next dev -H 0.0.0.0 -p 3001` no PC.
2. Acessar `http://<IP-local-do-PC>:3001` do celular na mesma rede Wi-Fi.
3. Como o celular não alcança o Convex em `127.0.0.1:3210`, apontar `NEXT_PUBLIC_CONVEX_URL` do `.env.local` para o deployment **dev** do Convex Cloud (não o prod) — assim, o celular consegue falar com o backend sem ngrok.

**Depois do deploy:**

4. Abrir a URL `*.vercel.app` no iPhone e Android reais.
5. Testar os fluxos principais:
   - Landing → CTA
   - Sign-up / sign-in
   - Dashboard (carregamento, navegação)
   - Profile
   - Logout

### Fase 5 — Auditoria de responsividade

Revisar cada página nos breakpoints **375px**, **768px** e **1024px**.

**Páginas a revisar:**
- `apps/web/src/app/page.tsx` — landing
- `apps/web/src/app/(auth)/layout.tsx` + `sign-up/page.tsx` + `sign-in` (se existir)
- `apps/web/src/app/(app)/layout.tsx` — shell do app
- `apps/web/src/app/(app)/dashboard/page.tsx`
- `apps/web/src/app/(app)/profile/page.tsx`

**Checklist por página:**
- [ ] Sem scroll horizontal em 375px
- [ ] Touch targets ≥ 44×44px (botões, links de navegação)
- [ ] Tipografia legível: body ≥ 16px (evita zoom automático no iOS em inputs)
- [ ] Menu/nav adapta para mobile (drawer, bottom bar ou hambúrguer)
- [ ] Formulários com `inputMode` e `autocomplete` corretos
- [ ] Respeito à safe-area do iOS em elementos fixos (`env(safe-area-inset-*)`)
- [ ] Imagens com `sizes` adequado para cada breakpoint
- [ ] Estados de loading visíveis em telas pequenas
- [ ] Modals e toasts não ultrapassam a viewport

### Fase 6 — Validação final

1. Rodar Lighthouse mobile na URL de produção (target ≥ 90 em Performance e Accessibility).
2. Testar em iPhone real (Safari) e Android real (Chrome).
3. Smoke test dos fluxos críticos: signup, criar liga, entrar em liga, palpitar, ver ranking.
4. Conferir logs do Convex Cloud e do Vercel para erros não tratados.

## Variáveis de ambiente consolidadas

**Vercel (produção):**
| Variável | Origem | Público? |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Integração Convex↔Vercel | sim |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Manual | sim |
| `CONVEX_DEPLOY_KEY` | Integração Convex↔Vercel | não |

**Convex Cloud (produção):**
| Variável | Origem | Observação |
|---|---|---|
| `JWT_PRIVATE_KEY` | gerado via Node (RSA 2048, PKCS#8 PEM) | **deve ser RSA**, não EC |
| `JWKS` | gerado via Node (RS256) | par público do `JWT_PRIVATE_KEY` |
| `SITE_URL` | Manual | URL do Vercel (`https://<projeto>.vercel.app`) |
| `FOOTBALL_DATA_API_KEY` | Manual | token da football-data.org |
| `API_FOOTBALL_KEY` | Manual | opcional; token da API-FOOTBALL/API-Sports para enriquecer estádios do Brasileirão |

> **Atenção — chaves RSA obrigatórias:** o `@convex-dev/auth` com provider `Password` exige RSA (RS256).
> Chaves EC (ES256) são aceitas pelo `convex env set` mas causam erro `PrivateKeyInfo algorithm is not rsaEncryption` em runtime.
>
> Snippet para gerar e setar (requer Node 18+):
>
> ```bash
> node -e "
> const { generateKeyPairSync } = require('crypto');
> const { privateKey, publicKey } = generateKeyPairSync('rsa', {
>   modulusLength: 2048,
>   publicKeyEncoding: { type: 'spki', format: 'pem' },
>   privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
> });
> const jwk = require('crypto').createPublicKey(publicKey).export({ format: 'jwk' });
> const jwks = JSON.stringify({ keys: [{ ...jwk, use: 'sig', alg: 'RS256', kid: 'default' }] });
> const os = require('os'), path = require('path');
> require('fs').writeFileSync(path.join(os.tmpdir(), 'priv.pem'), privateKey.trim());
> require('fs').writeFileSync(path.join(os.tmpdir(), 'jwks.json'), jwks);
> console.log('Arquivos gerados em', os.tmpdir());
> "
> # Depois, a partir de packages/backend/:
> PRIV=\$(cat "\$(node -e 'const{join}=require(\"path\"),{tmpdir}=require(\"os\");process.stdout.write(join(tmpdir(),\"priv.pem\"))')") && bunx convex env set --prod JWT_PRIVATE_KEY="\$PRIV"
> JWKS=\$(cat "\$(node -e 'const{join}=require(\"path\"),{tmpdir}=require(\"os\");process.stdout.write(join(tmpdir(),\"jwks.json\"))')") && bunx convex env set --prod JWKS="\$JWKS"
> ```

## Riscos e pontos de atenção

- **Build no Vercel com Bun + workspaces:** o Vercel suporta Bun, mas pode ser preciso ajustar `Install Command` se o `--filter` não resolver dependências do workspace. Plano B: usar `bun install` na raiz e customizar `Build Command`.
- **Convex Auth `SITE_URL`:** precisa apontar para a URL do Vercel, senão login/redirects quebram em produção.
- **Próximos passos:** depois que tudo subir, avaliar domínio custom (fora do escopo deste plano).

## Como retomar

- Decidir sobre envs vestigiais do Better Auth (Fase 2.1).
- Confirmar acesso ao Convex Cloud (conta criada, CLI logada).
- Confirmar acesso ao Vercel (conta criada, repo `bolao` disponível no GitHub).
