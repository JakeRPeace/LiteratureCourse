# Supabase Migration Verification Checklist

Use this to confirm system content is Supabase-first with markdown fallback retained.

## Setup
- Ensure `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` are set in `site/.env`.
- Restart the dev server after changing env vars.

## Supabase-first checks (happy path)
- Home (`/`): Course cards show Supabase pills when Supabase is available.
- Home (`/`): Hero progress cards display course titles from Supabase (not markdown).
- Course detail (`/course/{slug}`): Course materials and books show Supabase pills.
- Course doc (`/course/{slug}/{doc}`): Doc page shows Supabase pill and renders Supabase content.
- Book detail (`/book/{slug}`): Book pill shows Supabase; guide cards show Supabase.
- Book guide (`/book/{slug}/{guide}`): Guide page shows Supabase pill and renders Supabase content.
- User pages (`/course/user`, `/book/user`, `/course/user/doc`, `/book/user/guide`):
  - Header course switcher includes system courses from Supabase.
  - User pills remain “User”.
- Book switcher (`/book/{slug}`): List shows Supabase course books when available.

## Fallback checks (markdown)
- Temporarily unset Supabase env vars or point to an empty project.
- Repeat the pages above; pills should flip to “Markdown”.
- Verify markdown content renders correctly for docs/guides.

## Routing sanity
- Course and book slugs resolve when Supabase is available.
- Slugs still resolve with only markdown present.

## Notes
- If any page shows “Markdown” while Supabase data exists, inspect Supabase queries and source pills.
- If any page fails to render, confirm the corresponding markdown file exists to support fallback.
