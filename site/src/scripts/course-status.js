import { supabase } from "../lib/supabaseClient.js";

window.addEventListener("DOMContentLoaded", () => {
  const widgets = document.querySelectorAll("[data-course-status]");
  if (!widgets.length) return;

  widgets.forEach((root) => {
    const label = root.querySelector("[data-course-status-label]");
    const bookIds = JSON.parse(root.dataset.bookIds || "[]");

    const setLabel = (message) => {
      if (label) label.textContent = message;
    };

    const deriveStatus = (statuses, total) => {
      if (total === 0) return "not started";
      const hasInProgress = statuses.includes("in_progress");
      const hasRead = statuses.includes("read");

      if (hasInProgress) return "in progress";
      if (hasRead && statuses.length === total) return "read";
      if (hasRead) return "in progress";

      return "not started";
    };

    const loadStatus = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setLabel("Sign in to see status.");
        return;
      }

      if (!bookIds.length) {
        setLabel("No books found for this course.");
        return;
      }

      const { data, error } = await supabase
        .from("book_status")
        .select("status, book_id")
        .in("book_id", bookIds);

      if (error) {
        setLabel(error.message);
        return;
      }

      const statuses = (data || []).map((row) => row.status);
      const derived = deriveStatus(statuses, bookIds.length);
      setLabel(`Status: ${derived}`);
    };

    supabase.auth.onAuthStateChange(() => {
      loadStatus();
    });

    loadStatus();
  });
});
