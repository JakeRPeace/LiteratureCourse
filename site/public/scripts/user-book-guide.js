import { supabase } from "./supabase.js";
import { marked } from "https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.1.6/+esm";
import { getSession } from "./session-store.js";
import { stripHeadingIcons } from "./strip-heading-icons.js";

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    bookId: params.get("book_id"),
    guideSlug: params.get("guide")
  };
}

function setError(message) {
  const box = document.querySelector("[data-user-book-guide-error]");
  if (!box) return;
  const text = box.querySelector("p");
  if (text) text.textContent = message;
  box.hidden = !message;
}

function buildBookSwitcherItem(book, isActive) {
  const item = document.createElement("a");
  item.className = `course-switcher-item${isActive ? " is-active" : ""}`;
  item.href = `/book/user?book_id=${encodeURIComponent(book.book_id)}`;
  item.dataset.bookSource = "user";

  const title = document.createElement("div");
  title.className = "course-switcher-item-title";
  title.textContent = book.title || "Untitled Book";

  const sub = document.createElement("div");
  sub.className = "course-switcher-item-sub";
  sub.textContent = book.book_id;

  item.appendChild(title);
  item.appendChild(sub);
  return item;
}

async function loadGuidePage() {
  const { bookId, guideSlug } = getParams();
  if (!bookId || !guideSlug) {
    setError("Missing book_id or guide in the URL.");
    return;
  }

  const session = await getSession();
  if (!session) {
    setError("Sign in to view this guide.");
    return;
  }

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("book_id, course_id, title")
    .eq("book_id", bookId)
    .maybeSingle();

  if (bookError || !book) {
    setError("Unable to load this guide. Please check the link.");
    return;
  }

  const guidePromise = supabase
    .from("book_guides")
    .select("label, stage, content_md")
    .eq("book_id", book.book_id)
    .eq("slug", guideSlug)
    .maybeSingle();

  const backLink = document.querySelector("[data-user-book-guide-back]");
  if (backLink) {
    backLink.href = `/book/user?book_id=${encodeURIComponent(book.book_id)}`;
  }

  const courseSwitcher = document.querySelector("[data-course-switcher]");
  const courseTitle = document.querySelector("[data-course-switcher-title]");
  if (courseSwitcher) {
    courseSwitcher.dataset.currentCourseId = book.course_id;
    courseSwitcher.dataset.currentCourseSource = "user";
  }
  const courseTitlePromise = courseTitle
    ? supabase
        .from("courses")
        .select("title")
        .eq("course_id", book.course_id)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const bookSwitcher = document.querySelector("[data-book-switcher]");
  const bookTitle = document.querySelector("[data-book-switcher-title]");
  const bookMenu = document.querySelector("[data-book-switcher-menu]");
  if (bookSwitcher) {
    bookSwitcher.dataset.currentBookId = book.book_id;
    bookSwitcher.dataset.currentCourseId = book.course_id;
    bookSwitcher.dataset.currentCourseSource = "user";
  }
  if (bookTitle) bookTitle.textContent = book.title || "Untitled Book";
  const bookMenuPromise = bookMenu
    ? supabase
        .from("books")
        .select("book_id, title, sort_order")
        .eq("course_id", book.course_id)
        .order("sort_order", { ascending: true })
    : Promise.resolve({ data: null });

  const [{ data: guide, error }, { data: courseRow }, { data: books }] =
    await Promise.all([guidePromise, courseTitlePromise, bookMenuPromise]);

  if (error || !guide) {
    setError("Unable to load this guide. Please check the link.");
    return;
  }

  setError("");

  const titleEl = document.querySelector("[data-user-book-guide-title]");
  if (titleEl) titleEl.textContent = guide.label || "Guide";

  const stageEl = document.querySelector("[data-user-book-guide-stage]");
  if (stageEl) stageEl.textContent = `${book.title} · ${guide.stage || ""}`;

  const contentEl = document.querySelector("[data-user-book-guide-content]");
  if (contentEl) {
    const html = marked.parse(guide.content_md || "");
    contentEl.innerHTML = DOMPurify.sanitize(html);
    stripHeadingIcons(contentEl);
  }

  if (courseTitle && courseRow?.title) {
    courseTitle.textContent = courseRow.title;
  }
  window.dispatchEvent(new CustomEvent("course-switcher-refresh"));

  if (bookMenu) {
    bookMenu.querySelectorAll('[data-book-source="user"]').forEach((item) => item.remove());
    if (books && books.length) {
      const fragment = document.createDocumentFragment();
      books.forEach((entry) => {
        const isActive = entry.book_id === book.book_id;
        fragment.appendChild(buildBookSwitcherItem(entry, isActive));
      });
      bookMenu.appendChild(fragment);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadGuidePage();
});
