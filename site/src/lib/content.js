import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "./slug.js";
import coverMap from "../data/cover-map.json";

const projectRoot = fileURLToPath(new URL("../../../", import.meta.url));

const markdownModules = import.meta.glob("../../../**/*.md", { eager: true });

const ignoredRoots = ["/node_modules/", "/dist/", "/.git/", "/src/", "/site/"];
const filteredMarkdownModules = Object.fromEntries(
  Object.entries(markdownModules).filter(([filePath]) => {
    return !ignoredRoots.some((segment) => filePath.includes(segment));
  })
);

const markdownByFile = new Map(
  Object.values(filteredMarkdownModules)
    .filter((module) => module && module.file)
    .map((module) => [path.normalize(module.file), module])
);

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

function stripFrontmatter(contents) {
  if (!contents.startsWith("---\n")) return contents;
  const end = contents.indexOf("\n---\n", 4);
  if (end === -1) return contents;
  return contents.slice(end + 5);
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
  const body = stripFrontmatter(contents).trim();
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

function buildCourseDoc(filePath) {
  if (!filePath) return null;
  const module = getMarkdownModule(filePath);
  if (!module) return null;
  const docType = module?.frontmatter?.doc_type || "";
  const baseTitle = path.basename(filePath, ".md");
  const displayTitle = baseTitle.replace(/^\d+\.\d+\s+/, "");
  const meta = courseDocMeta[docType] || {};
  const rawContent =
    typeof module?.rawContent === "string"
      ? module.rawContent
      : fs.readFileSync(filePath, "utf8");
  return {
    title: baseTitle,
    displayTitle,
    slug: slugify(docType || displayTitle),
    docType,
    label: meta.label || displayTitle,
    stage: meta.stage || "Course material",
    excerpt: extractExcerpt(rawContent),
    filePath,
    module
  };
}

function getMarkdownModule(filePath) {
  return markdownByFile.get(path.normalize(filePath));
}

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

function courseTitleFromId(courseId) {
  return courseId.replace(/^\d{2}-\d{2}\s+/, "");
}

function bookTitleFromDir(bookDirName) {
  return bookDirName.replace(/^\d{2}\.\d{2}\s+/, "");
}

let cachedCourses = null;

export function getCourses() {
  if (cachedCourses) return cachedCourses;

  const courseDirs = listDirectories(projectRoot)
    .filter((dir) => /^\d{2}-\d{2}\s+/.test(dir.name))
    .filter((dir) => dir.name !== "00-09 Templates and Resources")
    .map((dir) => dir.name)
    .sort();

  cachedCourses = courseDirs.map((courseId) => {
    const coursePath = path.join(projectRoot, courseId);
    const managementDir = listDirectories(coursePath).find((dir) =>
      /^\d{2}\sManagement$/.test(dir.name)
    );
    const managementPath = managementDir
      ? path.join(coursePath, managementDir.name)
      : null;

    let syllabus = null;
    let index = null;
    if (managementPath) {
      const managementFiles = listMarkdownFiles(managementPath).map((entry) =>
        path.join(managementPath, entry.name)
      );
      syllabus = managementFiles.find((filePath) =>
        /\.01\sSyllabus\.md$/.test(filePath)
      );
      index = managementFiles.find((filePath) =>
        /\.00\sIndex\.md$/.test(filePath)
      );
    }

    const categories = listDirectories(coursePath)
      .filter((dir) => /^\d{2}\s+/.test(dir.name))
      .filter((dir) => !/^\d{2}\sManagement$/.test(dir.name));

    const books = categories.flatMap((category) => {
      const categoryPath = path.join(coursePath, category.name);
      const bookDirs = listDirectories(categoryPath)
        .filter((dir) => /^\d{2}\.\d{2}\s+/.test(dir.name))
        .map((dir) => dir.name)
        .sort();

      return bookDirs.map((bookDirName) => {
        const bookPath = path.join(categoryPath, bookDirName);
        const metadataPath = path.join(bookPath, "Book Metadata.md");
        const metadataModule = fs.existsSync(metadataPath)
          ? getMarkdownModule(metadataPath)
          : null;
        const metadata = metadataModule?.frontmatter || {};
        const slug = slugify(`${courseId}-${bookDirName}`);
        const coverEntry = coverLookup[slug];
        const guides = listMarkdownFiles(bookPath)
          .map((entry) => entry.name)
          .filter((fileName) => fileName !== "Book Metadata.md")
          .sort()
          .map((fileName) => {
            const filePath = path.join(bookPath, fileName);
            const module = getMarkdownModule(filePath);
            const baseTitle = fileName.replace(/\.md$/, "");
            const displayTitle = baseTitle.replace(/^\d+\s+/, "");
            const guideType = module?.frontmatter?.guide_type || "";
            const typeMeta = guideTypeMeta[guideType] || {};
            const rawContent =
              typeof module?.rawContent === "string"
                ? module.rawContent
                : fs.readFileSync(filePath, "utf8");
            const excerpt = extractExcerpt(rawContent);
            const orderMatch = baseTitle.match(/^(\d+)\s+/);
            return {
              title: baseTitle,
              displayTitle,
              slug: slugify(baseTitle),
              order: orderMatch ? orderMatch[1] : null,
              guideType,
              label: typeMeta.label || displayTitle,
              stage: typeMeta.stage || "Reading guide",
              excerpt,
              filePath,
              module
            };
          });

        return {
          id: path.join(courseId, bookDirName),
          courseId,
          courseSlug: slugify(courseId),
          category: category.name,
          title: metadata.book_title || bookTitleFromDir(bookDirName),
          author: metadata.author || "",
          slug,
          path: bookPath,
          coverUrl: coverEntry?.url || null,
          coverSource: coverEntry?.source || null,
          coverSourceId: coverEntry?.sourceId || null,
          metadata: metadataModule ? { filePath: metadataPath, module: metadataModule } : null,
          guides
        };
      });
    });

    const readmePath = path.join(coursePath, "README.md");
    const readmeModule = fs.existsSync(readmePath)
      ? getMarkdownModule(readmePath)
      : null;
    const courseDocs = [
      buildCourseDoc(readmePath),
      buildCourseDoc(syllabus),
      buildCourseDoc(index)
    ].filter(Boolean);

    return {
      id: courseId,
      title: courseTitleFromId(courseId),
      slug: slugify(courseId),
      path: coursePath,
      syllabus: syllabus ? { filePath: syllabus, module: getMarkdownModule(syllabus) } : null,
      index: index ? { filePath: index, module: getMarkdownModule(index) } : null,
      readme: readmeModule ? { filePath: readmePath, module: readmeModule } : null,
      docs: courseDocs,
      books
    };
  });

  return cachedCourses;
}

export function getCourseBySlug(slug) {
  return getCourses().find((course) => course.slug === slug) || null;
}

export function getBookBySlug(slug) {
  for (const course of getCourses()) {
    const match = course.books.find((book) => book.slug === slug);
    if (match) return match;
  }
  return null;
}
