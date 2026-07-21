# Plan 003: Remover o desempate de mata-mata (prorrogação/pênaltis)

> **Executor instructions**: Follow step by step. Run every verification command. On a
> "STOP condition", stop and report. When done, update this plan's row in
> `plans2/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 857d0d0..HEAD -- packages/backend/convex/predictions.ts packages/backend/convex/matches.ts packages/backend/convex/schema.ts packages/backend/convex/lib/ranking.ts`
> On any change, compare "Current state" excerpts to live code before proceeding; mismatch → STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (edits the points engine; idempotent recompute + tests mitigate)
- **Depends on**: plan 002 (do it after the registry lands, to avoid overlapping edits in `predictions.ts`). Independent of 001.
- **Category**: tech-debt / direction
- **Planned at**: commit `857d0d0`, 2026-07-21

## Why this matters

The Brasileirão is a points league with no knockout — there is no extra time or penalty
shootout to predict. The owner asked to "esquece aquele protocolo de empate com prorrogação
e penaltis". The tie-break bonus (`tieWinner`/`tieMethod`/`tieBonus`, +2 pts for calling who
advances) is dead weight that complicates the points engine, the schema, and the UI. Removing
it makes the scoring model exactly what a league needs: predict the 90-minute score, get
points, done. This plan removes the **backend + schema** side; plan 004 removes the matching
frontend (`TiebreakerPicker`).

## Current state

- **Schema** — `packages/backend/convex/schema.ts:60-85`, the `predictions` table carries:
  ```ts
  tieWinner: v.optional(v.union(v.literal("HOME"), v.literal("AWAY"))),
  tieMethod: v.optional(v.union(v.literal("ET"), v.literal("PEN"))),
  tieBonus: v.optional(v.number()),
  ```
  It also has `components` and the score fields. (The `matches` table's `duration`/`winner`
  fields at schema lines 35-40 support knockout labels — see Maintenance notes; leave them.)
- **`upsert`** — `predictions.ts:62-123`: accepts `tieWinner`/`tieMethod` args, computes
  `isKnockout` via `isKnockoutStage(match.stage)`, and writes/clears the tie fields
  (lines 87-121). `isKnockoutStage` is imported from `./lib/ranking`.
- **`computeForMatch`** — `predictions.ts:196-289`: lines 212-261 compute the tie bonus:
  `ninetyTie`, `tieDecided`, `tieAdvancer`, `bonusEligible = isKnockoutStage(...) && ...`,
  the per-prediction `newBonus`, and it patches `tieBonus` + folds `newBonus - oldBonus`
  into `leagueDelta`.
- **`getStats`** — `predictions.ts:496-521`: sums `p.points + (p.tieBonus ?? 0)` (line 515).
- **`resetComputedPoints`** — `predictions.ts:307-314`: sets `tieBonus: undefined` but does
  NOT clear `tieWinner`/`tieMethod`.
- **`getRankingByPhase`** — `leagues.ts:531-611`: line 587 adds `(pred.tieBonus ?? 0)` and
  the whole query buckets group vs knockout via `isKnockoutStage`. In a league there is no
  knockout bucket — this query is degenerate. **Reduce it to overall-only** (or leave the
  code but note it always returns empty knockout buckets — see Step 5).
- **`isKnockoutStage`** — `lib/ranking.ts:49-51`: `return stage !== "GROUP_STAGE";`. After
  this plan, backend has no more callers except possibly `getRankingByPhase`.
- **Convention**: Convex `optional` fields with existing data can stay in the schema
  harmlessly; to *remove* a field from the schema you must first stop writing it AND clear
  it from all rows (widen-migrate-narrow). This plan stops writing them and clears them; the
  actual schema-field removal is a deferred follow-up (see Maintenance notes) to avoid a
  risky validator change in the same PR.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `bun run check-types` | exit 0 |
| Lint/format | `bun run check` | exit 0 |
| Tests | `bun test packages/backend/tests` | all pass |

> ⚠️ Do NOT run `dev:server`/`convex deploy`/`convex run` — local Convex points at prod.

## Scope

**In scope**:
- `packages/backend/convex/predictions.ts` (remove tie logic from `upsert`, `computeForMatch`, `getStats`; clear tie fields in `resetComputedPoints`)
- `packages/backend/convex/leagues.ts` (`getRankingByPhase` — drop `tieBonus`; reduce phases)
- `packages/backend/convex/matches.ts` (`patchMatchScore` — drop the `duration`/`winner` tie args if unused after this; see Step 4)
- `packages/backend/tests/` (update/add tests)

**Out of scope** (do NOT touch):
- `apps/web/**` — the frontend `TiebreakerPicker` and Scorecard tie UI are plan 004.
- The `matches` table's `duration`/`winner` schema fields — harmless; keep (a future
  tournament with knockout may reuse them, and clearing them needs a migration).
- Removing `tieWinner`/`tieMethod`/`tieBonus` from the schema definition — deferred (see
  Maintenance notes). Here you stop writing them and clear their values, but the `v.optional`
  field definitions stay so existing rows still validate.

## Steps

### Step 1: Strip tie handling from `upsert`

In `predictions.ts` `upsert` (lines 62-123): remove the `tieWinner`/`tieMethod` args from
the validator, remove the `isTie`/`isKnockout`/`tieWinner`/`tieMethod` computation
(lines 87-91), and remove them from both the `patch` (lines 101-110) and `insert`
(lines 114-121) — the patch should still clear `points`/`calculatedAt`/`components`, and
must now also set `tieWinner: undefined, tieMethod: undefined, tieBonus: undefined` so
re-saving a prediction wipes any legacy tie data. Remove the `isKnockoutStage` import if it
becomes unused in this file.

