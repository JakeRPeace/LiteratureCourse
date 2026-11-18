import { supabase } from "./supabase.js";
import { getSession } from "./session-store.js";
import { shelfLooks } from "./book-look.js";
import { buildLedgeBook } from "./book-dom.js";

function getCourseId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("course_id");
}

function setText(element, value) {
  if (element) element.textContent = value || "";
}

function setError(message) {
  const box = document.querySelector("[data-user-course-error]");
  if (!box) return;
  const text = box.querySelector("p");
  if (text) text.textContent = message;
  box.hidden = !message;
}

function buildDocCard(courseId, doc, sourceLabel) {
  const card = document.createElement("a");
  card.className = "course-doc-card";
  card.href = `/course/user/doc?course_id=${encodeURIComponent(courseId)}&doc=${encodeURIComponent(
    doc.slug
  )}`;
  card.dataset.docType = doc.doc_type || "other";
  card.dataset.docSource = "user";

  const stageChip = document.createElement("span");
  stageChip.className = "course-doc-chip";
  stageChip.textContent = doc.stage || "Course material";

  const title = document.createElement("div");
  title.className = "course-doc-title";
  title.textContent = doc.label || "Course document";

  const excerpt = document.createElement("p");
  excerpt.className = "course-doc-excerpt";
  excerpt.textContent = doc.excerpt || "Open for the full course document.";

  const sourcePill = document.createElement("span");
  sourcePill.className = "data-source-pill";
  sourcePill.textContent = sourceLabel;

  const action = document.createElement("span");
  action.className = "course-doc-action";
  action.textContent = "Open";

  card.append(stageChip, title, excerpt, sourcePill, action);
  return card;
}

function buildBookRow(book, look) {
  return buildLedgeBook({
    id: book.book_id,
    title: book.title || "Untitled Book",
    author: book.author || "",
    sub: book.book_id,
    coverUrl: book.cover_url || "",
    href: `/book/user?book_id=${encodeURIComponent(book.book_id)}`,
    look,
    source: "user"
  });
}

async function loadCoursePage() {
  const courseId = getCourseId();
  if (!courseId) {
    setError("Missing course_id in the URL.");
    return;
  }

  const session = await getSession();
  if (!session) {
    setError("Sign in to view this course.");
    return;
  }

  const { data: course, error } = await supabase
    .from("courses")
    .select("course_id, title, summary, slug")
    .eq("course_id", courseId)
    .eq("source", "user")
    .maybeSingle();

  if (error || !course) {
    setError("Unable to load this course. Please check the link.");
    return;
  }

  setError("");

  setText(document.querySelector("[data-user-course-title]"), course.title);
  setText(document.querySelector("[data-user-course-id]"), course.course_id);
  document.title = `${course.title} | Literature Course Library`;

  const switcher = document.querySelector("[data-course-switcher]");
  const switcherTitle = document.querySelector("[data-course-switcher-title]");
  if (switcher) {
    switcher.dataset.currentCourseId = course.course_id;
    switcher.dataset.currentCourseSource = "user";
  }
  if (switcherTitle) switcherTitle.textContent = course.title;
  window.dispatchEvent(new CustomEvent("course-switcher-refresh"));

  const docsWrap = document.querySelector("[data-user-course-docs]");
  const docsEmpty = document.querySelector("[data-user-course-docs-empty]");
  if (docsWrap) docsWrap.innerHTML = "";

  const booksWrap = document.querySelector("[data-user-course-books]");
  const booksEmpty = document.querySelector("[data-user-course-books-empty]");
  if (booksWrap) booksWrap.innerHTML = "";

  const [docsResult, booksResult] = await Promise.all([
    supabase
      .from("course_docs")
      .select("doc_type, label, stage, excerpt, slug, sort_order")
      .eq("course_id", course.course_id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("books")
      .select("book_id, title, author, cover_url, sort_order")
      .eq("course_id", course.course_id)
      .order("sort_order", { ascending: true })
  ]);

  const docs = docsResult.data;
  if (!docs || !docs.length) {
    if (docsEmpty) docsEmpty.hidden = false;
  } else {
    if (docsEmpty) docsEmpty.hidden = true;
    const fragment = document.createDocumentFragment();
    docs.forEach((doc) => fragment.appendChild(buildDocCard(course.course_id, doc, "User")));
    if (docsWrap) docsWrap.appendChild(fragment);
  }

  const books = booksResult.data;
  if (!books || !books.length) {
    if (booksEmpty) booksEmpty.hidden = false;
  } else {
    if (booksEmpty) booksEmpty.hidden = true;
    const fragment = document.createDocumentFragment();
    const looks = shelfLooks(books);
    books.forEach((book, index) => fragment.appendChild(buildBookRow(book, looks[index])));
    if (booksWrap) booksWrap.appendChild(fragment);
    window.dispatchEvent(new CustomEvent("book-rows-updated"));
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadCoursePage();
});
