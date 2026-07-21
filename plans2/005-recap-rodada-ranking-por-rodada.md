# Plan 005: Recap de rodada + ranking por rodada (retenção do campeonato longo)

> **Executor instructions**: Follow step by step. Run every verification command. On a
> "STOP condition", stop and report. When done, update this plan's row in `plans2/README.md`.
> **Read `plans2/000-esquema-usabilidade-brasileirao.md` first** — this implements telas 3–4
> (recap de rodada + "melhor da rodada").
>
> **Drift check (run first)**:
> `git diff --stat 857d0d0..HEAD -- packages/backend/convex/matches.ts packages/backend/convex/leagues.ts apps/web/src/app/(app)/dashboard/page.tsx apps/web/src/app/(app)/leagues/[id]/page.tsx`
> On changes, compare "Current state" excerpts before proceeding; mismatch → STOP.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: LOW (additive queries + UI; no change to how points are computed)
- **Depends on**: plan 002 (BSA scores + `matchday` reliable), plan 004 (round-based frontend). Ideal after both.
- **Category**: direction
- **Planned at**: commit `857d0d0`, 2026-07-21

## Why this matters

An 8-month season loses people unless each round has a **close**: "how did I do this round,
and who won it?" This is the single highest-leverage retention mechanic for the format (see
000). It gives the group a reason to come back every Monday and something to share ("fui o
melhor da Rodada 12 🐤"). It's additive — it reads existing `predictions.components` +
`matches.matchday`, computes per-round points on the fly, and reuses `podium.tsx` /
`share-ranking-card.tsx`.

## Current state

- **Round data**: `matches.matchday` holds the Brasileirão round number; `matches.stage`
  is a single league stage. `matches` has index `by_tournament_date`.
- **Per-prediction detail**: `predictions.components` = `{ result, homeGoals, awayGoals }`
  (set when calculated), plus `points`, `calculatedAt`. `lib/ranking.ts` exports
  `pointsFrom(components, scoring)` and `DEFAULT_SCORING`.
- **Ranking building blocks**: `leagues.ts` `getRankingByPhase` (leagues.ts:531-611) already
  demonstrates the pattern of reading a league's ACTIVE members, each member's predictions,
  and bucketing by match — reuse that structure. `compareByPoints` sorts standings.
- **UI to reuse**: `apps/web/src/components/leagues/podium.tsx` (top-3),
  `ranking-row.tsx` (rows), `share-ranking-card.tsx` (shareable image),
  `share-ranking-sheet.tsx` (share flow), `BentoTile`. Read `leagues/[id]/page.tsx` to see
  how podium+rows are composed with the `getRanking` result shape.
- **Current-round concept**: defined in 000 — smallest `matchday` with a non-`FINISHED`
  match, else max. Plan 004 derived it client-side; this plan makes it a backend query.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `bun run check-types` | exit 0 |
| Lint/format | `bun run check` | exit 0 |
| Tests | `bun test packages/backend/tests` | all pass |
| Build | `bun run build` | exit 0 |

> ⚠️ Do NOT run `dev:server`/`convex deploy`/`convex run` — local Convex points at prod.

## Scope

**In scope**:
- `packages/backend/convex/matches.ts` — add `getCurrentRound` query.
- `packages/backend/convex/leagues.ts` — add `getRoundRanking({ leagueId, matchday })` query.
- `packages/backend/tests/round-ranking.test.ts` — unit test the pure per-round scoring helper.
- `apps/web/src/app/(app)/leagues/[id]/page.tsx` — add a "Rodada" view/section to the ranking.
- `apps/web/src/app/(app)/dashboard/page.tsx` — add the "Recap da última rodada" card.
- Optionally a small `apps/web/src/components/leagues/round-recap.tsx` (create) if the recap
  card is non-trivial.

**Out of scope**:
- Changing how points are computed or stored (this only *reads* + aggregates).
- Charts/graphs of season evolution — deferred (see Maintenance notes); this plan does the
  round recap + per-round ranking only.
- Branding strings — plan 006.

## Steps

### Step 1: `matches.getCurrentRound` query

Add to `matches.ts` a `query getCurrentRound({ tournament: v.string() })` returning
`{ current: number | null, min: number | null, max: number | null }`:
- Read matches for the tournament (`by_tournament_date`), collect distinct `matchday`
  values (ignore null).
- `current` = smallest matchday with at least one match whose `status !== "FINISHED"`;
  if none, the max matchday; if no matchdays at all, `null`.
- `min`/`max` = range of matchdays present (for navigation clamping).
Extract the pure logic into a helper `computeCurrentRound(matches)` so it's unit-testable.

**Verify**: `bun run check-types` → exit 0.

### Step 2: `leagues.getRoundRanking` query

Add to `leagues.ts` a `query getRoundRanking({ leagueId: v.id("leagues"), matchday: v.number() })`.
Auth-gate like `getRanking` (caller must be an ACTIVE member). For each ACTIVE member:
- Read their predictions; keep only those whose match is in the given `matchday` **and**
  `calculatedAt !== undefined`.
- Sum `pointsFrom(pred.components, scoring)` (league's `scoring ?? DEFAULT_SCORING`), count
  exacts (`result && homeGoals && awayGoals`) and correct results (`result`).
- Return rows `{ userId, name, totalPoints, exactScores, correctResults }` sorted by
  `compareByPoints`, with `rank` assigned.
To know a match's `matchday`, build a `Map<matchId, matchday>` from the tournament's matches
(mirror `getRankingByPhase`'s `knockoutByMatch` map at leagues.ts:557-559). Reuse
`ACTIVE_TOURNAMENT` from `lib/tournaments` (plan 002) for the match query.

**Verify**: `bun run check-types` → exit 0. `bun run check` → exit 0.

### Step 3: Round view in the league ranking page

In `leagues/[id]/page.tsx`, add a way to see "quem fez mais pontos na Rodada N": a round
selector (reuse the `◀ RODADA n ▶` pattern from plan 004's predictions page — extract it to
a shared component if convenient) that queries `getRoundRanking({ leagueId, matchday })` and
renders the same podium+rows UI the overall ranking uses. Default the selector to the
current round (`getCurrentRound`). Keep the existing overall Pontos/Cravadas panel; add this
as an additional segment/tab, not a replacement.

**Verify**: `bun run check-types` → exit 0.

### Step 4: "Recap da última rodada" card on the dashboard

In `dashboard/page.tsx`, when there is a **completed** round (a `matchday < current` whose
matches are all FINISHED), show a compact recap card:
- "Rodada {n-1}: você fez {seusPontos} pts" (from `getRoundRanking` filtered to the user)
  and "Melhor da liga: {topName} ({topPoints} pts)" (rank 1 of `getRoundRanking` for the
  user's top league).
- Link/button to the league's round view (Step 3) and a share affordance
  (`share-ranking-sheet.tsx` / `share-ranking-card.tsx`) captioned for the round.
- Only render when such a round exists; otherwise render nothing (no empty card).
Use `BentoTile` + `var(--b-*)` tokens; keep it lightweight.

**Verify**: `bun run check-types` → exit 0.

### Step 5: Wire dashboard/predictions current-round to the query (cleanup)

Replace the client-side current-round derivation added in plan 004 (dashboard faixa +
predictions navigator) with `api.matches.getCurrentRound` so there is one source of truth.
Keep the client fallback if the query is loading.

**Verify**: `bun run check-types` → exit 0. `bun run build` → exit 0.

## Test plan

- `packages/backend/tests/round-ranking.test.ts` (model on the existing ranking test):
  - `computeCurrentRound`: (a) rounds 1-2 all finished, round 3 has a scheduled game →
    current 3; (b) all finished → max; (c) empty → null.
  - The per-round scoring helper: members with predictions across two rounds → correct
    per-round totals, exacts, correct-results, and sort order via `compareByPoints`.
- Verification: `bun test packages/backend/tests` → all pass, including the new file.

## Done criteria

- [ ] `bun run check-types` exits 0
- [ ] `bun run check` exits 0
- [ ] `bun test packages/backend/tests` exits 0; `round-ranking.test.ts` passes
- [ ] `bun run build` exits 0
- [ ] `matches.getCurrentRound` and `leagues.getRoundRanking` exist and are queried by the UI
- [ ] Dashboard shows a round recap when a completed round exists; league page has a round view
- [ ] `plans2/README.md` status row updated

## STOP conditions

Stop and report if:
- `matchday` is null on BSA matches (round ranking impossible) — same STOP as plan 004.
- Plan 002 hasn't landed (`ACTIVE_TOURNAMENT`/registry missing) — this plan imports it.
- `predictions.components` is absent on calculated predictions (older rows) — the round
  ranking would undercount; report and consider falling back to `points` for those rows.

## Maintenance notes

- **Deferred**: season-evolution charts (position over rounds), streaks, monthly recap —
  natural follow-ups once per-round data is exposed here. Scope them separately.
- `getRoundRanking` recomputes from `components` each call; for a league of ≤50 members over
  38 rounds this is fine, but if it ever gets slow, precomputing per-round member totals is
  the optimization (don't do it preemptively).
- Reviewer should scrutinize: that round scoring uses the league's custom `scoring` (not
  hardcoded), matching how `getRankingByPhase` already does it.
