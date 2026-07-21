# Plan 007: Rotacionar e remover a chave football-data.org commitada

> **Executor instructions**: Follow step by step. Run every verification command. On a
> "STOP condition", stop and report. When done, update this plan's row in `plans2/README.md`.
> This plan contains a manual (owner-only) rotation step that the executor must NOT attempt.
>
> **Drift check (run first)**: `git diff --stat 857d0d0..HEAD -- SETUP.md .gitignore`
> On changes, re-inspect SETUP.md for the credential before editing; mismatch → STOP.

## Status

- **Priority**: P1 (security)
- **Effort**: S
- **Risk**: LOW (removing a secret from a doc); the real remediation is rotation (manual)
- **Depends on**: none (do this ASAP, independent of everything else)
- **Category**: security
- **Planned at**: commit `857d0d0`, 2026-07-21

## Why this matters

A **live football-data.org API key is committed in the versioned file `SETUP.md`** (in the
`packages/backend/.env.local` example block). Because it's in git, it is exposed to everyone
with repo access and is present in git history — deletion alone does not un-expose it. A
committed API key is "burned": the only real fix is to **rotate** it (issue a new key,
invalidate the old) and keep secrets out of versioned files. `.gitignore` already ignores
`.env*.local`, so the leak is specifically the SETUP.md documentation example.

> **Do not reproduce the key value** anywhere — in edits, commit messages, this plan, or your
> report. Refer to it only as "the football-data.org key in SETUP.md".

## Current state

- `SETUP.md` (repo root), inside the "### `packages/backend/.env.local`" fenced block,
  contains a line of the form `FOOTBALL_DATA_API_KEY=<a real key value>`. The surrounding
  block also hardcodes `CONVEX_DEPLOYMENT`/`CONVEX_URL`/`CONVEX_SITE_URL` (those are
  deployment identifiers, not secrets — lower sensitivity, but see Step 3).
- `.gitignore` already contains `.env` and `.env*.local` — real env files are not tracked;
  the exposure is the doc example only.
- The key is consumed at runtime via `process.env.FOOTBALL_DATA_API_KEY`
  (`footballData.ts:328`) and is set in Convex prod env (per README's env table). Rotating it
  requires updating that env var, which is why rotation is an **owner** action.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Confirm the secret is present | `grep -n "FOOTBALL_DATA_API_KEY" SETUP.md` | shows the line to fix |
| Confirm .env ignored | `git check-ignore packages/backend/.env.local` | prints the path (is ignored) |

## Scope

**In scope**:
- `SETUP.md` — replace the real key with a placeholder; add a note pointing to the real
  source of the value.

**Out of scope** (do NOT touch):
- `footballData.ts` and how the key is read — the runtime code is correct
  (`process.env.FOOTBALL_DATA_API_KEY`).
- Rewriting git history (filter-repo/BFG) — that's a destructive, force-push operation for
  the owner to decide on; rotation makes the leaked value worthless regardless.
- Any other env value — only the API key is a true secret.

## Steps

### Step 1: Replace the committed key with a placeholder in SETUP.md

In `SETUP.md`, change the `FOOTBALL_DATA_API_KEY=...` line inside the
`packages/backend/.env.local` example to a placeholder:
```
FOOTBALL_DATA_API_KEY=<sua-chave-football-data-org>
```
Add one line below the block: "> Os valores reais das chaves ficam no seu `.env.local`
(não versionado) e no dashboard do Convex (prod) — nunca commite chaves reais."

**Verify**: `grep -n "FOOTBALL_DATA_API_KEY" SETUP.md` shows only the placeholder; the real
value no longer appears. `bun run check` → exit 0.

### Step 2: Sanity-check no other real secret is committed

Run a quick scan (report anything found — do NOT print values):
```
grep -rnI "API_KEY\|SECRET\|_KEY=\|TOKEN" SETUP.md README.md DEPLOY.md
```
Confirm SETUP.md's Convex values are deployment identifiers (URLs/deployment name), not
secrets. If any other **real secret** (Resend key, Google secret, JWT private key) is found
committed, STOP and report it — that widens the plan.

### Step 3: Write the rotation runbook into your report (owner executes)

Do NOT execute. Put this in your completion report for the owner:
1. Log in to football-data.org → regenerate/rotate the API token (invalidates the old one).
2. Update the key in Convex prod: from `packages/backend/`,
   `bunx convex env set --prod FOOTBALL_DATA_API_KEY "<new key>"`.
3. Update your local `packages/backend/.env.local` (untracked) with the new key.
4. Verify sync still works: `/admin` → "Resync Brasileirão" returns a success JSON.
5. (Optional, owner's call) Purge the old value from git history with git-filter-repo/BFG +
   force-push — only meaningful alongside rotation, and coordinate with anyone who has clones.

## Test plan

- No automated test. Verification: the Step 1 grep shows no real key; the Step 2 scan is
  clean; `bun run check` passes.

## Done criteria

- [ ] `grep -n "FOOTBALL_DATA_API_KEY" SETUP.md` shows only a placeholder (no real value)
- [ ] `bun run check` exits 0
- [ ] Only `SETUP.md` modified (`git status`)
- [ ] Completion report contains the Step 3 rotation runbook (owner action)
- [ ] `plans2/README.md` status row updated

## STOP conditions

Stop and report if:
- SETUP.md no longer contains the key (someone already fixed it) — verify and mark done/stale.
- The Step 2 scan finds another committed real secret (Resend/Google/JWT) — report; do not
  attempt to rotate those yourself.
- You are asked to run `convex env set` or rotate the key — that's the owner's manual step;
  the executor must not touch production env.

## Maintenance notes

- Add a `.env.example` with placeholder keys (out of scope here) so docs never need real
  values again — good follow-up.
- Reviewer should confirm the diff contains **no** secret value (not even in the "before"
  side of the hunk if you can avoid it — prefer editing so the removed value isn't quoted in
  the commit; if git shows it in the diff, that's expected and rotation is what protects you).
- The committed Convex deployment identifiers are low-risk but ideally also become
  placeholders in a docs cleanup.
