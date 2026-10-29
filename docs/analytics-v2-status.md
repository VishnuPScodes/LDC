# Analytics V2 — implementation status

Updated: 2026-10-28

This is a handoff note for the LDC Practice Analytics task. It separates work committed in Git from the current, unfinished follow-up changes.

## Implemented

- Kept the existing `/progress` route and added the `analyticsV2` feature flag (`NEXT_PUBLIC_LDC_FEATURE_ANALYTICS_V2`). The enabled navigation label is “Analytics”.
- Added a shared server analytics engine in `server/src/analytics/engine.ts`, backed by one editable threshold and syllabus config in `server/src/analytics/config.ts`.
- Added authenticated `GET /api/analytics?range=7|30|all`. Results are cached on the user's own User record and refreshed for all ranges when a session completes.
- Added an unauthenticated guest analytics endpoint, `POST /api/analytics/guest`, which receives the guest's saved sessions and does not persist them.
- Implemented first-attempt and repeat counts, recent accuracy/trend, confidence and mastery, coverage, marks at stake, mock negative-mark loss, due review counts, activity, current/best streak, and rule-based advice. Current action buttons are wired to signed-in practice setup or guest topic/timed practice routes.
- Added the initial and continuing Analytics UI: summary metrics, section bars and lists, answer and mastery donuts with data tables, activity heatmap/time list, section trend/detail with recent wrong-question links, mock score/section tables, and the existing Rank Estimate card.
- Added English and Malayalam labels and recommendation title/reason strings. Continued bilingual coverage for section labels, mastery, errors, mock tables, activity labels, and guest consent. A final copy pass is still needed for remaining chart/topic content.
- Wrote the initial formulas and syllabus allocation rationale in `docs/analytics-v2-design.md`.

## Configuration currently used

Values are centralized in `server/src/analytics/config.ts` (mastery thresholds derive from that config):

- Trend comparison: last 14 days against the preceding 14 days, with a non-overlapping boundary; flat within ±5 percentage points.
- Confidence: at least 20 first attempts.
- Mastery: Weak below 50%; Developing 50–69%; Good 70–84%; Strong at least 85%.
- Due review trigger: 10 items; 2 minutes each, capped at 30 minutes; priority 100.
- Marks action: 20 questions; priority equals marks at stake, multiplied by 1.5 on a down trend.
- Low-evidence action: fewer than 20 first attempts; priority is marks × uncovered share × 1.5.
- Negative-mark action: last 2 mocks each lose at least 3 marks and answered accuracy is below 70%; priority 75; 10 quick questions.
- Mock cadence: at least 300 first attempts and no full mock in 10 days; priority 65; 100 questions.
- Declining area: prior-window accuracy at least 70% and drop of at least 10 points; priority 60.
- Speed action: mock mean above 50 seconds or at least 10 unanswered at timeout; priority 55; 25 timed questions.
- Daily plan: 45 minutes; personalization threshold: 50 first attempts; recently practised section cooldown: 2 hours.
- Syllabus weights use the existing 100-mark Rank Estimate map. The requested weights total 94 and differ from the checked-in map; the map has a separate 5-mark Important Acts section and different Biology/Kerala Governance weights.

## Verification completed

- `pnpm --filter @ldc/server build` passed after the guest endpoint changes.
- `pnpm --filter @ldc/client exec tsc --noEmit` passed before the final chart/detail additions; the subsequent Next.js production build also type-checked those additions.
- `pnpm --filter @ldc/client build` passed after the chart/detail work.
- The current server suite passes 76/76. New Analytics coverage includes guest payload and middleware validation, historical repeat inference, trend boundaries, range/skip behavior, and explicit mock-section mapping. Server TypeScript build passes.
- The older production preview was captured at 390px and 1440px in light and dark themes. Files:
  - `client/design-review/analytics-light-390.png`
  - `client/design-review/analytics-dark-390.png`
  - `client/design-review/analytics-light-1440.png`
  - `client/design-review/analytics-dark-1440.png`
- Fixed mobile heading sizing/wrapping, added bottom clearance for the fixed “Install app” button, raised Analytics tap targets to 44px, and added explicit bilingual consent before sending guest history for computation. Guest mistake/review actions unsupported by guest practice are hidden. The client production build passes and the footer reads its version from `client/package.json` (bumped to 1.10.1). Screenshots still need to be recaptured and visually inspected; current PNGs predate these changes. A production server started on port 3101, but headless Chrome exited with code 134 before saving a screenshot.
- The live guest analytics request was not exercised against a running backend (port 4000 was unavailable during review). The screenshots use a static review fixture at `/analytics-preview`, not real learner data.

## Still pending before the Analytics task is complete

1. Recapture all four screenshots after the layout changes and inspect them. The preview server starts on port 3101, but headless Chrome exited with code 134. Existing PNGs predate these fixes.
2. Run HTTP-level guest route tests and end-to-end signed-in/guest flows with the API and database running. Pure validation and engine tests pass; the API and database are unavailable here, so live responses and direct action destinations remain unverified.
3. Compare outputs with actual result, Today, review, and Rank Estimate pages. Code review fixed historical explicit-repeat inference and the overlapping 14-day boundary. Important Acts attribution is reliable only when mock section metadata supplies its key; ambiguous fallback-pool questions still need source metadata or product guidance.
4. Finish the bilingual copy audit. Core secondary labels and mock tables have Malayalam copy, but some chart/topic labels and question content remain English.
5. Complete contrast, keyboard, and screen-reader checks. Analytics controls have 44px minimum targets and visible focus styles, but assistive technology and contrast checks have not been run.
6. Guest privacy now has an upfront bilingual disclosure and explicit action before locally saved sessions are sent for calculation; the endpoint does not persist them.
7. Keep `/analytics-preview` as a static design-review route; it uses a fixed fixture and supports future visual review.

## Git state

Three commits currently contain the initial implementation:

- `8d7e1d2` — Add learner analytics engine and API
- `c145391` — Add Analytics dashboard to Progress
- `14c1eb9` — Add Malayalam advice and refine mock triggers

Guest analytics, Rank Estimate integration, extra detail/charts, the preview route, and screenshots have additional uncommitted changes in the worktree. Build-generated `client/.next-dev` files and the unrelated existing `client/design-review/calm-after-today-390-light.png` are also present; do not include those generated/unrelated files in a feature commit.
