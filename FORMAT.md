# Content Formatting Standard

This repository uses a simple, strict frontmatter format so content can be validated, parsed, and synced to Supabase.

## Frontmatter Format

- Every content file starts with a frontmatter block delimited by `---` lines.
- Frontmatter is **flat** `key: value` pairs only (no nested YAML, no lists).
- Keep values single-line and avoid unescaped `:` characters.

Example:

```yaml
---
type: book_guide
course_id: 10-19
book_id: 11.01
guide_type: pre_reading
---
```

## Required Frontmatter

### Course Documents

Applies to course `README.md`, `X0 Management/XX.00 Index.md`, and `X0 Management/XX.01 Syllabus.md`.

Required fields:

- `type`: `course_doc`
- `course_id`: `10-19`
- `course_title`: `Great Literature 101 - Modern Literature`
- `doc_type`: `readme` | `index` | `syllabus`

Example:

```yaml
---
type: course_doc
course_id: 10-19
course_title: Great Literature 101 - Modern Literature
doc_type: syllabus
---
```

Optional fields:

- `course_summary` or `summary` (used for course cards and excerpts)

### Book Metadata

Create a `Book Metadata.md` file inside each book folder.

Required fields:

- `type`: `book`
- `course_id`: `10-19`
- `book_id`: `11.01`
- `book_title`: `The Old Man and the Sea`
- `author`: `Ernest Hemingway`

Example:

```yaml
---
type: book
course_id: 10-19
book_id: 11.01
book_title: The Old Man and the Sea
author: Ernest Hemingway
published: 1952
genre: Fiction
---
```

Optional fields (used for cover lookup or display):

- `published`
- `genre`
- `isbn`
- `open_library_id`
- `cover_url`

### Book Guides

Applies to `01 Pre-Reading Guide.md`, `02 Chapter-by-Chapter Notes.md`, `03 Post-Reading Analysis.md`.

Required fields:

- `type`: `book_guide`
- `course_id`: `10-19`
- `book_id`: `11.01`
- `guide_type`: `pre_reading` | `notes` | `post_reading`

Example:

```yaml
---
type: book_guide
course_id: 10-19
book_id: 11.01
guide_type: pre_reading
---
```

## File Naming Rules

- Keep Johnny.Decimal numbering in file and folder names.
- Use Title Case for course titles and document headings.
- Book folder names follow: `NN.NN Title - Author/`.
- Guides use the numbered template names (`01`, `02`, `03`).

## Validation

Frontmatter and structure are enforced by `site/scripts/validate-content.mjs`.
Run:

```bash
cd site
npm run validate
```

Fix validation errors before running sync or deploy.
