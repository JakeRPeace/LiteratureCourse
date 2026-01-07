import type { APIRoute } from "astro";
import { z } from "zod";

const bookSchema = z.object({
  book_id: z.string().min(1),
  title: z.string().min(1).max(120),
  author: z.string().max(80).optional().nullable()
});

const requestSchema = z.object({
  books: z.array(bookSchema).min(1).max(5)
});

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

async function fetchCover(book) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("title", book.title);
  if (book.author) {
    url.searchParams.set("author", book.author);
  }
  url.searchParams.set("limit", "10");

  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const json = await response.json();
  const doc = chooseDoc(json?.docs, book.author);
  if (!doc?.cover_i) return null;

  return {
    book_id: book.book_id,
    cover_url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
    cover_source: "openlibrary",
    cover_source_id: String(doc.cover_i)
  };
}

export const POST: APIRoute = async ({ request }) => {
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
