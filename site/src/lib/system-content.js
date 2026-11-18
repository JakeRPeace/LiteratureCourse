import { createClient } from "@supabase/supabase-js";
import { slugify } from "./slug.js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

let cachedClient = null;

function getSupabaseClient() {
  if (cachedClient) return cachedClient;
  if (!supabaseUrl || !supabaseKey) return null;
  cachedClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
  return cachedClient;
}

function buildCourseBase(courseRow) {
  return {
    id: courseRow.course_id,
    title: courseRow.title,
    summary: courseRow.summary || "",
    slug: courseRow.slug || slugify(courseRow.course_id),
    courseType: courseRow.course_type || "",
    source: "supabase"
  };
}

export async function loadSystemCourses() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: courseRows, error: courseError } = await supabase
    .from("courses")
    .select("course_id, title, course_type, summary, slug")
    .eq("source", "system")
    .order("course_id");

  if (courseError || !courseRows || !courseRows.length) return null;

  const courseIds = courseRows.map((course) => course.course_id);

  const { data: bookRows, error: bookError } = await supabase
    .from("books")
    .select("book_id, course_id, title, author, slug, cover_url, sort_order")
    .in("course_id", courseIds)
    .order("sort_order", { ascending: true });

  if (bookError) return null;

  const bookMap = new Map();
  (bookRows || []).forEach((book) => {
    if (!book?.course_id) return;
    const entries = bookMap.get(book.course_id) || [];
    entries.push({
      id: book.book_id,
      courseId: book.course_id,
      title: book.title,
      author: book.author || "",
      slug: book.slug,
      coverUrl: book.cover_url || null
    });
    bookMap.set(book.course_id, entries);
  });

  return courseRows.map((course) => ({
    ...buildCourseBase(course),
    books: bookMap.get(course.course_id) || []
  }));
}

export async function loadSystemCourseBySlug(slug) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: courseRow, error } = await supabase
    .from("courses")
    .select("course_id, title, course_type, summary, slug")
    .eq("slug", slug)
    .eq("source", "system")
    .maybeSingle();

  if (error || !courseRow) return null;
  return buildCourseBase(courseRow);
}

export async function loadSystemCourseBooks(courseId) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: bookRows, error } = await supabase
    .from("books")
    .select("book_id, course_id, title, author, slug, cover_url, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (error || !bookRows || !bookRows.length) return null;

  return bookRows.map((book) => ({
    id: book.book_id,
    courseId: book.course_id,
    title: book.title,
    author: book.author || "",
    slug: book.slug,
    coverUrl: book.cover_url || null
  }));
}

export async function loadSystemCourseDocs(courseId) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: docRows, error } = await supabase
    .from("course_docs")
    .select("doc_type, label, stage, excerpt, slug, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (error || !docRows || !docRows.length) return null;

  return docRows.map((doc) => ({
    docType: doc.doc_type,
    label: doc.label || "Course document",
    stage: doc.stage || "Course material",
    excerpt: doc.excerpt || "",
    slug: doc.slug
  }));
}

export async function loadSystemCourseDoc(courseId, docSlugParam) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("course_docs")
    .select("doc_type, label, stage, content_md, excerpt, slug")
    .eq("course_id", courseId)
    .eq("slug", docSlugParam)
    .maybeSingle();

  if (error || !data || !data.content_md) return null;

  return {
    docType: data.doc_type,
    label: data.label || "Course document",
    stage: data.stage || "Course material",
    content: data.content_md,
    excerpt: data.excerpt || "",
    slug: data.slug
  };
}

export async function loadSystemCourseDocIndex() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: courseRows, error: courseError } = await supabase
    .from("courses")
    .select("course_id, slug")
    .eq("source", "system");

  if (courseError || !courseRows || !courseRows.length) return null;

  const { data: docRows, error: docError } = await supabase
    .from("course_docs")
    .select("course_id, slug");

  if (docError || !docRows || !docRows.length) return null;

  const slugMap = new Map(
    courseRows.map((course) => [course.course_id, course.slug || slugify(course.course_id)])
  );

  const entries = docRows
    .map((doc) => {
      const courseSlug = slugMap.get(doc.course_id);
      if (!courseSlug || !doc.slug) return null;
      return { courseSlug, docSlug: doc.slug };
    })
    .filter(Boolean);

  return entries.length ? entries : null;
}

export async function loadSystemBooks() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: bookRows, error } = await supabase
    .from("books")
    .select("book_id, course_id, title, author, slug, cover_url, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !bookRows || !bookRows.length) return null;

  return bookRows.map((book) => ({
    id: book.book_id,
    courseId: book.course_id,
    title: book.title,
    author: book.author || "",
    slug: book.slug,
    coverUrl: book.cover_url || null
  }));
}

export async function loadSystemBookBySlug(bookSlug) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: bookRow, error } = await supabase
    .from("books")
    .select("book_id, course_id, title, author, slug, cover_url")
    .eq("slug", bookSlug)
    .maybeSingle();

  if (error || !bookRow) return null;

  return {
    id: bookRow.book_id,
    courseId: bookRow.course_id,
    title: bookRow.title,
    author: bookRow.author || "",
    slug: bookRow.slug,
    coverUrl: bookRow.cover_url || null,
    source: "supabase"
  };
}

export async function loadSystemBookGuides(bookId) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: guideRows, error } = await supabase
    .from("book_guides")
    .select("guide_type, label, stage, excerpt, slug, sort_order")
    .eq("book_id", bookId)
    .order("sort_order", { ascending: true });

  if (error || !guideRows || !guideRows.length) return null;

  return guideRows.map((guide) => ({
    guideType: guide.guide_type,
    label: guide.label || "Guide",
    stage: guide.stage || "Reading guide",
    excerpt: guide.excerpt || "",
    slug: guide.slug,
    order: guide.sort_order
  }));
}

export async function loadSystemBookGuide(bookId, slugParam) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("book_guides")
    .select("guide_type, label, stage, content_md, excerpt, slug")
    .eq("book_id", bookId)
    .eq("slug", slugParam)
    .maybeSingle();

  if (error || !data || !data.content_md) return null;

  return {
    guideType: data.guide_type,
    label: data.label || "Guide",
    stage: data.stage || "Reading guide",
    content: data.content_md,
    excerpt: data.excerpt || "",
    slug: data.slug
  };
}

export async function loadSystemBookGuidesIndex() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: bookRows, error: bookError } = await supabase
    .from("books")
    .select("book_id, slug");

  if (bookError || !bookRows || !bookRows.length) return null;

  const { data: guideRows, error: guideError } = await supabase
    .from("book_guides")
    .select("book_id, slug");

  if (guideError || !guideRows || !guideRows.length) return null;

  const slugMap = new Map(bookRows.map((book) => [book.book_id, book.slug]));

  const entries = guideRows
    .map((guide) => {
      const bookSlug = slugMap.get(guide.book_id);
      if (!bookSlug || !guide.slug) return null;
      return { bookSlug, guideSlug: guide.slug };
    })
    .filter(Boolean);

  return entries.length ? entries : null;
}
