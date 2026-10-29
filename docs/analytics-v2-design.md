# Analytics V2 design note

## Data and page choice

Keep `/progress` and replace its insights content behind `analyticsV2`. This preserves saved links and the existing navigation slot. The current Progress page already uses Recharts. Authenticated answers come from per-user `TestSession` records; review due dates come from `UserProgress`; the official section map comes from `rankEstimateConfig`. Guest sessions stay in local storage. Before analytics are calculated, the guest sees a disclosure and chooses to send the saved history to the server for this request; the endpoint computes results without persisting the sessions.

The checked-in syllabus sources disagree with the supplied mark list. `server/data/syllabus.json` and `rankEstimateConfig.syllabus.sections` make a 100-mark allocation, including 10 Kerala Governance, 6 Biology and Public Health, and a separate 5-mark Important Acts section whose mock questions are drawn from Constitution and Kerala Governance pools. The values supplied in the request total 94. Analytics will reuse the Rank Estimate's 100-mark section keys and question section assignments to keep mock breakdowns and Rank Estimate aligned. This mapping remains editable in `server/src/analytics/config.ts`.

## Metrics

- Accuracy uses the first saved answer per student and question (`firstIsCorrect`, falling back to earliest stored answer for imported/legacy sessions). Mock revisions do not replace first-attempt accuracy. Repeats are counted separately.
- Recent accuracy compares first attempts in the latest 14 days with the preceding 14 days. The prior window excludes the exact 14-day boundary so an event is counted in only one window. Trend is up/down at a difference of at least 5 percentage points; otherwise flat.
- Confidence requires 20 first attempts in the selected range. Mastery bands apply only at that confidence: Weak <50%, Developing 50–69%, Good 70–84%, Strong ≥85%.
- Coverage is distinct eligible questions attempted divided by eligible questions in the selected section. Accuracy and coverage follow the selected 7-day, 30-day, or all-time range; trend remains a fixed recent-vs-prior 14-day comparison.
- Marks at stake = configured section marks × (1 − latest-14-day accuracy). If there are no recent attempts, use all-time first-attempt accuracy; with no attempts, report marks as unassessed rather than a loss.
- Wrong-mark loss = incorrect mock answers × 1/3, matching Rank Estimate marking. Time per question is calculated from recorded `timeTakenMs`; missing legacy durations are excluded and the section is marked approximate.
- Active days come from dated saved answers. Streak and best streak reuse learner-stat rules. Review backlog counts currently due `UserProgress.reviewAt` entries.

## Advice rules and scoring

All thresholds and weights live in `server/src/analytics/config.ts`.

1. Due review (10+): priority 100; estimated 2 minutes per due question, capped at 30 minutes.
2. Section marks at stake: priority = marks at stake × (1 + 0.5 when trend is down); practise 20 questions in instant mode.
3. Low evidence/coverage: priority = section marks × (1 − coverage), with an additional 0.5 weight for zero first attempts; practise 20 questions.
4. Negative marking: if each of the two latest mocks lost at least 3 marks and answered accuracy is below 70%, priority 75; launch a 10-question quick session with skip guidance.
5. Mock cadence: if 300+ questions have been answered and no full mock was completed in 10 days, priority 65; launch the configured 100-question mock.
6. Declining established section: if prior accuracy was Good/Strong and recent accuracy dropped 10+ points, priority 60; launch a 20-question section practice.
7. Time management: if mock mean time exceeds 50 seconds or timeout left 10+ blank, priority 55; launch a 25-question timed practice.
8. Daily goal: priority 10 and only used if fewer than three higher-ranked actions exist.

De-duplicate by section, sort by priority with stable configured rule order for ties, and take at most one action per section. Do not recommend a section practised in the last two hours except due review. Take actions in priority order for the daily plan until the 45-minute budget is reached. Reasons include the exact counts, percentages, mark value, or time that produced the recommendation.

## Compute and cache

One pure server engine computes section/topic metrics, summaries, chart datasets, detail data, and advice from a normalized learner snapshot. A server service reads user-owned sessions, question eligibility, review due dates, and Rank Estimate metadata, then caches the serialized result on that user's `User` document by range. Cache refresh runs after session completion; a missing/stale legacy cache is rebuilt on the next Analytics request. The authenticated API never accepts a user ID from the browser. The guest endpoint validates its bounded request and computes against the submitted local history without saving it.

## Accessibility and presentation

Use existing warm-background, white-card, text, and brand tokens; retain Recharts already in the client. Every chart is paired with a visible table/list and labels, and mastery includes text as well as color. The main page content, recommendations, and core chart/table labels have English and Malayalam copy; remaining topic names and question content can remain English. The section detail opens from the section bar and practice actions pass explicit topics, modes, and counts to the existing session-start flow. Guest controls that depend on a signed-in review queue or saved mistake filtering are hidden.
