import { surname } from "./book-look.js";

// Builders for books added in the browser (user-made courses). They mirror
// Spine.astro and BookCover.astro so every book is the same object.

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function hidden(node) {
  node.setAttribute("aria-hidden", "true");
  return node;
}

export function buildCover({ title = "", author = "", coverUrl = "", look, className = "" }) {
  const cover = hidden(el("span", `book-cover ${className}`.trim()));
  if (look) cover.style.cssText = look.style;

  const art = el("span", "cover-art");
  const coverTitle = el("span", "cover-title", title);
  coverTitle.dataset.coverTitle = "";
  const coverAuthor = el("span", "cover-author", author);
  coverAuthor.dataset.coverAuthor = "";
  art.append(coverTitle, coverAuthor);
  cover.append(art);

  if (coverUrl) {
    const img = el("img");
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => img.remove(), { once: true });
    img.src = coverUrl;
    cover.append(img);
  }

  cover.append(el("span", "cover-ribbon"), el("span", "cover-seal"));
  return cover;
}

export function buildSpine({ id, title = "", author = "", coverUrl = "", href, look, source = "", current = false }) {
  const spine = el(current ? "span" : "a", "spine");
  if (look?.long) spine.classList.add("is-long");
  if (look) {
    spine.style.cssText = look.style;
    spine.dataset.band = String(look.band);
  }
  spine.dataset.pick = "";
  spine.dataset.title = title;
  spine.dataset.author = author;
  spine.dataset.cover = coverUrl || "";

  if (current) {
    spine.classList.add("is-out");
    spine.setAttribute("aria-current", "page");
  } else {
    spine.href = href;
    spine.dataset.bookRow = "";
    spine.dataset.bookId = id;
    spine.dataset.status = "not_started";
    if (source) spine.dataset.bookSource = source;
  }

  const body = el("span", "spine-body");
  body.append(el("span", "spine-title", title));
  if (author) body.append(hidden(el("span", "spine-author", surname(author))));
  body.append(hidden(el("span", "spine-mark")));

  const label = el("span", "visually-hidden", author ? `by ${author}. ` : ". ");
  const status = el("span", "", current ? "Open on the desk" : "Not started");
  status.dataset.statusLabel = "";
  label.append(status);

  spine.append(body, hidden(el("span", "spine-slip", "Out")), label);
  return spine;
}

export function buildStatusPill() {
  const pill = el("span", "status-pill");
  pill.dataset.statusPill = "";
  pill.dataset.status = "not_started";
  const label = el("span", "status-label", "Not started");
  label.dataset.statusLabel = "";
  pill.append(hidden(el("span", "status-dot")), label);
  return pill;
}

export function buildLedgeBook({ id, title = "", author = "", sub = "", coverUrl = "", href, look, source = "" }) {
  const item = el("a", "ledge-book");
  item.href = href;
  item.dataset.pick = "";
  item.dataset.bookRow = "";
  item.dataset.bookId = id;
  item.dataset.status = "not_started";
  if (source) item.dataset.bookSource = source;

  const label = el("span", "ledge-label");
  label.append(
    el("span", "ledge-title", title),
    el("span", "ledge-author", author || sub),
    buildStatusPill()
  );

  item.append(buildCover({ title, author, coverUrl, look }), label);
  return item;
}
