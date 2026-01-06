import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "../src/lib/slug.js";

const args = new Set(process.argv.slice(2));
const isAuto = args.has("--auto");
const showSamples = args.has("--samples");

const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  const message =
    "Supabase URL or service role key missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.";
  if (isAuto) {
    console.log(`${message} Skipping verification.`);
    process.exit(0);
  }
  console.error(message);
  process.exit(1);
}

const repoRoot = path.resolve(process.cwd(), "..");

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

function courseTypeFromTitle(title) {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : title;
}

function docTypeFromFilename(filePath) {
  const name = path.basename(filePath).toLowerCase();
  if (name === "readme.md") return "readme";
  if (name.includes("syllabus")) return "syllabus";
  if (name.includes("index")) return "index";
  return "";
}

function chunkIds(ids, size = 500) {
  const chunks = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}

const local = {
  courses: [],
  courseIds: [],
  courseCategories: 0,
  courseDocs: 0,
  books: 0,
  bookIds: [],
  bookGuides: 0
};

const courseDirs = listDirectories(repoRoot)
  .filter((dir) => /^\d{2}-\d{2}\s+/.test(dir.name))
  .filter((dir) => dir.name !== "00-09 Templates and Resources")
  .map((dir) => dir.name)
  .sort();

for (const courseId of courseDirs) {
  const coursePath = path.join(repoRoot, courseId);
  const title = courseTitleFromId(courseId);
  const readmePath = path.join(coursePath, "README.md");
  const readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : "";
  const readmeFrontmatter = readmeContent ? parseFrontmatter(readmeContent).data : {};
  const summary =
    readmeFrontmatter.course_summary ||
    readmeFrontmatter.summary ||
    (readmeContent ? extractExcerpt(readmeContent, 140) : "");

  local.courses.push({
    course_id: courseId,
    title,
    course_type: courseTypeFromTitle(title),
    summary,
    slug: slugify(courseId)
  });
  local.courseIds.push(courseId);

  const managementDir = listDirectories(coursePath).find((dir) =>
    /^\d{2}\sManagement$/.test(dir.name)
  );
  const managementPath = managementDir
    ? path.join(coursePath, managementDir.name)
    : null;

  if (fs.existsSync(readmePath) && docTypeFromFilename(readmePath)) {
    local.courseDocs += 1;
  }

  if (managementPath && fs.existsSync(managementPath)) {
    const managementFiles = listMarkdownFiles(managementPath).map((entry) =>
      path.join(managementPath, entry.name)
    );
    for (const filePath of managementFiles) {
      if (docTypeFromFilename(filePath)) {
        local.courseDocs += 1;
      }
    }
  }

  const categories = listDirectories(coursePath)
    .filter((dir) => /^\d{2}\s+/.test(dir.name))
    .filter((dir) => !/^\d{2}\sManagement$/.test(dir.name));

  for (const category of categories) {
    local.courseCategories += 1;
    const categoryPath = path.join(coursePath, category.name);
    const bookDirs = listDirectories(categoryPath)
      .filter((dir) => /^\d{2}\.\d{2}\s+/.test(dir.name))
      .map((dir) => dir.name)
      .sort();

    for (const bookDirName of bookDirs) {
      local.books += 1;
      const bookId = path.posix.join(courseId, bookDirName);
      local.bookIds.push(bookId);
      const bookPath = path.join(categoryPath, bookDirName);
      const guideFiles = listMarkdownFiles(bookPath)
        .map((entry) => entry.name)
        .filter((fileName) => fileName !== "Book Metadata.md")
        .sort();
      for (const guideFile of guideFiles) {
        const guidePath = path.join(bookPath, guideFile);
        const content = fs.readFileSync(guidePath, "utf8");
        const guideType = parseFrontmatter(content).data.guide_type;
        if (guideType) {
          local.bookGuides += 1;
        }
      }
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function countByIds(table, column, ids) {
  if (!ids.length) return 0;
  let total = 0;
  for (const chunk of chunkIds(ids)) {
    const { count, error } = await supabase
      .from(table)
      .select(column, { count: "exact", head: true })
      .in(column, chunk);
    if (error) throw new Error(`${table} count failed: ${error.message}`);
    total += count || 0;
  }
  return total;
}

async function run() {
  const { data: dbCourses, error: courseError } = await supabase
    .from("courses")
    .select("course_id, title, course_type, summary, slug")
    .eq("source", "system");
  if (courseError) throw new Error(`courses fetch failed: ${courseError.message}`);

  const dbCourseIds = new Set(dbCourses.map((course) => course.course_id));
  const localCourseIds = new Set(local.courseIds);

  const missingCourses = local.courseIds.filter((id) => !dbCourseIds.has(id));
  const extraCourses = dbCourses
    .map((course) => course.course_id)
    .filter((id) => !localCourseIds.has(id));

  let hasMismatch = false;

  if (missingCourses.length) {
    console.log(`Missing courses in Supabase: ${missingCourses.join(", ")}`);
    hasMismatch = true;
  }
  if (extraCourses.length) {
    console.log(`Extra courses in Supabase: ${extraCourses.join(", ")}`);
    hasMismatch = true;
  }

  const expectedCourses = local.courses.length;
  const actualCourses = dbCourses.length;
  if (expectedCourses !== actualCourses) {
    console.log(`Mismatch courses count: expected ${expectedCourses}, got ${actualCourses}`);
    hasMismatch = true;
  } else {
    console.log(`OK courses count: ${actualCourses}`);
  }

  const courseCategoryCount = await countByIds("course_categories", "course_id", local.courseIds);
  const courseDocCount = await countByIds("course_docs", "course_id", local.courseIds);
  const bookCount = await countByIds("books", "course_id", local.courseIds);
  const guideCount = await countByIds("book_guides", "book_id", local.bookIds);

  if (courseCategoryCount !== local.courseCategories) {
    console.log(
      `Mismatch categories count: expected ${local.courseCategories}, got ${courseCategoryCount}`
    );
    hasMismatch = true;
  } else {
    console.log(`OK categories count: ${courseCategoryCount}`);
  }

  if (courseDocCount !== local.courseDocs) {
    console.log(`Mismatch course docs count: expected ${local.courseDocs}, got ${courseDocCount}`);
    hasMismatch = true;
  } else {
    console.log(`OK course docs count: ${courseDocCount}`);
  }

  if (bookCount !== local.books) {
    console.log(`Mismatch books count: expected ${local.books}, got ${bookCount}`);
    hasMismatch = true;
  } else {
    console.log(`OK books count: ${bookCount}`);
  }

  if (guideCount !== local.bookGuides) {
    console.log(`Mismatch guides count: expected ${local.bookGuides}, got ${guideCount}`);
    hasMismatch = true;
  } else {
    console.log(`OK guides count: ${guideCount}`);
  }

  const mismatchedFields = [];
  for (const localCourse of local.courses) {
    const dbCourse = dbCourses.find((course) => course.course_id === localCourse.course_id);
    if (!dbCourse) continue;
    const mismatches = [];
    if (dbCourse.title !== localCourse.title) mismatches.push("title");
    if (dbCourse.course_type !== localCourse.course_type) mismatches.push("course_type");
    if (dbCourse.slug !== localCourse.slug) mismatches.push("slug");
    if (localCourse.summary && dbCourse.summary !== localCourse.summary) {
      mismatches.push("summary");
    }
    if (mismatches.length) {
      mismatchedFields.push({
        course_id: localCourse.course_id,
        fields: mismatches.join(", ")
      });
    }
  }

  if (mismatchedFields.length) {
    console.log("Course field mismatches:");
    mismatchedFields.forEach((entry) => {
      console.log(`- ${entry.course_id}: ${entry.fields}`);
    });
    hasMismatch = true;
  }

  if (showSamples) {
    const sampleCourses = dbCourses.slice(0, 3);
    console.log("Sample courses:");
    sampleCourses.forEach((course) => {
      console.log(`- ${course.course_id}: ${course.title} (${course.course_type})`);
    });
  }

  if (hasMismatch) {
    process.exit(1);
  }

  console.log("Verification complete: no mismatches found.");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
