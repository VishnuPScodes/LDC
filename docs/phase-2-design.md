# Phase 2 design notes

## Feature 1 — Exam countdown

- Store an optional `targetExamDate` on the signed-in user's settings, as a date-only `YYYY-MM-DD` value. The authenticated settings endpoint owns updates; a missing date removes it.
- Calculate days remaining from local calendar dates when rendering Today. No official date is inferred. Settings can change or clear the date at any time.
- Feature switch: `NEXT_PUBLIC_LDC_FEATURE_EXAM_COUNTDOWN` (enabled unless set to `false`). English and Malayalam labels use the existing app language setting.

## Feature 2 — Points and levels

- `getLearnerStats(userId)` is the only source for points, level, streaks, goal counts, and question/session totals. It derives results from saved `TestSession` records and their timestamped answers; it does not increment a second balance on answer writes.
- Persist the user's daily goal as a user preference so goal bonuses can be recomputed from session history. Review-only sessions are identified in saved session settings. Mock completion and score bonus are derived from completed mock records.
- Practice points deduplicate question/day outside review and cap at 300 per local day. Level thresholds are a single pure function (`ceil(100 * level^1.5)` cumulative curve); all screens consume its returned level and progress.
- A maintenance script recomputes stats without mutating answer history. Any persisted cache, if introduced later, must be replaceable by this derivation.
- Feature switch: `NEXT_PUBLIC_LDC_FEATURE_POINTS` for UI and `LDC_FEATURE_POINTS` for the API, both enabled unless set to `false`.

## Feature 3 — Syllabus Journey

- Store the 14-stop route, district label/position, syllabus topic mapping, and mastery thresholds in `client/app/journey-config.ts`. Every existing syllabus topic is assigned once; the final Exam Ready stop depends on all topic stops.
- Journey mastery uses the latest 20 distinct answered records per topic, requiring at least 20 attempts and at least 60% correct. It reads the same per-topic attempts/accuracy returned by `getLearnerStats`.
- The recommended stop is the unreached topic with lowest accuracy, breaking ties by the greatest eligible question count. Users may choose any stop.
- Render a configurable SVG with list alternative; details are shown in a bottom sheet. Practice actions use the existing topic-filtered session flow.
- Feature switch: `NEXT_PUBLIC_LDC_FEATURE_JOURNEY` (enabled unless set to `false`).

## Shared data and verification

- Raw answer/session records remain authoritative. Stats use one ordered answer stream and one set of pure scoring rules; Today, Progress, Journey, and Milestones consume the same response.
- A consistency test feeds the same seeded records through the shared stats API projection and verifies identical level, points, and counts for each screen projection.
- The recompute script supports dry-run by default, explicit `--apply`, and logs before/after values. It must be idempotent and must not delete or rewrite session answers.
