# Plan 006: Rebrand "Bolão da Copa 2026" → "Chuta de Bico"

> **Executor instructions**: Follow step by step. Run every verification command. On a
> "STOP condition", stop and report. When done, update this plan's row in `plans2/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 857d0d0..HEAD -- apps/web/src packages/backend/convex/notifications.ts README.md SPEC.md`
> On changes to in-scope files, re-grep for brand strings before editing; mismatch → STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (string/copy changes; the one risk is the email `from:` address — see Step 3)
- **Depends on**: none (independent; ideally after plan 004 so no deleted files are edited)
- **Category**: direction / docs
- **Planned at**: commit `857d0d0`, 2026-07-21

## Why this matters

The product is now a long-term Brasileirão bolão, not a World Cup one. The owner chose the
new brand **"Chuta de Bico"**. "Bolão 2026" / "Bolão da Copa 2026" appears in the nav,
titles, page metadata, invite/OG cards, share cards, notification emails, and docs — all of
which read as a finished Cup. This plan renames the user-facing brand consistently.

## Current state (every brand string — from a repo-wide grep at commit 857d0d0)

Frontend:
- `apps/web/src/app/layout.tsx:30-31` — root metadata `title: "Bolão da Copa 2026"`,
  `description: "Faça seus palpites para a Copa do Mundo 2026"`.
- `apps/web/src/app/page.tsx` — landing: `:143` "Bolão 2026", `:149`/`:180` "Copa do Mundo
  2026", `:88` "jogos da Copa", `:235` `"104", "Jogos da Copa"`, `:463` "Bolão além do papel
  e caneta", `:721` "Bolão 2026", `:733` "© 2026 Bolão da Copa". (Landing Cup copy is heavy;
  see STOP note — coordinate with whoever owns the landing redesign.)
- `apps/web/src/app/(app)/layout.tsx:127,666` — sidebar/mobile logo "Bolão 2026".
- `apps/web/src/app/(auth)/layout.tsx:79,185` — auth screens "Bolão 2026".
- `apps/web/src/app/convite/[code]/page.tsx:22,27,36` — invite OG: "Convite — Bolão da Copa
  2026", `siteName: "Bolão da Copa 2026"`.
- `apps/web/src/app/convite/[code]/invite-client.tsx:117,162,262,288,292,334` — "Bolão 2026",
  "no Bolão da Copa 2026.", "Ir para o Bolão", etc.
- `apps/web/src/app/(app)/leagues/[id]/page.tsx:611-612` — share text "Liga ... — Bolão da
  Copa 2026".
- `apps/web/src/components/leagues/share-ranking-card.tsx:124,441` — "Bolão da Copa 2026",
  "Bolão 2026".
- `apps/web/src/components/leagues/share-ranking-sheet.tsx:116` — "... — Bolão da Copa 2026 ⚽".
- `apps/web/src/app/(app)/leagues/page.tsx:116` — placeholder "Ex: Família da Copa".

Backend (emails):
- `packages/backend/convex/notifications.ts:87,89,131,133,165` — `from: "Bolão 2026
  <onboarding@resend.dev>"`, subjects "... — Bolão 2026", and the HTML `<h1>Bolão 2026</h1>`.

Docs:
- `README.md:1,3`, `SPEC.md:1,7`, `DEPLOY.md:3` — titles/intros.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `bun run check-types` | exit 0 |
| Lint/format | `bun run check` | exit 0 |
| Build | `bun run build` | exit 0 |

## Scope

**In scope**: the files listed in "Current state" (frontend brand strings, email brand
strings, docs).

**Out of scope** (do NOT touch):
- Any Cup **feature** copy that plan 004 removes (mata-mata/bracket) — if plan 004 already
  ran, those files are gone; don't recreate them.
- The email `from:` **domain** — `onboarding@resend.dev` is a Resend sandbox sender; only
  change the display name, not the address (see Step 3).
- Functional identifiers: package names (`@bolao/*`), the `bolao` repo/dir name, Convex
  deployment names, env var names. Rebrand is user-facing only.

