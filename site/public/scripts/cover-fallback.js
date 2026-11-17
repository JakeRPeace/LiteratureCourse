function letterFromImg(img) {
  if (img.dataset.monogram) return img.dataset.monogram.slice(0, 1).toUpperCase();
  const alt = (img.getAttribute("alt") || "").replace(/^Cover of\s+/i, "").trim();
  if (alt) {
    const words = alt.split(/\s+/).filter(Boolean);
    const skip = new Set(["a", "an", "the"]);
    const word = words.find((part) => !skip.has(part.toLowerCase())) || words[0];
    if (word) return word[0].toUpperCase();
  }
  return "·";
}

function replaceBrokenCover(img) {
  const cover = img.closest(".data-cover, .book-cover");
  const span = document.createElement("span");
  span.className = "cover-monogram";
  span.setAttribute("aria-hidden", "true");
  span.textContent = letterFromImg(img);
  img.replaceWith(span);
  if (cover && !cover.classList.contains("is-stack")) {
    cover.classList.add("is-empty");
  }
}

document.querySelectorAll(".data-cover img, .book-cover img").forEach((img) => {
  if (img.complete && img.naturalWidth === 0) {
    replaceBrokenCover(img);
    return;
  }
  img.addEventListener("error", () => replaceBrokenCover(img), { once: true });
});
