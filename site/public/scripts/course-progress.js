import { supabase } from "./supabase.js";
import { applyStatusCounts } from "./course-progress-utils.js";

window.addEventListener("DOMContentLoaded", () => {
  const widgets = document.querySelectorAll("[data-course-progress]");
  if (!widgets.length) return;

  widgets.forEach((root) => {
    const cards = Array.from(root.querySelectorAll("[data-progress-card]"));
    const courses = JSON.parse(root.dataset.courses || "[]");

    const setMessage = (message) => {
      cards.forEach((card) => {
        const title = card.querySelector("[data-course-title]");
        const count = card.querySelector("[data-course-count]");
        const bar = card.querySelector("[data-course-bar]");
        if (title) title.textContent = message;
        if (count) count.textContent = "";
        if (bar) bar.style.width = "0%";
      });
    };

    const renderCourses = (selected) => {
      cards.forEach((card, index) => {
        const course = selected[index];
        const title = card.querySelector("[data-course-title]");
        const count = card.querySelector("[data-course-count]");
        const bar = card.querySelector("[data-course-bar]");

        if (!course) {
          if (title) title.textContent = "No course data.";
          if (count) count.textContent = "";
          if (bar) bar.style.width = "0%";
          return;
        }

        const total = course.totalBooks || 0;
        const read = course.readCount || 0;
        const inProgress = course.inProgressCount || 0;
        const activeCount = read + inProgress;
        const progress = total > 0 ? Math.round((activeCount / total) * 100) : 0;

        if (title) title.textContent = course.title;
        if (count) count.textContent = `${activeCount}/${total}`;
        if (bar) bar.style.width = `${progress}%`;
      });
    };

    const loadProgress = async () => {
      if (!courses.length) {
        setMessage("No courses found.");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setMessage("Sign in to see progress.");
        return;
      }

      const { data, error } = await supabase
        .from("book_status")
        .select("book_id, status");

      if (error) {
        setMessage(error.message);
        return;
      }

      const courseMap = new Map(
        courses.map((course) => [
          course.id,
          {
            ...course,
            readCount: 0,
            inProgressCount: 0
          }
        ])
      );

      const statusRows = data || [];
      const pending = applyStatusCounts(courseMap, statusRows);

      if (pending.length) {
        const bookIds = Array.from(
          new Set(pending.map((row) => row?.book_id).filter(Boolean))
        );
        if (bookIds.length) {
          const { data: bookRows, error: bookError } = await supabase
            .from("books")
            .select("book_id, course_id")
            .in("book_id", bookIds);

          if (!bookError && bookRows?.length) {
            const bookMap = new Map(
              bookRows.map((row) => [row.book_id, row.course_id])
            );
            applyStatusCounts(courseMap, pending, bookMap);
          }
        }
      }

      const ranked = Array.from(courseMap.values())
        .sort((a, b) => {
          if (b.readCount !== a.readCount) return b.readCount - a.readCount;
          if (b.inProgressCount !== a.inProgressCount) {
            return b.inProgressCount - a.inProgressCount;
          }
          return a.title.localeCompare(b.title);
        });

      const active = ranked.filter(
        (course) => course.readCount > 0 || course.inProgressCount > 0
      );

      const selected = (active.length ? active : ranked).slice(0, cards.length);
      renderCourses(selected);
    };

    supabase.auth.onAuthStateChange(() => {
      loadProgress();
    });

    loadProgress();
  });
});
