import type { APIRoute } from "astro";
import { z } from "zod";
import { checkRateLimit, getAuthUser } from "../../lib/api-guards";

const bookSchema = z.object({
  book_id: z.string().min(1),
  title: z.string().min(1).max(120),
  author: z.string().max(80).optional().nullable()
});

const requestSchema = z.object({
  books: z.array(bookSchema).min(1).max(5)
});

const OPEN_LIBRARY_URL = "https://openlibrary.org/search.json";
const OPEN_LIBRARY_HEADERS = {
  "User-Agent": "LiteratureCourse/1.0 (book covers)"
};

const RATE_LIMIT = { limit: 20, windowMs: 60_000 };

function normalizeTitle(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function getTitleVariants(title) {
  const base = normalizeTitle(title);
  const variants = [base];

  const colon = base.split(":")[0].trim();
  if (colon && colon !== base) variants.push(colon);

  const dash = base.split(" - ")[0].trim();
  if (dash && dash !== base && !variants.includes(dash)) variants.push(dash);

  const paren = base.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (paren && paren !== base && !variants.includes(paren)) variants.push(paren);

  return variants.filter(Boolean);
}

function chooseDoc(docs, author) {
  if (!Array.isArray(docs)) return null;
  const candidates = docs.filter((doc) => doc && doc.cover_i);
  if (!candidates.length) return null;

  const normalizedAuthor = (author || "").trim().toLowerCase();
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

async function searchOpenLibrary(title, author) {
  const url = new URL(OPEN_LIBRARY_URL);
  url.searchParams.set("title", title);
  if (author) {
    url.searchParams.set("author", author);
  }
  url.searchParams.set("limit", "10");

  const response = await fetch(url.toString(), {
    headers: OPEN_LIBRARY_HEADERS
  });
  if (!response.ok) {
    console.warn("Cover lookup failed.", {
      status: response.status,
      title,
      author
    });
    return [];
  }
  const json = await response.json();
  return Array.isArray(json?.docs) ? json.docs : [];
}

async function fetchCover(book) {
  const author = (book.author || "").trim();
  const titleVariants = getTitleVariants(book.title);

  for (const title of titleVariants) {
    let docs = await searchOpenLibrary(title, author || null);
    let doc = chooseDoc(docs, author);
    if (doc?.cover_i) {
      return {
        book_id: book.book_id,
        cover_url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
        cover_source: "openlibrary",
        cover_source_id: String(doc.cover_i)
      };
    }

    if (author) {
      docs = await searchOpenLibrary(title, null);
      doc = chooseDoc(docs, null);
      if (doc?.cover_i) {
        return {
          book_id: book.book_id,
          cover_url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
          cover_source: "openlibrary",
          cover_source_id: String(doc.cover_i)
        };
      }
    }
  }

  console.warn("No cover found.", {
    book_id: book.book_id,
    title: book.title,
    author: author || null
  });
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { allowed, retryAfter } = checkRateLimit(`book-covers:${user.id}`, RATE_LIMIT);
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let payload;
  try {
    payload = requestSchema.parse(await request.json());
  } catch (error) {
    return Response.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const results = await Promise.all(
      payload.books.map(async (book) => fetchCover(book))
    );
    const covers = results.filter(Boolean);
    return Response.json({ covers }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch covers." },
      { status: 500 }
    );
  }
};

export const GET: APIRoute = async () => {
  return Response.json({ error: "Method not allowed." }, { status: 405 });
};
