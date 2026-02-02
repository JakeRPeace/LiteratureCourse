import { getSession, onSessionChange } from "./session-store.js";

const summaryFallback = "Describe your course to get a draft.";
const maxMessages = 8;

async function getAuthHeaders() {
  const session = await getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
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

async function createCourseFromDraft(course, note, onSuccess) {
  const session = await getSession();
  if (!session) {
    setNote(note, "Sign in to create a course.", true);
    return;
  }

  setNote(note, "Creating course...");

  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch("/api/course-create", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ course })
    });

    const data = await response.json();
    if (!response.ok) {
      setNote(note, data?.error || "Failed to create course.", true);
      return;
    }
  } catch (error) {
    setNote(note, "Course creation failed.", true);
    return;
  }

  setNote(note, "");
  window.dispatchEvent(new CustomEvent("course-list-refresh"));
  window.dispatchEvent(new CustomEvent("course-switcher-refresh"));
  if (onSuccess) onSuccess();
}

const initCourseChat = () => {
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
  let closeTimer = null;
  let toastTimer = null;

  const toast = document.createElement("div");
  toast.className = "toast-banner";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);

  const showToast = (message, duration = 5000) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, duration);
  };

  const resetDraft = () => {
    draftCourse = null;
    createButton.disabled = true;
  };

  const resetChat = () => {
    messages = [];
    log.innerHTML = "";
    resetDraft();
    appendMessage("assistant", summaryFallback);
  };

  const appendMessage = (role, text) => {
    const message = buildMessage(role, text);
    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
    return message;
  };

  const updateVisibility = async () => {
    const session = await getSession();
    panel.hidden = !session;
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
    resetChat();
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
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/course-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
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
    await createCourseFromDraft(draftCourse, modalNote, () => {
      showToast("Course created. It should appear below.");
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        closeModal();
        resetChat();
      }, 5000);
    });
  });

  onSessionChange(() => {
    updateVisibility();
  });

  updateVisibility();
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initCourseChat);
} else {
  initCourseChat();
}
