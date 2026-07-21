# Plan 002: Registry de torneios + o Brasileirão passa a pontuar

> **Executor instructions**: Follow step by step. Run every verification command and
> confirm the expected result before moving on. If a "STOP condition" occurs, stop and
> report. When done, update this plan's row in `plans2/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 857d0d0..HEAD -- packages/backend/convex/predictions.ts packages/backend/convex/leagues.ts packages/backend/convex/matches.ts packages/backend/convex/footballData.ts packages/backend/convex/notifications.ts packages/backend/convex/crons.ts`
> On any change, compare the "Current state" excerpts to the live code before proceeding;
> on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (touches the points engine; mitigated by idempotent recompute + tests)
- **Depends on**: **plan 001 must be executed (archived + zeroed) first** — see 001's maintenance note.
- **Category**: bug / tech-debt / direction
- **Planned at**: commit `857d0d0`, 2026-07-21

## Why this matters

The app hardcodes the World Cup as the only tournament that scores, in **three** places.
Brasileirão games are already synced into the DB, but they generate **zero points** — so
without this change, a "Brasileirão bolão" literally cannot work. This plan introduces a
single **tournament registry** (one source of truth) and flips the active/scorable
tournament to `BSA2026`, which is exactly the "rearrange the Cup code so it works for
something else / make the code smarter" the owner asked for. It also fixes two adjacent
bugs that sit directly in the Brasileirão's path: the daily reminder email never fires
(wrong tournament code), and the ESPN score-fallback is dead for a league (gated to
group-stage).

## Current state (the exact coupling to remove)

Three hardcodes of the scorable tournament:

- `packages/backend/convex/predictions.ts:24` — `const SCORABLE_TOURNAMENT = "WC2026";`
  used at line 201: `if (match.tournament !== SCORABLE_TOURNAMENT) return;` inside
  `computeForMatch` (the points engine).
- `packages/backend/convex/leagues.ts:15` — `const SCORABLE_TOURNAMENT = "WC2026";`
  used at line 551 in `getRankingByPhase` (queries matches `by_tournament_date`).
- `packages/backend/convex/matches.ts:280-283` — `getFinishedWithScore` filters:
  ```ts
  return matches.filter(
    (m) => m.tournament === "WC2026" && m.homeScore != null && m.awayScore != null,
  );
  ```
  This feeds `recomputeAll`, so recompute only ever touches the Cup.

The daily-reminder bug:

- `packages/backend/convex/notifications.ts:28-32` — `scheduleDailyReminder` calls:
  ```ts
  const match = await ctx.runQuery(internal.matches.getFirstMatchOfDay, {
    tournament: "WC",   // ← BUG: matches are stored as "WC2026"/"BSA2026", never "WC"
    dayStartUtc: todayStart.toISOString(),
    dayEndUtc: todayEnd.toISOString(),
  });
  ```
  `getFirstMatchOfDay` (`matches.ts:400-424`) filters `by_tournament_date` on
  `q.eq("tournament", args.tournament)`. Passing `"WC"` matches nothing (stored codes are
  `"WC2026"`/`"BSA2026"`), so the "palpites fecham em 1h" email has never sent. Verify this
  claim against prod logs before shipping (see STOP conditions).

The ESPN fallback gated to group-stage:

