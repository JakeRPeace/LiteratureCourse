# Literature Study Collection

A curated collection of literature courses organized with the Johnny.Decimal system, with an Astro + Supabase web app for browsing, progress tracking, and publishing.

## Project Layout

- Course materials live at the repo root (Johnny.Decimal structure).
- Templates and system resources live in `00-09 Templates and Resources/`.
- The web app lives in `site/` (Astro + Supabase + Vercel).

## Quick Start (Web App)

```bash
cd site
npm install
cp .env.example .env
npm run dev
```

Set these variables in `.env`:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

Run the database schema once in Supabase using `site/supabase/schema.sql`.

## Content Workflow (Summary)

1. Create or update course folders using Johnny.Decimal naming.
2. Add required frontmatter to all course docs and book materials (see `FORMAT.md`).
3. Update the course index and the master index.
4. Validate content:

```bash
cd site
npm run validate
```

## Build, Covers, and Sync

`npm run build` runs:

1. Content validation.
2. Cover fetching (auto mode).
3. Content sync to Supabase (auto mode).
4. Supabase verification (auto mode).
5. Astro build.

To enable sync/verify, set these **build-time** env vars (do not expose them in client-side code):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Without these, sync/verify will be skipped in auto mode.

## Documentation

- `FORMAT.md` — frontmatter and content rules.
- `DEPLOYMENT.md` — Vercel + Supabase setup.
- `site/WEBSITE.md` — local setup, covers, and sync workflows.
- `SUPABASE_MIGRATION_CHECKLIST.md` — Supabase-first verification.
- `00-09 Templates and Resources/README.md` — templates and system resources.
- `00-09 Templates and Resources/00 System Management/00.01 Course Creation Guide.md` — adding new courses.
