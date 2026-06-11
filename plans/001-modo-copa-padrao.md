# Plan 001: Todo usuário entra no modo Copa do Mundo por padrão até 19/07/2026

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e87755c..HEAD -- apps/web/src/contexts/tournament-context.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `e87755c`, 2026-06-10

## Why this matters

A Copa do Mundo 2026 começa em **11/06/2026** (amanhã, na data deste plano) e a final é em **19/07/2026**. Hoje o app abre por padrão no modo **Brasileirão** (`BSA2026`), e a preferência fica gravada em `localStorage` — um usuário que alguma vez selecionou Brasileirão vai abrir o site durante a Copa e ver jogos do Brasileirão. O dono do produto decidiu: **todo usuário que entrar estará automaticamente no modo Copa do Mundo até 19/7**. O Brasileirão continua acessível pelo seletor, mas a Copa é o padrão de toda sessão durante o torneio.

## Current state

- `apps/web/src/contexts/tournament-context.tsx` — único arquivo que define o torneio ativo. Contexto React com persistência em `localStorage` (chave `bolao_tournament`).

Excerto atual (`tournament-context.tsx:22-46`):

```tsx
const STORAGE_KEY = "bolao_tournament";

const TournamentContext = createContext<{
	tournament: TournamentCode;
	setTournament: (t: TournamentCode) => void;
}>({ tournament: "BSA2026", setTournament: () => {} });

export function TournamentProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [tournament, setTournamentState] = useState<TournamentCode>("BSA2026");

	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY) as TournamentCode | null;
		if (saved && saved in COMPETITIONS) {
			setTournamentState(saved);
		}
	}, []);

	const setTournament = (t: TournamentCode) => {
		setTournamentState(t);
		localStorage.setItem(STORAGE_KEY, t);
	};
	...
```

`COMPETITIONS` (mesmo arquivo, linhas 5-18) tem `WC2026` ("Copa do Mundo") e `BSA2026` ("Brasileirão"). O consumidor principal é `useTournament()`, usado por páginas como `apps/web/src/app/(app)/predictions/page.tsx:64` e pelo `CompetitionSwitcher` em `apps/web/src/app/(app)/layout.tsx:390-480`.

Convenções do repo: TypeScript estrito, Biome para lint/format (tabs, aspas duplas), comentários e UI em português.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `bun install`            | exit 0              |
| Typecheck | `bun run check-types`    | exit 0 (roda em todos os workspaces) |
| Lint      | `bunx biome check apps/web` | exit 0           |
| Build     | `bun run build`          | exit 0              |

Não há suíte de testes neste repo — a verificação é typecheck + build + checagem manual descrita nos passos.

## Scope

**In scope** (the only files you should modify):
- `apps/web/src/contexts/tournament-context.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `apps/web/src/app/(app)/layout.tsx` (`CompetitionSwitcher`) — o seletor continua funcionando como está; não remova o Brasileirão dele.
- `packages/backend/convex/crons.ts` — sincronização do BSA continua ativa (modo Brasileirão fica "de lado", não morto).
- Qualquer página que consome `useTournament()` — a mudança é só no provider.

## Git workflow

- Branch: `advisor/001-modo-copa-padrao`
- Commits em português, conventional commits, como no histórico (`feat:`, `fix:`, `style(escopo):`). Exemplo do log: `feat: remove modo demo e reordena selector de competição`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Adicionar a janela "Copa por padrão" no provider

Em `apps/web/src/contexts/tournament-context.tsx`:

1. Adicione uma constante com o fim da janela (fim do dia da final, horário UTC):

```tsx
// Até o fim da final da Copa (19/07/2026), toda sessão abre no modo Copa.
const WC_DEFAULT_UNTIL_MS = Date.UTC(2026, 6, 19, 23, 59, 59); // mês 6 = julho
```

2. Mude o estado inicial de `"BSA2026"` para um cálculo:

```tsx
function defaultTournament(): TournamentCode {
	return Date.now() <= WC_DEFAULT_UNTIL_MS ? "WC2026" : "BSA2026";
}
```

e use `useState<TournamentCode>(defaultTournament)`.

3. No `useEffect` que lê o `localStorage`: **durante a janela da Copa, ignore o valor salvo** — toda sessão começa em `WC2026`. Após 19/7, o comportamento atual (restaurar o salvo) volta a valer:

```tsx
useEffect(() => {
	if (Date.now() <= WC_DEFAULT_UNTIL_MS) return; // Copa é o padrão da sessão
	const saved = localStorage.getItem(STORAGE_KEY) as TournamentCode | null;
	if (saved && saved in COMPETITIONS) {
		setTournamentState(saved);
	}
}, []);
```

4. `setTournament` continua igual (o usuário ainda pode trocar para o Brasileirão dentro da sessão, e o valor salvo voltará a ser respeitado depois de 19/7).

5. Atualize também o valor default do `createContext` de `"BSA2026"` para `"WC2026"` (linha 27) — é só o fallback fora do provider, mas deve refletir o novo padrão.

**Verify**: `bun run check-types` → exit 0.

### Step 2: Verificação manual

Rode `bun run dev:web`, faça login, e confirme:

1. Com `localStorage.bolao_tournament = "BSA2026"` setado manualmente no devtools e um reload da página: o app abre em **Copa do Mundo** (o valor salvo é ignorado durante a janela).
2. Trocar para Brasileirão pelo seletor do header ainda funciona e a página de palpites mostra jogos do BSA.
3. Recarregar a página volta para Copa do Mundo.

**Verify**: os três comportamentos acima confirmados; `bun run build` → exit 0.

## Test plan

Não há infraestrutura de testes no repo (nenhum runner configurado). Não crie uma neste plano. A verificação é o checklist manual do Step 2 + typecheck + build.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check-types` exits 0
- [ ] `bun run build` exits 0
- [ ] `bunx biome check apps/web` exits 0
- [ ] `grep -n "WC_DEFAULT_UNTIL" apps/web/src/contexts/tournament-context.tsx` retorna pelo menos 2 ocorrências (constante + uso)
- [ ] `git status` mostra modificação apenas em `apps/web/src/contexts/tournament-context.tsx`
- [ ] Linha de status atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- O conteúdo de `tournament-context.tsx` não bate com o excerto em "Current state" (drift).
- Você descobrir que outras partes do app leem `localStorage.bolao_tournament` diretamente (procure com `grep -rn "bolao_tournament" apps/`) — nesse caso a mudança precisa ser coordenada e o plano deve ser revisto.
- O typecheck falhar por motivo não relacionado à sua mudança.

## Maintenance notes

- Depois de **19/07/2026** o comportamento volta sozinho ao atual (preferência salva). Ninguém precisa reverter nada, mas o código da janela pode ser removido numa limpeza pós-Copa.
- O plano 003 (UI da fase de grupos) assume que o torneio padrão é `WC2026`; este plano deve aterrissar antes.
- Revisor: confira que a janela usa UTC e que o seletor manual continua funcional dentro da sessão.
