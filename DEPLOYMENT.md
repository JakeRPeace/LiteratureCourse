# Deployment Guide (Vercel + Supabase)

This app is built with Astro in `site/` and deployed via Vercel. Supabase provides auth and the `book_status` table.

## Supabase Setup

1. Create a new Supabase project.
2. Enable **Email/Password** auth in Auth settings.
3. Open the SQL editor and run `site/supabase/schema.sql`.
4. Copy the project URL and anon key from **Settings → API**.

You will use these in `.env` locally and in Vercel environment variables.

## Vercel Setup

1. Import this repo into Vercel.
2. Set the **Root Directory** to `site`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add env vars:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

## CI/CD Behavior

- Vercel automatically builds and deploys on every push to the connected branch.
- The build runs `npm run validate` before `astro build`.
- If content validation fails (missing frontmatter, mismatched IDs), the build will fail fast with file paths listed in the logs.

## Local Verification

```bash
cd site
npm run validate
npm run build
```

## Troubleshooting

- **Build fails on validation**: check the file path in the error and fix frontmatter values.
- **Auth issues**: ensure Email/Password is enabled and your anon key matches the project.
- **Blank data in UI**: confirm you ran the SQL schema and that RLS is enabled (the schema does this).
