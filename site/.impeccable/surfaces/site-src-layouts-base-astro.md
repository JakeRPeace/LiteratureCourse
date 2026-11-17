---
version: 1
slug: "site-src-layouts-base-astro"
primary_target: "site/src/layouts/Base.astro"
related_targets: ["site/src/pages/index.astro","site/src/pages/login.astro","site/src/pages/book/[slug].astro","site/src/pages/book/[slug]/[guide].astro"]
---

# Library shell

Scope: shared shell and the home, course, book, guide, and login surfaces.
Mode: operate. Guides are read inside this shell, not a separate world.

Audience: a reader returning to a private canon to choose a book, read its guide, and mark a place.
Job: find the next book and keep status. Action: open a course row. Content: real courses, covers, and guides already in the repo.
Constraint: standard web controls, client scripts and class hooks stay working, sign-in behavior unchanged.

## Direction contract

THESIS: The shelf is a private ledger of a real canon. It refuses the dark glass dashboard and the floating pill.

OWN-WORLD: Bone paper #f4efe4, a full-bleed library-green #24352f header, iron ink #241e16, vermilion #9d3428 for the place-mark and the primary button, brass #8d6a32 for focus. Spectral for titles and prose, Karla for chrome. Flat color, no glass.

STORY: The reader sees the library name, a few real progress lines, and the shelf. They open a course, then a book, then a guide in a reading measure. Status is a steady stamp.

FIRST VIEWPORT: Full-bleed green header with the wordmark, Courses, Docs, Deploy, and sign-in. On the paper, a Spectral title and one sentence, three progress lines with real counts, then the course list: cover, title, summary, book count, status. The row is the link.

FORM: Private ledger, sixth on the grounded list, seed 0439888b. Signature move: hover or focus lifts the cover fan and draws one vermilion rule under the title.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
