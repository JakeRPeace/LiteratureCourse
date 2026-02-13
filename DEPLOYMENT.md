# Deployment Guide (Vercel + Supabase)

The web app lives in `site/` and is deployed via Vercel. Supabase provides auth and the data tables for courses, books, and progress.

## Supabase Setup

1. Create a new Supabase project.
2. Enable **Email/Password** auth in Auth settings.
3. Open the SQL editor and run `site/supabase/schema.sql`.
4. Copy the project URL and anon key from **Settings → API**.

You will use these in `.env` locally and in Vercel environment variables:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

## Build-Time Sync Keys (Optional)

The build pipeline can sync markdown content to Supabase and verify it, but only if these build-time keys are present:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

If these keys are missing, sync and verification are skipped in auto mode. Do not expose the service role key in client-side code.

## Vercel Setup

1. Import this repo into Vercel.
2. Set the **Root Directory** to `site`.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Add env vars:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (optional for sync)
   - `SUPABASE_SERVICE_ROLE_KEY` (optional for sync)

## CI/CD Behavior

- Vercel builds on every push to the connected branch.
- The build runs validation, cover fetching, content sync, and Supabase verification before the Astro build.
- If validation fails, the build stops with file paths listed in the logs.

## Local Verification

```bash
cd site
npm run validate
npm run build
```

## Troubleshooting

- **Build fails on validation**: check the file path in the error and fix frontmatter values.
- **Auth issues**: confirm Email/Password auth is enabled and your anon key matches the project.
- **Blank data in UI**: confirm you ran the schema and that RLS is enabled (the schema does this).
- **Sync skipped**: ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in the build environment.
