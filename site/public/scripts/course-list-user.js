import { supabase } from "./supabase.js";
import { getSession, onSessionChange } from "./session-store.js";
import { bookLook, faceOutIndex, shelfLooks } from "./book-look.js";
import { buildFaceOut, buildSpine, buildStatusPill } from "./book-dom.js";

const summaryFallback = "Short course overview available in the syllabus.";
let loadSequence = 0;
const coverRetryCache = new Set();

async function getAuthHeaders() {
  const session = await getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function clearUserRows(list) {
  list.querySelectorAll('[data-course-source="user"]').forEach((row) => row.remove());
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// A reader's own course gets a shelf like any other, built from its books.
function buildCourseRow(course, books) {
  const courseHref = `/course/user?course_id=${encodeURIComponent(course.course_id)}`;
  const titleParts = (course.title || "").split(" - ");
  const courseType = course.course_type || titleParts.slice(1).join(" - ");
  const displayTitle = courseType || course.title || "Untitled Course";

  const shelf = el("article", "shelf");
  shelf.setAttribute("data-course-row", "");
  shelf.dataset.courseId = course.course_id;
  shelf.dataset.totalBooks = String(books.length);
  shelf.dataset.status = "not_started";
  shelf.dataset.courseSource = "user";

  const head = el("header", "shelf-head");
  const plate = el("a", "shelf-plate");
  plate.href = courseHref;
  plate.append(el("h2", "shelf-title", displayTitle));

  const meta = el("div", "shelf-meta");
  const count = el("span", "shelf-count", `${books.length} ${books.length === 1 ? "book" : "books"}`);
  count.dataset.shelfCount = "";
  meta.append(el("span", "data-source-pill", "User"), count, buildStatusPill());
  head.append(plate, el("p", "shelf-summary", course.summary || summaryFallback), meta);

  const row = el("div", "shelf-books");
  // One book stands face-out (courses of four or more); the rest spine-out.
  const faceAt = faceOutIndex(books, course.course_id);
  const spineBooks = books.filter((_, index) => index !== faceAt);
  const looks = shelfLooks(spineBooks, { scatter: true });
  const bookHref = (book) => `/book/user?book_id=${encodeURIComponent(book.book_id)}`;
  spineBooks.forEach((book, index) => {
    row.append(
      buildSpine({
        id: book.book_id,
        title: book.title || "Untitled Book",
        author: book.author || "",
        coverUrl: book.cover_url || "",
        href: bookHref(book),
        look: looks[index],
        source: "user"
      })
    );
  });

  const end = el("div", "shelf-end");
  if (faceAt >= 0) {
    const face = books[faceAt];
    end.append(
      buildFaceOut({
        id: face.book_id,
        title: face.title || "Untitled Book",
        author: face.author || "",
        coverUrl: face.cover_url || "",
        href: bookHref(face),
        look: bookLook(face.title || "Untitled Book", face.author || ""),
        source: "user"
      })
    );
  }

  const card = el("a", "shelf-card");
  card.href = courseHref;
  card.append(
    el("span", "shelf-card-eyebrow", "Your course"),
    el("span", "shelf-card-title", "Syllabus & reading order"),
    el("span", "shelf-card-action", "Open the course")
  );
  end.append(card);
  row.append(end);

  shelf.append(head, row);
  return shelf;
}

async function refreshMissingCovers(bookRows) {
  const missing = (bookRows || []).filter(
    (book) => book && !book.cover_url && !coverRetryCache.has(book.book_id)
  );

  if (!missing.length) return;

  const batch = missing.slice(0, 5);
  batch.forEach((book) => coverRetryCache.add(book.book_id));

  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch("/api/book-covers", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        books: batch.map((book) => ({
          book_id: book.book_id,
          title: book.title,
          author: book.author
        }))
      })
    });

    if (!response.ok) {
      console.warn("Cover refresh request failed.", response.status);
      return;
    }

    const data = await response.json();
    const covers = Array.isArray(data?.covers) ? data.covers : [];
    if (!covers.length) return;

    await Promise.all(
      covers.map(async (cover) => {
        const { error } = await supabase
          .from("books")
          .update({
            cover_url: cover.cover_url,
            cover_source: cover.cover_source,
            cover_source_id: cover.cover_source_id
          })
          .eq("book_id", cover.book_id);

        if (error) {
          console.warn("Cover update failed.", {
            book_id: cover.book_id,
            error: error.message
          });
        }
      })
    );

    window.dispatchEvent(new CustomEvent("course-list-refresh"));
  } catch (error) {
    console.warn("Cover refresh failed.", error);
  }
}

async function loadUserCourses(list) {
  const sequence = ++loadSequence;
  const session = await getSession();
  if (sequence !== loadSequence) return;
  if (!session) {
    if (sequence !== loadSequence) return;
    clearUserRows(list);
    window.dispatchEvent(new CustomEvent("course-rows-updated"));
    return;
  }

  const { data: courses, error } = await supabase
    .from("courses")
    .select("course_id, title, course_type, summary, slug")
    .eq("source", "user")
    .order("created_at", { ascending: true });

  if (sequence !== loadSequence) return;

  if (error || !courses || courses.length === 0) {
    if (sequence !== loadSequence) return;
    clearUserRows(list);
    window.dispatchEvent(new CustomEvent("course-rows-updated"));
    return;
  }

  if (sequence !== loadSequence) return;
  clearUserRows(list);

  const courseIds = courses.map((course) => course.course_id);
  const { data: bookRows } = await supabase
    .from("books")
    .select("course_id, book_id, title, author, cover_url, sort_order")
    .in("course_id", courseIds)
    .order("sort_order", { ascending: true });

  if (sequence !== loadSequence) return;

  const booksByCourse = new Map();
  (bookRows || []).forEach((book) => {
    if (!book?.course_id) return;
    const entries = booksByCourse.get(book.course_id) || [];
    entries.push(book);
    booksByCourse.set(book.course_id, entries);
  });

  const fragment = document.createDocumentFragment();
  courses.forEach((course) => {
    fragment.appendChild(buildCourseRow(course, booksByCourse.get(course.course_id) || []));
  });

  if (sequence !== loadSequence) return;

  list.appendChild(fragment);
  window.dispatchEvent(new CustomEvent("course-rows-updated"));

  void refreshMissingCovers(bookRows);
}

window.addEventListener("DOMContentLoaded", () => {
  const list = document.querySelector("[data-course-list]");
  if (!list) return;

  loadUserCourses(list);
  onSessionChange(() => {
    loadUserCourses(list);
  });
  window.addEventListener("course-list-refresh", () => {
    loadUserCourses(list);
  });
});
