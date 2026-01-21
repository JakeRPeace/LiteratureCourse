# Contributing

Thanks for improving the Literature Study Collection. This repo mixes content and a web app, so contributions may touch both.

## Content Contributions

1. Follow the Johnny.Decimal naming rules for folders and files.
2. Add required frontmatter to every course doc, book metadata file, and guide (see `FORMAT.md`).
3. Use Title Case for titles and headings.
4. Update indexes:
   - Course index: `[Area] Management/[Area].00 Index.md`
   - Master index: `00-09 Templates and Resources/00 System Management/00.00 Master Index.md`
5. Run validation before pushing:

```bash
cd site
npm run validate
```

## Web App Contributions

- The Astro app lives in `site/`.
- Run the dev server with `npm run dev`.
- Build locally with `npm run build` if you need to verify the full pipeline.

## Frontmatter Rules

Frontmatter is flat `key: value` pairs only. Lists and nested YAML are not supported by the current parsers. See `FORMAT.md` for examples and required fields.

## Commit Messages

Use short, descriptive, present-tense messages (for example: `add course index`, `fix cover sync`).

## What to Update When You Add Content

- Course `README.md` (if you add or change major items)
- Course index and syllabus (if the reading list changes)
- Master index (if a new course is added)
