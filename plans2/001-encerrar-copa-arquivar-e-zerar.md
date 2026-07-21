# Plan 001: Encerrar a Copa — arquivar o ranking final e zerar os pontos

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. If anything in "STOP
> conditions" occurs, stop and report — do not improvise. When done, update this plan's
> row in `plans2/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 857d0d0..HEAD -- packages/backend/convex/schema.ts packages/backend/convex/predictions.ts packages/backend/convex/leagues.ts`
> If any of these changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (adds a destructive one-time reset; the archive must be verified before the reset runs)
- **Depends on**: none (but MUST land and be executed before plan 002 makes the Brasileirão score)
- **Category**: migration / direction
- **Planned at**: commit `857d0d0`, 2026-07-21

## Why this matters

The World Cup is over. The owner decided: **snapshot the final Cup standings, then zero
everyone's points and reuse the same leagues for the Brasileirão** (leagues have no
tournament/season field — they just accumulate `totalPoints`). Today the only thing that
scores is the Cup (`SCORABLE_TOURNAMENT = "WC2026"`), so the current league standings ARE
the final Cup standings. If we zero without capturing them first, the Cup results are lost
forever. This plan persists a read-only snapshot of the Cup, then zeroes — in that order,
with a hard gate between them.

## Current state

- `packages/backend/convex/schema.ts` — Convex schema. Tables: `leagues`, `leagueMembers`
  (fields: `totalPoints`, `exactScores`, `correctResults`, `status`, `userId`, `leagueId`),
  `predictions`, `teams`, `matches`. There is **no** archive table yet.
- `packages/backend/convex/predictions.ts:291-321` — `resetComputedPoints` already exists
  and zeroes everything:
  ```ts
  export const resetComputedPoints = internalMutation({
    args: {},
    handler: async (ctx) => {
      const [memberships, predictions] = await Promise.all([
        ctx.db.query("leagueMembers").collect(),
        ctx.db.query("predictions").collect(),
      ]);
      for (const membership of memberships) {
        await ctx.db.patch(membership._id, {
          totalPoints: 0, exactScores: 0, correctResults: 0,
        });
      }
      for (const prediction of predictions) {
        await ctx.db.patch(prediction._id, {
          points: undefined, calculatedAt: undefined,
          components: undefined, tieBonus: undefined,
        });
      }
      return { resetMemberships: memberships.length, resetPredictions: predictions.length };
    },
  });
  ```
- `packages/backend/convex/predictions.ts:433-446` — `adminResetAllPoints` is the
  admin-guarded public wrapper around `resetComputedPoints` (guards by email via
  `getAdminUser`, whose `ADMIN_EMAIL` is `arthurdearaujofaria@gmail.com`).
- `packages/backend/convex/leagues.ts:53-59` + `lib/ranking.ts:53-59` — `compareByPoints`
  is the canonical standings sort (points → exacts → correct results). Reuse it.
- `apps/web/src/components/leagues/podium.tsx` and `ranking-row.tsx` — existing UI for
  showing a podium and ranking rows. Reuse them for the archive page.
- **Convention**: new Convex tables are additive and never require migrating existing
  data. Admin actions follow the `adminResetAllPoints` shape: `action` → `auth.getUserId`
  → `getAdminUser` check → `runMutation`.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `bun run check-types` | exit 0, no errors |
| Lint/format | `bun run check` | exit 0 |
| Tests | `bun test packages/backend/tests` | all pass |

> ⚠️ **Do NOT run** `bun run dev:server`, `bunx convex deploy`, or any `convex run`
> mutation. The local Convex deployment points at **production** (`prod:brazen-lemming-799`);
> running mutations would zero real production data before review. This plan only writes
> code + defines the runbook. The owner executes the one-time reset from `/admin` after
> reviewing the diff.

## Scope

