# Project guidance

For frontend UI changes and releases, read and follow [`skills/app-versioning/SKILL.md`](skills/app-versioning/SKILL.md). Keep the visible UI version synchronized with `client/package.json` and bump it for each app UI release.

## Mobile first, always

Most learners use LDC Practice on a phone. For every UI change:

1. Design and build for the phone screen first (≈360–430px wide): layout, tap targets (≥44px), reading order, and what is visible without scrolling.
2. Verify on a phone-width viewport (e.g. 390×844) before anything else, including no horizontal scroll.
3. Only then adapt the layout for laptop/desktop. Desktop is always the second priority.

When space is tight on mobile, collapse secondary content behind a tap (disclosure, sheet) rather than shrinking it.
