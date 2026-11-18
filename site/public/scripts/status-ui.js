export const statusLabels = {
  not_started: "Not started",
  in_progress: "In progress",
  read: "Read"
};

// Stamp a status on a shelf, a spine, or a book on a ledge.
export function applyStatus(element, status, labelOverride) {
  element.dataset.status = status;
  const pill = element.querySelector("[data-status-pill]");
  if (pill) pill.dataset.status = status;
  const label = (pill || element).querySelector("[data-status-label]");
  if (label) {
    label.textContent = labelOverride || statusLabels[status] || statusLabels.not_started;
  }
}
