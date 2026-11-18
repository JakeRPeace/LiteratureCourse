# Repository Guidelines

Johnny.Decimal course markdown at the repo root, and an Astro app in `site/` that reads it. Field lists and examples are in `FORMAT.md`. New-course steps are in `00-09 Templates and Resources/00 System Management/00.01 Course Creation Guide.md`.

## Layout

- A course folder is `NN-NN Great Literature NNN - Name`. `course_id` is the range prefix (`10-19`), not the course number (`101`).
- `00-09 Templates and Resources` holds templates and the master index. The site and the validator skip it.
- Inside a course: `N0 Management/` with `N0.00 Index.md` and `N0.01 Syllabus.md`, then category folders `NN Name`. Primary texts are usually `N1 Books/`. Poetry uses `31 Poetry Collections/`.
- Each text is a folder `NN.NN Title - Author/` containing `Book Metadata.md`, `01 Pre-Reading Guide.md`, `02 Chapter-by-Chapter Notes.md`, and `03 Post-Reading Analysis.md`. There is no `02 Notes` directory.
- Copy templates from `00-09 Templates and Resources/`, then remove the `_TEMPLATE ` prefix. Templates ship with `course_id: 10-19` and `book_id: 11.01`; change both.

## Frontmatter

The validator is not a YAML parser. It accepts only flat `key: value` lines between `---` fences. Astro then parses the same block as YAML, so quote any value that contains a colon. No nested keys and no lists. An empty required value fails validation.

- Course `README.md`, index, and syllabus: `type: course_doc`. `doc_type` is `readme`, `index`, or `syllabus`. `course_id` must equal the course folder prefix.
- `Book Metadata.md`: `type: book`, plus `book_title` and `author`. `book_id` must equal the folder prefix (`11.01`). The displayed author comes from this field. Optional cover keys are `isbn`, `open_library_id`, and `cover_url`.
- Every other markdown file in a book folder must be `type: book_guide` with `guide_type` of `pre_reading`, `notes`, or `post_reading`.

When a reading list changes, update that course's `README.md`, index, syllabus, and the matching list in `00.00 Master Index.md`. Leave the root `README.md` alone unless the project overview changes. Search the master index before adding a title. Reading-list status marks are `✅ *Completed*`, `🔵 *Reading*`, and `⚪ *Not Started*`.

Guides follow `00-09 Templates and Resources/01 Study Guide Templates/STUDY GUIDE STRUCTURE.md`. Write at graduate level: technique, context, and criticism.

## Commands

Run these from `site/` with Node 18+. The validator treats the parent of the current directory as the repo, so it checks the wrong tree from anywhere else.

- `npm install`, then copy `.env.example` to `.env` for local auth and progress.
- `npm run dev` starts the app. Astro is server-rendered (`output: "server"`), not a static export.
- `npm run validate` after any content edit.
- `npm run test:run` runs Vitest once. `npm test` stays in watch mode.
- Do not use `npm run build` as a content check. It also fetches covers, syncs Supabase, verifies rows, builds, and patches the Vercel runtime. Cover fetch runs only when `VERCEL=1` or `COVER_FETCH=1`. Sync and verify do nothing unless `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.

## App

- Vercel root directory is `site`. Browser code reads `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`. The service role key is build-time only. Do not commit `.env` or put that key in client code.
- Page interactions live in `site/public/scripts/` and load as `/scripts/*.js`. `book-look.js` is also imported by Astro pages. Rendered markdown is sanitized, and emoji are stripped from headings.
- `POST /api/course-chat` requires `AI_GATEWAY_API_KEY` off Vercel. `AI_GATEWAY_MODEL` is optional and defaults to `google/gemini-2.5-flash-lite`. The route must return exactly three real books.
- The deployed app is https://lit.peaces.lol/.

## Commits

Short, present-tense messages (`add course index`, `fix cover sync`). Name the courses a change touches and link any index or syllabus you updated.
