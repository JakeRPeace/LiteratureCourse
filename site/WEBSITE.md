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

## Supabase auth

- Enable Email/Password auth in Supabase Auth settings.
- The app uses row-level security so only the logged-in user can read/write status rows.

## Vercel deployment

- Import this repo into Vercel.
- Set environment variables from `.env`.
- Build command: `npm run build`
- Output: `dist`
