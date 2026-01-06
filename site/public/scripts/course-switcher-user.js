import { supabase } from "./supabase.js";

function buildCourseItem(course, isActive) {
  const [mainTitle, ...restTitle] = (course.title || "").split(" - ");
  const subtitle = restTitle.join(" - ");

  const item = document.createElement("a");
  item.className = `course-switcher-item${isActive ? " is-active" : ""}`;
  item.href = `/course/user?course_id=${encodeURIComponent(course.course_id)}`;
  item.dataset.courseSource = "user";

  const title = document.createElement("div");
  title.className = "course-switcher-item-title";
  title.textContent = mainTitle || course.title || "Untitled Course";

  item.appendChild(title);

  if (subtitle) {
    const sub = document.createElement("div");
    sub.className = "course-switcher-item-sub";
    sub.textContent = subtitle;
    item.appendChild(sub);
  }

  return item;
}

async function loadUserCourses() {
  const switcher = document.querySelector("[data-course-switcher]");
  if (!switcher) return;
  const menu = switcher.querySelector("[data-course-switcher-menu]");
  if (!menu) return;

  const currentCourseId = switcher.dataset.currentCourseId || "";
  const currentCourseSource = switcher.dataset.currentCourseSource || "system";

  menu.querySelectorAll('[data-course-source="user"]').forEach((item) => item.remove());

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return;

  const { data: courses, error } = await supabase
    .from("courses")
    .select("course_id, title")
    .eq("source", "user")
    .order("created_at", { ascending: true });

  if (error || !courses || !courses.length) return;

  const fragment = document.createDocumentFragment();
  courses.forEach((course) => {
    const isActive =
      currentCourseSource === "user" && course.course_id === currentCourseId;
    fragment.appendChild(buildCourseItem(course, isActive));
  });

  menu.appendChild(fragment);
}

window.addEventListener("DOMContentLoaded", () => {
  loadUserCourses();
  supabase.auth.onAuthStateChange(() => {
    loadUserCourses();
  });
  window.addEventListener("course-switcher-refresh", () => {
    loadUserCourses();
  });
});
