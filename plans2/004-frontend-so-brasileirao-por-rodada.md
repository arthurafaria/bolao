# Plan 004: Frontend só-Brasileirão, navegação por rodada

> **Executor instructions**: Follow step by step. Run every verification command. On a
> "STOP condition", stop and report. When done, update this plan's row in
> `plans2/README.md`. **Read `plans2/000-esquema-usabilidade-brasileirao.md` first** — it is
> the UX spec this plan implements (telas 1 e 2). This plan is self-contained for the
> mechanics, but 000 explains the intent.
>
> **Drift check (run first)**:
> `git diff --stat 857d0d0..HEAD -- apps/web/src`
> On changes to the files in Scope, compare "Current state" excerpts to live code; mismatch → STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED (large surface, but mostly deletions + relabeling; no data model change)
- **Depends on**: plan 002 (BSA scores) and plan 003 (tie logic gone from backend). Do 004 after both.
- **Category**: direction / tech-debt
- **Planned at**: commit `857d0d0`, 2026-07-21

## Why this matters

The frontend is a World Cup UI: a tournament switcher, a mata-mata tab, a bracket, a
"por grupo" view, and a prorrogação/pênaltis picker. The owner chose a **single-tournament
Brasileirão experience** ("esconder a Copa, só BSA") organized around the **current round**
(see 000). This plan removes the Cup UI and reorganizes Palpites + Dashboard around the
round — the core usability shift for an 8-month season. The backend stays generic (plan 002)
so another championship can be re-enabled later.

## Current state

- **App layout / switcher** — `apps/web/src/app/(app)/layout.tsx`: `CompetitionSwitcher`
  (lines 533-623), `CompetitionFlag`/`WcFlag`/`BrazilFlag` (lines 435-531), the nav arrays
  `navItems`/`mobileNavItems` (lines 52-74) both include `{ href: "/mata-mata", ... }`, and
  the header renders `<CompetitionSwitcher />` at line 672. `TournamentProvider` wraps the
  layout (line 627).
- **Tournament context** — `apps/web/src/contexts/tournament-context.tsx`: `COMPETITIONS`
  has `WC2026` + `BSA2026`; `defaultTournament()` returns WC before 2026-07-19 else BSA;
  `useTournament()` is consumed by dashboard, predictions.
- **Predictions page** — `apps/web/src/app/(app)/predictions/page.tsx`: tabs
  `upcoming`/`knockout`/`mine` (`FilterTab`), `showKnockoutTab = tournament === "WC2026"`
  (line 89), `canGroupView = tournament === "WC2026" && ...` (line 162), imports
  `resolveBracket`, `KnockoutPreviewCard`, `BracketStage`, `groupByGroup`, `STAGE_LABELS`.
  Matches come from `api.matches.getAllByDate` (line 70).
- **Mata-mata page** — `apps/web/src/app/(app)/mata-mata/page.tsx`: whole page is the
  bracket; queries `getByStage({ tournament: "WC2026" })` (line 23); imports `BracketMatch`,
  `resolveBracket`, `STAGE_GAME_COUNT`, `BracketStage`.
- **Dashboard** — `apps/web/src/app/(app)/dashboard/page.tsx`: uses `useTournament()`,
  `COMPETITIONS[tournament].label` in the eyebrow (line 92) and empty states (lines 113-115);
  `getUpcoming({ limit: 5, tournament })` (line 57).
- **Knockout-only files** (delete): `apps/web/src/lib/wc2026-bracket.ts`,
  `apps/web/src/lib/knockout.ts`, `apps/web/src/components/bracket/bracket-match.tsx`,
  `apps/web/src/components/bracket/knockout-preview-card.tsx`.
