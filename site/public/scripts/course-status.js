import { getBookStatusState, onBookStatusState } from "./status-store.js";

const statusLabels = {
  not_started: "Not started",
  in_progress: "In progress",
  read: "Completed",
  signed_out: "Locked",
};

window.addEventListener("DOMContentLoaded", () => {
  const widgets = document.querySelectorAll("[data-course-status]");
  if (!widgets.length) return;

  widgets.forEach((root) => {
    const label = root.querySelector("[data-course-status-label]");
    const pill = root.querySelector("[data-status-pill]");
    const pillLabel = root.querySelector("[data-status-label]");
    const progressFill = root.querySelector("[data-progress-fill]");
    const statsLabel = root.querySelector("[data-status-stats]");

    const bookIds = JSON.parse(root.dataset.bookIds || "[]");

    const updateUI = (status, readCount = 0, inProgressCount = 0) => {
      const total = bookIds.length;
      const progress = total > 0 ? Math.round((readCount / total) * 100) : 0;

      root.dataset.status = status;
      if (label) {
        if (status === "signed_out") {
          label.textContent = "Sign in to see status";
        } else {
          label.textContent = statusLabels[status] || statusLabels.not_started;
        }
      }

      if (pill) pill.dataset.status = status;
      if (pillLabel) pillLabel.textContent = statusLabels[status] || statusLabels.not_started;

      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }

      if (statsLabel) {
        if (status === "signed_out") {
          statsLabel.textContent = "Connect to track progress";
        } else {
          statsLabel.textContent = `${readCount} of ${total} books completed • ${progress}%`;
        }
      }
    };

    const deriveStatus = (data, total) => {
      if (total === 0) return "not_started";

      const readCount = data.filter(d => d.status === "read").length;
      const inProgressCount = data.filter(d => d.status === "in_progress").length;

      if (readCount === total) return "read";
      if (readCount > 0 || inProgressCount > 0) return "in_progress";
      return "not_started";
    };

    const loadStatus = async () => {
      if (!bookIds.length) {
        if (label) label.textContent = "No books found";
        return;
      }

      const state = await getBookStatusState();
      if (state.status === "signed_out") {
        updateUI("signed_out");
        return;
      }
      if (state.status === "error") {
        if (label) label.textContent = "Error loading status";
        return;
      }
      if (state.status !== "ready") {
        return;
      }

      const bookSet = new Set(bookIds);
      const statusData = (state.data || []).filter((row) => bookSet.has(row.book_id));
      const status = deriveStatus(statusData, bookIds.length);
      const readCount = statusData.filter(d => d.status === "read").length;
      const inProgressCount = statusData.filter(d => d.status === "in_progress").length;

      updateUI(status, readCount, inProgressCount);
    };

    onBookStatusState(() => loadStatus());

    loadStatus();
  });
});
