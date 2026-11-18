import { supabase } from "./supabase.js";
import { getSession, onSessionChange } from "./session-store.js";
import { applyStatus } from "./status-ui.js";
import { buildCover } from "./book-dom.js";

// The home bookcase: stamps every shelf and spine with the reader's status,
// and lays the books in progress out on the reading table.

const TABLE_LIMIT = 5;

function collect() {
  return {
    shelves: Array.from(document.querySelectorAll("[data-course-row]")),
    books: Array.from(document.querySelectorAll("[data-course-row] [data-book-row]"))
  };
}

function deriveStatus(read, inProgress, total) {
  if (!total) return "not_started";
  if (read >= total) return "read";
  if (read > 0 || inProgress > 0) return "in_progress";
  return "not_started";
}

function countLabel(read, total) {
  if (read > 0) return `${read} of ${total} read`;
  return `${total} ${total === 1 ? "book" : "books"}`;
}

function renderTable(spines, message) {
  const table = document.querySelector("[data-reading-table]");
  if (!table) return;
  const list = table.querySelector("[data-table-books]");
  const empty = table.querySelector("[data-table-empty]");
  list.replaceChildren();

  if (!spines.length) {
    list.hidden = true;
    empty.hidden = false;
    empty.textContent = message;
    return;
  }

  spines.slice(0, TABLE_LIMIT).forEach((spine) => {
    const title = spine.dataset.title || "";
    const author = spine.dataset.author || "";
    const link = document.createElement("a");
    link.className = "table-book";
    link.href = spine.href;
    link.setAttribute("aria-label", `Continue ${title}${author ? ` by ${author}` : ""}`);
    link.append(
      buildCover({
        title,
        author,
        coverUrl: spine.dataset.cover,
        look: { style: spine.style.cssText }
      })
    );
    list.append(link);
  });

  if (spines.length > TABLE_LIMIT) {
    const more = document.createElement("span");
    more.className = "table-more";
    more.textContent = `+${spines.length - TABLE_LIMIT} more`;
    list.append(more);
  }

  list.hidden = false;
  empty.hidden = true;
}

function render(statusMap) {
  const { shelves, books } = collect();

  books.forEach((book) => {
    applyStatus(book, statusMap.get(book.dataset.bookId) || "not_started");
  });

  shelves.forEach((shelf) => {
    const spines = Array.from(shelf.querySelectorAll("[data-book-row]"));
    const total = Number(shelf.dataset.totalBooks) || spines.length;
    const read = spines.filter((spine) => spine.dataset.status === "read").length;
    const inProgress = spines.filter((spine) => spine.dataset.status === "in_progress").length;
    applyStatus(shelf, deriveStatus(read, inProgress, total));
    const count = shelf.querySelector("[data-shelf-count]");
    if (count) count.textContent = countLabel(read, total);
  });

  renderTable(
    books.filter((book) => book.dataset.status === "in_progress"),
    "Nothing out at the moment. Pull a book from the shelf to start."
  );
}

function renderUnavailable(status, label, message) {
  const { shelves, books } = collect();
  books.forEach((book) => applyStatus(book, "not_started"));
  shelves.forEach((shelf) => applyStatus(shelf, status, label));
  renderTable([], message);
}

let loadSequence = 0;

async function loadStatuses() {
  const sequence = ++loadSequence;
  if (!collect().shelves.length) return;

  const session = await getSession();
  if (sequence !== loadSequence) return;
  if (!session) {
    renderUnavailable("signed_out", "Sign in to track", "Sign in to see what you have out.");
    return;
  }

  const { data, error } = await supabase
    .from("book_status")
    .select("book_id, status")
    .eq("user_id", session.user.id);

  if (sequence !== loadSequence) return;
  if (error) {
    renderUnavailable("error", "Status unavailable", "Your place could not be loaded just now.");
    return;
  }

  const statusMap = new Map();
  (data || []).forEach((entry) => {
    if (entry?.book_id) statusMap.set(entry.book_id, entry.status || "not_started");
  });
  render(statusMap);
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
