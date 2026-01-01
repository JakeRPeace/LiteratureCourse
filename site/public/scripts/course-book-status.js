import { supabase } from "./supabase.js";

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

window.addEventListener("DOMContentLoaded", () => {
  const rows = Array.from(document.querySelectorAll("[data-book-row]"));
  if (!rows.length) return;

  const bookIds = [...new Set(rows.map((row) => row.dataset.bookId).filter(Boolean))];

  const setLoggedOut = () => {
    rows.forEach((row) => applyStatus(row, "signed_out", "Sign in to track"));
  };

  const setError = () => {
    rows.forEach((row) => applyStatus(row, "error", "Status unavailable"));
  };

  const loadStatuses = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setLoggedOut();
      return;
    }

    if (!bookIds.length) return;

    const { data, error } = await supabase
      .from("book_status")
      .select("status, book_id")
      .in("book_id", bookIds);

    if (error) {
      setError();
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
  };

  supabase.auth.onAuthStateChange(() => {
    loadStatuses();
  });

  loadStatuses();
});
