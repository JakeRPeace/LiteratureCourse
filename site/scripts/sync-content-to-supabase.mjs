import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "../src/lib/slug.js";

const args = new Set(process.argv.slice(2));
const isAuto = args.has("--auto");
const isDryRun = args.has("--dry-run");
const skipDelete = args.has("--no-delete");

const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  const message =
    "Supabase URL or service role key missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.";
  if (isAuto) {
    console.log(`${message} Skipping sync.`);
    process.exit(0);
  }
  console.error(message);
  process.exit(1);
}

const repoRoot = path.resolve(process.cwd(), "..");
const coverMapPath = path.join(repoRoot, "site", "src", "data", "cover-map.json");
const coverMap = fs.existsSync(coverMapPath)
  ? JSON.parse(fs.readFileSync(coverMapPath, "utf8"))
  : {};
const coverLookup = coverMap?.covers || {};

const guideTypeMeta = {
  pre_reading: {
    label: "Pre-Reading Guide",
    stage: "Before you read"
  },
  notes: {
    label: "Chapter-by-Chapter Notes",
    stage: "During reading"
  },
  post_reading: {
    label: "Post-Reading Analysis",
    stage: "After you read"
  }
};

const courseDocMeta = {
  readme: {
    label: "Overview",
    stage: "Course snapshot"
  },
  syllabus: {
    label: "Syllabus",
    stage: "Schedule and goals"
  },
  index: {
    label: "Index",
    stage: "Quick links"
  }
};

function listDirectories(targetPath) {
  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
}

function listMarkdownFiles(targetPath) {
  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"));
}

function parseFrontmatter(contents) {
  if (!contents.startsWith("---\n")) {
    return { data: {}, body: contents };
  }
  const end = contents.indexOf("\n---\n", 4);
  if (end === -1) {
    return { data: {}, body: contents };
  }
  const raw = contents.slice(4, end);
  const data = {};
  raw.split("\n").forEach((line) => {
    if (!line.trim()) return;
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].trim();
    data[key] = value;
  });
  return { data, body: contents.slice(end + 5) };
}

