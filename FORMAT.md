# Content Formatting Standard

This repository uses a simple frontmatter convention to keep parsing predictable and future-proof.

## Required frontmatter blocks

### Course documents

Applies to course `README.md`, `X0 Management/XX.00 Index.md`, and `X0 Management/XX.01 Syllabus.md`.

```yaml
---
type: course_doc
course_id: 10-19
course_title: Great Literature 101 - Modern Literature
doc_type: syllabus
---
```

Allowed `doc_type`: `readme`, `index`, `syllabus`.

### Book metadata

Create a `Book Metadata.md` file inside each book folder.

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

`published` and `genre` are optional.

### Book guides

Applies to `01 Pre-Reading Guide.md`, `02 Chapter-by-Chapter Notes.md`, `03 Post-Reading Analysis.md`.

```yaml
---
type: book_guide
course_id: 10-19
book_id: 11.01
guide_type: pre_reading
---
```

Allowed `guide_type`: `pre_reading`, `notes`, `post_reading`.

## Content rules

- Keep titles in Title Case.
- Do not remove the Johnny.Decimal numbering in file and folder names.
- Use short, directive headings in guides and favor bullet lists.
- Validation is enforced by `site/scripts/validate-content.mjs` and runs on build.