**In scope**:
- `packages/backend/convex/schema.ts` — add `seasonArchives` table (create fields).
- `packages/backend/convex/archives.ts` — new file: archive mutation + admin action + read query.
- `apps/web/src/app/(app)/admin/page.tsx` — add "Arquivar Copa" button before the reset.
- `apps/web/src/app/copa-2026/page.tsx` — new public read-only archive page.

**Out of scope** (do NOT touch):
- `resetComputedPoints` / `adminResetAllPoints` — already correct; do not modify.
- Any change that makes the Brasileirão score — that is plan 002.
- Deleting Cup match data — the archive references standings, not matches; matches stay.

## Steps

### Step 1: Add the `seasonArchives` table to the schema

In `packages/backend/convex/schema.ts`, add a new table (additive — no migration):

```ts
seasonArchives: defineTable({
  tournament: v.string(),          // e.g. "WC2026"
  leagueId: v.id("leagues"),
  leagueName: v.string(),
  capturedAt: v.number(),
  standings: v.array(
    v.object({
      userId: v.string(),
      name: v.string(),
      rank: v.number(),
      totalPoints: v.number(),
      exactScores: v.number(),
      correctResults: v.number(),
    }),
  ),
})
  .index("by_tournament", ["tournament"])
  .index("by_tournament_league", ["tournament", "leagueId"]),
```

**Verify**: `bun run check-types` → exit 0.

### Step 2: Create `archives.ts` — archive mutation, admin action, read query

New file `packages/backend/convex/archives.ts`. Model the admin guard on
`predictions.ts:433-446` (`adminResetAllPoints`). Import `compareByPoints` from
`./lib/ranking`. The archive mutation:

- Reads all `leagues`.
- For each league, reads its `ACTIVE` `leagueMembers`, sorts with `compareByPoints`,
  resolves each member's display name (`user.name ?? user.email.split("@")[0] ?? "Jogador"`
  — same fallback used in `leagues.ts:516`), assigns `rank` (1-based), and inserts one
  `seasonArchives` row per league with `capturedAt: Date.now()`.
- **Idempotency**: before inserting, delete any existing `seasonArchives` rows for the
  same `(tournament, leagueId)` so re-running replaces rather than duplicates.
- Returns `{ archivedLeagues, archivedMembers }`.

Add:
- `internalMutation archiveStandings({ tournament: v.string() })` — the logic above.
- `action adminArchiveStandings({ tournament: v.string() })` — admin-guarded wrapper
  (copy the guard from `adminResetAllPoints`), calls `archiveStandings`.
- `query getArchive({ tournament: v.string() })` — public read; returns the archived
  rows (array of `{ leagueId, leagueName, capturedAt, standings }`) ordered by leagueName.
  This page is public history, so no auth gate is required (it exposes only names +
  points that league members already see).

**Verify**: `bun run check-types` → exit 0. `bun run check` → exit 0.

### Step 3: Add the "Arquivar Copa" admin button

In `apps/web/src/app/(app)/admin/page.tsx`, add a new `ActionCard` in the "Recomputação"
section (or a new "Encerramento" section), wired to `api.archives.adminArchiveStandings`
with `{ tournament: "WC2026" }`. Follow the existing `ActionCard` usage (see the
"Recomputar todos os pontos" card at lines 295-302). Give it:
- label: `"Arquivar ranking da Copa"`
- description: `"Salva a foto final do ranking de cada liga na Copa 2026. Rode ANTES de zerar os pontos."`
- `confirmLabel`: `"Arquivar o ranking atual como Copa 2026?"`

Place it **above** the "Recomputar" card so the visual order encodes the runbook order
(archive first, reset second). Do not change the reset card.

**Verify**: `bun run check-types` → exit 0.

### Step 4: Build the read-only archive page `/copa-2026`

New file `apps/web/src/app/copa-2026/page.tsx` (a route **outside** `(app)`, so it does
not require auth and does not show the app chrome/switcher). It:
- `"use client"`, `useQuery(api.archives.getArchive, { tournament: "WC2026" })`.
- Renders each league as a section: league name, `capturedAt` date, top-3 via `podium.tsx`,
  and the rest via `ranking-row.tsx` (match how `leagues/[id]/page.tsx` composes them —
  read that file for the prop shapes).
