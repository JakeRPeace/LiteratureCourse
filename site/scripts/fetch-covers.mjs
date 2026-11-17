import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { slugify } from "../src/lib/slug.js";

const repoRoot = path.resolve(process.cwd(), "..");
const siteRoot = process.cwd();

const courseDirRe = /^\d{2}-\d{2}\s+/;
const bookDirRe = /^(\d{2}\.\d{2})\s+/;
const skipCourseDirs = new Set(["00-09 Templates and Resources"]);

const args = process.argv.slice(2);
const auto = args.includes("--auto");
const refresh = args.includes("--refresh");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
const concurrency = Number(process.env.COVER_CONCURRENCY || "4");

const outputDir = path.join(siteRoot, "public/covers");
const mapPath = path.join(siteRoot, "src/data/cover-map.json");

if (auto) {
  const shouldRun = process.env.VERCEL === "1" || process.env.COVER_FETCH === "1";
  if (!shouldRun) {
    console.log(
      "Skipping cover fetch (auto mode). Set COVER_FETCH=1 to run locally."
    );
    process.exit(0);
  }
}

function parseFrontmatter(contents, filePath) {
  if (!contents.startsWith("---\n")) {
    console.warn(`${filePath}: missing frontmatter`);
    return null;
  }

  const end = contents.indexOf("\n---\n", 4);
  if (end === -1) {
    console.warn(`${filePath}: unterminated frontmatter`);
    return null;
  }

  const raw = contents.slice(4, end);
  const data = {};
  raw.split("\n").forEach((line) => {
    if (!line.trim()) return;
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) {
      console.warn(`${filePath}: invalid frontmatter line: ${line}`);
      return;
    }
    const key = match[1].trim();
    const value = match[2].trim();
    data[key] = value;
  });
  return data;
}

function bookTitleFromDir(bookDirName) {
  return bookDirName.replace(/^\d{2}\.\d{2}\s+/, "");
}

function normalizeIsbn(value) {
  if (!value) return "";
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function scanBooks() {
  const entries = fs.readdirSync(repoRoot, { withFileTypes: true });
  const books = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!courseDirRe.test(entry.name)) continue;
    if (skipCourseDirs.has(entry.name)) continue;

    const courseId = entry.name;
    const coursePath = path.join(repoRoot, entry.name);
    const categoryEntries = fs.readdirSync(coursePath, { withFileTypes: true });

    for (const category of categoryEntries) {
      if (!category.isDirectory()) continue;
      if (/^\d{2}\sManagement$/.test(category.name)) continue;
      if (!/^\d{2}\s+/.test(category.name)) continue;

      const categoryPath = path.join(coursePath, category.name);
      const bookEntries = fs.readdirSync(categoryPath, { withFileTypes: true });
      for (const bookDir of bookEntries) {
        if (!bookDir.isDirectory()) continue;
        if (!bookDirRe.test(bookDir.name)) continue;

        const bookDirName = bookDir.name;
        const bookPath = path.join(categoryPath, bookDirName);
        const metaPath = path.join(bookPath, "Book Metadata.md");
        const data = fs.existsSync(metaPath)
          ? parseFrontmatter(fs.readFileSync(metaPath, "utf8"), metaPath)
          : null;

        const title = data?.book_title?.trim() || bookTitleFromDir(bookDirName);
        const author = data?.author?.trim() || "";
        const isbn = normalizeIsbn(data?.isbn || "");
        const openLibraryId = data?.open_library_id?.trim() || "";
        const coverUrl = data?.cover_url?.trim() || "";
        const slug = slugify(`${courseId}-${bookDirName}`);

        books.push({
          courseId,
          bookDirName,
          title,
          author,
          isbn,
          openLibraryId,
          coverUrl,
          slug
        });
      }
    }
  }

  return books;
}

function chooseDoc(docs, author) {
  if (!Array.isArray(docs)) return null;
  const candidates = docs.filter((doc) => doc && doc.cover_i);
  if (!candidates.length) return null;

  const normalizedAuthor = author.trim().toLowerCase();
  if (!normalizedAuthor) return candidates[0];

  const exact = candidates.find((doc) =>
    doc.author_name?.some((name) => name.toLowerCase() === normalizedAuthor)
  );
  if (exact) return exact;

  const partial = candidates.find((doc) =>
    doc.author_name?.some((name) => name.toLowerCase().includes(normalizedAuthor))
  );
  return partial || candidates[0];
}

function getExtension(contentType) {
  const type = (contentType || "").toLowerCase();
  if (type.includes("image/png")) return ".png";
  if (type.includes("image/webp")) return ".webp";
  if (type.includes("image/jpg") || type.includes("image/jpeg")) return ".jpg";
  return ".jpg";
}

const fetchAttempts = 3;

function isTransientFetchError(error) {
  const code = error?.cause?.code || error?.code || "";
  return (
    error?.name === "TimeoutError" ||
    error?.message === "fetch failed" ||
    ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ECONNREFUSED", "UND_ERR_SOCKET"].includes(code)
  );
}

