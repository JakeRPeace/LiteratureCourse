import { supabase } from "./supabase.js";
import { getSession, onSessionChange } from "./session-store.js";
import { applyStatus } from "./status-ui.js";

function collectRows() {
  const rows = Array.from(document.querySelectorAll("[data-book-row]"));
  const bookIds = [...new Set(rows.map((row) => row.dataset.bookId).filter(Boolean))];
  return { rows, bookIds };
}

function setLoggedOut(rows) {
  rows.forEach((row) => applyStatus(row, "signed_out", "Sign in to track"));
}

function setError(rows) {
  rows.forEach((row) => applyStatus(row, "error", "Status unavailable"));
}

async function loadStatuses() {
  const { rows, bookIds } = collectRows();
  if (!rows.length) return;

  const session = await getSession();
  if (!session) {
    setLoggedOut(rows);
    return;
  }

  if (!bookIds.length) return;

  const { data, error } = await supabase
    .from("book_status")
    .select("status, book_id")
    .in("book_id", bookIds)
    .eq("user_id", session.user.id);

  if (error) {
    setError(rows);
    return;
  }

  const statusMap = new Map();
  (data || []).forEach((entry) => {
    statusMap.set(entry.book_id, entry.status || "not_started");
  });

  rows.forEach((row) => {
    const status = statusMap.get(row.dataset.bookId) || "not_started";
    applyStatus(row, status);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadStatuses();
  onSessionChange(() => {
    loadStatuses();
  });
  window.addEventListener("book-rows-updated", () => {
    loadStatuses();
  });
});
