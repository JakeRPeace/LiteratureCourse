import { supabase } from "./supabase.js";
import { getSession, onSessionChange } from "./session-store.js";

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

function buildCourseRow(course, stats) {
  const row = document.createElement("a");
  row.className = "data-row";
  row.href = `/course/user?course_id=${encodeURIComponent(course.course_id)}`;
  row.setAttribute("data-course-row", "");
  row.dataset.courseId = course.course_id;
  row.dataset.totalBooks = String(stats.total || 0);
  row.dataset.status = "not_started";
  row.dataset.courseSource = "user";

  const dataBody = document.createElement("div");
  dataBody.className = "data-body";

  const coverWrap = document.createElement("div");
  const coverList = stats.covers || [];
  coverWrap.className = `data-cover ${coverList.length ? "is-stack" : "is-empty"}`;

  if (coverList.length) {
    const selected = coverList.slice(0, 3);
    selected.forEach((url) => {
      const item = document.createElement("div");
      item.className = "cover-stack-item";
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      item.appendChild(img);
      coverWrap.appendChild(item);
    });
  }

  const dataMain = document.createElement("div");
  dataMain.className = "data-main";

  const title = document.createElement("div");
  title.className = "data-title";
  const titleParts = (course.title || "").split(" - ");
  const courseType = course.course_type || titleParts.slice(1).join(" - ");
  title.textContent = courseType || course.title || "Untitled Course";

  const summary = document.createElement("div");
  summary.className = "data-sub";
  summary.textContent = course.summary || summaryFallback;

  const sourcePill = document.createElement("span");
  sourcePill.className = "data-source-pill";
  sourcePill.textContent = "User";

  dataMain.appendChild(title);
  dataMain.appendChild(summary);
  dataMain.appendChild(sourcePill);

  dataBody.appendChild(coverWrap);
  dataBody.appendChild(dataMain);

  const dataMeta = document.createElement("div");
  dataMeta.className = "data-meta";

  const chip = document.createElement("span");
  chip.className = "data-chip";
  chip.textContent = course.title || "Untitled Course";

  const statusPill = document.createElement("span");
  statusPill.className = "status-pill";
  statusPill.dataset.statusPill = "";
  statusPill.dataset.status = "not_started";

  const statusDot = document.createElement("span");
  statusDot.className = "status-dot";
  statusDot.setAttribute("aria-hidden", "true");

  const statusLabel = document.createElement("span");
  statusLabel.className = "status-label";
  statusLabel.dataset.statusLabel = "";
  statusLabel.textContent = "Not started";

  statusPill.appendChild(statusDot);
  statusPill.appendChild(statusLabel);

  dataMeta.appendChild(chip);
  dataMeta.appendChild(statusPill);

  row.appendChild(dataBody);
  row.appendChild(dataMeta);

  return row;
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
    .select("course_id, book_id, title, author, cover_url")
    .in("course_id", courseIds);

  if (sequence !== loadSequence) return;

  const statsMap = new Map();
  (bookRows || []).forEach((book) => {
    if (!book?.course_id) return;
    const entry = statsMap.get(book.course_id) || { total: 0, covers: [] };
    entry.total += 1;
    if (book.cover_url) entry.covers.push(book.cover_url);
    statsMap.set(book.course_id, entry);
  });

  const fragment = document.createDocumentFragment();
  courses.forEach((course) => {
    const stats = statsMap.get(course.course_id) || { total: 0, covers: [] };
    fragment.appendChild(buildCourseRow(course, stats));
  });

  if (sequence !== loadSequence) return;

  list.appendChild(fragment);
  window.dispatchEvent(new CustomEvent("course-rows-updated"));

  void refreshMissingCovers(bookRows);
}

window.addEventListener("DOMContentLoaded", () => {
  const list = document.querySelector(".data-list");
  if (!list) return;

  loadUserCourses(list);
  onSessionChange(() => {
    loadUserCourses(list);
  });
  window.addEventListener("course-list-refresh", () => {
    loadUserCourses(list);
  });
});