- **Scorecard** — `apps/web/src/components/match/scorecard.tsx`: contains `TieWinner`/
  `TieMethod` types (18-19), `TiebreakerPicker` (182-298), tie state + `handleTie` +
  `editableTie`/`showLockedTie`/`realAdvancer`/`lockedTieValue` (322-483), the two
  `TiebreakerPicker` renders (632-649), the `tieBonus` footer badge (663-675), and the
  `upsert({ ..., tieWinner, tieMethod })` call (376-382). It already builds `stageLabel` with
  a `RODADA {matchday}` branch (lines 407-412) — that part stays.
- **`match-grouping.ts`** — `apps/web/src/lib/match-grouping.ts`: `roundLabel` already
  returns `Rodada {matchday}` when `matchday != null` (line 30). `STAGE_LABELS` has the
  Cup stages; `groupByGroup` is Cup-only. `groupByRound`/`roundKey` are generic — keep.
- **New backend query needed (this plan adds the consumer; the query lands in plan 005)**:
  "current round". To avoid a hard cross-plan dependency, this plan derives the current
  round **client-side** from the already-available match list (see Step 5), and plan 005
  can later replace it with `matches.getCurrentRound`. Do not block on 005.

**Design conventions**: reuse tokens `var(--b-*)`, `PillTabs`, `DayHeader`, `Scorecard`,
`Skeleton`. Match the editorial header style already in `predictions/page.tsx`.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `bun run check-types` | exit 0 |
| Lint/format | `bun run check` | exit 0 |
| Build | `bun run build` | exit 0 |

## Scope

**In scope**:
- `apps/web/src/app/(app)/layout.tsx` (remove switcher + mata-mata nav)
- `apps/web/src/contexts/tournament-context.tsx` (collapse to BSA-only — see Step 1)
- `apps/web/src/app/(app)/predictions/page.tsx` (round-based rewrite)
- `apps/web/src/app/(app)/dashboard/page.tsx` (round faixa + drop Cup labels)
- `apps/web/src/components/match/scorecard.tsx` (remove tie UI)
- `apps/web/src/lib/match-grouping.ts` (optional: prune Cup-only helpers if unused)
- **Delete**: `apps/web/src/app/(app)/mata-mata/page.tsx`,
  `apps/web/src/lib/wc2026-bracket.ts`, `apps/web/src/lib/knockout.ts`,
  `apps/web/src/components/bracket/bracket-match.tsx`,
  `apps/web/src/components/bracket/knockout-preview-card.tsx`

**Out of scope** (do NOT touch):
- The landing page (`apps/web/src/app/page.tsx`) and its Cup components (`cup-countdown`,
  `logo-marquee`) — branding/landing is plan 006.
