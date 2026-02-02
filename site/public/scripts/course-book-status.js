import { getBookStatusState, onBookStatusState } from "./status-store.js";

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

  const state = await getBookStatusState();
  if (state.status === "signed_out") {
    setLoggedOut(rows);
    return;
  }
  if (state.status !== "ready") {
    if (state.status === "error") setError(rows);
    return;
  }

  if (!bookIds.length) return;

  const statusMap = new Map();
  const bookIdSet = new Set(bookIds);
  (state.data || []).forEach((entry) => {
    if (!bookIdSet.has(entry.book_id)) return;
    statusMap.set(entry.book_id, entry.status || "not_started");
  });

  rows.forEach((row) => {
    const status = statusMap.get(row.dataset.bookId) || "not_started";
    applyStatus(row, status);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadStatuses();
  onBookStatusState(() => loadStatuses());
  window.addEventListener("book-rows-updated", () => {
    loadStatuses();
  });
});
