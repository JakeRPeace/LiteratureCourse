# Literature Study Collection

A curated set of literature courses organized with the Johnny.Decimal system, now paired with a web app for browsing and progress tracking.

## What This Repo Contains

- Course materials in the root (Johnny.Decimal structure)
- A web app in `site/` (Astro + Supabase + Vercel)
- Templates and formatting rules for consistent content parsing
- Unit tests in `site/tests`

## Web App Quickstart

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

## Content Rules (Required)

All course and book documents must include frontmatter per `FORMAT.md`.

Validation runs on build:

```bash
cd site
npm run validate
```

## Where Things Live

- Courses: top-level folders like `10-19 Great Literature 101 - Modern Literature`
- Book metadata: `Book Metadata.md` inside each book folder
- Guide templates: `00-09 Templates and Resources/01 Study Guide Templates`
- Course templates: `00-09 Templates and Resources/02 Course Templates`
- Book templates: `00-09 Templates and Resources/03 Book Templates`
- Web app: `site/`

## Deployment (Vercel + Supabase)

See `DEPLOYMENT.md` for step-by-step setup and CI/CD notes.