- `packages/backend/convex/footballData.ts:437` —
  `if (!result.hasScore && match.stage === "GROUP_STAGE") { ... }` gates the entire ESPN
  score-fallback (the app's key robustness feature) to group-stage matches. Brasileirão
  matches are **not** group-stage (football-data returns league matches with a non-group
  `stage`, e.g. `REGULAR_SEASON`), so the fallback never fires for the BSA. The comment at
  lines 434-436 explains it was gated because in knockout, ESPN returns the ET/penalty
  score. In a pure league there is no ET, so `fullTime == regularTime` always → the
  fallback is safe and should run for all BSA matches.

The two crons (both every 10 min):

- `packages/backend/convex/crons.ts:7-19` — `"sync WC today"` → `syncToday`, and
  `"sync BSA today"` → `syncTodayBSA`. The WC cron is now pure waste against a finished
  tournament and burns football-data rate limit.

**Conventions**: shared backend constants live in `packages/backend/convex/lib/` (see
`lib/ranking.ts`). Follow that: put the registry in `lib/tournaments.ts`.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `bun run check-types` | exit 0 |
| Lint/format | `bun run check` | exit 0 |
| Tests | `bun test packages/backend/tests` | all pass |

> ⚠️ Do NOT run `dev:server`, `convex deploy`, or `convex run` — local Convex points at
> production. Verification here is typecheck + lint + tests only.

## Scope

**In scope**:
- `packages/backend/convex/lib/tournaments.ts` (create)
- `packages/backend/convex/predictions.ts` (replace the `SCORABLE_TOURNAMENT` constant + use)
- `packages/backend/convex/leagues.ts` (replace the `SCORABLE_TOURNAMENT` constant + use)
- `packages/backend/convex/matches.ts` (`getFinishedWithScore` filter)
- `packages/backend/convex/notifications.ts` (reminder tournament code)
- `packages/backend/convex/footballData.ts` (ESPN fallback gate)
- `packages/backend/convex/crons.ts` (retire the WC cron)
- `packages/backend/tests/tournaments.test.ts` (create)

**Out of scope** (do NOT touch):
- The tie-break/knockout point logic in `computeForMatch` — that is plan 003. Here, ONLY
  change the tournament gate; leave the tie-bonus code as-is (003 removes it).
- Any frontend file — that is plan 004.
- `syncAll`/`syncToday` (WC sync functions) — leave them defined; just stop cron-driving
  the WC one. The admin "Resync Copa" button (plan 004 removes it) may still call them.

## Steps

### Step 1: Create the tournament registry `lib/tournaments.ts`

New file `packages/backend/convex/lib/tournaments.ts`. This becomes the single source of
truth. Minimum shape:

```ts
export type TournamentConfig = {
  code: string;              // stored in matches.tournament, e.g. "BSA2026"
  competitionCode: string;   // football-data.org competition, e.g. "BSA" / "WC"
  espnCode: string | null;   // ESPN league code, e.g. "bra.1" / "fifa.world"
  label: string;             // "Brasileirão Série A"
  hasKnockout: boolean;      // false for a league, true for a Cup
};

export const TOURNAMENTS: Record<string, TournamentConfig> = {
  BSA2026: { code: "BSA2026", competitionCode: "BSA", espnCode: "bra.1",
    label: "Brasileirão Série A", hasKnockout: false },
  WC2026: { code: "WC2026", competitionCode: "WC", espnCode: "fifa.world",
    label: "Copa do Mundo", hasKnockout: true },
};

// The tournament that currently scores league points.
export const ACTIVE_TOURNAMENT = "BSA2026";
```

Keep the existing `ESPN_LEAGUE_CODES` map in `footballData.ts` for now (Step 6 does not
require merging it) — but the registry is where new tournaments get added later.

**Verify**: `bun run check-types` → exit 0.

### Step 2: Point the scoring engine at the active tournament (`predictions.ts`)

In `predictions.ts`, replace the local constant at line 24:

```ts
// remove:
const SCORABLE_TOURNAMENT = "WC2026";
// add (import at top, next to the other ./lib/ranking import):
import { ACTIVE_TOURNAMENT } from "./lib/tournaments";
```

Update the use at line 201:
```ts
if (match.tournament !== ACTIVE_TOURNAMENT) return;
```
Update the now-stale comment at lines 21-24 to say the Brasileirão (active tournament)
scores. **Do not touch** the tie-bonus block (lines 212-289) — plan 003 owns it.

**Verify**: `bun run check-types` → exit 0.

### Step 3: Same swap in `leagues.ts`

Replace `leagues.ts:15` constant with `import { ACTIVE_TOURNAMENT } from "./lib/tournaments";`
and use it at line 551 (`q.eq("tournament", ACTIVE_TOURNAMENT)`). Update the comment at
line 14.

**Verify**: `bun run check-types` → exit 0.

### Step 4: Fix `getFinishedWithScore` (`matches.ts`)

In `matches.ts:272-285`, import `ACTIVE_TOURNAMENT` and change the filter to:
```ts
return matches.filter(
  (m) => m.tournament === ACTIVE_TOURNAMENT && m.homeScore != null && m.awayScore != null,
);
```
Update the comment at line 279.

**Verify**: `bun run check-types` → exit 0.

### Step 5: Fix the daily reminder tournament code (`notifications.ts`)

In `notifications.ts:28-32`, change `tournament: "WC"` to `tournament: ACTIVE_TOURNAMENT`
(import from `./lib/tournaments`). Update the log strings at lines 35 ("Nenhum jogo da
Copa hoje" → "Nenhum jogo hoje") so they are not Cup-specific.

**Verify**: `bun run check-types` → exit 0.

### Step 6: Un-gate the ESPN fallback for league tournaments (`footballData.ts`)

The gate at line 437 must allow the fallback when the tournament has no knockout. Change:
```ts
if (!result.hasScore && match.stage === "GROUP_STAGE") {
```
to use the registry:
```ts
import { TOURNAMENTS } from "./lib/tournaments";
// ...
const noKnockout = TOURNAMENTS[tournament]?.hasKnockout === false;
if (!result.hasScore && (noKnockout || match.stage === "GROUP_STAGE")) {
```
Keep the existing knockout carve-out (so if the WC is ever re-synced, group-stage still
works and knockout still waits for football-data's regularTime). Update the comment at
lines 434-436 to explain: leagues (no knockout) always use the fallback because
`fullTime == regularTime`.

**Verify**: `bun run check-types` → exit 0.

### Step 7: Retire the WC cron (`crons.ts`)

Remove the `"sync WC today"` cron block (`crons.ts:7-12`). Leave `"sync BSA today"` and
`"schedule first match reminder"`. Do not delete the `syncToday` function itself.

**Verify**: `bun run check-types` → exit 0. `bun run check` → exit 0.

### Step 8: Confirm every hardcode is gone

Run:
```
grep -rn 'SCORABLE_TOURNAMENT\|tournament: "WC"\|"WC2026"' packages/backend/convex
```
Expected: matches only inside `lib/tournaments.ts` (the registry entry `WC2026: {...}`) and
inside `footballData.ts`'s WC sync wrappers (`doSync(ctx, "WC", "WC2026", ...)` — those are
the still-defined WC sync functions, which are fine). **No** matches of `SCORABLE_TOURNAMENT`
or `tournament: "WC"` anywhere.

## Test plan

- Create `packages/backend/tests/tournaments.test.ts` (model on the existing
  ranking-comparator test in `packages/backend/tests/`). Assert:
  - `ACTIVE_TOURNAMENT === "BSA2026"`.
  - `TOURNAMENTS[ACTIVE_TOURNAMENT].hasKnockout === false`.
  - `TOURNAMENTS.BSA2026.espnCode === "bra.1"` and `.competitionCode === "BSA"`.
- Verification: `bun test packages/backend/tests` → all pass including the new file.

## Done criteria

- [ ] `bun run check-types` exits 0
- [ ] `bun run check` exits 0
- [ ] `bun test packages/backend/tests` exits 0; `tournaments.test.ts` passes
- [ ] `grep -rn 'SCORABLE_TOURNAMENT' packages/backend/convex` → **no matches**
- [ ] `grep -rn 'tournament: "WC"' packages/backend/convex` → **no matches**
- [ ] `crons.ts` has no `"sync WC today"` cron
- [ ] No frontend files modified (`git status` shows only backend + tests)
- [ ] `plans2/README.md` status row updated

## STOP conditions

Stop and report if:
- Any "Current state" excerpt doesn't match the live code (drift).
- **The daily-reminder claim can't be confirmed**: if prod logs actually show the reminder
  emailing users under `"WC"`, then matches were once stored as `"WC"` and this "fix" would
  change behavior — report before shipping. (Expected: logs show "Nenhum jogo da Copa hoje"
  or nothing.)
- You cannot determine the real `stage` value football-data returns for BSA matches. Do NOT
  guess a specific string — the Step 6 change keys off `hasKnockout`, not the stage string,
  precisely to avoid that. But if BSA matches turn out to carry `stage === "GROUP_STAGE"`,
  the existing gate already worked and Step 6 is a safe no-op — note it and continue.
- Making BSA scorable would retroactively score already-finished BSA games in a way that
  conflicts with plan 001's reset ordering (001 not yet executed) — STOP and confirm 001
  ran first.

## Maintenance notes

- After this ships and 001's reset is done, the owner runs **"Recomputar todos os pontos"**
  in `/admin` once to score any already-finished Brasileirão games (recompute is idempotent).
- The registry is the extension point for "another championship later" (the owner's "por
  enquanto"): add an entry to `TOURNAMENTS` and flip `ACTIVE_TOURNAMENT`. Anything that
  still hardcodes a tournament code is a bug to route through the registry.
- Reviewer should scrutinize: that `computeForMatch`'s tie-bonus block was left untouched
  (plan 003 owns it), and that the ESPN gate still protects a hypothetical future knockout.
