---
description: Validate the structure of a course against Johnny.Decimal rules
---

1. Ask the user for the **Course Directory** path or name.
2. Verify that the directory exists.
3. Check for the existence of a **Management** folder.
   - It should follow the pattern `X0 Management` (e.g., `10 Management`, `20 Management`).
4. Check for the existence of a `README.md` file in the course root.
5. Check for content folders.
   - They should follow the pattern `X1` through `X9` (e.g., `11 Books`, `12 Essays`).
   - Ensure there are no "loose" files in the course root other than `README.md` (and potentially system files like `.DS_Store`).
6. Verify that the folder names follow the `NN Name` convention.
7. Report the results of the validation:
   - List any missing required folders (Management).
   - List any files that are in the wrong place.
   - Confirm if the structure looks correct.
