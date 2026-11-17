import { supabase } from "./supabase.js";
import { getSession } from "./session-store.js";

function getBookId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("book_id");
}

function setError(message) {
  const box = document.querySelector("[data-user-book-error]");
  if (!box) return;
  const text = box.querySelector("p");
  if (text) text.textContent = message;
  box.hidden = !message;
}

function updateCover(url, title) {
  const cover = document.querySelector("[data-user-book-cover]");
  if (!cover) return;
  cover.innerHTML = "";
  if (!url) {
    cover.classList.add("is-empty");
    return;
  }
  cover.classList.remove("is-empty");
  const img = document.createElement("img");
  img.src = url;
  img.alt = `Cover of ${title}`;
  img.loading = "lazy";
  img.decoding = "async";
  cover.appendChild(img);
}

function buildGuideCard(bookId, guide) {
  const card = document.createElement("a");
  card.className = "guide-card";
  card.href = `/book/user/guide?book_id=${encodeURIComponent(bookId)}&guide=${encodeURIComponent(
    guide.slug
  )}`;
  card.dataset.guideType = guide.guide_type || "other";
  card.dataset.guideSource = "user";

  const action = document.createElement("span");
  action.className = "guide-action";
  action.textContent = "Open";

  const title = document.createElement("div");
  title.className = "guide-title";
  title.textContent = guide.label || "Guide";

  const excerpt = document.createElement("p");
  excerpt.className = "guide-excerpt";
  excerpt.textContent = guide.excerpt || "Open for the full guide and prompts.";

  const meta = document.createElement("div");
  meta.className = "guide-meta";

  const stageChip = document.createElement("span");
  stageChip.className = "guide-chip";
  stageChip.textContent = guide.stage || "Reading guide";
  meta.appendChild(stageChip);

  if (guide.sort_order) {
    const chip = document.createElement("span");
    chip.className = "guide-chip";
    chip.textContent = `Guide ${guide.sort_order}`;
    meta.appendChild(chip);
  }

  const bookChip = document.createElement("span");
  bookChip.className = "guide-chip";
  bookChip.textContent = bookId;
  meta.appendChild(bookChip);
  meta.appendChild(action);

  const sourcePill = document.createElement("span");
  sourcePill.className = "data-source-pill";
  sourcePill.textContent = "User";
  meta.appendChild(sourcePill);

  card.appendChild(title);
  card.appendChild(excerpt);
  card.appendChild(meta);

  return card;
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

async function loadBookPage() {
  const bookId = getBookId();
  if (!bookId) {
    setError("Missing book_id in the URL.");
    return;
  }

  const session = await getSession();
  if (!session) {
    setError("Sign in to view this book.");
    return;
  }

  const { data: book, error } = await supabase
    .from("books")
    .select("book_id, course_id, title, author, cover_url, slug")
    .eq("book_id", bookId)
    .maybeSingle();

  if (error || !book) {
    setError("Unable to load this book. Please check the link.");
    return;
  }

  setError("");

  const titleEl = document.querySelector("[data-user-book-title]");
  if (titleEl) titleEl.textContent = book.title || "Untitled Book";
  const metaEl = document.querySelector("[data-user-book-meta]");
  if (metaEl) {
    metaEl.textContent = `${book.author ? `${book.author} · ` : ""}${book.book_id}`;
  }
  document.title = `${book.title} | Literature Course Library`;
  updateCover(book.cover_url, book.title || "Book");

  const backLink = document.querySelector("[data-user-book-back]");
  if (backLink) {
    backLink.href = `/course/user?course_id=${encodeURIComponent(book.course_id)}`;
  }

  const statusRoot = document.querySelector("[data-book-status]");
  if (statusRoot) {
    statusRoot.dataset.bookId = book.book_id;
    window.dispatchEvent(new CustomEvent("book-status-updated"));
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

  const guidesWrap = document.querySelector("[data-user-book-guides]");
  const guidesEmpty = document.querySelector("[data-user-book-guides-empty]");
  if (guidesWrap) guidesWrap.innerHTML = "";

  const guidesPromise = supabase
    .from("book_guides")
    .select("guide_type, label, stage, excerpt, slug, sort_order")
    .eq("book_id", book.book_id)
    .order("sort_order", { ascending: true });

  const [{ data: courseRow }, { data: books }, { data: guides }] = await Promise.all([
    courseTitlePromise,
    bookMenuPromise,
    guidesPromise
  ]);

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

  if (!guides || !guides.length) {
    if (guidesEmpty) guidesEmpty.hidden = false;
  } else {
    if (guidesEmpty) guidesEmpty.hidden = true;
    const fragment = document.createDocumentFragment();
    guides.forEach((guide) => fragment.appendChild(buildGuideCard(book.book_id, guide)));
    if (guidesWrap) guidesWrap.appendChild(fragment);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadBookPage();
});
