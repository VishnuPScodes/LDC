# Rank Estimate design note

## Data flow

- Mock settings, syllabus quotas, eligibility rules, scoring and all estimate thresholds live in `server/src/rank-estimate/config.ts`.
- A mock is a 100-question, 75-minute session using Kerala PSC LDC syllabus version `ldc-2024`. Session metadata records the set, question section, difficulty and whether the user had answered each question before. Existing answers retain the first submitted choice for first-attempt difficulty calculations.
- Authenticated sessions and rank history use MongoDB/Mongoose. Guest mocks, summaries and trends stay in local storage; a public estimate endpoint uses the same score and curve functions without storing guest identity.
- `TestSession` retains the question and answer record and adds mock balance, repeat share, difficulty, section scores and rank eligibility/reason. User district is stored under `User.settings.district`.
- `LdcHistory` stores verified district/cycle data. `LdcCurrentCycle` stores district applicant and attendance inputs. Neither collection is seeded. A privileged server-side CSV import command validates entries and is the admin workflow because the app has no admin-role system.
- `RankCalibration` stores a user's private prediction snapshot and their optional actual score/rank. A privileged aggregate report returns anonymous coverage/error metrics only.

## Estimate formulas

- Raw score is correct × 1 + wrong × −1/3 + skipped × 0. Difficulty is the mean question first-attempt wrong share when at least 30 first attempts exist; otherwise use the topic mean, then neutral 0.5. Adjusted score is raw score + 8 × (mock difficulty − mean mock difficulty), clamped to 0–100.
- Count only completed/timed-out mocks with at least 70% answered (or elapsed full duration) and repeat share at or below 50%. Early quits and ineligible mocks remain in results with a reason.
- Combine counted mocks from the last 60 days using a 14-day half-life. Half-width is `max(3, 7 / sqrt(mock count))`, widened by score spread and repeat share. Round scores to one decimal and expose `First estimate`, `Getting sharper`, or `Reliable` by mock count.
- Section scores use the same recency weights. Difficulty and section statistics are retained with each mock so later config changes do not rewrite old sessions.
- Build a monotone PCHIP curve over score and log-rank anchors from at most the latest three verified cycles, weighted toward recent cycles. Do not extrapolate beyond anchors. Use attendance ratios only when supplied for the current cycle or available from verified history. If minimum district data is absent, show no rank range.
- Fit thresholds, score/rank rounding, improvement targets, tip thresholds and all mock quotas are config entries. Missing history never falls back to fabricated or generic rank values.

## Initial configurable values

The initial guesses (not calibrated predictions) are: 100 questions, 75 minutes, 1/−1/3/0 marking, 30 first attempts, neutral difficulty 0.5, adjustment coefficient 8, 60-day window, 14-day recency half-life, 7/3 marks base/minimum uncertainty, 3 historical cycles, 70% answer threshold, 50% repeat limit, +15 percentage-point target capped at 90%, and 5,000 simulation draws. The official 2024 LDC weights are configured per syllabus section in the config file. `Important Acts` currently has no matching bank topic and uses only the configured Constitution/Governance fallback; affected mocks are flagged unbalanced.

## Empty-data and operational behavior

- Production historical/current-cycle collections start empty. The UI reports missing district data and shows the score estimate without a rank range. Fit is shown only when cutoff data supports it.
- `docs/rank-estimate-history-template.csv` contains headers only. `docs/rank-estimate-data-guide.md` explains sourcing and verification requirements.
- Tests may use clearly labeled synthetic fixtures, kept under test-only files and never imported by production code.
- After an exam, calibration prompts remain optional. The admin aggregate report computes absolute score error, score-range coverage, rank error and rank-range coverage; no per-user calibration record is returned.
