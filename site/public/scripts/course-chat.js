import { supabase } from "./supabase.js";

const summaryFallback = "Describe your course to get a draft.";
const maxMessages = 8;

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

function buildMessage(role, text) {
  const message = document.createElement("div");
  message.className = "chat-message";
  message.dataset.role = role;

  const body = document.createElement("div");
  body.className = "chat-message-body";
  body.textContent = text;

  message.appendChild(body);
  return message;
}

function formatDraft(course) {
  const lines = [
    `Draft: ${course.title}`,
    `Type: ${course.course_type}`,
    course.summary,
    "Books:",
    ...course.books.map(
      (book, index) => `${index + 1}. ${book.title} - ${book.author}`
    )
  ];
  return lines.join("\n");
}

async function createCourseFromDraft(course, note) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    setNote(note, "Sign in to create a course.", true);
    return;
  }

  const userId = sessionData.session.user.id;
  const timestamp = Date.now();
  const courseId = `user-${userId}-${timestamp}`;
  const title = course.title;
  const courseType = course.course_type;
  const summary = course.summary;
  const slug = slugify(title);

  setNote(note, "Creating course...");

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
    return;
  }

  const bookRows = course.books.map((book, index) => ({
    book_id: `${courseId}/book-${String(index + 1).padStart(2, "0")}`,
    course_id: courseId,
    category: "01 Books",
    title: book.title,
    author: book.author,
    slug: slugify(`${courseId}-${book.title}`),
    sort_order: index + 1
  }));

  const { error: bookError } = await supabase.from("books").insert(bookRows);

  if (bookError) {
    setNote(note, bookError.message || "Course created, but books failed.", true);
    return;
  }

  setNote(note, "Course created. It should appear below.");
  window.dispatchEvent(new CustomEvent("course-list-refresh"));
  window.dispatchEvent(new CustomEvent("course-switcher-refresh"));
}

window.addEventListener("DOMContentLoaded", () => {
  const panel = document.querySelector("[data-course-chat-panel]");
  const modal = document.querySelector("[data-course-chat-modal]");
  if (!panel || !modal) return;

  const openButton = panel.querySelector("[data-course-chat-open]");
  const panelNote = panel.querySelector("[data-course-chat-note]");
  const closeButton = modal.querySelector("[data-course-chat-close]");
  const clearButton = modal.querySelector("[data-course-chat-clear]");
  const createButton = modal.querySelector("[data-course-chat-create]");
  const form = modal.querySelector("[data-course-chat-form]");
  const input = modal.querySelector("[data-course-chat-input]");
  const sendButton = modal.querySelector("[data-course-chat-send]");
  const log = modal.querySelector("[data-course-chat-log]");
  const modalNote = modal.querySelector("[data-course-chat-modal-note]");

  if (!openButton || !form || !input || !log || !createButton) return;

  let messages = [];
  let draftCourse = null;
  let pendingMessage = null;
  let isBusy = false;

  const resetDraft = () => {
    draftCourse = null;
    createButton.disabled = true;
  };

  const appendMessage = (role, text) => {
    const message = buildMessage(role, text);
    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
    return message;
  };

  const updateVisibility = async () => {
    const { data } = await supabase.auth.getSession();
    panel.hidden = !data.session;
  };

  const openModal = () => {
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "true");
    }
    if (!log.childElementCount) {
      appendMessage("assistant", summaryFallback);
    }
    input.focus();
  };

  const closeModal = () => {
    if (typeof modal.close === "function") {
      modal.close();
    } else {
      modal.removeAttribute("open");
    }
  };

  openButton.addEventListener("click", () => {
    setNote(panelNote, "");
    setNote(modalNote, "");
    openModal();
  });

  closeButton?.addEventListener("click", () => {
    closeModal();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  clearButton?.addEventListener("click", () => {
    messages = [];
    log.innerHTML = "";
    resetDraft();
    appendMessage("assistant", summaryFallback);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value || isBusy) return;

    setNote(modalNote, "");
    resetDraft();
    messages.push({ role: "user", content: value });
    messages = messages.slice(-maxMessages);
    appendMessage("user", value);
    input.value = "";

    isBusy = true;
    input.disabled = true;
    if (sendButton) sendButton.disabled = true;

    pendingMessage = appendMessage("assistant", "Thinking...");

    try {
      const response = await fetch("/api/course-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error || "Chat service failed.";
        pendingMessage.querySelector(".chat-message-body").textContent =
          errorMessage;
        setNote(modalNote, errorMessage, true);
        return;
      }

      const course = data?.course;
      if (!course) {
        const fallback = "No course draft returned.";
        pendingMessage.querySelector(".chat-message-body").textContent =
          fallback;
        setNote(modalNote, fallback, true);
        return;
      }

      const summary = formatDraft(course);
      pendingMessage.querySelector(".chat-message-body").textContent = summary;
      messages.push({ role: "assistant", content: summary });
      draftCourse = course;
      createButton.disabled = false;
    } catch (error) {
      const fallback = "Chat request failed.";
      if (pendingMessage) {
        pendingMessage.querySelector(".chat-message-body").textContent = fallback;
      }
      setNote(modalNote, fallback, true);
    } finally {
      isBusy = false;
      input.disabled = false;
      if (sendButton) sendButton.disabled = false;
    }
  });

  createButton.addEventListener("click", async () => {
    if (!draftCourse) return;
    createButton.disabled = true;
    await createCourseFromDraft(draftCourse, modalNote);
  });

  supabase.auth.onAuthStateChange(() => {
    updateVisibility();
  });

  updateVisibility();
});
