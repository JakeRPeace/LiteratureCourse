import { supabase } from "./supabase.js";
import { getSession, onSessionChange } from "./session-store.js";

function initWidgets() {
  const widgets = document.querySelectorAll("[data-book-status]:not([data-status-init])");
  if (!widgets.length) return;

  widgets.forEach((root) => {
    root.dataset.statusInit = "true";
    const statusSelect = root.querySelector("[data-status]");
    const scoreInput = root.querySelector("[data-score]");
    const scoreValue = root.querySelector("[data-score-value]");
    const scoreClear = root.querySelector("[data-score-clear]");
    const note = root.querySelector("[data-note]");
    const scoreField = root.querySelector(".score-field");
    let scoreIsEmpty = true;

    const formatScore = (value) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return "--";
      }
      return Number(value).toFixed(2).replace(/\.?0+$/, "");
    };

    const getScoreColor = (value) => {
      if (scoreIsEmpty) {
        return "#cfc4b2";
      }

      const clamped = Math.max(0, Math.min(5, value));
      if (clamped < 2.5) return "#9d3428";
      if (clamped < 4) return "#8d6a32";
      return "#2c5c40";
    };

    const updateScoreDisplay = () => {
      const numericValue = Number(scoreInput.value || 0);
      const percent = Math.max(0, Math.min(100, (numericValue / 5) * 100));
      const scoreColor = getScoreColor(numericValue);

      if (scoreValue) {
        scoreValue.textContent = scoreIsEmpty ? "--" : formatScore(numericValue);
      }

      if (scoreField) {
        scoreField.style.setProperty("--score-color", scoreColor);
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

    const getBookId = () => root.dataset.bookId || "";

    const loadStatus = async () => {
      const session = await getSession();
      if (!session) {
        setEnabled(false);
        setNote("Sign in to save your status.");
        return;
      }

      const bookId = getBookId();
      if (!bookId) {
        setEnabled(false);
        setNote("Book not ready yet.");
        return;
      }

      setEnabled(true);
      const { data, error } = await supabase
        .from("book_status")
        .select("status, score")
        .eq("book_id", bookId)
        .eq("user_id", session.user.id)
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
      const session = await getSession();
      if (!session) return;
      const bookId = getBookId();
      if (!bookId) return;
      const userId = session.user.id;

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

    onSessionChange(() => {
      loadStatus();
    });

    loadStatus();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initWidgets();
  window.addEventListener("book-status-updated", () => {
    initWidgets();
  });
});
