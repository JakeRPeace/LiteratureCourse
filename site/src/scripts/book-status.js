import { supabase } from "../lib/supabaseClient.js";

window.addEventListener("DOMContentLoaded", () => {
  const widgets = document.querySelectorAll("[data-book-status]");
  if (!widgets.length) return;

  widgets.forEach((root) => {
    const statusSelect = root.querySelector("[data-status]");
    const scoreInput = root.querySelector("[data-score]");
    const note = root.querySelector("[data-note]");
    const bookId = root.dataset.bookId;

    const setNote = (message) => {
      note.textContent = message || "";
    };

    const setEnabled = (enabled) => {
      statusSelect.disabled = !enabled;
      scoreInput.disabled = !enabled;
    };

    const loadStatus = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setEnabled(false);
        setNote("Sign in to save your status.");
        return;
      }

      setEnabled(true);
      const { data, error } = await supabase
        .from("book_status")
        .select("status, score")
        .eq("book_id", bookId)
        .maybeSingle();

      if (error) {
        setNote(error.message);
        return;
      }

      if (data) {
        statusSelect.value = data.status || "not_started";
        if (data.score !== null && data.score !== undefined) {
          scoreInput.value = data.score;
        }
      }
    };

    const saveStatus = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const userId = sessionData.session.user.id;

      const status = statusSelect.value;
      const scoreValue = scoreInput.value === "" ? null : Number(scoreInput.value);

      const { error } = await supabase
        .from("book_status")
        .upsert(
          {
            user_id: userId,
            book_id: bookId,
            status,
            score: scoreValue
          },
          { onConflict: "user_id,book_id" }
        );

      if (error) {
        setNote(error.message);
        return;
      }

      setNote("Saved.");
    };

    root.addEventListener("change", (event) => {
      if (event.target === statusSelect || event.target === scoreInput) {
        saveStatus();
      }
    });

    supabase.auth.onAuthStateChange(() => {
      loadStatus();
    });

    loadStatus();
  });
});
