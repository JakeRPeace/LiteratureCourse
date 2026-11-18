---
description: Create a new study guide for a book
---

1. Ask for the course area (`10-19`, not `101`), the title, and the author.
2. Open the matching course folder, then the primary category (`11 Books`, or `31 Poetry Collections` for poetry).
3. Search `00-09 Templates and Resources/00 System Management/00.00 Master Index.md`. Skip a title that is already in another course unless the user wants it in both.
4. Use the next `NN.NN` number and create `NN.NN Title - Author/`.
5. Copy the three guides from `00-09 Templates and Resources/01 Study Guide Templates/` and `00-09 Templates and Resources/03 Book Templates/_TEMPLATE Book Metadata.md`. Remove the `_TEMPLATE ` prefix.
6. Set `course_id` and `book_id` in every frontmatter block. Keep frontmatter flat, as in `FORMAT.md`.
7. Update the course `README.md`, `N0.00 Index.md`, syllabus, and the matching list in `00.00 Master Index.md`.
8. From `site/`, run `npm run validate`.
