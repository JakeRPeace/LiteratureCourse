// Taking a book off the shelf.
//
// Where the browser can carry an element across a page load (cross-document
// view transitions), the picked spine or cover is named so it travels to the
// desk on the book page and leaves its gap behind. Elsewhere the book is
// pulled out of its slot first, then the page changes.

const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const crossPageTransitions = "CSSViewTransitionRule" in window;
const PULL_MS = 420;

function pick(event) {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const book = event.target.closest("a[data-pick]");
  if (!book || !motionOk) return;

  document.querySelectorAll(".is-picked").forEach((node) => node.classList.remove("is-picked"));
  document.documentElement.classList.add("is-picking");
  hideTip();

  const isOut = book.dataset.status === "in_progress" && book.classList.contains("spine");
  if (crossPageTransitions) {
    if (!isOut) book.classList.add("is-picked");
    return;
  }
  if (isOut) return;

  event.preventDefault();
  book.classList.add("is-pulling");
  window.setTimeout(() => {
    window.location.href = book.href;
  }, PULL_MS);
}

document.addEventListener("click", pick);

// Coming back with the browser's Back button restores the page as it was
// left; put any pulled book back in its slot.
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  document.documentElement.classList.remove("is-picking");
  document.querySelectorAll(".is-pulling").forEach((node) => node.classList.remove("is-pulling"));
});

// A paper tag that names the spine under the pointer: vertical titles are
// short on room, the tag is not.
let tip = null;
let tipTarget = null;

function ensureTip() {
  if (tip) return tip;
  tip = document.createElement("div");
  tip.className = "shelf-tip";
  tip.setAttribute("aria-hidden", "true");
  tip.innerHTML =
    '<div class="shelf-tip-title"></div><div class="shelf-tip-author"></div><div class="shelf-tip-status"></div>';
  document.body.appendChild(tip);
  return tip;
}

function showTip(spine) {
  const node = ensureTip();
  tipTarget = spine;
  node.querySelector(".shelf-tip-title").textContent = spine.dataset.title || "";
  const author = node.querySelector(".shelf-tip-author");
  author.textContent = spine.dataset.author || "";
  author.hidden = !spine.dataset.author;

  const status = spine.classList.contains("is-out") ? "in_progress" : spine.dataset.status || "";
  const statusText = {
    in_progress: spine.classList.contains("is-out") ? "Open on the desk" : "On your reading table",
    read: "Read"
  }[status];
  const statusNode = node.querySelector(".shelf-tip-status");
  statusNode.textContent = statusText || "";
  statusNode.hidden = !statusText;
  node.dataset.status = status;

  const rect = spine.getBoundingClientRect();
  const body = spine.querySelector(".spine-body");
  const top = status === "in_progress" || !body ? rect.top + rect.height * 0.4 : body.getBoundingClientRect().top;
  const tipRect = node.getBoundingClientRect();
  const left = Math.min(
    Math.max(8, rect.left + rect.width / 2 - tipRect.width / 2),
    window.innerWidth - tipRect.width - 8
  );
  const above = top - tipRect.height - 22;
  node.style.transform = `translate(${Math.round(left)}px, ${Math.round(
    above > 8 ? above : rect.bottom + 12
  )}px)`;
  node.classList.add("is-visible");
}

function hideTip() {
  tipTarget = null;
  if (tip) tip.classList.remove("is-visible");
}

if (window.matchMedia("(hover: hover)").matches) {
  document.addEventListener("pointerover", (event) => {
    const spine = event.target.closest?.(".spine");
    if (spine === tipTarget) return;
    if (spine) showTip(spine);
    else hideTip();
  });
  document.addEventListener("focusin", (event) => {
    const spine = event.target.closest?.(".spine");
    if (spine && spine.matches(":focus-visible")) showTip(spine);
  });
  document.addEventListener("focusout", hideTip);
  window.addEventListener("scroll", hideTip, { passive: true });
}
