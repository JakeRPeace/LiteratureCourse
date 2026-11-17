import { supabase } from "./supabase.js";
import { getSession } from "./session-store.js";

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
  card.className = "card course-doc-card";
  card.href = `/course/user/doc?course_id=${encodeURIComponent(courseId)}&doc=${encodeURIComponent(
    doc.slug
  )}`;
  card.dataset.docType = doc.doc_type || "other";
  card.dataset.docSource = "user";

  const action = document.createElement("span");
  action.className = "course-doc-action";
  action.textContent = "Open";

  const title = document.createElement("div");
  title.className = "course-doc-title";
  title.textContent = doc.label || "Course document";

  const excerpt = document.createElement("p");
  excerpt.className = "course-doc-excerpt";
  excerpt.textContent = doc.excerpt || "Open for the full course document.";

  const meta = document.createElement("div");
  meta.className = "course-doc-meta";

  const stageChip = document.createElement("span");
  stageChip.className = "course-doc-chip";
  stageChip.textContent = doc.stage || "Course material";

  const chip = document.createElement("span");
  chip.className = "course-doc-chip";
  chip.textContent = courseId;

  const sourcePill = document.createElement("span");
  sourcePill.className = "data-source-pill";
  sourcePill.textContent = sourceLabel;

  meta.appendChild(stageChip);
  meta.appendChild(chip);
  meta.appendChild(action);
  meta.appendChild(sourcePill);

  card.appendChild(title);
  card.appendChild(excerpt);
  card.appendChild(meta);

  return card;
}

function buildBookRow(courseId, book, sourceLabel) {
  const row = document.createElement("a");
  row.className = "data-row";
  row.href = `/book/user?book_id=${encodeURIComponent(book.book_id)}`;
  row.setAttribute("data-book-row", "");
  row.dataset.bookId = book.book_id;
  row.dataset.status = "not_started";
  row.dataset.bookSource = "user";

  const body = document.createElement("div");
  body.className = "data-body";

  const cover = document.createElement("div");
  cover.className = `data-cover ${book.cover_url ? "" : "is-empty"}`;

  if (book.cover_url) {
    const img = document.createElement("img");
    img.src = book.cover_url;
    img.alt = `Cover of ${book.title}`;
    img.loading = "lazy";
    img.decoding = "async";
    cover.appendChild(img);
  }

  const main = document.createElement("div");
  main.className = "data-main";

  const title = document.createElement("div");
  title.className = "data-title";
  title.textContent = book.title || "Untitled Book";

  const sub = document.createElement("div");
  sub.className = "data-sub";
  sub.textContent = book.book_id;

  const sourcePill = document.createElement("span");
  sourcePill.className = "data-source-pill";
  sourcePill.textContent = sourceLabel;

  main.appendChild(title);
  main.appendChild(sub);
  main.appendChild(sourcePill);

  body.appendChild(cover);
  body.appendChild(main);

  const meta = document.createElement("div");
  meta.className = "data-meta";

  const statusPill = document.createElement("span");
  statusPill.className = "status-pill";
  statusPill.dataset.statusPill = "";
  statusPill.dataset.status = "not_started";

  const dot = document.createElement("span");
  dot.className = "status-dot";
  dot.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "status-label";
  label.dataset.statusLabel = "";
  label.textContent = "Not started";

  statusPill.appendChild(dot);
  statusPill.appendChild(label);
  meta.appendChild(statusPill);

  row.appendChild(body);
  row.appendChild(meta);

  return row;
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
      .select("book_id, title, cover_url, sort_order")
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
    books.forEach((book) => fragment.appendChild(buildBookRow(course.course_id, book, "User")));
    if (booksWrap) booksWrap.appendChild(fragment);
    window.dispatchEvent(new CustomEvent("book-rows-updated"));
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadCoursePage();
});
