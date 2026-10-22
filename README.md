# Kerala PSC LDC Practice

A monorepo for a Kerala PSC Lower Division Clerk practice app: Next.js client, Express/TypeScript API, MongoDB/Mongoose, JWT cookie authentication, PDF import, and syllabus-wise progress reporting.

## Requirements

- Node.js 20+
- pnpm 9+
- MongoDB local instance or MongoDB connection URI

## Setup

```sh
pnpm install
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Set `MONGODB_URI` and a long random `JWT_SECRET` in `server/.env`. The defaults target MongoDB at `127.0.0.1:27017`. The API runs on port 4000 and the Next app on port 3001.

```sh
pnpm dev
```

The app is at http://localhost:3001. Create an account, then configure a practice session. Authenticated routes use an httpOnly cookie.

## Import questions

Install the packages first, then run:

```sh
pnpm exec tsx scripts/import-pdf.ts LDC.pdf server/data/questions.json
pnpm seed
```

The importer uses `pdf-parse` and conservatively recognizes numbered question lines and A–D options. It maps common inline answer-key formats, leaves answers unset when no key is found, and prints an `unparsed` list. Review its output against the PDF before seeding.

To reconcile a bank against a text export and per-page Tesseract output, run:

```sh
pnpm exec tsx scripts/reconcile-pdf-text.ts LDC.txt /path/to/ocr-text server/data/questions.json server/data/questions.reconciled.json
```

The reconciler matches on source page and question number, keeps existing answer keys and syllabus tags, and writes a separate output file for review.

The supplied `LDC.pdf` has been transcribed into `server/data/questions.json` in PDF order. Its first 18 papers were reconciled against the provided `LDC.txt`; the remaining pages were transcribed with Malayalam-capable Tesseract OCR (`eng+mal`). Matching used the PDF page and question number, and the reconciliation kept all existing answer keys unchanged. The Google Docs text and OCR both contain errors, so questions with incomplete or suspicious text/options and questions without an answer key remain marked `needsReview` and are excluded from tests by default. Review those entries against `sourcePage` before using them. Topic labels are inferred from question wording and should also be checked.

## API

The Express service exposes signup/login/logout/me, syllabus, test creation, per-question answer submission, completion, reports, history and dashboard progress below `/api`. The server omits answer keys when creating/resuming sessions and reveals correctness only after answer submission. Tests use the server's scoring helpers.

## Commands

- `pnpm dev` — run client and API in parallel
- `pnpm build` — production builds
- `npm run seed` (or `pnpm seed`) — load `server/data/questions.json` into MongoDB (replaces the Question collection when the file contains rows)
- `pnpm test` — scoring unit tests

## Configuration

See `server/.env.example` and `client/.env.example`.

In PDF order mode the API advances beyond the last answered or skipped PDF-order question recorded for the user, then wraps to the beginning when the available sequence is exhausted. An unfinished test can be resumed from the dashboard/history.


### Supplied PDF import summary

- Detected MCQs: 4,694 across the 207-page PDF
- Answer key letters retained: 4,160
- Flagged for review after text reconciliation: 2,086
- Complete A–D option sets: 4,502; partial or absent option sets remain flagged
- Currently eligible for practice (verified answer, complete options, not flagged): 2,608
- Reconciled question text: 2,936 records; reconciled option sets: 2,842
- Answer keys retained unchanged: 4,160; 534 questions still have no verified answer
- Snippets that could not be parsed as MCQs: 3

Topic counts are recorded in `server/data/import-report.json`. Because this is a historical collection, some papers have fewer than 100 numbered questions. Check `paperNumber`, `questionNumber`, and `sourcePage` together when reviewing repeated numbers.
