import { supabase } from "./supabase.js";

const summaryFallback = "Short course overview available in the syllabus.";

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
    const selected = coverList.slice().sort(() => 0.5 - Math.random()).slice(0, 3);
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

async function loadUserCourses(list) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    clearUserRows(list);
    window.dispatchEvent(new CustomEvent("course-rows-updated"));
    return;
  }

  const { data: courses, error } = await supabase
    .from("courses")
    .select("course_id, title, course_type, summary, slug")
    .eq("source", "user")
    .order("created_at", { ascending: true });

  clearUserRows(list);

  if (error || !courses || courses.length === 0) {
    window.dispatchEvent(new CustomEvent("course-rows-updated"));
    return;
  }

  const courseIds = courses.map((course) => course.course_id);
  const { data: bookRows } = await supabase
    .from("books")
    .select("course_id, cover_url")
    .in("course_id", courseIds);

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

  list.appendChild(fragment);
  window.dispatchEvent(new CustomEvent("course-rows-updated"));
}

window.addEventListener("DOMContentLoaded", () => {
  const list = document.querySelector(".data-list");
  if (!list) return;

  loadUserCourses(list);
  supabase.auth.onAuthStateChange(() => {
    loadUserCourses(list);
  });
});
