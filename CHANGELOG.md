# Changelog

## 1.7.0

- Added a daily activity summary, a kind streak restart prompt, and a direct link to review questions due today.
- Removed the separate local streak and question counter so Today uses the shared learner statistics.

## 1.6.0

- Rebuilt Progress with time ranges, an activity calendar, topic accuracy practice links, mock score trends, and shared learner statistics.

## 1.5.0

- Added historical, dependency-ordered milestones, recent milestone highlights, and an all-milestones page with progress toward locked achievements.

## 1.4.0

- Added computed points, levels, streak totals, daily goal rewards, mock and review bonuses, and session point summaries from answer history.
- Added the safe `pnpm --filter @ldc/server stats:recompute` dry-run command and expanded point-rule consistency tests.

## 1.3.0

- Added an optional, editable exam countdown to Today and Study settings in English and Malayalam.
- Saved the target exam date and daily goal in the signed-in user's settings.

## 1.2.0

- Fixed syllabus data loading and added topic mastery, coverage, loading, and retry states.
- Added distinct Instant, Quick, and Mock answer behaviour, with partial-session results and usable session history.
- Added deep links and session restoration, safer Malayalam question text wrapping, reviewed topic corrections, and clearer daily-facts actions.
- Simplified navigation, added an English/Malayalam menu toggle, and surfaced unfinished sessions and upcoming reviews.
