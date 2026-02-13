import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");

const courseDirRe = /^\d{2}-\d{2}\s+/;
const bookDirRe = /^(\d{2}\.\d{2})\s+/;

const requiredCourseDoc = [
  "type",
  "course_id",
  "course_title",
  "doc_type"
];

const requiredBookGuide = ["type", "course_id", "book_id", "guide_type"];
const requiredBookMeta = ["type", "course_id", "book_id", "book_title", "author"];

const allowedDocTypes = new Set(["readme", "index", "syllabus"]);
const allowedGuideTypes = new Set(["pre_reading", "notes", "post_reading"]);

const errors = [];
const skipCourseDirs = new Set(["00-09 Templates and Resources"]);

function parseFrontmatter(contents, filePath) {
  if (!contents.startsWith("---\n")) {
    errors.push(`${filePath}: missing frontmatter`);
    return null;
  }

  const end = contents.indexOf("\n---\n", 4);
  if (end === -1) {
    errors.push(`${filePath}: unterminated frontmatter`);
    return null;
  }

  const raw = contents.slice(4, end);
  const data = {};
  raw.split("\n").forEach((line) => {
    if (!line.trim()) return;
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) {
      errors.push(`${filePath}: invalid frontmatter line: ${line}`);
      return;
    }
    const key = match[1].trim();
    const value = match[2].trim();
    data[key] = value;
  });
  return data;
}

function validateRequired(fields, data, filePath) {
  for (const field of fields) {
    if (!data[field]) {
      errors.push(`${filePath}: missing ${field} in frontmatter`);
    }
  }
}

function validateCourseDoc(filePath, data) {
  validateRequired(requiredCourseDoc, data, filePath);
  if (data.doc_type && !allowedDocTypes.has(data.doc_type)) {
    errors.push(`${filePath}: invalid doc_type ${data.doc_type}`);
  }
}

function validateBookGuide(filePath, data) {
  validateRequired(requiredBookGuide, data, filePath);
  if (data.guide_type && !allowedGuideTypes.has(data.guide_type)) {
    errors.push(`${filePath}: invalid guide_type ${data.guide_type}`);
  }
}

function validateBookMeta(filePath, data) {
  validateRequired(requiredBookMeta, data, filePath);
}

function scanCourse(coursePath) {
  const courseName = path.basename(coursePath);
  const courseId = courseName.split(" ")[0];

  const readmePath = path.join(coursePath, "README.md");
  if (fs.existsSync(readmePath)) {
    const contents = fs.readFileSync(readmePath, "utf8");
    const data = parseFrontmatter(contents, readmePath);
    if (data) {
      validateCourseDoc(readmePath, data);
      if (data.course_id && data.course_id !== courseId) {
        errors.push(`${readmePath}: course_id does not match folder`);
      }
    }
  }

  const entries = fs.readdirSync(coursePath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const entryPath = path.join(coursePath, entry.name);

    if (/^\d{2}\sManagement$/.test(entry.name)) {
      const docs = fs.readdirSync(entryPath).filter((name) => name.endsWith(".md"));
      for (const doc of docs) {
        const docPath = path.join(entryPath, doc);
        const contents = fs.readFileSync(docPath, "utf8");
        const data = parseFrontmatter(contents, docPath);
        if (!data) continue;
        if (data.type !== "course_doc") {
          errors.push(`${docPath}: type must be course_doc`);
        }
        validateCourseDoc(docPath, data);
        if (data.course_id && data.course_id !== courseId) {
          errors.push(`${docPath}: course_id does not match folder`);
        }
      }
      continue;
    }

    if (!/^\d{2}\s+/.test(entry.name)) continue;

    const bookDirs = fs.readdirSync(entryPath, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const bookDir of bookDirs) {
      const bookMatch = bookDirRe.exec(bookDir.name);
      if (!bookMatch) continue;
      const bookId = bookMatch[1];
      const bookPath = path.join(entryPath, bookDir.name);

      const metaPath = path.join(bookPath, "Book Metadata.md");
      if (!fs.existsSync(metaPath)) {
        errors.push(`${metaPath}: missing Book Metadata.md`);
      } else {
        const contents = fs.readFileSync(metaPath, "utf8");
        const data = parseFrontmatter(contents, metaPath);
        if (data) {
          if (data.type !== "book") {
            errors.push(`${metaPath}: type must be book`);
          }
          validateBookMeta(metaPath, data);
          if (data.course_id && data.course_id !== courseId) {
            errors.push(`${metaPath}: course_id does not match folder`);
          }
          if (data.book_id && data.book_id !== bookId) {
            errors.push(`${metaPath}: book_id does not match folder`);
          }
        }
      }

      const guideFiles = fs
        .readdirSync(bookPath)
        .filter((name) => name.endsWith(".md") && name !== "Book Metadata.md");

      for (const guide of guideFiles) {
        const guidePath = path.join(bookPath, guide);
        const contents = fs.readFileSync(guidePath, "utf8");
        const data = parseFrontmatter(contents, guidePath);
        if (!data) continue;
        if (data.type !== "book_guide") {
          errors.push(`${guidePath}: type must be book_guide`);
        }
        validateBookGuide(guidePath, data);
        if (data.course_id && data.course_id !== courseId) {
          errors.push(`${guidePath}: course_id does not match folder`);
        }
        if (data.book_id && data.book_id !== bookId) {
          errors.push(`${guidePath}: book_id does not match folder`);
        }
      }
    }
  }
}

function main() {
  const entries = fs.readdirSync(repoRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!courseDirRe.test(entry.name)) continue;
    if (skipCourseDirs.has(entry.name)) continue;
    scanCourse(path.join(repoRoot, entry.name));
  }

  if (errors.length) {
    console.error("Content validation failed:\n" + errors.join("\n"));
    process.exit(1);
  }

  console.log("Content validation passed.");
}

main();
