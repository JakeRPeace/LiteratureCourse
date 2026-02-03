import { supabase } from "./supabase.js";
import { getSession, onSessionChange } from "./session-store.js";

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function setNote(note, message, isError = false) {
  if (!note) return;
  note.textContent = message || "";
  note.dataset.state = isError ? "error" : "info";
}

async function createTestCourse(note, button) {
  const session = await getSession();
  if (!session) {
    setNote(note, "Sign in to create a course.", true);
    return;
  }

  const userId = session.user.id;
  const timestamp = Date.now();
  const courseId = `user-${userId}-${timestamp}`;
  const title = `Test Course ${timestamp} - Modern Literature`;
  const courseType = "Modern Literature";
  const summary = "Test course created via the UI button.";
  const slug = slugify(title);

  button.disabled = true;
  setNote(note, "Creating test course...");

  const { error: courseError } = await supabase.from("courses").insert({
    course_id: courseId,
    title,
    course_type: courseType,
    summary,
    slug,
    source: "user",
    owner_id: userId
  });

  if (courseError) {
    setNote(note, courseError.message || "Failed to create course.", true);
    button.disabled = false;
    return;
  }

  const bookId = `${courseId}/book-01`;
  const bookTitle = "Test Book";
  const bookSlug = slugify(`${courseId}-book-01`);

  const { error: bookError } = await supabase.from("books").insert({
    book_id: bookId,
    course_id: courseId,
    category: "01 Books",
    title: bookTitle,
    author: "Test Author",
    slug: bookSlug,
    sort_order: 1
  });

  if (bookError) {
    setNote(note, bookError.message || "Course created, but book failed.", true);
    button.disabled = false;
    return;
  }

  setNote(note, "Course created. It should appear below.");
  button.disabled = false;
  window.dispatchEvent(new CustomEvent("course-list-refresh"));
  window.dispatchEvent(new CustomEvent("course-switcher-refresh"));
}

window.addEventListener("DOMContentLoaded", () => {
  const panel = document.querySelector("[data-course-test-panel]");
  if (!panel) return;
  const button = panel.querySelector("[data-course-test-button]");
  const note = panel.querySelector("[data-course-test-note]");

  const updateVisibility = async () => {
    const session = await getSession();
    panel.hidden = !session;
  };

  button?.addEventListener("click", () => {
    createTestCourse(note, button);
  });

  onSessionChange(() => {
    updateVisibility();
  });

  updateVisibility();
});