## Steps

### Step 1: Decide the exact display strings (use these verbatim)

- App/brand name: **`Chuta de Bico`**
- Root title (`layout.tsx`): `Chuta de Bico — Bolão do Brasileirão`
- Root description: `Faça seus palpites do Brasileirão Série A e dispute com seus amigos.`
- Invite/OG `siteName`: `Chuta de Bico`
- Share suffix (share cards/sheet/league share): `— Chuta de Bico ⚽`
- Footer copyright: `© 2026 Chuta de Bico`
- League name placeholder: `Ex: Galera do Bar`

### Step 2: Replace frontend brand strings

Edit each frontend file in "Current state". Replace "Bolão 2026" / "Bolão da Copa 2026" /
"Bolão da Copa" with the appropriate string from Step 1. Replace generic "o Bolão" phrasing
in `invite-client.tsx` with "o Chuta de Bico". Do **not** blindly sed — some lines say
"Copa do Mundo 2026" as landing hero copy that plan 006 may or may not own (see STOP note).

**Verify**: `bun run check-types` → exit 0.

### Step 3: Rebrand the notification emails

In `notifications.ts`, change the display name in both `from:` fields (lines 87, 131) from
`"Bolão 2026 <onboarding@resend.dev>"` to `"Chuta de Bico <onboarding@resend.dev>"` —
**keep the `@resend.dev` address unchanged**. Update the subjects (lines 89, 133) and the
HTML `<h1>` (line 165) to "Chuta de Bico".

**Verify**: `bun run check-types` → exit 0.

### Step 4: Update docs

Update the H1/intro of `README.md` (`:1`, `:3`), `SPEC.md` (`:1`, `:7`), and `DEPLOY.md`
(`:3`) to name "Chuta de Bico" and describe a Brasileirão bolão. Do not rewrite the whole
docs — just the brand/positioning lines.

**Verify**: `bun run check` → exit 0.

### Step 5: Confirm no user-facing "Bolão 2026" / "Bolão da Copa" remains

Run:
```
grep -rn "Bolão 2026\|Bolão da Copa" apps/web/src packages/backend/convex README.md SPEC.md DEPLOY.md
```
Expected: **no matches** (or only inside code identifiers you were told to keep — there
should be none in these paths).

**Verify**: the grep returns nothing.

## Test plan

- No automated tests for copy. Verification is `check-types` + `build` + the Step 5 grep.
- If a local run is available (`bun run dev:web`), eyeball: nav logo, an auth screen, and an
  invite page OG title, to confirm the new brand renders.

## Done criteria

- [ ] `bun run check-types` exits 0
- [ ] `bun run check` exits 0
- [ ] `bun run build` exits 0
- [ ] `grep -rn "Bolão 2026\|Bolão da Copa" apps/web/src packages/backend/convex` → **no matches**
- [ ] Email `from:` addresses still use `onboarding@resend.dev` (only display name changed)
- [ ] `plans2/README.md` status row updated

## STOP conditions

Stop and report if:
- The landing page (`app/page.tsx`) is mid-redesign or its Cup hero copy is contested — the
  landing has heavy Cup-specific messaging ("104 jogos da Copa", countdown). Rebrand the
  **name** strings there, but if turning the landing into a Brasileirão landing is a larger
  redesign, flag it as a follow-up rather than improvising new marketing copy.
- A brand string sits in a file plan 004 deleted (e.g. `mata-mata/page.tsx`) — skip it; it's
  already gone.
- You're tempted to change the `@resend.dev` sender or any `@bolao/*` package name — don't;
  out of scope.

## Maintenance notes

- Sending from a branded domain (e.g. `no-reply@chutadebico.com`) instead of the Resend
  sandbox is a separate infra task (domain verification in Resend) — not this plan.
- The favicon (`apps/web/src/app/favicon.ico`) still reflects the old brand; regenerating it
  is a nice follow-up, out of scope here.
- Reviewer should scrutinize: OG/`siteName` on the invite page (that's what shows in the
  WhatsApp share card), and the email subjects (first thing users see).
