# Website Setup

This repo can be served as a static Astro site with Supabase-backed progress tracking.

## Prerequisites

- Node.js 18+
- A Supabase project
- A Vercel account

## Local setup

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

## Content validation

Run the validation script to enforce frontmatter and folder conventions:

```bash
npm run validate
```

## Book covers

The site can display local book cover images generated from Open Library.

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

On Vercel, `npm run build` now runs the cover fetcher automatically in auto mode.
Set `COVER_FETCH=1` if you want that auto step to run locally as well.

## Supabase auth

- Enable Email/Password auth in Supabase Auth settings.
- The app uses row-level security so only the logged-in user can read/write status rows.

## Vercel deployment

- Import this repo into Vercel.
- Set environment variables from `.env`.
- Build command: `npm run build`
- Output: `dist`
