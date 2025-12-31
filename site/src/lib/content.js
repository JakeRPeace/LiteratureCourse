import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "./slug.js";

const projectRoot = fileURLToPath(new URL("../../../", import.meta.url));

const markdownModules = import.meta.glob("../../**/*.md", { eager: true });

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
      const guides = listMarkdownFiles(bookPath)
        .map((entry) => entry.name)
        .filter((fileName) => fileName !== "Book Metadata.md")
        .sort()
        .map((fileName) => {
          const filePath = path.join(bookPath, fileName);
          const module = getMarkdownModule(filePath);
          return {
            title: fileName.replace(/\.md$/, ""),
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
        slug: slugify(`${courseId}-${bookDirName}`),
        path: bookPath,
        metadata: metadataModule ? { filePath: metadataPath, module: metadataModule } : null,
        guides
      };
    });
    });

    const readmePath = path.join(coursePath, "README.md");
    const readmeModule = fs.existsSync(readmePath)
      ? getMarkdownModule(readmePath)
      : null;

    return {
      id: courseId,
      title: courseTitleFromId(courseId),
      slug: slugify(courseId),
      path: coursePath,
      syllabus: syllabus ? { filePath: syllabus, module: getMarkdownModule(syllabus) } : null,
      index: index ? { filePath: index, module: getMarkdownModule(index) } : null,
      readme: readmeModule ? { filePath: readmePath, module: readmeModule } : null,
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
