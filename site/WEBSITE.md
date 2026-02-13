# Website Setup

This repo can be served as a static Astro site with Supabase-backed progress tracking and optional Supabase-first content.

## Prerequisites

- Node.js 18+
- A Supabase project
- A Vercel account (for deployment)

## Local Setup

1. Move into the web app directory:

```bash
cd site
```

2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

4. Run the Supabase schema in `supabase/schema.sql`.

5. Start the dev server:

```bash
npm run dev
```

## Content Validation

Run the validation script to enforce frontmatter and folder conventions:

```bash
npm run validate
```

## Build Pipeline

`npm run build` runs, in order:

1. Content validation.
2. Cover fetching (auto mode).
3. Content sync to Supabase (auto mode).
4. Supabase verification (auto mode).
5. Astro build.

To enable sync and verification, set build-time environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

If those are missing, sync/verify are skipped in auto mode.

## Manual Sync and Verification

```bash
npm run sync:content
npm run verify:content
```

## Book Covers

The site can display local cover images generated from Open Library.

1. Fetch and cache covers into `site/public/covers`:

```bash
npm run covers
```

2. Re-fetch everything if you want to refresh or repair a bad match:

```bash
npm run covers -- --refresh
```

Optional controls:

- `COVER_CONCURRENCY=4` to tune parallel requests.
- `--limit=10` to fetch only the first 10 books.
- Add `isbn`, `open_library_id`, or `cover_url` to `Book Metadata.md` for better matches or manual overrides.

Auto mode runs during `npm run build` on Vercel. Set `COVER_FETCH=1` to run auto mode locally.

## Supabase Auth

- Enable Email/Password auth in Supabase Auth settings.
- The app uses row-level security so only the logged-in user can read/write status rows.

## Vercel Deployment

- Import this repo into Vercel.
- Set environment variables from `.env` and optionally the service role keys for sync.
- Build command: `npm run build`.
- Output: `dist`.
