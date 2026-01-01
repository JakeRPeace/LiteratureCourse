import { supabase } from "./supabase.js";

window.addEventListener("DOMContentLoaded", () => {
  const widgets = document.querySelectorAll("[data-book-status]");
  if (!widgets.length) return;

  widgets.forEach((root) => {
    const statusSelect = root.querySelector("[data-status]");
    const scoreInput = root.querySelector("[data-score]");
    const scoreValue = root.querySelector("[data-score-value]");
    const scoreClear = root.querySelector("[data-score-clear]");
    const note = root.querySelector("[data-note]");
    const bookId = root.dataset.bookId;
    let scoreIsEmpty = true;

    const formatScore = (value) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return "--";
      }
      return Number(value).toFixed(2).replace(/\.?0+$/, "");
    };

    const updateScoreDisplay = () => {
      const numericValue = Number(scoreInput.value || 0);
      const percent = Math.max(0, Math.min(100, (numericValue / 5) * 100));

      if (scoreValue) {
        scoreValue.textContent = scoreIsEmpty ? "--" : formatScore(numericValue);
      }

      scoreInput.style.setProperty("--percent", `${percent}%`);
      if (scoreClear) {
        scoreClear.disabled = scoreIsEmpty || scoreInput.disabled;
      }
    };

    const setNote = (message) => {
      note.textContent = message || "";
    };

    const setEnabled = (enabled) => {
      statusSelect.disabled = !enabled;
      scoreInput.disabled = !enabled;
      if (scoreClear) {
        scoreClear.disabled = !enabled || scoreIsEmpty;
      }
    };

    const setScoreState = (value) => {
      if (value === null || value === undefined || value === "") {
        scoreIsEmpty = true;
        scoreInput.value = 0;
      } else {
        scoreIsEmpty = false;
        scoreInput.value = value;
      }

      updateScoreDisplay();
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
        setScoreState(data.score);
      } else {
        setScoreState(null);
      }
    };

    const saveStatus = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const userId = sessionData.session.user.id;

      const status = statusSelect.value;
      const scoreValue = scoreIsEmpty ? null : Number(scoreInput.value);

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

    scoreInput.addEventListener("input", () => {
      if (scoreIsEmpty) {
        scoreIsEmpty = false;
      }
      updateScoreDisplay();
    });

    if (scoreClear) {
      scoreClear.addEventListener("click", () => {
        scoreIsEmpty = true;
        scoreInput.value = 0;
        updateScoreDisplay();
        saveStatus();
      });
    }

    supabase.auth.onAuthStateChange(() => {
      loadStatus();
    });

    loadStatus();
  });
});
