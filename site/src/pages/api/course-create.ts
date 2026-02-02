import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { checkRateLimit, getAuthUser } from "../../lib/api-guards";
import { slugify } from "../../lib/slug.js";

const bookSchema = z.object({
  title: z.string().min(1).max(120),
  author: z.string().min(1).max(80)
});

const courseSchema = z.object({
  title: z.string().min(3).max(120),
  course_type: z.string().min(3).max(80),
  summary: z.string().min(10).max(240),
  books: z.array(bookSchema).min(1).max(6)
});

const requestSchema = z.object({
  course: courseSchema
});

const RATE_LIMIT = { limit: 6, windowMs: 60_000 };

function getSupabaseClient(authHeader) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined
  });
}

async function ensureUniqueSlug(supabase, userId, baseSlug) {
  const safeBase = baseSlug || "course";
  let slug = baseSlug || `course-${Date.now().toString(36)}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("courses")
      .select("course_id")
      .eq("owner_id", userId)
      .eq("source", "user")
      .eq("slug", slug)
      .maybeSingle();

    if (!error && !data) return slug;

    slug = `${safeBase}-${attempt + 2}`;
  }

  return `${safeBase}-${Date.now().toString(36)}`;
}

export const POST: APIRoute = async ({ request }) => {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { allowed, retryAfter } = await checkRateLimit(
    `course-create:${user.id}`,
    RATE_LIMIT
  );
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

  const authHeader = request.headers.get("authorization") || "";
  const supabase = getSupabaseClient(authHeader);
  if (!supabase) {
    return Response.json(
      { error: "Supabase client not configured." },
      { status: 500 }
    );
  }

  const course = payload.course;
  const baseSlug = slugify(course.title);
  const slug = await ensureUniqueSlug(supabase, user.id, baseSlug);
  const courseId = `user-${user.id}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const { error: courseError } = await supabase.from("courses").insert({
    course_id: courseId,
    title: course.title,
    course_type: course.course_type,
    summary: course.summary,
    slug,
    source: "user",
    owner_id: user.id
  });

  if (courseError) {
    return Response.json(
      { error: courseError.message || "Failed to create course." },
      { status: 500 }
    );
  }

  const bookRows = course.books.map((book, index) => ({
    book_id: `${courseId}/book-${String(index + 1).padStart(2, "0")}`,
    course_id: courseId,
    category: "01 Books",
    title: book.title,
    author: book.author,
    slug: slugify(`${courseId}-${book.title}`),
    sort_order: index + 1
  }));

  const { error: bookError } = await supabase.from("books").insert(bookRows);
  if (bookError) {
    await supabase.from("courses").delete().eq("course_id", courseId);
    return Response.json(
      { error: bookError.message || "Failed to create course books." },
      { status: 500 }
    );
  }

  return Response.json({ course_id: courseId, slug }, { status: 200 });
};

export const GET: APIRoute = async () => {
  return Response.json({ error: "Method not allowed." }, { status: 405 });
};
