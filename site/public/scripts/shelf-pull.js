const PULL_MS = 460;
const SELECTOR = "a.shelf-card[href], a.guide-card[href], a.course-doc-card[href]";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shouldBypass(event) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function go(href) {
  window.location.assign(href);
}

document.addEventListener(
  "click",
  (event) => {
    const link = event.target.closest?.(SELECTOR);
    if (!link || !(link instanceof HTMLAnchorElement)) return;
    if (shouldBypass(event)) return;

    const href = link.href;
    if (!href || link.target === "_blank") return;
    if (link.classList.contains("is-pulling")) {
      event.preventDefault();
      return;
    }

    if (prefersReducedMotion()) return;

    event.preventDefault();
    link.classList.add("is-pulling");
    window.setTimeout(() => go(href), PULL_MS);
  },
  true
);
