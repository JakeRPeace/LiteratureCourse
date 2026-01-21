import { supabase } from "./supabase.js";
import { marked } from "https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.1.6/+esm";
import { getSession } from "./session-store.js";

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    courseId: params.get("course_id"),
    docSlug: params.get("doc")
  };
}

function setError(message) {
  const box = document.querySelector("[data-user-course-doc-error]");
  if (!box) return;
  const text = box.querySelector("p");
  if (text) text.textContent = message;
  box.hidden = !message;
}

async function loadDocPage() {
  const { courseId, docSlug } = getParams();
  if (!courseId || !docSlug) {
    setError("Missing course_id or doc in the URL.");
    return;
  }

  const session = await getSession();
  if (!session) {
    setError("Sign in to view this document.");
    return;
  }

  const [courseResult, docResult] = await Promise.all([
    supabase
      .from("courses")
      .select("title")
      .eq("course_id", courseId)
      .maybeSingle(),
    supabase
      .from("course_docs")
      .select("label, stage, content_md")
      .eq("course_id", courseId)
      .eq("slug", docSlug)
      .maybeSingle()
  ]);

  const courseRow = courseResult.data;
  const { data: doc, error } = docResult;

  if (error || !doc) {
    setError("Unable to load this document. Please check the link.");
    return;
  }

  setError("");

  const titleEl = document.querySelector("[data-user-course-doc-title]");
  if (titleEl) titleEl.textContent = doc.label || "Course document";

  const stageEl = document.querySelector("[data-user-course-doc-stage]");
  if (stageEl) {
    const courseTitle = courseRow?.title || "";
    stageEl.textContent = courseTitle ? `${courseTitle} · ${doc.stage || ""}` : doc.stage || "";
  }

  const contentEl = document.querySelector("[data-user-course-doc-content]");
  if (contentEl) {
    const html = marked.parse(doc.content_md || "");
    contentEl.innerHTML = DOMPurify.sanitize(html);
  }

  const backLink = document.querySelector("[data-user-course-doc-back]");
  if (backLink) {
    backLink.href = `/course/user?course_id=${encodeURIComponent(courseId)}`;
  }

  const switcher = document.querySelector("[data-course-switcher]");
  const switcherTitle = document.querySelector("[data-course-switcher-title]");
  if (switcher) {
    switcher.dataset.currentCourseId = courseId;
    switcher.dataset.currentCourseSource = "user";
  }
  if (switcherTitle && courseRow?.title) {
    switcherTitle.textContent = courseRow.title;
  }
  window.dispatchEvent(new CustomEvent("course-switcher-refresh"));
}

window.addEventListener("DOMContentLoaded", () => {
  loadDocPage();
});