- Header copy: eyebrow "Arquivo" / title "Copa do Mundo 2026" / subtitle "O ranking final
  do nosso bolão da Copa. Guardado para a posteridade."
- Loading + empty states matching the app's existing patterns (`Skeleton`, dashed empty card).

**Verify**: `bun run check-types` → exit 0. `bun run check` → exit 0.

### Step 5: Write the execution runbook into this plan's report

Do NOT execute it. After the code is merged and deployed by the owner, the one-time
sequence (run by the owner from the site) is:

1. Deploy this plan's code (owner: push to `master` + `bunx convex deploy`).
2. Open `/admin` → click **"Arquivar ranking da Copa"** → confirm the result JSON shows
   `archivedLeagues > 0` and `archivedMembers` = expected total.
3. Open `/copa-2026` → confirm every league's final standings render correctly.
4. **Only after 2–3 pass**: `/admin` → **"Recomputar…"** section → click
   **"Zerar pontos"** (this is `adminResetAllPoints` — if there is no dedicated "zerar"
   button yet, the owner runs `adminResetAllPoints`; note that "Recomputar" would
   RE-derive Cup points, so it must NOT be used here — see STOP conditions).
5. Confirm dashboards now show 0 pts for everyone.

Put this runbook verbatim in your completion report so the owner has it.

## Test plan

- Add `packages/backend/tests/archives.test.ts` modeled on the existing ranking-comparator
  test in `packages/backend/tests/` (read one file there for the harness style). Cover the
  pure ranking logic you can unit-test without a live DB: a helper that takes an array of
  members and returns them sorted + ranked with `compareByPoints` (extract that into a
  small pure function in `archives.ts` if needed so it's testable, e.g. `rankMembers`).
  Cases: (a) simple descending points, (b) tie broken by exacts, (c) empty league → `[]`.
- Verification: `bun test packages/backend/tests` → all pass, including the new file.

## Done criteria

- [ ] `bun run check-types` exits 0
- [ ] `bun run check` exits 0
- [ ] `bun test packages/backend/tests` exits 0, new archives test passes
- [ ] `seasonArchives` table exists in `schema.ts` with both indexes
- [ ] `archives.ts` exports `adminArchiveStandings` (action) and `getArchive` (query)
- [ ] `/admin` shows the "Arquivar ranking da Copa" card above the reset card
- [ ] `/copa-2026` page compiles and renders from `getArchive`
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans2/README.md` status row updated
- [ ] Completion report contains the Step 5 runbook

## STOP conditions

Stop and report (do not improvise) if:
- `resetComputedPoints` or `adminResetAllPoints` no longer look like the excerpts (drift).
- You cannot confirm `compareByPoints` is exported from `lib/ranking.ts`.
- The archive would need to read data that no longer exists (e.g. leagueMembers lost their
  `exactScores`/`correctResults` fields).
- Anyone asks you to run the reset/`convex run`/`dev:server` — you must NOT; the local
  Convex points at production. Executing it is the owner's manual step.
- You find the leagues already have a `tournament`/`season` field (means a different
  archive strategy was chosen elsewhere — reconcile, don't duplicate).

## Maintenance notes

- **Ordering with plan 002**: this archive+reset MUST be executed before plan 002 makes the
  Brasileirão score. If 002 lands first and BSA games finish, their points would be mixed
  into the same `leagueMembers.totalPoints` and the reset would wipe them too.
- The `seasonArchives` table is the seed of a real "temporadas passadas" feature — future
  seasons (Brasileirão 2026 final standings) can be archived the same way. Keep the table
  generic (keyed by `tournament`), not Cup-specific.
- Reviewer should scrutinize: that the archive runs and is verified *before* any reset, and
  that `getArchive` exposes only data already visible to league members (names + points).
