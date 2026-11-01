# Question data review

## Topic import diagnosis

`scripts/import-pdf.ts` classifies questions through ordered keyword rules. Malayalam text currently reaches the regional-language fallback before several English-only subject checks, Kerala-related vocabulary can over-select the governance topic, and unmatched text defaults to Current Affairs. This explains why Current Affairs accumulates unrelated questions and why some Malayalam science/geography/history questions receive language or governance tags.

`scripts/retag-question-topics.mjs` accepts reviewed paper section maps with `--section-map=path.json`, combines them with subject-specific keyword rules, and writes a CSV proposal list. Run it without `--apply` first. The current dry run proposed 64 changes: 0 high-confidence section-map matches and 64 keyword suggestions left for review. None were applied. Keyword rules do not replace section-by-section human checking.

## General Science grouping

Keep General Science as a convenience aggregate for browsing and practice. It combines Biology and Public Health, Physics, and Chemistry. Those three official syllabus topics stay separate in source data, marks, analytics, and syllabus views; the aggregate does not create a fourth source-data topic.

## Time-sensitive questions

`scripts/detect-time-sensitive-questions.mjs` writes `server/data/time-sensitive-review.csv` without changing question data. The current run flagged 3 questions for review. Guest and signed-in mock selection excludes questions matched by the current classifier. Public paper pages retain them and display an “asked in YEAR” notice. The classifier is deliberately reviewable and will not catch every volatile fact; inspect the CSV and add reviewed patterns when needed.

## Malayalam normalization

`scripts/normalize-malayalam-question-text.mjs` writes a before/after CSV, normalizes NFC, and removes the targeted zero-width and dependent-sign boundary errors. Apply mode creates a timestamped copy under `server/data/backups/` before writing `questions.json`. Current dry run: 175 proposed text edits; none applied. Review the full `server/data/malayalam-text-review.csv` before using `--apply`.

## Paper category verification

Paper 116/2014 is identified by Kerala PSC as “L.D Clerk (SR from PH) – Various (All Districts),” tested 6 August 2014. It is labeled special recruitment for differently abled candidates. Source: [Kerala PSC final answer key, Paper 116/2014](https://keralapsc.gov.in/sites/default/files/2018-09/FKEY116-14.pdf).