async function fetchWithRetry(url) {
  let lastError = null;
  for (let attempt = 0; attempt < fetchAttempts; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status} for ${url}`);
      } else {
        return response;
      }
    } catch (error) {
      if (!isTransientFetchError(error)) throw error;
      lastError = error;
    }
    if (attempt < fetchAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url);
  if (!response.ok) return null;
  return response.json();
}

async function downloadCover(url, slug) {
  const response = await fetchWithRetry(url);
  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") || "";
  const ext = getExtension(contentType);
  const fileName = `${slug}${ext}`;
  const filePath = path.join(outputDir, fileName);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fsp.writeFile(filePath, buffer);
  return { url: `/covers/${fileName}`, contentType };
}

function shouldSkip(existingEntry) {
  if (refresh) return false;
  if (!existingEntry?.url) return false;
  if (!existingEntry.url.startsWith("/covers/")) return true;
  const localPath = path.join(siteRoot, "public", existingEntry.url);
  return fs.existsSync(localPath);
}

async function resolveCover(book, existingEntry) {
  if (book.coverUrl) {
    if (book.coverUrl.startsWith("http")) {
      const downloaded = await downloadCover(book.coverUrl, book.slug);
      if (downloaded) {
        return {
          url: downloaded.url,
          source: "manual_url",
          sourceId: book.coverUrl
        };
      }
      return null;
    }

    return {
      url: book.coverUrl,
      source: "manual_url",
      sourceId: book.coverUrl
    };
  }

  if (book.openLibraryId) {
    const url = `https://covers.openlibrary.org/b/olid/${encodeURIComponent(
      book.openLibraryId
    )}-L.jpg?default=false`;
    const downloaded = await downloadCover(url, book.slug);
    if (downloaded) {
      return {
        url: downloaded.url,
        source: "openlibrary",
        sourceId: `olid:${book.openLibraryId}`
      };
    }
  }

  if (book.isbn) {
    const url = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(
      book.isbn
    )}-L.jpg?default=false`;
    const downloaded = await downloadCover(url, book.slug);
    if (downloaded) {
      return {
        url: downloaded.url,
        source: "openlibrary",
        sourceId: `isbn:${book.isbn}`
      };
    }
  }

  if (!book.title) return null;

  const params = new URLSearchParams({ title: book.title, limit: "5" });
  if (book.author) params.set("author", book.author);
  const searchUrl = `https://openlibrary.org/search.json?${params.toString()}`;
  const data = await fetchJson(searchUrl);
  const doc = chooseDoc(data?.docs || [], book.author);

  if (!doc || !doc.cover_i) return null;
  const coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`;
  const downloaded = await downloadCover(coverUrl, book.slug);
  if (!downloaded) return null;

  return {
    url: downloaded.url,
    source: "openlibrary",
    sourceId: `cover_i:${doc.cover_i}`
  };
}

async function runQueue(items, worker, workerCount) {
  let index = 0;
  const workers = Array.from({ length: workerCount }, async () => {
    while (index < items.length) {
      const current = items[index++];
      await worker(current);
    }
  });
  await Promise.all(workers);
}

async function main() {
  await fsp.mkdir(outputDir, { recursive: true });
  await fsp.mkdir(path.dirname(mapPath), { recursive: true });

  let coverMap = { generatedAt: null, covers: {} };
  if (fs.existsSync(mapPath)) {
    try {
      coverMap = JSON.parse(await fsp.readFile(mapPath, "utf8"));
      if (!coverMap.covers) coverMap.covers = {};
    } catch (error) {
      console.warn(`Failed to parse ${mapPath}: ${error.message}`);
    }
  }

  const books = scanBooks();
  const selectedBooks = limit ? books.slice(0, limit) : books;

  let added = 0;
  let skipped = 0;
  let missing = 0;

  await runQueue(selectedBooks, async (book) => {
    const existingEntry = coverMap.covers[book.slug];
    if (shouldSkip(existingEntry)) {
      skipped += 1;
      return;
    }

    let coverEntry = null;
    try {
      coverEntry = await resolveCover(book, existingEntry);
    } catch (error) {
      missing += 1;
      const detail = error?.cause?.code || error?.message || "request failed";
      console.warn(`[cover] ${book.title}: ${detail}`);
      return;
    }
    if (!coverEntry) {
      missing += 1;
      return;
    }

    coverMap.covers[book.slug] = coverEntry;
    added += 1;
    console.log(`[cover] ${book.title} -> ${coverEntry.url}`);
  }, concurrency);

  coverMap.generatedAt = new Date().toISOString();
  await fsp.writeFile(mapPath, JSON.stringify(coverMap, null, 2) + "\n");

  console.log(
    `Covers updated. Added: ${added}, skipped: ${skipped}, missing: ${missing}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
