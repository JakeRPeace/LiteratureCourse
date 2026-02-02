import { getSession, onSessionChange } from "./session-store.js";

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

  const timestamp = Date.now();
  const title = `Test Course ${timestamp} - Modern Literature`;
  const courseType = "Modern Literature";
  const summary = "Test course created via the UI button.";

  button.disabled = true;
  setNote(note, "Creating test course...");

  try {
    const response = await fetch("/api/course-create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        course: {
          title,
          course_type: courseType,
          summary,
          books: [
            { title: "Test Book", author: "Test Author" }
          ]
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setNote(note, data?.error || "Failed to create course.", true);
      button.disabled = false;
      return;
    }
  } catch (error) {
    setNote(note, "Failed to create course.", true);
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
