---
name: app-versioning
description: Keep the LDC Practice UI version visible and correctly bumped when shipping frontend changes.
---

# LDC Practice UI versioning

Use this skill for app-facing frontend changes and releases in this repository.

- `client/package.json` is the source of truth for the UI version. The global footer reads this value; do not hard-code a second version string.
- Bump the client version whenever an app UI change is prepared for release. Use a patch bump for fixes and small UI changes, a minor bump for backwards-compatible features, and a major bump for breaking changes.
- Keep versioning changes scoped to the client package unless the server or monorepo itself is separately versioned for that release.
- Before finishing, check that the rendered footer shows the bumped version and run the client production build.
