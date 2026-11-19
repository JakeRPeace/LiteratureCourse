# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary reader is a person working through a private, curated literature canon on their own time (inferred from the course structure, progress tracking, and guest/account sign-in). They open the library to choose a course, pick up a book, read its study guide, and mark where they left off. There is no social or classroom audience in the product.

## Product Purpose

Literature Course Library is a private shelf for a structured reading canon. It publishes Johnny.Decimal literature courses (syllabus, overview, and per-book pre-reading, chapter notes, and post-reading analysis) and lets a signed-in reader track each book as not started, in progress, or read, with an optional score. Success is a reader who can find the next book and return to their place without the shelf feeling like a dashboard.

## Positioning

A personal reading room for one curated canon with scholarly guides written beside the books. Neighboring products are public course platforms, social reading apps, or a folder of markdown files. This one keeps the canon, the guides, and the reader's own status in the same shelf.

## Operating Context

Courses and books are authored as markdown in this repository, validated, and synced to Supabase. The site at https://lit.peaces.lol/ is an Astro app. Readers sign in with email and password or a shared guest account, then browse courses, open a book, read a guide, and update status. An optional chat draft can outline a private three-book course. Docs and deploy pages are maintainer notes, not reader curriculum.

## Capabilities and Constraints

- Browse system courses, books, covers, and study guides. User-created courses have parallel pages.
- Reading status and scores persist in Supabase per signed-in user.
- Client-side route guard sends unsigned visitors to the login page. Pages are still prerendered.
- Cover art comes from a stored map, with an authenticated Open Library lookup for gaps.
- Course chat requires a signed-in user and an AI gateway key, and returns exactly three real books.
- Content voice for the guides is graduate and scholarly. Interface chrome should not talk like a deploy log.
- Undecided: whether the catalog should be readable before sign-in. The current guard stays as-is.

## Brand Commitments

The name is Literature Course Library. The owner asked that the interface feel warm, as if you are in your favorite library or an independent bookstore. That warmth is binding. No logo file is currently in the repo.

## Evidence on Hand

- Course markdown under the Johnny.Decimal course folders, with real titles, authors, and study guides.
- Web app in `site/`, including layouts, pages, and client scripts.
- Live URL: https://lit.peaces.lol/
- Do not invent testimonials, enrollment numbers, prices, or reviews.

## Product Principles

- The book and the guide are the point; status is a bookmark, not a scoreboard.
- Catalog metadata should help a reader choose, then get out of the way of the prose.
- Maintainer machinery (sources, deploy, stack) stays quiet on reader surfaces.
- A return visit should feel like walking back into the same shop, not reloading a console.
- Warmth never costs the words: study guides stay readable for a long sitting.
- Taking a course or book should feel like lifting a volume from a real shelf, then get out of the way.

## Accessibility & Inclusion

Reader surfaces must keep body text at or above 4.5:1, preserve visible focus, and honor reduced motion. No additional formal standard was specified.