- Any backend file — plans 002/003/005 own those.
- Leagues pages beyond removing a broken import if one appears (note it, don't redesign).

## Steps

### Step 1: Collapse the tournament context to Brasileirão-only

The owner wants the switcher hidden but the code generic underneath. Simplest robust move:
keep `useTournament()` as an API (so consumers don't all change) but make it **always
return `"BSA2026"`**. In `tournament-context.tsx`: remove `WC2026` from `COMPETITIONS`,
delete `WC_DEFAULT_UNTIL_MS`/`defaultTournament`/localStorage logic, and make the provider
return a constant `tournament: "BSA2026"` with a no-op `setTournament`. Keep the
`TournamentCode` type = `"BSA2026"`.

**Verify**: `bun run check-types` → exit 0 (consumers still compile since `useTournament()`
still exists).

### Step 2: Remove the switcher and mata-mata from the app layout

In `layout.tsx`: delete `CompetitionSwitcher`, `CompetitionFlag`, `WcFlag`, `BrazilFlag`
(lines 435-623) and the `<CompetitionSwitcher />` render (line 672). Remove the
`{ href: "/mata-mata", ... }` entry from both `navItems` and `mobileNavItems` (and the
`GitBranch` import if now unused). `mobileNavItems` must keep 4 entries flanking the FAB —
replace the removed mata-mata slot per the layout's 2+FAB+2 structure; if you drop to 3
items, rebalance to keep the FAB centered (e.g. Início, Palpites | FAB | Ligas, Perfil —
verify visually in Step 8). Remove the `COMPETITIONS`/`useTournament` imports if now unused.

**Verify**: `bun run check-types` → exit 0.

### Step 3: Delete the knockout/bracket files

Delete the five files listed in Scope ("Delete"). Then confirm nothing imports them:
```
grep -rn "wc2026-bracket\|lib/knockout\|components/bracket\|resolveBracket\|KnockoutPreviewCard\|BracketStage\|BracketMatch\|STAGE_GAME_COUNT" apps/web/src
```
Expected after Steps 4-5: **no matches** (predictions.ts stops importing them in Step 5).

**Verify**: the grep returns nothing once Step 5 is done.

### Step 4: Remove the tie UI from `Scorecard`

In `scorecard.tsx`: delete the `TieWinner`/`TieMethod` types (keep them off the `Prediction`
type too — remove `tieWinner`/`tieMethod`/`tieBonus` from the `Prediction` type at
lines 21-30), delete `TiebreakerPicker` (182-298) and `TieValue` (182), delete tie state
(`tie`, `setTie`, `handleTie`, the "deixou de empatar" effect, `isTie`, `isKnockout`,
`editableTie`, `showLockedTie`, `realAdvancer`, `lockedTieValue`, `tieBonus`), delete the two
`TiebreakerPicker` renders (632-649) and the `tieBonus` footer badge (663-675). Change the
`upsert(...)` call (376-382) to pass only `{ matchId, predictedHome, predictedAway }`.

Keep: the `overtimeNote` label is knockout-only — in a league `match.duration` is always
`REGULAR`/absent, so it will simply never render; you may delete it (lines 421-433, 617-628)
for cleanliness. The `stageLabel` `RODADA {matchday}` branch (407-412) stays.

**Verify**: `bun run check-types` → exit 0. `grep -n "tie" apps/web/src/components/match/scorecard.tsx`
returns nothing meaningful (no `tieWinner`/`tieBonus`/`Tiebreaker`).

### Step 5: Rewrite Predictions around the current round

Rewrite `predictions/page.tsx` per 000's tela 2:
- Remove imports of `KnockoutPreviewCard`, `resolveBracket`, `groupByGroup`, `BracketStage`,
  `GitBranch`, `LayoutGrid` and the `KNOCKOUT_STAGES`, `showKnockoutTab`, `bracket`,
  `knockoutDefinedCount`, `canGroupView`, `upcomingByGroup`, `groupStageUpcoming` logic.
- Tabs reduce to **two** (`PillTabs`): `"rodada"` and `"mine"` (Meus palpites — keep the
  existing "mine" rendering intact).
- Derive rounds from `matches` (from `getAllByDate({ tournament })`): group by `matchday`.
  **Current round** = smallest `matchday` that has any match with `status !== "FINISHED"`;
  if all finished, the max `matchday`. Default the selected round to the current round.
- Render a round navigator: `◀  RODADA {n}  ▶` (buttons; clamp to available min/max
  matchday). Under it, a progress line: `{predictedInRound}/{totalInRound} palpitados`
  and the round's close time (earliest non-locked kickoff − 1h) if any.
- Inside the round: group the round's matches by day (`groupByDay` already in this file) and
  render `Scorecard` for each, exactly as the current "upcoming by day" branch does.
- Matches with no `matchday` (should be none for BSA) fall into a "sem rodada" bucket —
  guard against it, don't crash.

Keep the loading skeletons and `EmptyByTab` (drop the `upcoming` empty variant wording that
mentions "janela do torneio"; use round wording).

**Verify**: `bun run check-types` → exit 0.

### Step 6: Dashboard — round faixa + drop Cup labels

In `dashboard/page.tsx`:
- Replace the eyebrow (line 92) `COMPETITIONS[tournament].label · ...sublabel` with a fixed
  `"Brasileirão · Série A 2026"` (or read `COMPETITIONS["BSA2026"].label` — still valid).
- Fix the empty-state copy (lines 113-115) to drop `COMPETITIONS[tournament].label`.
- Add the **Faixa da Rodada Atual** block near the top (per 000 tela 1): derive current
  round the same way as Step 5 from `getUpcoming`/a round query, show `RODADA {n}`, the
  `{done}/{total}` progress, and a CTA button linking to `/predictions`. Reuse `BentoTile`
  or a simple bordered card with `var(--b-*)` tokens. If deriving total-per-round from
  `getUpcoming({limit:5})` is insufficient (it only returns 5), use
  `getAllByDate({ tournament })` here too (already a cheap reactive query) and compute the
  current round client-side, mirroring Step 5. Keep it simple; the richer recap is plan 005.

**Verify**: `bun run check-types` → exit 0.

### Step 7: Prune now-dead grouping helpers (optional, low risk)

If `groupByGroup` / Cup-only entries in `STAGE_LABELS` are no longer imported anywhere
(`grep -rn "groupByGroup\|STAGE_LABELS" apps/web/src`), remove `groupByGroup` and trim
`STAGE_LABELS` to only what's still referenced. If anything still imports them, leave them.
Do not remove `groupByRound`/`roundKey`/`roundLabel` (generic, keep).

**Verify**: `bun run check-types` → exit 0.

### Step 8: Full build + visual smoke

Run `bun run build`. Then (if a local run is available per the `run` skill / SETUP.md
`bun run dev:web`, which uses the prod backend read-only) load `/dashboard` and
`/predictions`: confirm no tournament switcher, no mata-mata tab, round navigator works,
and palpite save still works on an open match. Navigating to `/mata-mata` should 404.

**Verify**: `bun run build` → exit 0.

## Test plan

- This repo's tests are backend-only (`packages/backend/tests`); there is no frontend test
  harness. Do **not** stand one up. Verification is `check-types` + `build` + the manual
  smoke in Step 8.
- Extract the "current round" derivation into a small pure function (e.g. in
  `match-grouping.ts`: `currentRound(matches): number | null`) so it *can* be unit-tested
  and reused by dashboard + predictions. If you add it there, add a `bun test` case for it
  under `packages/backend/tests` is not possible (different package) — instead keep it pure
  and covered by the type system; note this in your report.

## Done criteria

- [ ] `bun run check-types` exits 0
- [ ] `bun run check` exits 0
- [ ] `bun run build` exits 0
- [ ] `grep -rn "CompetitionSwitcher\|/mata-mata\|resolveBracket\|TiebreakerPicker\|wc2026-bracket" apps/web/src` → **no matches**
- [ ] The five knockout/bracket files are deleted (`git status` shows deletions)
- [ ] Predictions has exactly two tabs (Rodada, Meus palpites) and a round navigator
- [ ] No backend files modified (`git status`)
- [ ] `plans2/README.md` status row updated

## STOP conditions

Stop and report if:
- "Current state" excerpts don't match live code (drift — likely if 002/003 renumbered).
- Deleting the bracket files breaks an import you didn't expect (grep in Step 3 finds a
  consumer outside predictions/mata-mata) — report it.
- BSA matches turn out to have `matchday == null` (no round data) — the whole round
  navigation depends on `matchday`. STOP and report; the data source may need investigation.
- `getRankingByPhase` is still called by a leagues page and now returns empty phase buckets
  in a way that renders broken — note it for plan 005 (the phase panel removal), don't
  redesign leagues here.

## Maintenance notes

- The client-side "current round" derivation here is provisional; plan 005 adds
  `matches.getCurrentRound` as the canonical source. When it lands, replace the client
  derivation in both dashboard and predictions with the query.
- If a second championship is re-enabled later, the switcher can come back — the backend
  registry (plan 002) already supports it; only this frontend collapse (Step 1) hid it.
- Reviewer should scrutinize: mobile bottom-nav balance after removing mata-mata (FAB stays
  centered), and that palpite save still works (the `upsert` call lost its tie args).
