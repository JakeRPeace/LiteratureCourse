import { supabase } from "./supabase.js";
import { getSession, onSessionChange } from "./session-store.js";

const statusLabels = {
  not_started: "Not started",
  in_progress: "In progress",
  read: "Read"
};

function applyStatus(row, status, labelOverride) {
  row.dataset.status = status;
  const pill = row.querySelector("[data-status-pill]");
  if (!pill) return;
  pill.dataset.status = status;
  const label = pill.querySelector("[data-status-label]");
  if (label) {
    label.textContent = labelOverride || statusLabels[status] || statusLabels.not_started;
  }
}

function deriveStatus(statuses, total) {
  if (!total) return "not_started";
  const inProgress = statuses.filter((status) => status === "in_progress").length;
  const read = statuses.filter((status) => status === "read").length;
  if (inProgress > 0) return "in_progress";
  if (read > 0 && read === total) return "read";
  if (read > 0) return "in_progress";
  return "not_started";
}

function collectRows() {
  const rows = Array.from(document.querySelectorAll("[data-course-row]"));
  const courseMap = new Map();

  rows.forEach((row) => {
    const courseId = row.dataset.courseId;
    if (!courseId) return;
    const totalBooks = Number(row.dataset.totalBooks || 0);
    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, { rows: [], totalBooks, statuses: [] });
    }
    courseMap.get(courseId).rows.push(row);
  });

  return { rows, courseMap };
}

function setLoggedOut(rows) {
  rows.forEach((row) => applyStatus(row, "signed_out", "Sign in to track"));
}

function setError(rows) {
  rows.forEach((row) => applyStatus(row, "error", "Status unavailable"));
}

async function loadStatuses() {
  const { rows, courseMap } = collectRows();
  if (!rows.length) return;

  const session = await getSession();
  if (!session) {
    setLoggedOut(rows);
    return;
  }

  const { data, error } = await supabase
    .from("book_status")
    .select("book_id, status")
    .eq("user_id", session.user.id);

  if (error) {
    setError(rows);
    return;
  }

  (data || []).forEach((entry) => {
    const courseId = (entry.book_id || "").split(/[\\/]/)[0];
    const course = courseMap.get(courseId);
    if (!course) return;
    course.statuses.push(entry.status || "not_started");
  });

  courseMap.forEach((course) => {
    const status = deriveStatus(course.statuses, course.totalBooks);
    course.rows.forEach((row) => applyStatus(row, status));
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadStatuses();
  onSessionChange(() => {
    loadStatuses();
  });
  window.addEventListener("course-rows-updated", () => {
    loadStatuses();
  });
});
