---
description: Create a new study guide for a book
---

1. Ask the user for the **Course ID** (e.g., `101`) and the **Book Title**.
2. Locate the course directory corresponding to the Course ID (e.g., `10-19 Great Literature 101 - Modern Literature`).
3. Identify the "Books" directory within the course. This is typically numbered `11` (e.g., `11 Books`), but check for the specific `X1` or `X2` folder that contains books.
4. Scan the "Books" directory to determine the next available number for the new book folder (e.g., if `11.05` exists, the next is `11.06`).
5. Create a new directory for the book using the format `NN.NN Title` (e.g., `11.06 The Great Gatsby`).
6. Copy the standard study guide templates into this new directory.
   - Source: `00-09 Templates and Resources/01 Study Guide Templates/`
   - Files to copy:
     - `01 Pre-Reading Guide.md`
     - `02 Chapter-by-Chapter Notes.md`
     - `03 Post-Reading Analysis.md`
7. Create a `Book Metadata.md` file in the new directory if it doesn't exist in the templates, or ensure it's included.
8. **IMPORTANT**: Remind the user to update the **Master Index** in `00-09 Templates and Resources/00 System Management/00.00 Master Index.md` to include this new book.
