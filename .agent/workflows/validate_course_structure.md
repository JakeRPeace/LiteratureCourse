---
description: Validate a course against Johnny.Decimal and frontmatter rules
---

1. Ask for the course directory.
2. Confirm `README.md`, an `N0 Management/` folder (`N0.00 Index.md`, `N0.01 Syllabus.md`), and category folders named `NN Name`.
3. Confirm each text folder is `NN.NN Title - Author/` and contains `Book Metadata.md` plus the three numbered guides.
4. From `site/`, run `npm run validate`. The script reads the parent of the current directory, so it only works there.
5. Report missing folders, frontmatter errors, and `course_id` or `book_id` mismatches.