function stripMarkdown(text) {
  return text
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractExcerpt(contents, maxLength = 220) {
  const body = parseFrontmatter(contents).body.trim();
  if (!body) return "";
  const blocks = body.split(/\n\s*\n/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (/^#{1,6}\s/.test(trimmed)) continue;
    if (/^[-*_]{3,}\s*$/.test(trimmed)) continue;
    const text = stripMarkdown(trimmed);
    if (!text) continue;
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
  }
  return "";
}

function courseTitleFromId(courseId) {
  return courseId.replace(/^\d{2}-\d{2}\s+/, "");
}

function bookTitleFromDir(bookDirName) {
  return bookDirName.replace(/^\d{2}\.\d{2}\s+/, "");
}

function courseTypeFromTitle(title) {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : title;
}

function chunkRows(rows, size = 500) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
}

function readMarkdown(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function docTypeFromFilename(filePath) {
  const name = path.basename(filePath).toLowerCase();
  if (name === "readme.md") return "readme";
  if (name.includes("syllabus")) return "syllabus";
  if (name.includes("index")) return "index";
  return "";
}

function buildCourseDoc(courseId, filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const content = readMarkdown(filePath);
  const { data } = parseFrontmatter(content);
  const baseTitle = path.basename(filePath, ".md");
  const displayTitle = baseTitle.replace(/^\d+\.\d+\s+/, "");
  const docType = data.doc_type || docTypeFromFilename(filePath);
  if (!docType) return null;
  const meta = courseDocMeta[docType] || {};
  const orderMatch = baseTitle.match(/^(\d+)\.(\d+)\s+/);
  const sortOrder = orderMatch
    ? parseInt(`${orderMatch[1]}${orderMatch[2]}`, 10)
    : docType === "readme"
      ? 0
      : null;
  return {
    course_id: courseId,
    doc_type: docType,
    label: meta.label || displayTitle,
    stage: meta.stage || "Course material",
    slug: slugify(docType || displayTitle),
    content_md: content,
    excerpt: extractExcerpt(content),
    sort_order: sortOrder
  };
}

function buildGuideEntry(bookId, fileName, filePath) {
  const content = readMarkdown(filePath);
  const { data } = parseFrontmatter(content);
  const guideType = data.guide_type;
  if (!guideType) return null;
  const baseTitle = fileName.replace(/\.md$/, "");
  const displayTitle = baseTitle.replace(/^\d+\s+/, "");
  const typeMeta = guideTypeMeta[guideType] || {};
  const orderMatch = baseTitle.match(/^(\d+)\s+/);
  return {
    book_id: bookId,
    guide_type: guideType,
    label: typeMeta.label || displayTitle,
    stage: typeMeta.stage || "Reading guide",
    slug: slugify(baseTitle),
    content_md: content,
    excerpt: extractExcerpt(content),
    sort_order: orderMatch ? parseInt(orderMatch[1], 10) : null
  };
}

function buildCategoryEntry(courseId, categoryName) {
  const match = categoryName.match(/^(\d{2})\s+/);
  return {
    course_id: courseId,
    name: categoryName,
    sort_order: match ? parseInt(match[1], 10) : null
  };
}

function buildBookEntry(courseId, categoryName, bookDirName) {
  const bookPath = path.join(repoRoot, courseId, categoryName, bookDirName);
  const metadataPath = path.join(bookPath, "Book Metadata.md");
  const metadataContent = fs.existsSync(metadataPath)
    ? readMarkdown(metadataPath)
    : "";
  const metadata = metadataContent ? parseFrontmatter(metadataContent).data : {};
  const bookTitle = metadata.book_title || bookTitleFromDir(bookDirName);
  const slug = slugify(`${courseId}-${bookDirName}`);
  const coverEntry = coverLookup[slug];
  const orderMatch = bookDirName.match(/^(\d{2}\.\d{2})\s+/);
  const sortOrder = orderMatch ? parseInt(orderMatch[1].replace(".", ""), 10) : null;
  return {
    book_id: path.posix.join(courseId, bookDirName),
    course_id: courseId,
    category: categoryName,
    title: bookTitle,
    author: metadata.author || "",
    slug,
    cover_url: coverEntry?.url || null,
    cover_source: coverEntry?.source || null,
    cover_source_id: coverEntry?.sourceId || null,
    sort_order: sortOrder
  };
}

const courses = [];
const courseCategories = [];
const courseDocs = [];
const books = [];
const bookGuides = [];

const courseDirs = listDirectories(repoRoot)
  .filter((dir) => /^\d{2}-\d{2}\s+/.test(dir.name))
  .filter((dir) => dir.name !== "00-09 Templates and Resources")
  .map((dir) => dir.name)
  .sort();

for (const courseId of courseDirs) {
  const coursePath = path.join(repoRoot, courseId);
  const title = courseTitleFromId(courseId);
  const courseType = courseTypeFromTitle(title);

  const readmePath = path.join(coursePath, "README.md");
  const readmeContent = fs.existsSync(readmePath) ? readMarkdown(readmePath) : "";
  const readmeFrontmatter = readmeContent ? parseFrontmatter(readmeContent).data : {};
  const summary =
    readmeFrontmatter.course_summary ||
    readmeFrontmatter.summary ||
    (readmeContent ? extractExcerpt(readmeContent, 140) : "");

  courses.push({
    course_id: courseId,
    title,
    course_type: courseType,
    summary,
    slug: slugify(courseId),
    status: null,
    source: "system",
    owner_id: null
  });

  const managementDir = listDirectories(coursePath).find((dir) =>
    /^\d{2}\sManagement$/.test(dir.name)
  );
  const managementPath = managementDir
    ? path.join(coursePath, managementDir.name)
    : null;

  let syllabusPath = null;
  let indexPath = null;
  if (managementPath && fs.existsSync(managementPath)) {
    const managementFiles = listMarkdownFiles(managementPath).map((entry) =>
      path.join(managementPath, entry.name)
    );
    syllabusPath = managementFiles.find((filePath) =>
      /\.01\sSyllabus\.md$/.test(filePath)
    );
    indexPath = managementFiles.find((filePath) =>
      /\.00\sIndex\.md$/.test(filePath)
    );
  }

  [readmePath, syllabusPath, indexPath]
    .filter(Boolean)
    .forEach((docPath) => {
      const entry = buildCourseDoc(courseId, docPath);
      if (entry) courseDocs.push(entry);
    });

  const categories = listDirectories(coursePath)
    .filter((dir) => /^\d{2}\s+/.test(dir.name))
    .filter((dir) => !/^\d{2}\sManagement$/.test(dir.name));

  for (const category of categories) {
    courseCategories.push(buildCategoryEntry(courseId, category.name));
    const categoryPath = path.join(coursePath, category.name);
    const bookDirs = listDirectories(categoryPath)
      .filter((dir) => /^\d{2}\.\d{2}\s+/.test(dir.name))
      .map((dir) => dir.name)
      .sort();

    for (const bookDirName of bookDirs) {
      const bookEntry = buildBookEntry(courseId, category.name, bookDirName);
      books.push(bookEntry);
      const bookPath = path.join(categoryPath, bookDirName);
      const guideFiles = listMarkdownFiles(bookPath)
        .map((entry) => entry.name)
        .filter((fileName) => fileName !== "Book Metadata.md")
        .sort();
      for (const guideFile of guideFiles) {
        const guidePath = path.join(bookPath, guideFile);
        const guideEntry = buildGuideEntry(bookEntry.book_id, guideFile, guidePath);
        if (guideEntry) {
          bookGuides.push(guideEntry);
        }
      }
    }
  }
}

if (isDryRun) {
  console.log("Dry run only:");
  console.log(`Courses: ${courses.length}`);
  console.log(`Categories: ${courseCategories.length}`);
  console.log(`Course docs: ${courseDocs.length}`);
  console.log(`Books: ${books.length}`);
  console.log(`Book guides: ${bookGuides.length}`);
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function upsertRows(table, rows, onConflict) {
  if (!rows.length) return;
  for (const chunk of chunkRows(rows, 500)) {
    const { error } = await supabase
      .from(table)
      .upsert(chunk, onConflict ? { onConflict } : undefined);
    if (error) {
      throw new Error(`${table} upsert failed: ${error.message}`);
    }
  }
}

async function run() {
  if (!skipDelete) {
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("source", "system");
    if (error) {
      throw new Error(`Failed to delete system courses: ${error.message}`);
    }
  }

  await upsertRows("courses", courses, "course_id");
  await upsertRows("course_categories", courseCategories, "course_id,name");
  await upsertRows("course_docs", courseDocs, "course_id,doc_type");
  await upsertRows("books", books, "book_id");
  await upsertRows("book_guides", bookGuides, "book_id,guide_type");

  console.log(
    `Synced ${courses.length} courses, ${books.length} books, ${bookGuides.length} guides.`
  );
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
