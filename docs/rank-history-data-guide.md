# Rank history data entry

The two CSV files under `server/data/` contain headers only. They intentionally contain no production estimates or sample values.

Collect district-specific historical figures from Kerala PSC's official rank lists, short lists, notifications and exam publications. Reliable news reports can help locate or corroborate a figure, but verify each number against an official PSC publication whenever possible. Record the exact URL and a short note describing which document/table supports the value. Confirm notification number, district and exam cycle before entering values. Do not infer applicant totals, attendance, list sizes, cutoffs or top scores from another district or cycle.

Cutoffs and top scores are marks out of 100. Attendance ratio is a decimal from `0` to `1` (for example, a verified 75% is entered as `0.75`). Leave a value empty when it is unknown. Any row with a figure must include both `source_url` and `source_note`. Verify each row independently before importing.

To import from a trusted admin shell, set `LDC_RANK_HISTORY_ADMIN=true` and `MONGODB_URI`, then run:

```sh
pnpm --filter @ldc/server rank-history:import path/to/history.csv path/to/current-cycle.csv
```

The current-cycle CSV is optional. Historical rows upsert by district, exam year and notification number; current-cycle rows upsert by district. No rank-history values are seeded by the app.