**Verify**: `bun run check-types` → exit 0.

### Step 2: Strip the tie bonus from `computeForMatch`

In `computeForMatch` (lines 196-289): delete the tie-bonus block (lines 212-261's
`ninetyTie`/`tieDecided`/`tieAdvancer`/`bonusEligible`/`newBonus`/`oldBonus` machinery).
The loop should keep computing `points`/`components`/`isExact`/`isCorrectResult` and the
`exactDelta`/`correctResultDelta`, patch predictions with `tieBonus: undefined` (to clear
legacy values), and fold **only** `newPts - oldPts` into `leagueDelta` (remove the
`+ (newBonus - oldBonus)` term). Keep everything else (idempotency via `calculatedAt`,
membership updates) intact.

**Verify**: `bun run check-types` → exit 0.

### Step 3: Clean `getStats` and `resetComputedPoints`

- `getStats` (line 515): change the sum to `s + (p.points ?? 0)` (drop `+ (p.tieBonus ?? 0)`).
- `resetComputedPoints` (lines 307-314): also set `tieWinner: undefined, tieMethod: undefined`
  in the prediction patch (it already sets `tieBonus: undefined`). This makes the one-time
  reset also purge legacy tie data.

**Verify**: `bun run check-types` → exit 0.

### Step 4: Simplify `patchMatchScore` (`matches.ts`)

`patchMatchScore` (lines 322-343) has optional `duration`/`winner` args used only to fix who
advanced in a knockout. In a league they are never needed. Remove the `duration`/`winner`
args and the two conditional spreads (lines 327-341), leaving it to set
`homeScore`/`awayScore`/`status: "FINISHED"`/`manualOverride: true`. Check callers:
`footballData.ts:611` (`adminPatchMatchScore`) and `footballData.ts:464` (ESPN fallback) —
neither passes `duration`/`winner`, so this is safe. Confirm with:
`grep -rn "patchMatchScore" packages/backend/convex`.

**Verify**: `bun run check-types` → exit 0.

### Step 5: Reduce `getRankingByPhase` to overall (`leagues.ts`)

In a league there is no group/knockout split. Options — pick the smaller diff that keeps
callers compiling:
- **Preferred**: keep the query name and return shape but make `group`/`knockout` buckets
  always empty and put all points in `overall` (remove the `isKnockoutStage` bucketing and
  the `+ (pred.tieBonus ?? 0)` at line 587). This keeps the frontend compiling until plan
  004 stops calling the phase panel.
- If plan 004 is being done in the same batch and will delete the phase-panel consumer,
  you may instead leave `getRankingByPhase` and let 004 remove the caller. Do NOT delete
  the query here without checking `grep -rn "getRankingByPhase" apps/web` — deleting it
  while the frontend still imports it breaks the build.

Remove the `+ (pred.tieBonus ?? 0)` regardless. Update comments at lines 524-529, 556, 585.

**Verify**: `bun run check-types` → exit 0. `bun run check` → exit 0.

### Step 6: Confirm the tie protocol is gone from the backend

Run:
```
grep -rn "tieBonus\|tieWinner\|tieMethod\|bonusEligible\|tieAdvancer" packages/backend/convex
```
Expected: the only remaining matches are the **`v.optional` field definitions in
`schema.ts`** and the `undefined`-clearing patches in `predictions.ts` (Steps 1-3). No
computation, no bonus, no reads that add to points.

## Test plan

- Update any existing points test in `packages/backend/tests/` that referenced tie bonus.
- Add cases to a points/compute test (or the ranking test) asserting the pure scoring for a
  drawn knockout-style score no longer yields a bonus — i.e. `calcPoints(1,1,1,1)` returns
  the exact-score points only, with no `+2`. (If `calcPoints` isn't exported, test through
  whatever pure helper is available; do not stand up a live DB.)
- Verification: `bun test packages/backend/tests` → all pass.

## Done criteria

- [ ] `bun run check-types` exits 0
- [ ] `bun run check` exits 0
- [ ] `bun test packages/backend/tests` exits 0
- [ ] `grep -rn "bonusEligible\|tieAdvancer\|newBonus" packages/backend/convex` → **no matches**
- [ ] `computeForMatch` no longer adds any bonus to `leagueDelta`
- [ ] `getStats` no longer adds `tieBonus`
- [ ] No `apps/web/**` files modified (`git status`)
- [ ] `plans2/README.md` status row updated

## STOP conditions

Stop and report if:
- Any "Current state" excerpt doesn't match live code (drift — esp. if plan 002 renumbered lines).
- `grep -rn "getRankingByPhase" apps/web` shows a consumer AND you were about to delete the
  query — reduce it instead (Step 5 preferred path).
- Removing `duration`/`winner` from `patchMatchScore` reveals a caller that passes them
  (grep in Step 4 finds one) — STOP; don't break that caller.

## Maintenance notes

- **Deferred follow-up (separate plan, needs migration)**: once no rows have
  `tieWinner`/`tieMethod`/`tieBonus` set (after the one-time reset in plan 001 + the clears
  added here), the three `v.optional` fields can be removed from `schema.ts` using the
  widen-migrate-narrow flow (see `convex-migration-helper` skill). Not done here to keep this
  PR free of a schema-validator change.
- The `matches.duration`/`winner` fields stay — a future knockout tournament (registry entry
  with `hasKnockout: true`) can reuse them for labels without re-adding schema.
- Reviewer should scrutinize: that `leagueDelta` math is correct after dropping the bonus
  term, and that `resetComputedPoints` now clears all three tie fields.
